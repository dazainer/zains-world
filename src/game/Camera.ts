/**
 * Camera — follows the player with smooth lerp, clamped to room boundaries.
 * The game renders at a native low resolution (e.g. 512×288) then scales up to fill the viewport.
 */
export class Camera {
  x = 0
  y = 0

  private lerpSpeed = 5

  constructor(
    private viewWidth: number,
    private viewHeight: number,
  ) {}

  follow(targetX: number, targetY: number, mapPixelW: number, mapPixelH: number, dt: number) {
    const desiredX = targetX - this.viewWidth / 2
    const desiredY = targetY - this.viewHeight / 2

    this.x += (desiredX - this.x) * Math.min(1, this.lerpSpeed * dt)
    this.y += (desiredY - this.y) * Math.min(1, this.lerpSpeed * dt)

    // Clamp to map bounds
    this.x = Math.max(0, Math.min(this.x, mapPixelW - this.viewWidth))
    this.y = Math.max(0, Math.min(this.y, mapPixelH - this.viewHeight))
  }

  snap(targetX: number, targetY: number, mapPixelW: number, mapPixelH: number) {
    this.x = Math.max(0, Math.min(targetX - this.viewWidth / 2, mapPixelW - this.viewWidth))
    this.y = Math.max(0, Math.min(targetY - this.viewHeight / 2, mapPixelH - this.viewHeight))
  }
}
