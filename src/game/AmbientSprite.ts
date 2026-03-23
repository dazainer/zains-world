/**
 * AmbientSprite — animated non-player entities: camel, snake, torches.
 * Each has an idle animation loop; the camel also has an eating animation
 * that plays randomly.
 */
import { SpriteSheet, Animation, type Frame } from './SpriteSheet'

export type AmbientType = 'camel' | 'snake' | 'torch'

export interface AmbientSpriteConfig {
  type: AmbientType
  x: number
  y: number
  /** Pixel size to render at (32 for terrain-scale sprites, 32 for 2× dungeon sprites) */
  renderSize?: number
}

export class AmbientSprite {
  readonly x: number
  readonly y: number
  readonly type: AmbientType
  private renderSize: number

  private sheet: SpriteSheet | null = null
  private animation: Animation | null = null

  constructor(config: AmbientSpriteConfig) {
    this.x = config.x
    this.y = config.y
    this.type = config.type
    this.renderSize = config.renderSize ?? 32
  }

  /** Call after sprite sheets are loaded to wire up animations. */
  init(sheet: SpriteSheet, idleFrames: Frame[], fps = 8) {
    this.sheet = sheet
    this.animation = new Animation(idleFrames, fps)
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
      this.renderSize,
      this.renderSize,
    )
  }
}
