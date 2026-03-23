/**
 * GameEngine — main game loop running at 60fps via requestAnimationFrame.
 * Orchestrates update → render cycle and owns all subsystems.
 */
export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId: number | null = null
  private lastTime = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
  }

  start() {
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private loop = (timestamp: number) => {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05)
    this.lastTime = timestamp

    this.update(dt)
    this.render()

    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(_dt: number) {
    // TODO: update player, camera, interactions
  }

  private render() {
    const { ctx, canvas } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // TODO: render tile maps, player, ambient sprites, UI overlays
  }
}
