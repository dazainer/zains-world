/**
 * GameEngine — 60fps requestAnimationFrame loop.
 *
 * Supports room transitions (fade-out → swap → fade-in) and two render modes:
 *   • overworld: desert tileset layers + cropped structures + props + ambients
 *   • interior:  canvas-drawn dungeon walls/floors + Door.png exits + Fire.png torches
 */
import { InputManager } from './InputManager'
import { Player, type Direction } from './Player'
import { Camera } from './Camera'
import { CollisionMap, getPlayerCollisionBounds } from './CollisionMap'
import type { InteriorDecoSheetKey } from './InteriorDeco'
import { TileRenderer, type TileSet } from './TileRenderer'
import { SpriteSheet, Animation, type Frame } from './SpriteSheet'
import { AmbientSprite } from './AmbientSprite'
import { DayNightCycle } from './DayNightCycle'
import { roomRegistry, type RoomData, type RoomId, type DoorDef } from './RoomManager'

// ── Room data imports ───────────────────────────────────────────────────────
import {
  terrainLayer,
  decorationLayer,
  collisionMap as overworldCollision,
  MAP_PIXEL_W,
  MAP_PIXEL_H,
  SPAWN,
  overworldRoom,
  overworldBorderTiles,
  overworldStructures,
  overworldProps,
  overworldAmbientDefs,
  overworldNpcDefs,
  type OverworldSheetKey,
} from './maps/overworld'
import { projectsLabRoom, stationDecos } from './maps/projectsLab'
import { skillsForgeRoom } from './maps/skillsForge'
import { experienceTower1Room, experienceTower2Room, experienceTower3Room, towerGalleryData } from './maps/experienceTower'
import { contactPortalRoom, portalTiles, contactStations } from './maps/contactPortal'
import { secretRoomData, secretStations, isSecretPropTile } from './maps/secretRoom'
import { pyramidLoreRoom, skillPedestals, categoryLabels, workshopPlaques } from './maps/pyramidLore'

/** A single static (non-animated) world-space sprite drawn each frame. */
interface StaticSprite {
  sheet: SpriteSheet
  frame: Frame
  worldX: number
  worldY: number
  renderW: number
  renderH: number
  flipX?: boolean
  label?: string
  occlusionStartY?: number
  renderLayer?: 'default' | 'shrubbery'
}

interface OverworldChestSprite {
  sheet: SpriteSheet
  frames: Frame[]
  worldX: number
  worldY: number
  renderW: number
  renderH: number
  label?: string
  fps: number
  frameIndex: number
  elapsed: number
  targetOpen: boolean
  glowTime: number
}

interface CreatureSpeechBubble {
  text: string
  worldX: number
  worldY: number
  ttl: number
  fill: string
  border: string
}

interface CamelSpitParticle {
  x: number
  y: number
  vx: number
  vy: number
  ttl: number
  size: number
  color: string
}

// ── Transition state machine ────────────────────────────────────────────────
type TransitionPhase = 'none' | 'door-open' | 'fade-out' | 'swap' | 'fade-in'

interface TransitionState {
  phase: TransitionPhase
  elapsed: number
  door: DoorDef | null
  alpha: number          // overlay opacity 0..1
  /** World-pixel position of the door being animated (for Door.png) */
  doorWorldX: number
  doorWorldY: number
  /** Whether source room is interior (play door-open anim) */
  fromInterior: boolean
}

// ── UI callback interface ───────────────────────────────────────────────────
export interface GameUICallbacks {
  onShowInteractionPrompt: (show: boolean) => void
  onInteraction: (zoneId: string, payload?: string) => void
  onLoadProgress: (loaded: number, total: number) => void
  onReady: () => void
}

