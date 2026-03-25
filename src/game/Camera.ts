/**
 * Camera — follows the player with smooth lerp, clamped to map boundaries.
 * Uses a simple per-frame lerp factor of 0.1 (moves 10% of remaining distance
 * each frame — assumes ~60fps, which is standard for this game).
 */

const LERP = 0.1

export class Camera {
  x = 0
  y = 0

  private viewW: number
  private viewH: number

  constructor(viewW: number, viewH: number) {
    this.viewW = viewW
    this.viewH = viewH
  }

  /** Called every update. Smoothly chases the target and clamps to map edges. */
  follow(targetX: number, targetY: number, mapPixelW: number, mapPixelH: number) {
    const desiredX = targetX - this.viewW / 2
    const desiredY = targetY - this.viewH / 2

    this.x += (desiredX - this.x) * LERP
    this.y += (desiredY - this.y) * LERP

    // Never show outside the map
    this.x = Math.max(0, Math.min(this.x, mapPixelW - this.viewW))
    this.y = Math.max(0, Math.min(this.y, mapPixelH - this.viewH))
  }

  /** Teleport camera instantly (use on room load so there's no lerp across the map). */
  snapTo(targetX: number, targetY: number, mapPixelW: number, mapPixelH: number) {
    this.x = Math.max(0, Math.min(targetX - this.viewW / 2, mapPixelW - this.viewW))
    this.y = Math.max(0, Math.min(targetY - this.viewH / 2, mapPixelH - this.viewH))
  }
}
