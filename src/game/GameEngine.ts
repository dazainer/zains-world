/**
 * GameEngine — 60fps requestAnimationFrame loop.
 *
 * Render order:
 *   terrain → decorations → buildings (renderBlock) → ambient sprites → player
 */
import { InputManager } from './InputManager'
import { Player } from './Player'
import { Camera } from './Camera'
import { CollisionMap } from './CollisionMap'
import { TileRenderer, type TileSet } from './TileRenderer'
import { SpriteSheet } from './SpriteSheet'
import { AmbientSprite } from './AmbientSprite'
import {
  terrainLayer,
  decorationLayer,
  buildings,
  collisionMap as overworldCollision,
  MAP_PIXEL_W,
  MAP_PIXEL_H,
  SPAWN,
} from './maps/overworld'

const NATIVE_W = 512
const NATIVE_H = 288
const T = 32

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId: number | null = null
  private lastTime = 0

  private input: InputManager
  private player: Player
  private camera: Camera
  private collision: CollisionMap
  private tileRenderer: TileRenderer
  private desertTileSet: TileSet
  private ambients: AmbientSprite[]

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.ctx.fillStyle = '#2a1a08'   // set once — only fillRect uses this

    this.input     = new InputManager()
    this.player    = new Player(SPAWN.x, SPAWN.y)
    this.camera    = new Camera(NATIVE_W, NATIVE_H)
    this.collision = new CollisionMap(overworldCollision)

    this.tileRenderer  = new TileRenderer(32)
    this.desertTileSet = {
      sheet:       new SpriteSheet('/assets/tiles/desert/DESERT TILESET 32x32.png'),
      srcTileSize: 32,
      tilesPerRow: 19,
    }

    // Idle Camel (2 Directions).png — 128×64, 32×32 frames, 4 cols × 2 rows
    //   Row 1 (y=32): left-facing
    const camelSheet = new SpriteSheet('/assets/ambient/Idle Camel (2 Directions).png')
    // Idle Snake (2 Directions).png — 128×64, 32×32 frames, 4 cols × 2 rows
    //   Row 0 (y=0): right-facing
    const snakeSheet = new SpriteSheet('/assets/ambient/Idle Snake (2 Directions).png')

    // Camel: east of castle (col 23, row 10), left-facing toward spawn, 64×48 (~2×1.5 tiles)
    const camel = new AmbientSprite({ type: 'camel', x: 23 * T, y: 10 * T, renderW: 64, renderH: 48 })
    camel.init(camelSheet, SpriteSheet.buildRow(0, 32, 32, 32, 4), 4)

    // Snake: NE area (col 26, row 5), right-facing — subtle hint toward the secret room
    const snake = new AmbientSprite({ type: 'snake', x: 26 * T, y: 5 * T })
    snake.init(snakeSheet, SpriteSheet.buildRow(0, 0, 32, 32, 4), 3)

    this.ambients = [camel, snake]

    this.camera.snapTo(SPAWN.x, SPAWN.y, MAP_PIXEL_W, MAP_PIXEL_H)
  }

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

  private loop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05)
    this.lastTime = timestamp
    this.update(dt)
    this.render()
    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    const input = this.input.getState()
    this.player.update(dt, input, this.collision)
    this.camera.follow(this.player.x, this.player.y, MAP_PIXEL_W, MAP_PIXEL_H)
    for (const a of this.ambients) a.update(dt)
  }

  private render() {
    const { ctx } = this
    const cx = this.camera.x
    const cy = this.camera.y

    ctx.fillRect(0, 0, NATIVE_W, NATIVE_H)

    this.tileRenderer.renderLayer(ctx, terrainLayer,    this.desertTileSet, cx, cy, NATIVE_W, NATIVE_H)
    this.tileRenderer.renderLayer(ctx, decorationLayer, this.desertTileSet, cx, cy, NATIVE_W, NATIVE_H)

    for (const b of buildings) {
      this.tileRenderer.renderBlock(
        ctx, b.tiles, this.desertTileSet,
        b.worldX, b.worldY, cx, cy, b.pixelW, b.pixelH,
        NATIVE_W, NATIVE_H,
      )
    }

    for (const a of this.ambients) a.render(ctx, cx, cy)
    this.player.render(ctx, cx, cy)
  }
}
