/**
 * Player — pharaoh character.
 * Handles position, velocity, sprite animation (walk/idle), and bobbing effect.
 *
 * Sprite sheet: public/assets/sprites/Player.png (16x16 frames, rendered at 2x = 32x32)
 * Movement speed: ~96px/s (3 tiles/s at 32px grid)
 * Bob: sine wave ±1.5px @ ~4Hz while walking, ±0.5px @ ~1Hz while idle
 */
export type Direction = 'up' | 'down' | 'left' | 'right'

export class Player {
  x: number
  y: number
  velocityX = 0
  velocityY = 0
  direction: Direction = 'down'
  isMoving = false

  private bobTime = 0

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  update(_dt: number) {
    // TODO: apply velocity, collision check, animation frame advance, bob
  }

  getBobOffset(): number {
    if (this.isMoving) {
      return Math.sin(this.bobTime * Math.PI * 2 * 4) * 1.5
    }
    return Math.sin(this.bobTime * Math.PI * 2 * 1) * 0.5
  }

  render(_ctx: CanvasRenderingContext2D, _cameraX: number, _cameraY: number) {
    // TODO: draw pharaoh sprite at (x - cameraX, y - cameraY + bobOffset)
  }
}
