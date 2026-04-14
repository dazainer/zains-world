/**
 * AmbientSprite — animated non-player entities: camel, snake, torches.
 * Each has an idle animation loop.
 *
 * Camel/snake: 32×32 native (desert pack) — renderW=renderH=32.
 * Torch flame: 16×16 source (dungeon pack) drawn at 32×32 (2× scale).
 */
import { SpriteSheet, Animation, type Frame } from './SpriteSheet'
import type { Direction } from './Player'

export type AmbientType = 'camel' | 'snake' | 'torch' | 'npc' | 'chest'

export interface AmbientSpriteConfig {
  id?: string
  type: AmbientType
  facing?: Direction
  /** World-space top-left x of the rendered sprite */
  x: number
  /** World-space top-left y of the rendered sprite */
  y: number
  /** Render width in destination pixels (default 32) */
  renderW?: number
  /** Render height in destination pixels (default 32) */
  renderH?: number
}

export class AmbientSprite {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly type: AmbientType
  readonly facing: Direction | null
  private renderW: number
  private _renderH: number

  private sheet: SpriteSheet | null = null
  private animation: Animation | null = null

  constructor(config: AmbientSpriteConfig) {
    this.id = config.id ?? `${config.type}-${config.x}-${config.y}`
    this.x = config.x
    this.y = config.y
    this.type = config.type
    this.facing = config.facing ?? null
    this.renderW = config.renderW ?? 32
    this._renderH = config.renderH ?? 32
  }

  /**
   * Wire up the sprite sheet and build the animation.
   * @param sheet       Pre-created SpriteSheet instance (shared across sprites of the same type)
   * @param idleFrames  Frame descriptors for the idle loop
   * @param fps         Animation speed (default 8)
   * @param startFrame  First frame index — stagger multiple instances so they don't flicker in sync
   */
  init(sheet: SpriteSheet, idleFrames: Frame[], fps = 8, startFrame = 0) {
    this.sheet = sheet
    this.animation = new Animation(idleFrames, fps, startFrame)
  }

  /** Y coordinate of the sprite's bottom edge — used for Y-sort rendering. */
  get sortY(): number { return this.y + this._renderH }
  get width(): number { return this.renderW }
  get height(): number { return this._renderH }
  get centerX(): number { return this.x + this.renderW / 2 }
  get centerY(): number { return this.y + this._renderH / 2 }

  update(dt: number) {
    this.animation?.update(dt)
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    if (!this.sheet || !this.animation) return
    const frame = this.animation.currentFrame()
    this.sheet.draw(
      ctx,
      frame,
      this.x - cameraX,
      this.y - cameraY,
      this.renderW,
      this._renderH,
    )
  }
}