const NATIVE_W = 512
const NATIVE_H = 288
const OVERWORLD_ZOOM = 1.25
const OVERWORLD_VIEW_W = Math.round(NATIVE_W / OVERWORLD_ZOOM)
const OVERWORLD_VIEW_H = Math.round(NATIVE_H / OVERWORLD_ZOOM)
const T = 32
const FADE_DURATION = 0.3        // seconds
const DOOR_ANIM_DURATION = 0.35  // seconds for 6-frame door open

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private mainCtx: CanvasRenderingContext2D
  private rafId: number | null = null
  private lastTime = 0

  private input: InputManager
  private player: Player
  private camera: Camera
  private collision: CollisionMap
  private tileRenderer: TileRenderer
  private desertTileSet: TileSet

  // Current room state
  private currentRoom: RoomData
  private ambients: AmbientSprite[]

  // Overworld-specific (kept permanently, only rendered when room is overworld)
  private overworldAmbients: AmbientSprite[]
  private overworldStructures: StaticSprite[]
  private overworldProps: StaticSprite[]
  private npcSprites: AmbientSprite[]
  private resumeChest: OverworldChestSprite | null = null

  // Interior door sprite (Door.png — gold row)
  private doorSheet: SpriteSheet
  private doorOpenFrames: Frame[]
  private doorClosedFrame: Frame
  private doorAnimation: Animation

  // Interior props sprite (Props+Items.png — 16×16 grid, 4 cols × 5 rows)
  private propsSheet: SpriteSheet
  private vaseSheet: SpriteSheet

  // Gallery photos (Experience Tower paintings)
  private galleryPhotos: Map<string, HTMLImageElement> = new Map()

  // Photo overlay canvas (smooth rendering, separate from pixelated game canvas)
  private photoOverlay: HTMLCanvasElement | null = null
  private photoCtx: CanvasRenderingContext2D | null = null
  private overworldCanvas: HTMLCanvasElement
  private overworldCtx: CanvasRenderingContext2D

  // Transition
  private transition: TransitionState = {
    phase: 'none', elapsed: 0, door: null, alpha: 0,
    doorWorldX: 0, doorWorldY: 0, fromInterior: false,
  }

  // Asset loading
  private allSheets: SpriteSheet[] = []
  private assetsReady = false
  private loadStartTime = 0
  private static readonly LOAD_TIMEOUT_MS = 15_000

  // UI
  private callbacks: GameUICallbacks
  private uiPaused = false
  private lastPromptState = false
  private showDebugOverlay = false
  private overworldLayerMode = 0
  private dayNightCycle: DayNightCycle
  private creatureSpeechBubbles: CreatureSpeechBubble[] = []
  private camelSpitParticles: CamelSpitParticle[] = []
  private camelInteractCooldowns = new Map<string, number>()
  private snakeHissCooldowns = new Map<string, number>()

  private getViewportSize(room: RoomData = this.currentRoom) {
    if (room.isInterior) {
      return { width: NATIVE_W, height: NATIVE_H }
    }
    return { width: OVERWORLD_VIEW_W, height: OVERWORLD_VIEW_H }
  }

  constructor(canvas: HTMLCanvasElement, callbacks: GameUICallbacks) {
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.mainCtx = this.ctx
    this.callbacks = callbacks

    this.overworldCanvas = document.createElement('canvas')
    this.overworldCanvas.width = OVERWORLD_VIEW_W
    this.overworldCanvas.height = OVERWORLD_VIEW_H
    this.overworldCtx = this.overworldCanvas.getContext('2d')!
    this.overworldCtx.imageSmoothingEnabled = false

    // ── Register all rooms ────────────────────────────────────────────────
    roomRegistry.register('overworld', overworldRoom)
    roomRegistry.register('projectsLab', projectsLabRoom)
    roomRegistry.register('skillsForge', skillsForgeRoom)
    roomRegistry.register('experienceTower_1', experienceTower1Room)
    roomRegistry.register('experienceTower_2', experienceTower2Room)
    roomRegistry.register('experienceTower_3', experienceTower3Room)
    roomRegistry.register('contactPortal', contactPortalRoom)
    roomRegistry.register('secretRoom', secretRoomData)
    roomRegistry.register('pyramidLore', pyramidLoreRoom)

    // ── Engine systems ────────────────────────────────────────────────────
    this.input     = new InputManager()
    this.player    = new Player(SPAWN.x, SPAWN.y)
    this.camera    = new Camera(OVERWORLD_VIEW_W, OVERWORLD_VIEW_H)
    this.collision = new CollisionMap(overworldCollision, 32, overworldRoom.collisionRects)
    this.tileRenderer = new TileRenderer(32)
    this.dayNightCycle = new DayNightCycle()

    this.desertTileSet = {
      sheet: new SpriteSheet('/assets/tiles/desert/DESERT TILESET 32x32.png'),
      srcTileSize: 32,
      tilesPerRow: 19,
    }

    // ── Current room ──────────────────────────────────────────────────────
    this.currentRoom = overworldRoom
    this.ambients = []

    // ── Overworld sheets and sprite defs ────────────────────────────────
    const pyramidDoorSheet = new SpriteSheet('/assets/tiles/egypt/Pyramid with Door.png')
    const pyramidSheet     = new SpriteSheet('/assets/tiles/egypt/Pyramid.png')
    const sphinxSheet      = new SpriteSheet('/assets/tiles/egypt/Back.png')
    const pillarSheet      = new SpriteSheet('/assets/tiles/egypt/Pillar.png')
    const camelSheet       = new SpriteSheet('/assets/ambient/Idle Camel (2 Directions).png')
    const camelEatingSheet = new SpriteSheet('/assets/ambient/Camel Eating (2 Directions).png')
    const snakeSheet       = new SpriteSheet('/assets/ambient/Idle Snake (2 Directions).png')
    const mummySheet       = new SpriteSheet('/assets/sprites/Mummy.png')
    const chestSheet       = new SpriteSheet('/assets/tiles/dungeon/Treasure_Box.png')
    const dungeonPropsSheet = new SpriteSheet('/assets/tiles/dungeon/Props+Items.png')

    const resolveOverworldSheet = (sheetKey: OverworldSheetKey) => {
      switch (sheetKey) {
        case 'desert':
          return this.desertTileSet.sheet
        case 'dungeonProps':
          return dungeonPropsSheet
        case 'pyramidDoor':
          return pyramidDoorSheet
        case 'pyramid':
          return pyramidSheet
        case 'sphinx':
          return sphinxSheet
        case 'pillar':
          return pillarSheet
      }
    }

    const toStaticSprite = (entry: { sheetKey: OverworldSheetKey; frame: Frame; worldX: number; worldY: number; renderW: number; renderH: number; flipX?: boolean; label?: string; occlusionStartY?: number; renderLayer?: 'default' | 'shrubbery' }): StaticSprite => ({
      sheet: resolveOverworldSheet(entry.sheetKey),
      frame: entry.frame,
      worldX: entry.worldX,
      worldY: entry.worldY,
      renderW: entry.renderW,
      renderH: entry.renderH,
      flipX: entry.flipX,
      label: entry.label,
      occlusionStartY: entry.occlusionStartY,
      renderLayer: entry.renderLayer,
    })

    this.overworldStructures = overworldStructures.map(toStaticSprite)
    this.overworldProps = overworldProps.map(toStaticSprite)

    this.overworldAmbients = overworldAmbientDefs.map((entry, index) => {
      const ambient = new AmbientSprite({
        id: entry.id,
        type: entry.type,
        facing: entry.facing,
        x: entry.worldX,
        y: entry.worldY,
        renderW: entry.renderW ?? 32,
        renderH: entry.renderH ?? 32,
      })

      const row = entry.facing === 'left' ? 0 : 1
      const isEatingCamel = entry.type === 'camel' && entry.animation === 'eating'
      const sheet = entry.type === 'camel'
        ? (isEatingCamel ? camelEatingSheet : camelSheet)
        : snakeSheet
      const frames = isEatingCamel
        ? Array.from({ length: 10 }, (_, frameIndex) => ({
            sx: frameIndex * 36,
            sy: row * 32,
            sw: 36,
            sh: 32,
          }))
        : SpriteSheet.buildRow(0, row * 32, 32, 32, 4)
      ambient.init(sheet, frames, entry.fps ?? 6, index)
      return ambient
    })

    const chestDef = overworldNpcDefs.find((entry) => entry.sheetKey === 'chest')
    if (chestDef) {
      this.resumeChest = {
        sheet: chestSheet,
        frames: Array.from({ length: chestDef.frameCount }, (_, frameIndex) => ({
          sx: chestDef.sourceX + frameIndex * chestDef.frameStrideX,
          sy: chestDef.sourceY,
          sw: chestDef.sourceW,
          sh: chestDef.sourceH,
        })),
        worldX: chestDef.worldX,
        worldY: chestDef.worldY,
        renderW: chestDef.renderW,
        renderH: chestDef.renderH,
        label: chestDef.label,
        fps: chestDef.fps ?? 10,
        frameIndex: 0,
        elapsed: 0,
        targetOpen: false,
        glowTime: 0,
      }
    }

    this.npcSprites = overworldNpcDefs
      .filter((entry) => entry.sheetKey !== 'chest')
      .map((entry, index) => {
      const npc = new AmbientSprite({
        id: entry.id,
        type: 'npc',
        x: entry.worldX,
        y: entry.worldY,
        renderW: entry.renderW,
        renderH: entry.renderH,
      })

      const frames = Array.from({ length: entry.frameCount }, (_, frameIndex) => ({
        sx: entry.sourceX + frameIndex * entry.frameStrideX,
        sy: entry.sourceY,
        sw: entry.sourceW,
        sh: entry.sourceH,
      }))

      npc.init(mummySheet, frames, entry.fps ?? 4, index)
      return npc
    })

    // ── Door sprite (Door.png — gold row 1, 32×32 frames) ──────────────
    this.doorSheet = new SpriteSheet('/assets/tiles/dungeon/Door.png')
    this.doorOpenFrames = SpriteSheet.buildRow(0, 32, 32, 32, 6) // row 1 = gold
    this.doorClosedFrame = this.doorOpenFrames[0]
    this.doorAnimation = new Animation(this.doorOpenFrames, 6 / DOOR_ANIM_DURATION)

    // ── Props sprite (Props+Items.png — 16×16 items) ───────────────────
    this.propsSheet = dungeonPropsSheet
    this.vaseSheet = new SpriteSheet('/assets/tiles/egypt/Vase.png')

    // ── Gallery photos (preload for Experience Tower paintings) ────────
    for (const floor of Object.values(towerGalleryData)) {
      for (const p of floor.paintings) {
        if (!this.galleryPhotos.has(p.photo)) {
          const img = new Image()
          img.src = p.photo
          this.galleryPhotos.set(p.photo, img)
        }
      }
    }

    this.camera.snapTo(SPAWN.x, SPAWN.y, MAP_PIXEL_W, MAP_PIXEL_H)

    // ── Track all sprite sheets for loading progress ────────────────────
    this.allSheets = [
      this.desertTileSet.sheet,
      pyramidDoorSheet, pyramidSheet, sphinxSheet, pillarSheet,
      camelSheet, camelEatingSheet, snakeSheet, mummySheet, chestSheet,
      this.doorSheet,
      this.propsSheet,
      this.vaseSheet,
      this.player.getSheet(),
    ]
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /** Expose InputManager so MobileControls can inject virtual input. */
  getInputManager(): InputManager { return this.input }

  /** Expose player world position for React overlays (e.g. map). */
  getPlayerPosition(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y }
  }

  /** Expose current room id for React overlays. */
  getCurrentRoomId(): string {
    return this.currentRoom.id
  }

  /** True only while the player is actively walking in normal gameplay. */
  isPlayerWalking(): boolean {
    return this.transition.phase === 'none' && !this.uiPaused && this.player.isMoving
  }

  setResumeChestPromptOpen(open: boolean) {
    if (!this.resumeChest) return
    this.resumeChest.targetOpen = open
  }

  /** Attach a second canvas for full-resolution photo rendering. */
  setPhotoOverlay(canvas: HTMLCanvasElement) {
    this.photoOverlay = canvas
    this.photoCtx = canvas.getContext('2d')
  }

  start() {
    this.lastTime = performance.now()
    this.loadStartTime = performance.now()
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.input.destroy()
  }

  setUIPaused(paused: boolean) {
    this.uiPaused = paused
  }

  suppressCurrentActionKeys() {
    this.input.suppressCurrentActionKeys()
  }

  // ── Main loop ─────────────────────────────────────────────────────────

  private loop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05)
    this.lastTime = timestamp
    this.update(dt)
    this.render()
    this.rafId = requestAnimationFrame(this.loop)
  }

  // ── Update ────────────────────────────────────────────────────────────

  private update(dt: number) {
    // Track asset loading
    if (!this.assetsReady) {
      const loaded = this.allSheets.filter(s => s.isLoaded()).length
      const total = this.allSheets.length
      this.callbacks.onLoadProgress(loaded, total)
      const timedOut = performance.now() - this.loadStartTime > GameEngine.LOAD_TIMEOUT_MS
      if (loaded === total || timedOut) {
        if (timedOut) console.warn(`Asset loading timed out (${loaded}/${total} loaded). Proceeding anyway.`)
        this.assetsReady = true
        this.callbacks.onReady()
      }
    }

    if (this.input.consumeDebugOverlayToggle()) {
      this.showDebugOverlay = !this.showDebugOverlay
    }
    if (this.currentRoom.id === 'overworld' && this.input.consumeOverworldLayerCycle()) {
      this.overworldLayerMode = (this.overworldLayerMode + 1) % 3
    }
    if (false && import.meta.env.DEV && this.input.consumeDayNightSpeedToggle()) {
      this.dayNightCycle.cycleSpeedMultiplier()
    }

    // Always tick ambient animations
    for (const a of this.ambients) a.update(dt)
    if (this.currentRoom.id === 'overworld') {
      for (const a of this.overworldAmbients) a.update(dt)
      for (const n of this.npcSprites) n.update(dt)
      this.updateResumeChest(dt)
      this.tickOverworldCreatureEffects(dt)
    }

    // Handle active transition
    if (this.transition.phase !== 'none') {
      this.stepTransition(dt)
      return // freeze player during transition
    }

    // Skip input processing when UI panel is open
    if (this.uiPaused) return

    const input = this.input.getState()
    this.player.update(dt, input, this.collision)

    // Camera follow
    const mapW = this.currentRoom.cols * this.currentRoom.tileSize
    const mapH = this.currentRoom.rows * this.currentRoom.tileSize
    this.camera.follow(this.player.x, this.player.y, mapW, mapH)

    // ── Door check (auto-trigger on contact) ──────────────────────────
    const playerCol = Math.floor(this.player.x / T)
    const playerRow = Math.floor(this.player.y / T)

    // Tile-based doors (Contact Portal, interior exits)
    if (this.collision.isDoor(this.player.x, this.player.y)) {
      const door = this.currentRoom.doors.find(d => d.col === playerCol && d.row === playerRow)
      if (door) {
        this.startTransition(door)
        return
      }
    }

    // Rect-based doors (building entrances)
    const rectDoorId = this.collision.getRectDoor(this.player.x, this.player.y)
    if (rectDoorId) {
      const rd = this.currentRoom.rectDoors?.find(d => d.doorId === rectDoorId)
      if (rd) {
        this.startTransition({
          col: 0, row: 0, // unused for overworld exits (no door-open animation)
          targetRoom: rd.targetRoom,
          spawnX: rd.spawnX,
          spawnY: rd.spawnY,
          spawnDirection: rd.spawnDirection,
        })
        return
      }
    }

    // ── Interaction zone check ────────────────────────────────────────
    const activeInteraction = this.getActiveInteraction()
    const onZone = Boolean(activeInteraction)
    if (onZone !== this.lastPromptState) {
      this.lastPromptState = onZone
      this.callbacks.onShowInteractionPrompt(onZone)
    }
    const interactPressed = this.input.consumeInteract()
    if (activeInteraction && interactPressed) {
      this.callbacks.onInteraction(activeInteraction.id, activeInteraction.payload)
      return
    }

    if (this.currentRoom.id === 'overworld') {
      this.tryTriggerSnakeHiss()
      if (!activeInteraction && interactPressed) {
        this.tryTriggerCamelSpit()
      }
    }
  }

  private getActiveInteraction(): { id: string; payload?: string } | null {
    const playerCol = Math.floor(this.player.x / T)
    const playerRow = Math.floor(this.player.y / T)

    if (this.collision.isInteractionZone(this.player.x, this.player.y)) {
      const tileZone = this.currentRoom.interactionZones.find(
        (z) => z.col === playerCol && z.row === playerRow,
      )
      if (tileZone) return tileZone
    }

    const rectZone = this.currentRoom.interactionRects?.find(
      (z) =>
        this.player.x >= z.x &&
        this.player.x <= z.x + z.width &&
        this.player.y >= z.y &&
        this.player.y <= z.y + z.height,
    )

    return rectZone ?? null
  }

  // ── Transition state machine ──────────────────────────────────────────

  private startTransition(door: DoorDef) {
    if (this.transition.phase !== 'none') return
    const fromInterior = this.currentRoom.isInterior
    this.transition = {
      phase: fromInterior ? 'door-open' : 'fade-out',
      elapsed: 0,
      door,
      alpha: 0,
      doorWorldX: door.col * T,
      doorWorldY: door.row * T,
      fromInterior,
    }
    if (fromInterior) {
      this.doorAnimation.reset()
    }
    // Hide interaction prompt during transition
    if (this.lastPromptState) {
      this.lastPromptState = false
      this.callbacks.onShowInteractionPrompt(false)
    }
  }

  private stepTransition(dt: number) {
    const tr = this.transition
    tr.elapsed += dt

    switch (tr.phase) {
      case 'door-open':
        this.doorAnimation.update(dt)
        if (tr.elapsed >= DOOR_ANIM_DURATION) {
          tr.phase = 'fade-out'
          tr.elapsed = 0
          tr.alpha = 0
        }
        break

      case 'fade-out':
        tr.alpha = Math.min(tr.elapsed / FADE_DURATION, 1)
        if (tr.elapsed >= FADE_DURATION) {
          tr.phase = 'swap'
          tr.elapsed = 0
          // Perform the actual room swap at full black
          if (tr.door) this.loadRoom(tr.door.targetRoom, tr.door.spawnX, tr.door.spawnY, tr.door.spawnDirection)
        }
        break

      case 'swap':
        // Single frame of black, then start fade-in
        tr.phase = 'fade-in'
        tr.elapsed = 0
        tr.alpha = 1
        break

      case 'fade-in':
        tr.alpha = 1 - Math.min(tr.elapsed / FADE_DURATION, 1)
        if (tr.elapsed >= FADE_DURATION) {
          tr.phase = 'none'
          tr.alpha = 0
          tr.door = null
        }
        break
    }
  }

  private loadRoom(id: RoomId, spawnX: number, spawnY: number, direction: Direction) {
    const room = roomRegistry.get(id)
    this.currentRoom = room
    this.collision = new CollisionMap(room.collisionGrid, room.tileSize, room.collisionRects)
    this.player.x = spawnX
    this.player.y = spawnY
    this.player.direction = direction
    this.player.isMoving = false
    this.creatureSpeechBubbles = []
    this.camelSpitParticles = []
    this.camelInteractCooldowns.clear()
    this.snakeHissCooldowns.clear()

    // Swap ambient sprites
    this.ambients = room.buildAmbients?.() ?? []

    // Camera snap to new room
    const mapW = room.cols * room.tileSize
    const mapH = room.rows * room.tileSize
    const viewport = this.getViewportSize(room)
    this.camera.setViewSize(viewport.width, viewport.height)
    this.camera.snapTo(spawnX, spawnY, mapW, mapH)
  }

  // ── Render ────────────────────────────────────────────────────────────

  private render() {
    const ctx = this.mainCtx

    // Background fill
    ctx.fillStyle = '#2a1a08'
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H)

    // Clear photo overlay each frame
    if (this.photoCtx && this.photoOverlay) {
      this.photoCtx.clearRect(0, 0, this.photoOverlay.width, this.photoOverlay.height)
    }

    if (this.currentRoom.isInterior) {
      this.ctx = this.mainCtx
      const cx = Math.round(this.camera.x)
      const cy = Math.round(this.camera.y)
      this.renderInterior()
      this.player.render(ctx, cx, cy) // always on top in interiors
    } else {
      this.overworldCtx.clearRect(0, 0, OVERWORLD_VIEW_W, OVERWORLD_VIEW_H)
      this.overworldCtx.fillStyle = '#2a1a08'
      this.overworldCtx.fillRect(0, 0, OVERWORLD_VIEW_W, OVERWORLD_VIEW_H)

      this.ctx = this.overworldCtx
      this.renderOverworld() // player rendered inside via Y-sort
      if (this.showDebugOverlay) {
        this.renderDebugOverlay()
      }
      this.ctx = this.mainCtx
      ctx.drawImage(this.overworldCanvas, 0, 0, NATIVE_W, NATIVE_H)

      ctx.fillStyle = this.dayNightCycle.getOverlayColor()
      ctx.fillRect(0, 0, NATIVE_W, NATIVE_H)
      this.renderCreatureSpeechBubblesOnMain()

    }

    // Transition fade overlay
    if (this.transition.alpha > 0) {
      ctx.save()
      ctx.globalAlpha = this.transition.alpha
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, NATIVE_W, NATIVE_H)
      ctx.restore()
    }

    if (this.showDebugOverlay && this.currentRoom.isInterior) {
      this.renderDebugOverlay()
    }
  }

  // ── Overworld render (Y-sorted for walk-behind) ──────────────────────

  private renderOverworld() {
    const { ctx } = this
    const cx = Math.round(this.camera.x)
    const cy = Math.round(this.camera.y)
    const { width: viewW, height: viewH } = this.getViewportSize()
    const playerBounds = getPlayerCollisionBounds(this.player.x, this.player.y)
    const showProps = this.overworldLayerMode === 0
    const showStructures = this.overworldLayerMode !== 2

    const getSpriteSortY = (sprite: StaticSprite) => {
      if (sprite.occlusionStartY !== undefined && playerBounds.top >= sprite.occlusionStartY) {
        return sprite.occlusionStartY
      }
      return sprite.worldY + sprite.renderH
    }

    // 1. Flat ground layers — always behind everything
    this.tileRenderer.renderLayer(ctx, terrainLayer,    this.desertTileSet, cx, cy, viewW, viewH)
    this.tileRenderer.renderLayer(ctx, decorationLayer, this.desertTileSet, cx, cy, viewW, viewH)
    for (const tile of overworldBorderTiles) {
      this.tileRenderer.renderBlock(
        ctx,
        [[tile.tile]],
        this.desertTileSet,
        tile.col * T,
        tile.row * T,
        cx,
        cy,
        T,
        T,
        viewW,
        viewH,
      )
    }

    // 2. Collect drawables around the player layer.
    const prePlayerSortables: { sortY: number; draw: () => void }[] = []
    const postPlayerSortables: { sortY: number; draw: () => void }[] = []
    const shrubberyDraws: Array<() => void> = []

    const pushSortable = (sortY: number, draw: () => void) => {
      if (sortY <= this.player.y) {
        prePlayerSortables.push({ sortY, draw })
      } else {
        postPlayerSortables.push({ sortY, draw })
      }
    }

    const drawStaticSprite = (sprite: StaticSprite, dx: number, dy: number) => {
      if (sprite.flipX) {
        ctx.save()
        ctx.translate(dx + sprite.renderW, dy)
        ctx.scale(-1, 1)
        sprite.sheet.draw(ctx, sprite.frame, 0, 0, sprite.renderW, sprite.renderH)
        ctx.restore()
        return
      }
      sprite.sheet.draw(ctx, sprite.frame, dx, dy, sprite.renderW, sprite.renderH)
    }

    // Cropped landmark / building sprites
    if (showStructures) {
      for (const s of this.overworldStructures) {
        if (!s.sheet.isLoaded()) continue
        const dx = s.worldX - cx
        const dy = s.worldY - cy
        if (dx + s.renderW < 0 || dx > viewW || dy + s.renderH < 0 || dy > viewH) continue
        pushSortable(getSpriteSortY(s), () => drawStaticSprite(s, dx, dy))
      }
    }

    // Ground props should never cover the player. Only props that explicitly
    // participate in walk-behind occlusion stay in the Y-sorted stack.
    if (showProps) {
      for (const s of this.overworldProps) {
        if (!s.sheet.isLoaded()) continue
        const dx = s.worldX - cx
        const dy = s.worldY - cy
        if (dx + s.renderW < 0 || dx > viewW || dy + s.renderH < 0 || dy > viewH) continue
        if (s.renderLayer === 'shrubbery') {
          shrubberyDraws.push(() => drawStaticSprite(s, dx, dy))
          continue
        }
        if (s.occlusionStartY === undefined) {
          drawStaticSprite(s, dx, dy)
        } else {
          pushSortable(getSpriteSortY(s), () => drawStaticSprite(s, dx, dy))
        }
      }
    }

    // Ground snakes should never render over the player. Camels keep their
    // regular Y-sorted behavior so they still feel like world entities.
    if (showProps) {
      for (const a of this.overworldAmbients) {
        if (a.type === 'snake') {
          a.render(ctx, cx, cy)
        } else {
          pushSortable(a.sortY, () => a.render(ctx, cx, cy))
        }
      }
    }

    // NPC sprites should not cover the player.
    for (const n of this.npcSprites) {
      n.render(ctx, cx, cy)
    }

    if (this.resumeChest) {
      this.renderResumeChest(ctx, cx, cy)
    }

    // 3. Draw entities in front/back passes around the player so shrubbery can
    // sit above palms/structures while still staying below the player.
    prePlayerSortables.sort((a, b) => a.sortY - b.sortY)
    postPlayerSortables.sort((a, b) => a.sortY - b.sortY)

    for (const s of prePlayerSortables) s.draw()
    for (const draw of shrubberyDraws) draw()
    this.player.render(ctx, cx, cy)
    for (const s of postPlayerSortables) s.draw()
    this.renderOverworldCreatureEffects(cx, cy)
  }

  private tickOverworldCreatureEffects(dt: number) {
    const tickCooldowns = (cooldowns: Map<string, number>) => {
      for (const [key, timeLeft] of cooldowns.entries()) {
        const next = timeLeft - dt
        if (next <= 0) {
          cooldowns.delete(key)
        } else {
          cooldowns.set(key, next)
        }
      }
    }

    tickCooldowns(this.camelInteractCooldowns)
    tickCooldowns(this.snakeHissCooldowns)

    this.creatureSpeechBubbles = this.creatureSpeechBubbles
      .map((bubble) => ({ ...bubble, ttl: bubble.ttl - dt }))
      .filter((bubble) => bubble.ttl > 0)

    this.camelSpitParticles = this.camelSpitParticles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx * dt,
        y: particle.y + particle.vy * dt,
        vy: particle.vy + 150 * dt,
        ttl: particle.ttl - dt,
      }))
      .filter((particle) => particle.ttl > 0)
  }

  private tryTriggerCamelSpit() {
    const camel = this.findNearestAmbient('camel', 58)
    if (!camel || this.camelInteractCooldowns.has(camel.id)) return

    const mouthOffsetX = camel.facing === 'left' ? 8 : camel.width - 8
    const originX = camel.x + mouthOffsetX
    const originY = camel.y + camel.height * 0.42
    const dx = this.player.x - originX
    const dy = this.player.y - originY
    const length = Math.hypot(dx, dy) || 1
    const dirX = dx / length
    const dirY = dy / length

    const particleCount = 12
    for (let i = 0; i < particleCount; i++) {
      const speed = 44 + Math.random() * 34
      this.camelSpitParticles.push({
        x: originX + (Math.random() * 4 - 2),
        y: originY + (Math.random() * 4 - 2),
        vx: dirX * speed + (Math.random() * 18 - 9),
        vy: dirY * speed - 12 + (Math.random() * 16 - 8),
        ttl: 0.35 + Math.random() * 0.3,
        size: Math.random() > 0.55 ? 3 : 2,
        color: Math.random() > 0.4 ? '#d8f07a' : '#b8df63',
      })
    }

    this.creatureSpeechBubbles.push({
      text: 'PTOO!',
      worldX: camel.centerX,
      worldY: camel.y - 6,
      ttl: 0.85,
      fill: 'rgba(40, 28, 10, 0.92)',
      border: '#d8f07a',
    })

    this.playAmbientSfx('/assets/sfx/spitcamel.wav', 0.16)
    this.camelInteractCooldowns.set(camel.id, 2.6)
  }

  private tryTriggerSnakeHiss() {
    const snake = this.overworldAmbients.find((ambient) => ambient.id === 'snake-west-border')
    if (!snake || this.snakeHissCooldowns.has(snake.id)) return

    const distance = Math.hypot(this.player.x - snake.centerX, this.player.y - snake.centerY)
    if (distance > 68) return

    const hisses = ['HSSS', 'SSSS', 'HISSS']
    this.creatureSpeechBubbles.push({
      text: hisses[Math.floor(Math.random() * hisses.length)],
      worldX: snake.centerX,
      worldY: snake.y - 8,
      ttl: 1.1,
      fill: 'rgba(26, 16, 8, 0.94)',
      border: '#d28d53',
    })

    this.playAmbientSfx('/assets/sfx/hisssnake.wav', 0.13)
    this.snakeHissCooldowns.set(snake.id, 3.8)
  }

  private findNearestAmbient(type: 'camel' | 'snake', maxDistance: number) {
    let nearest: AmbientSprite | null = null
    let nearestDistance = maxDistance

    for (const ambient of this.overworldAmbients) {
      if (ambient.type !== type) continue
      const distance = Math.hypot(this.player.x - ambient.centerX, this.player.y - ambient.centerY)
      if (distance <= nearestDistance) {
        nearest = ambient
        nearestDistance = distance
      }
    }

    return nearest
  }

  private renderOverworldCreatureEffects(cx: number, cy: number) {
    const { ctx } = this

    if (this.camelSpitParticles.length > 0) {
      ctx.save()
      for (const particle of this.camelSpitParticles) {
        const alpha = Math.max(0, Math.min(1, particle.ttl / 0.65))
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.fillRect(
          Math.round(particle.x - cx),
          Math.round(particle.y - cy),
          particle.size,
          particle.size,
        )
      }
      ctx.restore()
    }
  }

  private renderCreatureSpeechBubblesOnMain() {
    if (this.currentRoom.id !== 'overworld' || this.creatureSpeechBubbles.length === 0) return

    const { ctx } = this
    const cx = Math.round(this.camera.x)
    const cy = Math.round(this.camera.y)
    const scaleX = NATIVE_W / OVERWORLD_VIEW_W
    const scaleY = NATIVE_H / OVERWORLD_VIEW_H

    ctx.save()
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const bubble of this.creatureSpeechBubbles) {
      const screenX = Math.round((bubble.worldX - cx) * scaleX)
      const screenY = Math.round((bubble.worldY - cy) * scaleY)
      const bubbleWidth = Math.max(42, bubble.text.length * 7 + 14)
      const bubbleHeight = 18
      const left = Math.round(screenX - bubbleWidth / 2)
      const top = Math.round(screenY - bubbleHeight)

      ctx.fillStyle = bubble.fill
      ctx.fillRect(left, top, bubbleWidth, bubbleHeight)
      ctx.strokeStyle = bubble.border
      ctx.strokeRect(left + 0.5, top + 0.5, bubbleWidth - 1, bubbleHeight - 1)
      ctx.beginPath()
      ctx.moveTo(screenX, top + bubbleHeight + 4)
      ctx.lineTo(screenX - 4, top + bubbleHeight - 1)
      ctx.lineTo(screenX + 4, top + bubbleHeight - 1)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#000'
      ctx.fillText(bubble.text, screenX + 1, top + bubbleHeight / 2 + 1)
      ctx.fillStyle = '#f7dfab'
      ctx.fillText(bubble.text, screenX, top + bubbleHeight / 2)
    }

    ctx.restore()
  }

  private playAmbientSfx(src: string, volume: number) {
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
  }

  // ── Interior render (canvas-drawn walls/floors + sprites) ─────────────

  private renderInterior() {
    const { ctx } = this
    const cx = Math.round(this.camera.x)
    const cy = Math.round(this.camera.y)
    const room = this.currentRoom
    const ts = room.tileSize
    const isProjectsLab = room.id === 'projectsLab'
    const isPyramidLore = room.id === 'pyramidLore'
    const isContactPortal = room.id === 'contactPortal'
    const isSecretRoom = room.id === 'secretRoom'
    const gallery = towerGalleryData[room.id]

    // Visible tile range (frustum culling)
    const minCol = Math.max(0, Math.floor(cx / ts))
    const maxCol = Math.min(room.cols - 1, Math.floor((cx + NATIVE_W) / ts))
    const minRow = Math.max(0, Math.floor(cy / ts))
    const maxRow = Math.min(room.rows - 1, Math.floor((cy + NATIVE_H) / ts))

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const tile = room.collisionGrid[row]?.[col] ?? 0
        const dx = Math.floor(col * ts - cx)
        const dy = Math.floor(row * ts - cy)

        if (tile === 0) {
          // Check if this wall tile is a desk surface in the Projects Lab
          const deskStation = isProjectsLab
            ? stationDecos.find(s => s.deskRow === row && (col === s.deskCols[0] || col === s.deskCols[1]))
            : null
          const markerStation = isProjectsLab
            ? stationDecos.find(s => s.markerRow === row && (col === s.deskCols[0] || col === s.deskCols[1]))
            : null

          if (deskStation) {
            // Desk surface: dark wood plank look
            ctx.fillStyle = '#3d2b1a'
            ctx.fillRect(dx, dy, ts, ts)
            // Wood grain lines
            ctx.fillStyle = '#4d3822'
            ctx.fillRect(dx, dy + 6, ts, 1)
            ctx.fillRect(dx, dy + 14, ts, 1)
            ctx.fillRect(dx, dy + 22, ts, 1)
            ctx.fillRect(dx, dy + 30, ts, 1)
            // Front edge highlight
            ctx.fillStyle = '#5a4430'
            ctx.fillRect(dx, dy + ts - 2, ts, 2)
          } else if (markerStation) {
            // Colored marker/sign above desk
            ctx.fillStyle = '#5a3820'
            ctx.fillRect(dx, dy, ts, ts)
            // Brick mortar
            ctx.fillStyle = '#4a2e18'
            ctx.fillRect(dx, dy + 7, ts, 1)
            ctx.fillRect(dx, dy + 15, ts, 1)
            ctx.fillRect(dx, dy + 23, ts, 1)
            ctx.fillRect(dx + 16, dy, 1, 8)
            ctx.fillRect(dx + 8, dy + 8, 1, 8)
            ctx.fillRect(dx + 24, dy + 8, 1, 8)
            ctx.fillRect(dx + 16, dy + 16, 1, 8)
            ctx.fillRect(dx + 8, dy + 24, 1, 8)
            ctx.fillRect(dx + 24, dy + 24, 1, 8)
            // Colored banner/sign strip
            ctx.fillStyle = markerStation.color
            ctx.fillRect(dx + 4, dy + 10, ts - 8, 12)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
            ctx.fillRect(dx + 4, dy + 10, ts - 8, 1)
            ctx.fillRect(dx + 4, dy + 21, ts - 8, 1)
          } else {
            // Check if this wall tile is a shelf backing in Pyramid Lore or Contact Portal
            const isShelfBacking = isPyramidLore
              ? skillPedestals.find(p => p.shelfRow === row && p.shelfCol === col)
              : null
            const isContactShelf = isContactPortal
              ? contactStations.find(s => s.shelfRow === row && s.shelfCol === col)
              : null

            if (isContactShelf) {
              // Mystical station alcove: deep purple-brown stone
              ctx.fillStyle = '#3a2838'
              ctx.fillRect(dx, dy, ts, ts)
              // Stone mortar lines
              ctx.fillStyle = '#2a1828'
              ctx.fillRect(dx, dy + 10, ts, 1)
              ctx.fillRect(dx, dy + 21, ts, 1)
              ctx.fillRect(dx + 16, dy, 1, 11)
              ctx.fillRect(dx + 8, dy + 11, 1, 11)
              ctx.fillRect(dx + 24, dy + 11, 1, 10)
              // Colored accent strip (station identifier)
              ctx.fillStyle = isContactShelf.color
              ctx.globalAlpha = 0.5
              ctx.fillRect(dx + 3, dy + ts - 5, ts - 6, 3)
              ctx.globalAlpha = 1.0
            } else if (isShelfBacking) {
              // Shelf surface: dark wood plank with bracket details
              ctx.fillStyle = '#3a2510'
              ctx.fillRect(dx, dy, ts, ts)
              // Wood grain
              ctx.fillStyle = '#4a3520'
              ctx.fillRect(dx, dy + 8, ts, 1)
              ctx.fillRect(dx, dy + 18, ts, 1)
              ctx.fillRect(dx, dy + 28, ts, 1)
              // Front shelf edge (lighter strip at bottom)
              ctx.fillStyle = '#5a4530'
              ctx.fillRect(dx, dy + ts - 3, ts, 3)
              // Bracket details (small L-shaped supports)
              ctx.fillStyle = '#6a5540'
              ctx.fillRect(dx + 4, dy + ts - 6, 2, 6)
              ctx.fillRect(dx + ts - 6, dy + ts - 6, 2, 6)
            } else if (isSecretRoom && isSecretPropTile(col, row)) {
              const station = isSecretPropTile(col, row)!
              if (station.icon === 'terminal') {
                // Terminal screen: black monitor on dark wall
                ctx.fillStyle = '#2a1e14'
                ctx.fillRect(dx, dy, ts, ts)
                // Screen bezel
                ctx.fillStyle = '#1a1a1a'
                ctx.fillRect(dx + 2, dy + 3, ts - 4, ts - 6)
                // Screen surface (dark green CRT)
                ctx.fillStyle = '#0a1a0a'
                ctx.fillRect(dx + 4, dy + 5, ts - 8, ts - 10)
                // Scan line effect
                ctx.fillStyle = '#0d200d'
                for (let sy = 5; sy < ts - 5; sy += 3) {
                  ctx.fillRect(dx + 4, dy + sy, ts - 8, 1)
                }
                // Blinking cursor
                const blink = Math.sin(Date.now() / 400) > 0
                if (blink) {
                  ctx.fillStyle = '#00ff41'
                  ctx.fillRect(dx + 8, dy + ts - 12, 6, 2)
                }
                // Green text lines
                ctx.fillStyle = '#00aa30'
                ctx.fillRect(dx + 7, dy + 8, 12, 1)
                ctx.fillRect(dx + 7, dy + 12, 8, 1)
                ctx.fillRect(dx + 7, dy + 16, 14, 1)
              } else if (station.icon === 'bulletin') {
                // Bulletin board: cork board on wall
                ctx.fillStyle = '#2a1e14'
                ctx.fillRect(dx, dy, ts, ts)
                // Cork background
                ctx.fillStyle = '#9a7a50'
                ctx.fillRect(dx + 3, dy + 3, ts - 6, ts - 6)
                // Board border
                ctx.fillStyle = '#5a3a20'
                ctx.fillRect(dx + 3, dy + 3, ts - 6, 2)
                ctx.fillRect(dx + 3, dy + ts - 5, ts - 6, 2)
                ctx.fillRect(dx + 3, dy + 3, 2, ts - 6)
                ctx.fillRect(dx + ts - 5, dy + 3, 2, ts - 6)
                // Paper notes pinned to board
                ctx.fillStyle = '#f0e8d0'
                ctx.fillRect(dx + 7, dy + 7, 8, 6)
                ctx.fillStyle = '#e8d8b8'
                ctx.fillRect(dx + 17, dy + 9, 7, 8)
                ctx.fillStyle = '#ffe880'
                ctx.fillRect(dx + 8, dy + 16, 10, 7)
                // Pins
                ctx.fillStyle = '#e04040'
                ctx.fillRect(dx + 10, dy + 6, 2, 2)
                ctx.fillRect(dx + 19, dy + 8, 2, 2)
                ctx.fillStyle = '#4040e0'
                ctx.fillRect(dx + 12, dy + 15, 2, 2)
              } else if (station.icon === 'jukebox') {
                // Jukebox: colorful music box on wall
                ctx.fillStyle = '#2a1e14'
                ctx.fillRect(dx, dy, ts, ts)
                // Jukebox body
                ctx.fillStyle = '#6a2040'
                ctx.fillRect(dx + 5, dy + 4, ts - 10, ts - 7)
                // Window / record area
                ctx.fillStyle = '#1a0a10'
                ctx.fillRect(dx + 8, dy + 7, ts - 16, 10)
                // Record (vinyl circle)
                const jcx = dx + ts / 2
                const jcy = dy + 12
                ctx.fillStyle = '#1a1a1a'
                ctx.beginPath()
                ctx.arc(jcx, jcy, 4, 0, Math.PI * 2)
                ctx.fill()
                // Label on record
                ctx.fillStyle = '#e060a0'
                ctx.beginPath()
                ctx.arc(jcx, jcy, 1.5, 0, Math.PI * 2)
                ctx.fill()
                // Colored lights
                const lightPhase = Date.now() / 300
                ctx.fillStyle = `hsl(${lightPhase % 360}, 80%, 60%)`
                ctx.fillRect(dx + 8, dy + 19, 3, 2)
                ctx.fillStyle = `hsl(${(lightPhase + 120) % 360}, 80%, 60%)`
                ctx.fillRect(dx + 14, dy + 19, 3, 2)
                ctx.fillStyle = `hsl(${(lightPhase + 240) % 360}, 80%, 60%)`
                ctx.fillRect(dx + 20, dy + 19, 3, 2)
              } else if (station.icon === 'bookshelf') {
                // Bookshelf: tall shelf with colored book spines
                ctx.fillStyle = '#3a2510'
                ctx.fillRect(dx, dy, ts, ts)
                // Shelf planks
                ctx.fillStyle = '#4a3520'
                ctx.fillRect(dx, dy + 15, ts, 2)
                ctx.fillRect(dx, dy + ts - 2, ts, 2)
                // Books (top shelf)
                const bookColors = ['#8B4513', '#CC3300', '#6B3FA0', '#1a3c5e']
                bookColors.forEach((color, i) => {
                  ctx.fillStyle = color
                  ctx.fillRect(dx + 4 + i * 6, dy + 3, 5, 12)
                })
                // Books (bottom shelf)
                ctx.fillStyle = '#4a6030'
                ctx.fillRect(dx + 5, dy + 18, 5, 11)
                ctx.fillStyle = '#8a6040'
                ctx.fillRect(dx + 12, dy + 18, 5, 11)
                ctx.fillStyle = '#3a5a8a'
                ctx.fillRect(dx + 19, dy + 18, 6, 11)
              } else if (station.icon === 'arcade') {
                // Arcade cabinet: small retro game machine
                ctx.fillStyle = '#2a1e14'
                ctx.fillRect(dx, dy, ts, ts)
                // Cabinet body
                ctx.fillStyle = '#2a2a3a'
                ctx.fillRect(dx + 5, dy + 2, ts - 10, ts - 4)
                // Screen
                ctx.fillStyle = '#0a0a0a'
                ctx.fillRect(dx + 7, dy + 4, ts - 14, 14)
                // Mini snake on screen
                ctx.fillStyle = '#40c040'
                ctx.fillRect(dx + 9, dy + 8, 3, 3)
                ctx.fillRect(dx + 12, dy + 8, 3, 3)
                ctx.fillRect(dx + 15, dy + 8, 3, 3)
                ctx.fillRect(dx + 15, dy + 11, 3, 3)
                // Food dot
                ctx.fillStyle = '#ff4040'
                ctx.fillRect(dx + 10, dy + 13, 2, 2)
                // Buttons
                ctx.fillStyle = '#e04040'
                ctx.fillRect(dx + 10, dy + 22, 4, 3)
                ctx.fillStyle = '#4040e0'
                ctx.fillRect(dx + 17, dy + 22, 4, 3)
              } else if (station.icon === 'sand') {
                // Suspicious sand patch: wall inset with loose sand and tracks.
                ctx.fillStyle = '#2a1e14'
                ctx.fillRect(dx, dy, ts, ts)
                ctx.fillStyle = '#8e6b3a'
                ctx.fillRect(dx + 4, dy + 6, ts - 8, ts - 10)
                ctx.fillStyle = '#b78949'
                ctx.fillRect(dx + 6, dy + 8, ts - 12, ts - 14)
                ctx.fillStyle = '#6f532d'
                ctx.fillRect(dx + 8, dy + 10, 4, 2)
                ctx.fillRect(dx + 18, dy + 13, 3, 2)
                ctx.fillRect(dx + 13, dy + 18, 3, 2)
                ctx.fillStyle = '#402010'
                ctx.fillRect(dx + 11, dy + 12, 2, 2)
                ctx.fillRect(dx + 15, dy + 16, 2, 2)
                ctx.fillStyle = '#d1b170'
                ctx.fillRect(dx + 20, dy + 20, 4, 3)
              }
            } else {
              // Regular wall tile with room-specific palette
              const wallBase = isSecretRoom ? '#3a2818' : isContactPortal ? '#4a2830' : '#5a3820'
              const wallMortar = isSecretRoom ? '#2a1e10' : isContactPortal ? '#3a1820' : '#4a2e18'
              ctx.fillStyle = wallBase
              ctx.fillRect(dx, dy, ts, ts)
              ctx.fillStyle = wallMortar
              ctx.fillRect(dx, dy + 7, ts, 1)
              ctx.fillRect(dx, dy + 15, ts, 1)
              ctx.fillRect(dx, dy + 23, ts, 1)
              ctx.fillRect(dx + 16, dy, 1, 8)
              ctx.fillRect(dx + 8, dy + 8, 1, 8)
              ctx.fillRect(dx + 24, dy + 8, 1, 8)
              ctx.fillRect(dx + 16, dy + 16, 1, 8)
              ctx.fillRect(dx + 8, dy + 24, 1, 8)
              ctx.fillRect(dx + 24, dy + 24, 1, 8)
            }
          }
        } else {
          // Check if this is a Contact Portal diamond tile
          const isPortalTile = isContactPortal
            && portalTiles.some(p => p.col === col && p.row === row)
          const contactStation = isContactPortal
            ? contactStations.find(s => s.col === col && s.row === row)
            : null

          if (isPortalTile) {
            // Portal diamond floor: lighter mystical stone
            ctx.fillStyle = '#a0b8c8'
            ctx.fillRect(dx, dy, ts, ts)
            // Inner diamond pattern etched into stone
            ctx.fillStyle = '#90a8b8'
            ctx.fillRect(dx, dy + ts - 1, ts, 1)
            ctx.fillRect(dx + ts - 1, dy, 1, ts)
            // Animated teal glow
            const pulse = Math.sin(Date.now() / 600 + col * 0.5 + row * 0.7) * 0.12 + 0.18
            ctx.save()
            ctx.globalAlpha = pulse
            ctx.fillStyle = '#40e0d0'
            ctx.fillRect(dx + 1, dy + 1, ts - 2, ts - 2)
            ctx.restore()
            // Rune mark in center tile
            if (col === 5 && row === 5) {
              ctx.save()
              ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 500) * 0.15
              ctx.strokeStyle = '#60ffee'
              ctx.lineWidth = 1.5
              const cx2 = dx + ts / 2
              const cy2 = dy + ts / 2
              // Diamond rune
              ctx.beginPath()
              ctx.moveTo(cx2, cy2 - 10)
              ctx.lineTo(cx2 + 8, cy2)
              ctx.lineTo(cx2, cy2 + 10)
              ctx.lineTo(cx2 - 8, cy2)
              ctx.closePath()
              ctx.stroke()
              // Inner dot
              ctx.fillStyle = '#60ffee'
              ctx.beginPath()
              ctx.arc(cx2, cy2, 2, 0, Math.PI * 2)
              ctx.fill()
              ctx.restore()
            }
          } else if (contactStation) {
            // Station interaction tile: mystical dark floor with colored accent
            ctx.fillStyle = '#8a7a6a'
            ctx.fillRect(dx, dy, ts, ts)
            ctx.fillStyle = '#7a6a5a'
            ctx.fillRect(dx, dy + ts - 1, ts, 1)
            ctx.fillRect(dx + ts - 1, dy, 1, ts)
            // Colored glow for the station
            ctx.save()
            ctx.globalAlpha = 0.2 + Math.sin(Date.now() / 800) * 0.08
            ctx.fillStyle = contactStation.color
            ctx.fillRect(dx + 2, dy + 2, ts - 4, ts - 4)
            ctx.restore()
            // Small prop pedestal
            ctx.fillStyle = '#5a4a3a'
            ctx.fillRect(dx + 6, dy + 18, ts - 12, 10)
            ctx.fillStyle = '#6a5a4a'
            ctx.fillRect(dx + 6, dy + 18, ts - 12, 2)
          } else {
            // Regular floor tile
            if (isContactPortal) {
              // Darker mystical stone for Contact Portal
              ctx.fillStyle = '#9a8a70'
              ctx.fillRect(dx, dy, ts, ts)
              ctx.fillStyle = '#8a7a60'
            } else if (isSecretRoom) {
              // Cozy dark stone for Secret Room
              ctx.fillStyle = '#8a7860'
              ctx.fillRect(dx, dy, ts, ts)
              ctx.fillStyle = '#7a6850'
            } else {
              // Standard sandy stone
              ctx.fillStyle = '#c8a870'
              ctx.fillRect(dx, dy, ts, ts)
              ctx.fillStyle = '#b89860'
            }
            ctx.fillRect(dx, dy + ts - 1, ts, 1)
            ctx.fillRect(dx + ts - 1, dy, 1, ts)
          }

          // Interaction zone accent (subtle glow) — non-Contact-Portal rooms
          if (tile === 2 && !isPortalTile && !contactStation) {
            const stationColor = isProjectsLab
              ? stationDecos.find(s => row === 4 && (col === s.deskCols[0] || col === s.deskCols[1]))?.color
              : null
            const pedestal = isPyramidLore
              ? skillPedestals.find(p => p.row === row && p.col === col)
              : null
            const secretStation = isSecretRoom
              ? secretStations.find(s => s.col === col && s.row === row)
              : null

            if (secretStation) {
              // Secret room station glow
              ctx.save()
              ctx.globalAlpha = 0.15 + Math.sin(Date.now() / 700 + col) * 0.06
              ctx.fillStyle = secretStation.color
              ctx.fillRect(dx + 2, dy + 2, ts - 4, ts - 4)
              ctx.restore()
            } else if (stationColor) {
              ctx.save()
              ctx.globalAlpha = 0.12
              ctx.fillStyle = stationColor
              ctx.fillRect(dx + 2, dy + 2, ts - 4, ts - 4)
              ctx.restore()
            } else if (pedestal) {
              // Tier-colored pedestal glow
              const tierColor = pedestal.tier === 'legendary' ? '#c8a850'
                : pedestal.tier === 'rare' ? '#5090c0'
                : '#8a7a6a'
              ctx.save()
              ctx.globalAlpha = 0.18
              ctx.fillStyle = tierColor
              ctx.fillRect(dx + 2, dy + 2, ts - 4, ts - 4)
              ctx.restore()
              // Small pedestal/platform in the center of the tile
              ctx.fillStyle = pedestal.tier === 'legendary' ? '#8a7020'
                : pedestal.tier === 'rare' ? '#3a6080'
                : '#5a5040'
              ctx.fillRect(dx + 6, dy + 20, ts - 12, 8)
              // Top surface highlight
              ctx.fillStyle = pedestal.tier === 'legendary' ? '#b89830'
                : pedestal.tier === 'rare' ? '#5090b0'
                : '#7a6a5a'
              ctx.fillRect(dx + 6, dy + 20, ts - 12, 2)
            } else {
              ctx.fillStyle = 'rgba(200, 168, 80, 0.15)'
              ctx.fillRect(dx + 2, dy + 2, ts - 4, ts - 4)
            }
          }
        }
      }
    }

    if (gallery) {
      this.renderGalleryFloorDecor(cx, cy)
    }
    this.renderInteriorSpriteDecos(room, cx, cy)
    if (isProjectsLab) {
      this.renderProjectsLabWorkbenchDecor(cx, cy)
    }

    // ── Projects Lab: station labels ─────────────────────────────────────
    if (isProjectsLab) {
      ctx.save()
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (const station of stationDecos) {
        const labelX = Math.floor((station.deskCols[0] + station.deskCols[1] + 1) / 2 * ts - cx)
        const labelY = Math.floor(station.markerRow * ts - cy) + 4
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillText(station.label, labelX + 1, labelY + 1)
        // Label
        ctx.fillStyle = station.color
        ctx.fillText(station.label, labelX, labelY)
      }
      ctx.restore()
    }

    // ── Pyramid Lore: skill item icons + category labels ─────────────────
    if (isPyramidLore) {
      ctx.save()

      // Draw skill item icons on each pedestal
      for (const ped of skillPedestals) {
        const px = Math.floor(ped.col * ts - cx)
        const py = Math.floor(ped.row * ts - cy)

        // Tier-colored orb/gem on the pedestal
        const orbX = px + ts / 2
        const orbY = py + 14
        const orbR = 5

        // Outer glow
        ctx.globalAlpha = 0.3
        ctx.fillStyle = ped.tier === 'legendary' ? '#ffe060'
          : ped.tier === 'rare' ? '#60b0ff'
          : '#b0a090'
        ctx.beginPath()
        ctx.arc(orbX, orbY, orbR + 3, 0, Math.PI * 2)
        ctx.fill()

        // Orb body
        ctx.globalAlpha = 1.0
        ctx.fillStyle = ped.tier === 'legendary' ? '#c8a850'
          : ped.tier === 'rare' ? '#4a90c0'
          : '#8a7a6a'
        ctx.beginPath()
        ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2)
        ctx.fill()

        // Specular highlight
        ctx.fillStyle = ped.tier === 'legendary' ? '#ffe890'
          : ped.tier === 'rare' ? '#90d0ff'
          : '#c0b0a0'
        ctx.beginPath()
        ctx.arc(orbX - 1, orbY - 2, 2, 0, Math.PI * 2)
        ctx.fill()

        // Legendary pulse (animated glow ring)
        if (ped.tier === 'legendary') {
          const pulse = Math.sin(Date.now() / 400) * 0.15 + 0.15
          ctx.globalAlpha = pulse
          ctx.strokeStyle = '#ffe060'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(orbX, orbY, orbR + 5, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1.0
        }

        // Skill name label below the pedestal
        ctx.font = 'bold 8px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillText(ped.name, px + ts / 2 + 1, py + 25)
        ctx.fillStyle = ped.tier === 'legendary' ? '#c8a850'
          : ped.tier === 'rare' ? '#80b8e0'
          : '#a09080'
        ctx.fillText(ped.name, px + ts / 2, py + 24)
      }

      for (const plaque of workshopPlaques) {
        const px = Math.floor(plaque.col * ts - cx)
        const py = Math.floor(plaque.row * ts - cy)
        const plaqueX = px + 4
        const plaqueY = py + 6
        const plaqueW = ts - 8
        const plaqueH = 16
        const glow = plaque.placement === 'near-door' ? '#f0d494' : '#c8a850'

        ctx.globalAlpha = 0.16
        ctx.fillStyle = glow
        ctx.fillRect(plaqueX - 2, plaqueY - 2, plaqueW + 4, plaqueH + 4)

        ctx.globalAlpha = 1
        ctx.fillStyle = '#4f3820'
        ctx.fillRect(plaqueX, plaqueY, plaqueW, plaqueH)
        ctx.strokeStyle = glow
        ctx.strokeRect(plaqueX + 0.5, plaqueY + 0.5, plaqueW - 1, plaqueH - 1)

        ctx.font = 'bold 7px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillText(plaque.label, px + ts / 2 + 1, plaqueY + plaqueH / 2 + 1)
        ctx.fillStyle = '#f5e6c8'
        ctx.fillText(plaque.label, px + ts / 2, plaqueY + plaqueH / 2)
      }

      // Draw category labels on the walls
      ctx.font = 'bold 9px monospace'
      ctx.textBaseline = 'middle'
      for (const cat of categoryLabels) {
        const lx = Math.floor(cat.x - cx)
        const ly = Math.floor(cat.y - cy)

        // Render vertically for side walls (BACKEND, FRONTEND)
        if (cat.label === 'BACKEND' || cat.label === 'FRONTEND') {
          ctx.save()
          ctx.translate(lx, ly)
          ctx.rotate(-Math.PI / 2)
          ctx.textAlign = 'center'
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
          ctx.fillText(cat.label, 1, 1)
          // Label
          ctx.fillStyle = cat.color
          ctx.fillText(cat.label, 0, 0)
          ctx.restore()
        } else {
          ctx.textAlign = 'center'
          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
          ctx.fillText(cat.label, lx + 1, ly + 1)
          // Label
          ctx.fillStyle = cat.color
          ctx.fillText(cat.label, lx, ly)
        }
      }

      ctx.restore()
    }

    // ── Contact Portal: station icons, labels, and portal glow ───────────
    if (isContactPortal) {
      ctx.save()

      // Animated radial glow over the portal center
      const portalCols = portalTiles.map((tile) => tile.col)
      const portalRows = portalTiles.map((tile) => tile.row)
      const portalMinCol = Math.min(...portalCols)
      const portalMaxCol = Math.max(...portalCols)
      const portalMinRow = Math.min(...portalRows)
      const portalMaxRow = Math.max(...portalRows)
      const portalCX = ((portalMinCol + portalMaxCol + 1) / 2) * ts - cx
      const portalCY = ((portalMinRow + portalMaxRow + 1) / 2) * ts - cy
      const glowPulse = Math.sin(Date.now() / 700) * 0.08 + 0.16
      const grad = ctx.createRadialGradient(portalCX, portalCY, 4, portalCX, portalCY, ts * 2)
      grad.addColorStop(0, `rgba(64, 224, 208, ${glowPulse + 0.1})`)
      grad.addColorStop(0.5, `rgba(64, 224, 208, ${glowPulse * 0.5})`)
      grad.addColorStop(1, 'rgba(64, 224, 208, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(portalCX - ts * 2, portalCY - ts * 2, ts * 4, ts * 4)

      // Station props: orb/icon on each pedestal
      for (const station of contactStations) {
        const sx = Math.floor(station.col * ts - cx)
        const sy = Math.floor(station.row * ts - cy)
        const orbX = sx + ts / 2
        const orbY = sy + 12

        // Outer glow
        ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 600) * 0.1
        ctx.fillStyle = station.color
        ctx.beginPath()
        ctx.arc(orbX, orbY, 8, 0, Math.PI * 2)
        ctx.fill()

        // Icon body
        ctx.globalAlpha = 1.0
        ctx.fillStyle = station.color
        ctx.beginPath()

        if (station.id === 'mail-scroll') {
          // Scroll/envelope icon
          ctx.moveTo(orbX - 5, orbY - 3)
          ctx.lineTo(orbX + 5, orbY - 3)
          ctx.lineTo(orbX + 5, orbY + 4)
          ctx.lineTo(orbX - 5, orbY + 4)
          ctx.closePath()
          ctx.fill()
          // Envelope flap
          ctx.beginPath()
          ctx.moveTo(orbX - 5, orbY - 3)
          ctx.lineTo(orbX, orbY + 1)
          ctx.lineTo(orbX + 5, orbY - 3)
          ctx.strokeStyle = '#2a1a10'
          ctx.lineWidth = 1
          ctx.stroke()
        } else if (station.id === 'connection-tome') {
          // Book/tome icon
          ctx.fillRect(orbX - 5, orbY - 5, 10, 11)
          ctx.fillStyle = '#2a4a6a'
          ctx.fillRect(orbX - 5, orbY - 5, 2, 11)
          // Page lines
          ctx.fillStyle = '#e0e8f0'
          ctx.fillRect(orbX - 1, orbY - 2, 5, 1)
          ctx.fillRect(orbX - 1, orbY + 1, 4, 1)
          ctx.fillRect(orbX - 1, orbY + 4, 3, 1)
        } else if (station.id === 'code-archive') {
          // Code brackets icon < / >
          ctx.font = 'bold 10px monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#1a1a1a'
          ctx.fillText('</>', orbX + 1, orbY + 1)
          ctx.fillStyle = station.color
          ctx.fillText('</>', orbX, orbY)
        }
      }

      // Station labels
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (const station of contactStations) {
        const lx = Math.floor(station.col * ts - cx) + ts / 2
        const ly = Math.floor(station.row * ts - cy) + 24
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillText(station.label, lx + 1, ly + 1)
        // Label
        ctx.fillStyle = station.color
        ctx.fillText(station.label, lx, ly)
      }

      // Portal center label
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const labelPulse = 0.6 + Math.sin(Date.now() / 500) * 0.2
      ctx.globalAlpha = labelPulse
      ctx.fillStyle = '#000'
      ctx.fillText('CONTACT PORTAL', portalCX + 1, portalCY - ts - 5)
      ctx.fillStyle = '#60ffee'
      ctx.fillText('CONTACT PORTAL', portalCX, portalCY - ts - 6)
      ctx.globalAlpha = 1.0

      ctx.restore()
    }

    // ── Secret Room: station labels ───────────────────────────────────────
    if (isSecretRoom) {
      ctx.save()
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      for (const station of secretStations) {
        if (!station.label) continue
        const lx = Math.floor(station.col * ts - cx) + ts / 2 + (station.labelOffsetX ?? 0)
        const ly = Math.floor(station.row * ts - cy) + 24
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillText(station.label, lx + 1, ly + 1)
        // Label
        ctx.fillStyle = station.color
        ctx.fillText(station.label, lx, ly)
      }

      // Room title on back wall
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const titleX = Math.floor((this.currentRoom.cols / 2) * ts - cx)
      const titleY = Math.floor(0.4 * ts - cy)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillText("ZAIN'S HIDEOUT", titleX + 1, titleY + 1)
      ctx.fillStyle = '#a08060'
      ctx.fillText("ZAIN'S HIDEOUT", titleX, titleY)
      ctx.restore()
    }

    // ── Experience Tower: gallery paintings ──────────────────────────────
    if (gallery) {
      this.renderGalleryPaintings(gallery, cx, cy)
    }

    // ── Door sprites (Door.png gold) at exit door positions ─────────────
    for (const door of room.doors) {
      if (!this.doorSheet.isLoaded()) continue
      const doorDx = Math.floor(door.col * ts - cx)
      const doorDy = Math.floor(door.row * ts - cy)

      // During door-open transition, show animated frame for the triggering door
      if (
        this.transition.phase === 'door-open' &&
        this.transition.doorWorldX === door.col * ts &&
        this.transition.doorWorldY === door.row * ts
      ) {
        this.doorSheet.draw(ctx, this.doorAnimation.currentFrame(), doorDx, doorDy, ts, ts)
      } else {
        this.doorSheet.draw(ctx, this.doorClosedFrame, doorDx, doorDy, ts, ts)
      }
    }

    // ── Ambient sprites (torches) ───────────────────────────────────────
    for (const a of this.ambients) a.render(ctx, cx, cy)

    // ── Wayfinding overlays (kept top-most over room art) ───────────────
    this.renderInteriorExitSigns(cx, cy)
    if (gallery) {
      this.renderExperienceTowerFloorBadge(gallery)
    }
  }

  private updateResumeChest(dt: number) {
    const chest = this.resumeChest
    if (!chest) return

    chest.glowTime += dt

    const maxFrame = chest.frames.length - 1
    const direction = chest.targetOpen ? 1 : -1
    const needsAdvance = chest.targetOpen ? chest.frameIndex < maxFrame : chest.frameIndex > 0

    if (!needsAdvance) {
      chest.elapsed = 0
      return
    }

    chest.elapsed += dt
    const frameDuration = 1 / chest.fps

    while (chest.elapsed >= frameDuration) {
      chest.elapsed -= frameDuration
      chest.frameIndex += direction

      if (chest.frameIndex <= 0) {
        chest.frameIndex = 0
        chest.elapsed = 0
        break
      }
      if (chest.frameIndex >= maxFrame) {
        chest.frameIndex = maxFrame
        chest.elapsed = 0
        break
      }
    }
  }

  private renderResumeChest(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const chest = this.resumeChest
    if (!chest || !chest.sheet.isLoaded()) return

    const dx = Math.round(chest.worldX - cameraX)
    const dy = Math.round(chest.worldY - cameraY)
    const pulse = 0.82 + Math.sin(chest.glowTime * 2.6) * 0.18

    ctx.save()
    ctx.fillStyle = `rgba(240, 196, 84, ${0.08 * pulse})`
    ctx.fillRect(dx - 8, dy - 7, chest.renderW + 16, chest.renderH + 14)
    ctx.fillStyle = `rgba(255, 219, 120, ${0.14 * pulse})`
    ctx.fillRect(dx - 4, dy - 4, chest.renderW + 8, chest.renderH + 8)
    ctx.strokeStyle = `rgba(255, 220, 118, ${0.5 * pulse})`
    ctx.lineWidth = 1
    ctx.strokeRect(dx - 2, dy - 2, chest.renderW + 4, chest.renderH + 4)
    ctx.restore()

    chest.sheet.draw(ctx, chest.frames[chest.frameIndex], dx, dy, chest.renderW, chest.renderH)
  }

  // ── Gallery painting renderer ──────────────────────────────────────────

  private resolveInteriorDecoSheet(sheetKey: InteriorDecoSheetKey): SpriteSheet {
    switch (sheetKey) {
      case 'props':
        return this.propsSheet
      case 'vase':
        return this.vaseSheet
    }
  }

  private renderInteriorSpriteDecos(room: RoomData, cx: number, cy: number) {
    const { ctx } = this
    for (const deco of room.spriteDecos ?? []) {
      const sheet = this.resolveInteriorDecoSheet(deco.sheetKey)
      if (!sheet.isLoaded()) continue

      const dx = Math.floor(deco.x - cx)
      const dy = Math.floor(deco.y - cy)
      if (dx + deco.renderW < 0 || dx > NATIVE_W || dy + deco.renderH < 0 || dy > NATIVE_H) continue

      ctx.save()
      if (deco.alpha !== undefined) ctx.globalAlpha = deco.alpha
      sheet.draw(ctx, deco.frame, dx, dy, deco.renderW, deco.renderH)
      ctx.restore()
    }
  }

  private renderProjectsLabWorkbenchDecor(cx: number, cy: number) {
    const { ctx } = this

    ctx.save()

    for (const [index, station] of stationDecos.entries()) {
      const deskLeft = station.deskCols[0] * T - cx
      const deskWidth = (station.deskCols[1] - station.deskCols[0] + 1) * T
      const deskTop = station.deskRow * T - cy
      const screenX = Math.floor(deskLeft + deskWidth / 2 - 14)
      const screenY = Math.floor(deskTop + 5)

      ctx.fillStyle = '#1a1d24'
      ctx.fillRect(screenX, screenY, 28, 16)
      ctx.fillStyle = '#0a0d12'
      ctx.fillRect(screenX + 2, screenY + 2, 24, 12)

      if (index === 0) {
        const scanX = Math.floor((Date.now() / 120) % 18)
        ctx.fillStyle = '#4ec9b0'
        ctx.fillRect(screenX + 4, screenY + 4, 6, 2)
        ctx.fillRect(screenX + 4, screenY + 8, 14, 1)
        ctx.fillRect(screenX + 4 + scanX, screenY + 10, 4, 1)
      } else if (index === 1) {
        ctx.strokeStyle = '#dcdcaa'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(screenX + 4, screenY + 11)
        ctx.lineTo(screenX + 8, screenY + 9)
        ctx.lineTo(screenX + 12, screenY + 10)
        ctx.lineTo(screenX + 17, screenY + 6)
        ctx.lineTo(screenX + 22, screenY + 7)
        ctx.stroke()
      } else {
        ctx.fillStyle = '#ce9178'
        ctx.fillRect(screenX + 4, screenY + 4, 16, 1)
        ctx.fillRect(screenX + 4, screenY + 7, 10, 1)
        ctx.fillRect(screenX + 4, screenY + 10, 7, 1)
        const pulseX = 15 + Math.floor((Date.now() / 220) % 8)
        ctx.fillStyle = '#f0b27a'
        ctx.fillRect(screenX + pulseX, screenY + 9, 2, 2)
        ctx.strokeStyle = '#ce9178'
        ctx.beginPath()
        ctx.moveTo(screenX + 18, screenY + 5)
        ctx.lineTo(screenX + 21, screenY + 5)
        ctx.lineTo(screenX + 21, screenY + 11)
        ctx.lineTo(screenX + 18, screenY + 11)
        ctx.stroke()
      }

      ctx.fillStyle = '#2e3138'
      ctx.fillRect(screenX + 12, screenY + 16, 4, 4)
      ctx.fillRect(screenX + 8, screenY + 20, 12, 2)

      ctx.fillStyle = station.color
      ctx.globalAlpha = 0.22
      ctx.fillRect(screenX + 2, screenY + 2, 24, 12)
      ctx.globalAlpha = 1

      ctx.fillStyle = '#d8d0c0'
      ctx.fillRect(screenX - 6, screenY + 11, 5, 4)
      ctx.fillStyle = '#3d2b1a'
      ctx.fillRect(screenX - 5, screenY + 15, 3, 1)

      ctx.fillStyle = '#8a6038'
      ctx.fillRect(screenX + 30, screenY + 11, 5, 4)
      ctx.fillRect(screenX + 31, screenY + 15, 3, 1)
    }

    const boardX = Math.floor((this.currentRoom.cols - 2) * T - cx)
    const boardY = Math.floor(2 * T - cy) + 4
    ctx.fillStyle = '#6a5134'
    ctx.fillRect(boardX, boardY, 44, 28)
    ctx.fillStyle = '#efe6ce'
    ctx.fillRect(boardX + 3, boardY + 3, 38, 22)
    ctx.fillStyle = '#d8ccad'
    ctx.fillRect(boardX + 7, boardY + 7, 24, 2)
    ctx.fillRect(boardX + 7, boardY + 12, 18, 2)
    ctx.fillRect(boardX + 7, boardY + 17, 28, 2)
    ctx.fillStyle = '#e8c170'
    ctx.fillRect(boardX + 32, boardY + 6, 5, 5)
    ctx.fillStyle = '#ce9178'
    ctx.fillRect(boardX + 28, boardY + 14, 6, 6)
    ctx.fillStyle = '#4ec9b0'
    ctx.fillRect(boardX + 5, boardY + 19, 6, 4)

    ctx.restore()
  }

  private renderGalleryFloorDecor(cx: number, cy: number) {
    const { ctx } = this
    const runnerX = Math.floor(4 * T - cx)
    const runnerY = Math.floor(3 * T - cy)
    const runnerW = 4 * T
    const runnerH = Math.max(4 * T, (this.currentRoom.rows - 5) * T)

    ctx.save()
    ctx.fillStyle = '#6b2a1d'
    ctx.fillRect(runnerX, runnerY, runnerW, runnerH)
    ctx.fillStyle = '#c8a850'
    ctx.fillRect(runnerX + 4, runnerY + 4, runnerW - 8, runnerH - 8)
    ctx.fillStyle = '#7a3324'
    ctx.fillRect(runnerX + 8, runnerY + 8, runnerW - 16, runnerH - 16)

    for (let y = runnerY + 18; y < runnerY + runnerH - 18; y += 40) {
      ctx.fillStyle = '#c8a850'
      ctx.beginPath()
      ctx.moveTo(runnerX + runnerW / 2, y)
      ctx.lineTo(runnerX + runnerW / 2 + 10, y + 10)
      ctx.lineTo(runnerX + runnerW / 2, y + 20)
      ctx.lineTo(runnerX + runnerW / 2 - 10, y + 10)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  private renderGalleryPaintings(
    gallery: import('./maps/experienceTower').FloorGalleryData,
    cx: number,
    cy: number,
  ) {
    const { ctx } = this

    // Photo area in game-canvas native coords (inside frame borders)
    const PHOTO_X_OFF = 10
    const PHOTO_Y_OFF = 11
    const PHOTO_W = 44
    const PHOTO_H = 42

    for (const painting of gallery.paintings) {
      // Painting spans 2 tiles wide (cols col..col+1) × 2 tile rows (rows 0-1)
      const px = Math.floor(painting.col * T - cx)
      const py = Math.floor(0 - cy) // row 0

      // Outer frame border (dark wood)
      ctx.fillStyle = '#2a1508'
      ctx.fillRect(px + 5, py + 6, 54, 52)

      // Inner frame border (gold)
      ctx.fillStyle = '#c8a850'
      ctx.fillRect(px + 7, py + 8, 50, 48)

      // Matte background (dark, visible before photo loads)
      ctx.fillStyle = '#1a0e04'
      ctx.fillRect(px + PHOTO_X_OFF, py + PHOTO_Y_OFF, PHOTO_W, PHOTO_H)

      // Photo rendered on the overlay canvas (full resolution, smooth scaling)
      if (this.photoCtx && this.photoOverlay) {
        const img = this.galleryPhotos.get(painting.photo)
        if (img?.complete && img.naturalWidth > 0) {
          const scaleX = this.photoOverlay.width / NATIVE_W
          const scaleY = this.photoOverlay.height / NATIVE_H

          const dx = (px + PHOTO_X_OFF) * scaleX
          const dy = (py + PHOTO_Y_OFF) * scaleY
          const dw = PHOTO_W * scaleX
          const dh = PHOTO_H * scaleY

          // Cover-fit crop
          const imgAspect = img.naturalWidth / img.naturalHeight
          const frameAspect = PHOTO_W / PHOTO_H
          let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
          if (imgAspect > frameAspect) {
            sw = img.naturalHeight * frameAspect
            sx = (img.naturalWidth - sw) / 2
          } else {
            sh = img.naturalWidth / frameAspect
            sy = (img.naturalHeight - sh) / 2
          }

          this.photoCtx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
        }
      }

      // Frame corner accents (small gold dots for decorative flair)
      ctx.fillStyle = '#dab860'
      ctx.fillRect(px + 7, py + 8, 2, 2)
      ctx.fillRect(px + 55, py + 8, 2, 2)
      ctx.fillRect(px + 7, py + 54, 2, 2)
      ctx.fillRect(px + 55, py + 54, 2, 2)
    }

    // Floor title text (drawn on the wall area between paintings, row 1)
    ctx.save()
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const titleX = Math.floor((this.currentRoom.cols / 2) * T - cx)
    const titleY = Math.floor(3 * T - cy) + T / 2
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillText(gallery.title, titleX + 1, titleY + 1)
    ctx.fillStyle = gallery.titleColor
    ctx.fillText(gallery.title, titleX, titleY)
    ctx.restore()
  }

  private renderInteriorExitSigns(cx: number, cy: number) {
    const { ctx } = this
    const ts = this.currentRoom.tileSize
    const roomId = this.currentRoom.id

    let exitDoors = this.currentRoom.doors.filter((door) => door.targetRoom === 'overworld')
    if (exitDoors.length === 0 && roomId === 'experienceTower_2') {
      exitDoors = this.currentRoom.doors.filter((door) => door.targetRoom === 'experienceTower_1')
    } else if (exitDoors.length === 0 && roomId === 'experienceTower_3') {
      exitDoors = this.currentRoom.doors.filter((door) => door.targetRoom === 'experienceTower_2')
    }

    if (exitDoors.length === 0) return

    ctx.save()
    ctx.font = 'bold 7px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const door of exitDoors) {
      const pulse = Math.sin(Date.now() / 450 + door.col * 0.5) * 0.12 + 0.88
      const signX = Math.floor((door.col + 0.5) * ts - cx)
      const signY = Math.floor(door.row * ts - cy) - 12
      const label = 'EXIT'
      const labelW = 26

      ctx.fillStyle = 'rgba(20, 10, 4, 0.84)'
      ctx.fillRect(signX - labelW / 2, signY - 7, labelW, 10)
      ctx.strokeStyle = `rgba(232, 193, 112, ${pulse})`
      ctx.strokeRect(signX - labelW / 2 + 0.5, signY - 6.5, labelW - 1, 9)
      ctx.fillStyle = '#000'
      ctx.fillText(label, signX + 1, signY - 1 + 1)
      ctx.fillStyle = '#f0d494'
      ctx.fillText(label, signX, signY - 1)

      ctx.fillStyle = `rgba(232, 193, 112, ${pulse})`
      ctx.beginPath()
      ctx.moveTo(signX, signY + 7)
      ctx.lineTo(signX - 4, signY + 12)
      ctx.lineTo(signX + 4, signY + 12)
      ctx.closePath()
      ctx.fill()
    }

    ctx.restore()
  }

  private renderExperienceTowerFloorBadge(
    gallery: import('./maps/experienceTower').FloorGalleryData,
  ) {
    const { ctx } = this
    const floorLabelByRoom: Partial<Record<RoomId, string>> = {
      experienceTower_1: 'FLOOR 1',
      experienceTower_2: 'FLOOR 2',
      experienceTower_3: 'FLOOR 3',
    }
    const floorLabel = floorLabelByRoom[this.currentRoom.id]
    if (!floorLabel) return

    ctx.save()
    const badgeX = 14
    const badgeY = NATIVE_H - 34
    const badgeW = 82
    const badgeH = 20
    ctx.fillStyle = 'rgba(20, 10, 4, 0.88)'
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
    ctx.strokeStyle = gallery.titleColor
    ctx.lineWidth = 1
    ctx.strokeRect(badgeX + 0.5, badgeY + 0.5, badgeW - 1, badgeH - 1)
    ctx.font = 'bold 9px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
    ctx.fillText(floorLabel, badgeX + badgeW / 2 + 1, badgeY + badgeH / 2 + 1)
    ctx.fillStyle = '#f8e7b0'
    ctx.fillText(floorLabel, badgeX + badgeW / 2, badgeY + badgeH / 2)
    ctx.restore()
  }

  private renderDebugOverlay() {
    const { ctx } = this
    const cx = Math.round(this.camera.x)
    const cy = Math.round(this.camera.y)
    const { width: viewW, height: viewH } = this.getViewportSize()
    const tileSize = this.currentRoom.tileSize
    const rects = this.currentRoom.collisionRects ?? []
    const interactionRects = this.currentRoom.interactionRects ?? []
    const showProps = this.overworldLayerMode === 0
    const showStructures = this.overworldLayerMode !== 2

    ctx.save()
    ctx.lineWidth = 1
    ctx.font = '8px monospace'
    ctx.textBaseline = 'top'

    // Grid
    const minCol = Math.floor(cx / tileSize)
    const maxCol = Math.ceil((cx + viewW) / tileSize)
    const minRow = Math.floor(cy / tileSize)
    const maxRow = Math.ceil((cy + viewH) / tileSize)

    ctx.strokeStyle = 'rgba(70, 70, 70, 0.4)'
    for (let col = minCol; col <= maxCol; col++) {
      const x = Math.round(col * tileSize - cx)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, viewH)
      ctx.stroke()
    }
    for (let row = minRow; row <= maxRow; row++) {
      const y = Math.round(row * tileSize - cy)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(viewW, y)
      ctx.stroke()
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.lineWidth = 2
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const x = Math.round(col * tileSize - cx) + 2
        const y = Math.round(row * tileSize - cy) + 2
        const label = `(${col},${row})`
        ctx.strokeText(label, x, y)
        ctx.fillText(label, x, y)
      }
    }

    // Rendered structure bounds (what the map currently interprets as each
    // landmark/building's on-screen size), useful for comparing against the
    // smaller red collision rects.
    if (!this.currentRoom.isInterior) {
      ctx.fillStyle = 'rgba(80, 200, 255, 0.18)'
      ctx.strokeStyle = 'rgba(80, 200, 255, 0.95)'

      if (showStructures) {
        for (const s of this.overworldStructures) {
          const dx = Math.round(s.worldX - cx)
          const dy = Math.round(s.worldY - cy)
          ctx.fillRect(dx, dy, s.renderW, s.renderH)
          ctx.strokeRect(dx, dy, s.renderW, s.renderH)
        }
      }

      if (showProps) {
        for (const s of this.overworldProps) {
          const dx = Math.round(s.worldX - cx)
          const dy = Math.round(s.worldY - cy)
          ctx.fillRect(dx, dy, s.renderW, s.renderH)
          ctx.strokeRect(dx, dy, s.renderW, s.renderH)
        }
      }

      for (const s of overworldNpcDefs) {
        const dx = Math.round(s.worldX - cx)
        const dy = Math.round(s.worldY - cy)
        ctx.fillRect(dx, dy, s.renderW, s.renderH)
        ctx.strokeRect(dx, dy, s.renderW, s.renderH)
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)'
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
      ctx.lineWidth = 2

      if (showStructures) {
        for (const s of this.overworldStructures) {
          if (!s.label) continue
          const dx = Math.round(s.worldX - cx)
          const dy = Math.max(2, Math.round(s.worldY - cy) - 10)
          if (dx + s.renderW < 0 || dx > viewW || dy > viewH) continue
          ctx.strokeText(s.label ?? '', dx, dy)
          ctx.fillText(s.label ?? '', dx, dy)
        }
      }
    }

    for (const rect of interactionRects) {
      const dx = Math.round(rect.x - cx)
      const dy = Math.round(rect.y - cy)
      ctx.fillStyle = 'rgba(0, 100, 255, 0.18)'
      ctx.strokeStyle = 'rgba(0, 100, 255, 0.95)'
      ctx.fillRect(dx, dy, rect.width, rect.height)
      ctx.strokeRect(dx, dy, rect.width, rect.height)
    }

    // Collision rects
    ctx.lineWidth = 1
    for (const rect of rects) {
      const dx = Math.round(rect.x - cx)
      const dy = Math.round(rect.y - cy)

      ctx.fillStyle = 'rgba(255, 0, 0, 0.25)'
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.95)'
      ctx.fillRect(dx, dy, rect.width, rect.height)
      ctx.strokeRect(dx, dy, rect.width, rect.height)

      if (rect.doorZone) {
        const dzx = Math.round(rect.doorZone.x - cx)
        const dzy = Math.round(rect.doorZone.y - cy)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.95)'
        ctx.fillRect(dzx, dzy, rect.doorZone.width, rect.doorZone.height)
        ctx.strokeRect(dzx, dzy, rect.doorZone.width, rect.doorZone.height)
      }
    }

    // Player collision bbox (18px wide, trimmed 6px from the top)
    const playerBounds = getPlayerCollisionBounds(this.player.x, this.player.y)
    const playerDx = Math.round(playerBounds.x - cx)
    const playerDy = Math.round(playerBounds.y - cy)
    ctx.fillStyle = 'rgba(0, 120, 255, 0.25)'
    ctx.strokeStyle = 'rgba(0, 120, 255, 0.95)'
    ctx.fillRect(playerDx, playerDy, playerBounds.width, playerBounds.height)
    ctx.strokeRect(playerDx, playerDy, playerBounds.width, playerBounds.height)

    // Tiny status box so it's obvious the overlay is active.
    const layerModeLabel = this.overworldLayerMode === 0
      ? 'normal'
      : this.overworldLayerMode === 1
        ? 'hide props'
        : 'hide props+structures'

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(6, 6, 188, 34)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.lineWidth = 1
    ctx.fillText('DEBUG OVERLAY', 10, 10)
    ctx.fillText('` to toggle', 10, 18)
    ctx.fillText(`§ : ${layerModeLabel}`, 10, 26)

    ctx.restore()
  }
}
