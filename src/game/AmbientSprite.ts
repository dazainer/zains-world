/**
 * AmbientSprite — animated non-player entities: camel, snake, torches.
 * Each has an idle animation loop.
 *
 * Camel/snake: 32×32 native (desert pack) — renderW=renderH=32.
 * Torch flame: 16×16 source (dungeon pack) drawn at 32×32 (2× scale).
 */
import { SpriteSheet, Animation, type Frame } from './SpriteSheet'

export type AmbientType = 'camel' | 'snake' | 'torch' | 'npc' | 'chest'

export interface AmbientSpriteConfig {
  type: AmbientType
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
  readonly x: number
  readonly y: number
  readonly type: AmbientType
  private renderW: number
  private renderH: number

  private sheet: SpriteSheet | null = null
  private animation: Animation | null = null

  constructor(config: AmbientSpriteConfig) {
    this.x = config.x
    this.y = config.y
    this.type = config.type
    this.renderW = config.renderW ?? 32
    this.renderH = config.renderH ?? 32
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
      this.renderH,
    )
  }
}
