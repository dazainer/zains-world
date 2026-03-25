/**
 * GameEngine — 60fps requestAnimationFrame loop.
 *
 * Supports room transitions (fade-out → swap → fade-in) and two render modes:
 *   • overworld: desert tileset layers + landmarks + buildings + NPCs
 *   • interior:  canvas-drawn dungeon walls/floors + Door.png exits + Fire.png torches
 */
import { InputManager } from './InputManager'
import { Player, type Direction } from './Player'
import { Camera } from './Camera'
import { CollisionMap } from './CollisionMap'
import { TileRenderer, type TileSet } from './TileRenderer'
import { SpriteSheet, Animation, type Frame } from './SpriteSheet'
import { AmbientSprite } from './AmbientSprite'
import { roomRegistry, type RoomData, type RoomId, type DoorDef } from './RoomManager'

// ── Room data imports ───────────────────────────────────────────────────────
import {
  terrainLayer,
  decorationLayer,
  buildings,
  collisionMap as overworldCollision,
  MAP_PIXEL_W,
  MAP_PIXEL_H,
  SPAWN,
  NPC_POS,
  CHEST_POS,
  overworldRoom,
} from './maps/overworld'
import { projectsLabRoom } from './maps/projectsLab'
import { skillsForgeRoom } from './maps/skillsForge'
import { experienceTower1Room, experienceTower2Room, experienceTower3Room } from './maps/experienceTower'
import { contactPortalRoom } from './maps/contactPortal'
import { secretRoomData } from './maps/secretRoom'

/** A single static (non-animated) world-space sprite drawn each frame. */
interface StaticSprite {
  sheet: SpriteSheet
  frame: Frame
  worldX: number
  worldY: number
  renderW: number
  renderH: number
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
const T = 32
const FADE_DURATION = 0.3        // seconds
const DOOR_ANIM_DURATION = 0.35  // seconds for 6-frame door open

export class GameEngine {
  private ctx: CanvasRenderingContext2D
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
  private egyptLandmarks: StaticSprite[]
  private npcSprites: AmbientSprite[]

  // Interior door sprite (Door.png — gold row)
  private doorSheet: SpriteSheet
  private doorOpenFrames: Frame[]
  private doorClosedFrame: Frame
  private doorAnimation: Animation

  // Transition
  private transition: TransitionState = {
    phase: 'none', elapsed: 0, door: null, alpha: 0,
    doorWorldX: 0, doorWorldY: 0, fromInterior: false,
  }

  // Asset loading
  private allSheets: SpriteSheet[] = []
  private assetsReady = false

  // UI
  private callbacks: GameUICallbacks
  private uiPaused = false
  private lastPromptState = false

