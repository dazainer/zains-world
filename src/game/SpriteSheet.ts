/**
 * SpriteSheet — loads a sprite sheet image and extracts frames by position.
 * Handles 2× scaling for 16×16 dungeon-pack sprites so they align with
 * the 32×32 terrain grid.
 */
export interface Frame {
  sx: number  // source x in sheet
  sy: number  // source y in sheet
  sw: number  // source width
  sh: number  // source height
}

export class SpriteSheet {
  private image: HTMLImageElement
  private loaded = false
  private failed = false

  constructor(src: string) {
    this.image = new Image()
    this.image.onload  = () => { this.loaded = true }
    this.image.onerror = () => {
      console.error(`SpriteSheet: failed to load "${src}"`)
      this.failed = true
      this.loaded = true  // unblock loading progress
    }
    this.image.src = src
  }

  isLoaded() { return this.loaded }

  /**
   * Draw a single frame to the canvas.
   * @param dw  Destination width  (pass 32 to 2× a 16px sprite)
   * @param dh  Destination height (pass 32 to 2× a 16px sprite)
   */
  draw(
    ctx: CanvasRenderingContext2D,
    frame: Frame,
    dx: number,
    dy: number,
    dw = frame.sw,
    dh = frame.sh,
  ) {
    if (!this.loaded || this.failed) return
    ctx.drawImage(this.image, frame.sx, frame.sy, frame.sw, frame.sh, dx, dy, dw, dh)
  }

  /** Build a row of equally-sized frames from a sprite sheet row. */
  static buildRow(
    startX: number,
    startY: number,
    frameW: number,
    frameH: number,
    count: number,
  ): Frame[] {
    return Array.from({ length: count }, (_, i) => ({
      sx: startX + i * frameW,
      sy: startY,
      sw: frameW,
      sh: frameH,
    }))
  }
}

/** Simple frame-based animation ticker. */
export class Animation {
  private frameIndex = 0
  private elapsed = 0
  private readonly frameDuration: number  // cached 1/fps

  private frames: Frame[]

  constructor(
    frames: Frame[],
    fps = 8,
    startFrame = 0,
  ) {
    this.frames = frames
    this.frameDuration = 1 / fps
    if (frames.length > 0) this.frameIndex = startFrame % frames.length
  }

  update(dt: number) {
    this.elapsed += dt
    if (this.elapsed >= this.frameDuration) {
      this.elapsed -= this.frameDuration
      this.frameIndex = (this.frameIndex + 1) % this.frames.length
    }
  }

  currentFrame(): Frame {
    return this.frames[this.frameIndex]
  }

  reset() {
    this.frameIndex = 0
    this.elapsed = 0
  }
}
