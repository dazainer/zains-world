/**
 * Player — pharaoh character.
 * Position (x, y) is the centre of the 24×24 rendered sprite in world pixels.
 *
 * Movement: 96 px/s (3 tiles/s @ 32 px grid), 4-directional (no diagonal).
 * Collision: per-axis sliding so the player slides along walls.
 * Bob: sine-wave Y offset — ±1.5 px @ 4 Hz while walking, ±0.5 px @ 1 Hz idle.
 *
 * Sprite: Player.png — 96×128 px, 16×16 source frames → 6 cols × 8 rows
 *   Layout (2 rows per direction: even=idle, odd=walk):
 *     Row 0 (y=  0): Idle Down   Row 1 (y= 16): Walk Down
 *     Row 2 (y= 32): Idle Left   Row 3 (y= 48): Walk Left
 *     Row 4 (y= 64): Idle Right  Row 5 (y= 80): Walk Right
 *     Row 6 (y= 96): Idle Up     Row 7 (y=112): Walk Up
 *   Source 16×16 drawn at 24×24 dest (1.5×, imageSmoothingEnabled=false).
 */
import type { InputState } from './InputManager'
import type { CollisionMap } from './CollisionMap'
import { SpriteSheet, Animation } from './SpriteSheet'

export type Direction = 'up' | 'down' | 'left' | 'right'

const SPEED       = 96   // px/s
const RENDER_SIZE = 24   // destination px — 1.5× the 16-px source
const HALF        = 12   // RENDER_SIZE / 2

const FW   = 16   // source frame width
const FH   = 16   // source frame height
const COLS = 6    // frames per row

const ROW_IDLE_DOWN  = 0
const ROW_WALK_DOWN  = 1
const ROW_IDLE_LEFT  = 2
const ROW_WALK_LEFT  = 3
const ROW_IDLE_RIGHT = 4
const ROW_WALK_RIGHT = 5
const ROW_IDLE_UP    = 6
const ROW_WALK_UP    = 7

export class Player {
  x: number
  y: number
  direction: Direction = 'down'
  isMoving = false

  private bobTime = 0
  private anim: Animation    // active animation this frame — set in update, read in render

  private sheet: SpriteSheet
  private walkAnims: Record<Direction, Animation>
  private idleAnims: Record<Direction, Animation>

  constructor(x: number, y: number) {
    this.x = x
    this.y = y

    this.sheet = new SpriteSheet('/assets/sprites/Player.png')

    const row = (r: number, fps: number) =>
      new Animation(SpriteSheet.buildRow(0, r * FH, FW, FH, COLS), fps)

    this.walkAnims = {
      down:  row(ROW_WALK_DOWN,  8),
      left:  row(ROW_WALK_LEFT,  8),
      right: row(ROW_WALK_RIGHT, 8),
      up:    row(ROW_WALK_UP,    8),
    }

    this.idleAnims = {
      down:  row(ROW_IDLE_DOWN,  4),
      left:  row(ROW_IDLE_LEFT,  4),
      right: row(ROW_IDLE_RIGHT, 4),
      up:    row(ROW_IDLE_UP,    4),
    }

    this.anim = this.idleAnims.down
  }

  update(dt: number, input: InputState, collisionMap: CollisionMap) {
    let vx = 0
    let vy = 0

    if (input.right || input.left) {
      vx = input.right ? SPEED : -SPEED
      this.direction = input.right ? 'right' : 'left'
    } else if (input.down || input.up) {
      vy = input.down ? SPEED : -SPEED
      this.direction = input.down ? 'down' : 'up'
    }

    this.isMoving = vx !== 0 || vy !== 0
    this.bobTime  = (this.bobTime + dt) % 1   // wrap at 1s to prevent float drift

    this.anim = this.isMoving ? this.walkAnims[this.direction] : this.idleAnims[this.direction]
    this.anim.update(dt)

    const newX = this.x + vx * dt
    const newY = this.y + vy * dt
    if (collisionMap.isWalkable(newX, this.y)) this.x = newX
    if (collisionMap.isWalkable(this.x, newY)) this.y = newY
  }

  private getBobOffset(): number {
    const t = this.bobTime * Math.PI * 2
    return this.isMoving
      ? Math.sin(t * 4) * 1.5
      : Math.sin(t * 1) * 0.5
  }

  render(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number) {
    const bob = this.getBobOffset()
    const dx  = Math.round(this.x - cameraX - HALF)
    const dy  = Math.round(this.y - cameraY - HALF + bob)
    this.sheet.draw(ctx, this.anim.currentFrame(), dx, dy, RENDER_SIZE, RENDER_SIZE)
  }
}