  constructor(canvas: HTMLCanvasElement, callbacks: GameUICallbacks) {
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.callbacks = callbacks

    // ── Register all rooms ────────────────────────────────────────────────
    roomRegistry.register('overworld', overworldRoom)
    roomRegistry.register('projectsLab', projectsLabRoom)
    roomRegistry.register('skillsForge', skillsForgeRoom)
    roomRegistry.register('experienceTower_1', experienceTower1Room)
    roomRegistry.register('experienceTower_2', experienceTower2Room)
    roomRegistry.register('experienceTower_3', experienceTower3Room)
    roomRegistry.register('contactPortal', contactPortalRoom)
    roomRegistry.register('secretRoom', secretRoomData)

    // ── Engine systems ────────────────────────────────────────────────────
    this.input     = new InputManager()
    this.player    = new Player(SPAWN.x, SPAWN.y)
    this.camera    = new Camera(NATIVE_W, NATIVE_H)
    this.collision = new CollisionMap(overworldCollision)
    this.tileRenderer = new TileRenderer(32)

    this.desertTileSet = {
      sheet: new SpriteSheet('/assets/tiles/desert/DESERT TILESET 32x32.png'),
      srcTileSize: 32,
      tilesPerRow: 19,
    }

    // ── Current room ──────────────────────────────────────────────────────
    this.currentRoom = overworldRoom
    this.ambients = []

    // ── Overworld ambient sprites (kept across room transitions) ─────────
    const camelSheet = new SpriteSheet('/assets/ambient/Idle Camel (2 Directions).png')
    const snakeSheet = new SpriteSheet('/assets/ambient/Idle Snake (2 Directions).png')

    const camel = new AmbientSprite({ type: 'camel', x: 23 * T, y: 10 * T, renderW: 64, renderH: 48 })
    camel.init(camelSheet, SpriteSheet.buildRow(0, 32, 32, 32, 4), 4)

    const snake = new AmbientSprite({ type: 'snake', x: 26 * T, y: 5 * T })
    snake.init(snakeSheet, SpriteSheet.buildRow(0, 0, 32, 32, 4), 3)

    this.overworldAmbients = [camel, snake]

    // ── Egypt landmarks ─────────────────────────────────────────────────
    const pyramidDoorSheet = new SpriteSheet('/assets/tiles/egypt/Pyramid with Door.png')
    const pyramidSheet     = new SpriteSheet('/assets/tiles/egypt/Pyramid.png')
    const sphinxSheet      = new SpriteSheet('/assets/tiles/egypt/Back.png')

    this.egyptLandmarks = [
      { sheet: pyramidDoorSheet, frame: { sx:0, sy:0, sw:256, sh:256 }, worldX: 3*T, worldY: 1*T, renderW: 320, renderH: 256 },
      { sheet: sphinxSheet,      frame: { sx:0, sy:0, sw:128, sh:128 }, worldX: 1*T, worldY: 5*T, renderW: 128, renderH: 128 },
      { sheet: pyramidSheet,     frame: { sx:0, sy:0, sw:256, sh:256 }, worldX:20*T, worldY: 1*T, renderW: 192, renderH: 160 },
    ]

    // ── NPC + chest ─────────────────────────────────────────────────────
    const mummySheet = new SpriteSheet('/assets/sprites/Mummy.png')
    const npc = new AmbientSprite({ type: 'npc', x: NPC_POS.x - 12, y: NPC_POS.y - 12, renderW: 24, renderH: 24 })
    npc.init(mummySheet, SpriteSheet.buildRow(0, 0, 16, 16, 6), 4)

    const chestSheet = new SpriteSheet('/assets/tiles/dungeon/Treasure_Box.png')
    const chest = new AmbientSprite({ type: 'chest', x: CHEST_POS.x - 16, y: CHEST_POS.y - 16, renderW: 32, renderH: 32 })
    chest.init(chestSheet, [{ sx: 0, sy: 0, sw: 16, sh: 16 }], 1)

    this.npcSprites = [npc, chest]

    // ── Door sprite (Door.png — gold row 1, 32×32 frames) ──────────────
    this.doorSheet = new SpriteSheet('/assets/tiles/dungeon/Door.png')
    this.doorOpenFrames = SpriteSheet.buildRow(0, 32, 32, 32, 6) // row 1 = gold
    this.doorClosedFrame = this.doorOpenFrames[0]
    this.doorAnimation = new Animation(this.doorOpenFrames, 6 / DOOR_ANIM_DURATION)

    this.camera.snapTo(SPAWN.x, SPAWN.y, MAP_PIXEL_W, MAP_PIXEL_H)

    // ── Track all sprite sheets for loading progress ────────────────────
    this.allSheets = [
      this.desertTileSet.sheet,
      pyramidDoorSheet, pyramidSheet, sphinxSheet,
      camelSheet, snakeSheet,
      mummySheet, chestSheet,
      this.doorSheet,
      this.player.getSheet(),
    ]
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /** Expose InputManager so MobileControls can inject virtual input. */
  getInputManager(): InputManager { return this.input }

  start() {
    this.lastTime = performance.now()
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
      if (loaded === total) {
        this.assetsReady = true
        this.callbacks.onReady()
      }
    }

    // Always tick ambient animations
    for (const a of this.ambients) a.update(dt)
    if (this.currentRoom.id === 'overworld') {
      for (const a of this.overworldAmbients) a.update(dt)
      for (const n of this.npcSprites) n.update(dt)
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
    if (this.collision.isDoor(this.player.x, this.player.y)) {
      const door = this.currentRoom.doors.find(d => d.col === playerCol && d.row === playerRow)
      if (door) {
        this.startTransition(door)
        return
      }
    }

    // ── Interaction zone check ────────────────────────────────────────
    const onZone = this.collision.isInteractionZone(this.player.x, this.player.y)
    if (onZone !== this.lastPromptState) {
      this.lastPromptState = onZone
      this.callbacks.onShowInteractionPrompt(onZone)
    }
    if (onZone && this.input.consumeInteract()) {
      const zone = this.currentRoom.interactionZones.find(
        z => z.col === playerCol && z.row === playerRow,
      )
      if (zone) {
        this.callbacks.onInteraction(zone.id, zone.payload)
      }
    }
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
    this.collision = new CollisionMap(room.collisionGrid)
    this.player.x = spawnX
    this.player.y = spawnY
    this.player.direction = direction
    this.player.isMoving = false

    // Swap ambient sprites
    this.ambients = room.buildAmbients?.() ?? []

    // Camera snap to new room
    const mapW = room.cols * room.tileSize
    const mapH = room.rows * room.tileSize
    this.camera.snapTo(spawnX, spawnY, mapW, mapH)
  }

  // ── Render ────────────────────────────────────────────────────────────

  private render() {
    const { ctx } = this
    const cx = this.camera.x
    const cy = this.camera.y

    // Background fill
    ctx.fillStyle = '#2a1a08'
    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H)

    if (this.currentRoom.isInterior) {
      this.renderInterior()
    } else {
      this.renderOverworld()
    }

    // Player always renders on top
    this.player.render(ctx, cx, cy)

    // Transition fade overlay
    if (this.transition.alpha > 0) {
      ctx.save()
      ctx.globalAlpha = this.transition.alpha
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, NATIVE_W, NATIVE_H)
      ctx.restore()
    }
  }

  // ── Overworld render (existing tile-based rendering) ──────────────────

  private renderOverworld() {
    const { ctx } = this
    const cx = this.camera.x
    const cy = this.camera.y

    this.tileRenderer.renderLayer(ctx, terrainLayer,    this.desertTileSet, cx, cy, NATIVE_W, NATIVE_H)
    this.tileRenderer.renderLayer(ctx, decorationLayer, this.desertTileSet, cx, cy, NATIVE_W, NATIVE_H)

    // Egypt landmarks before buildings
    this.renderStaticSprites(this.egyptLandmarks)

    for (const b of buildings) {
      this.tileRenderer.renderBlock(
        ctx, b.tiles, this.desertTileSet,
        b.worldX, b.worldY, cx, cy, b.pixelW, b.pixelH,
        NATIVE_W, NATIVE_H,
      )
    }

    for (const a of this.overworldAmbients) a.render(ctx, cx, cy)
    for (const n of this.npcSprites) n.render(ctx, cx, cy)
  }

  // ── Interior render (canvas-drawn walls/floors + sprites) ─────────────

  private renderInterior() {
    const { ctx } = this
    const cx = this.camera.x
    const cy = this.camera.y
    const room = this.currentRoom
    const ts = room.tileSize

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
          // Wall tile: dark brown with brick pattern
          ctx.fillStyle = '#5a3820'
          ctx.fillRect(dx, dy, ts, ts)
          ctx.fillStyle = '#4a2e18'
          // Horizontal mortar lines
          ctx.fillRect(dx, dy + 7, ts, 1)
          ctx.fillRect(dx, dy + 15, ts, 1)
          ctx.fillRect(dx, dy + 23, ts, 1)
          // Vertical mortar lines (offset per row for brick stagger)
          ctx.fillRect(dx + 16, dy, 1, 8)
          ctx.fillRect(dx + 8, dy + 8, 1, 8)
          ctx.fillRect(dx + 24, dy + 8, 1, 8)
          ctx.fillRect(dx + 16, dy + 16, 1, 8)
          ctx.fillRect(dx + 8, dy + 24, 1, 8)
          ctx.fillRect(dx + 24, dy + 24, 1, 8)
        } else {
          // Floor tile: sandy stone
          ctx.fillStyle = '#c8a870'
          ctx.fillRect(dx, dy, ts, ts)
          // Subtle stone grid lines
          ctx.fillStyle = '#b89860'
          ctx.fillRect(dx, dy + ts - 1, ts, 1)
          ctx.fillRect(dx + ts - 1, dy, 1, ts)

          // Interaction zone accent (subtle glow)
          if (tile === 2) {
            ctx.fillStyle = 'rgba(200, 168, 80, 0.15)'
            ctx.fillRect(dx + 2, dy + 2, ts - 4, ts - 4)
          }
        }
      }
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
  }

  /** Renders full-image static sprites with viewport culling. */
  private renderStaticSprites(sprites: StaticSprite[]) {
    const cx = this.camera.x
    const cy = this.camera.y
    for (const s of sprites) {
      if (!s.sheet.isLoaded()) continue
      const dx = s.worldX - cx
      const dy = s.worldY - cy
      if (dx + s.renderW < 0 || dx > NATIVE_W || dy + s.renderH < 0 || dy > NATIVE_H) continue
      s.sheet.draw(this.ctx, s.frame, dx, dy, s.renderW, s.renderH)
    }
  }
}
