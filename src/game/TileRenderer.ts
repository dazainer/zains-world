/**
 * TileRenderer — draws tile-based maps from a 2D tile-index array.
 *
 * Index convention:
 *   0   = skip (transparent — background colour shows through, used for walls)
 *   1…N = tile n, sourced from the sheet at:
 *           srcCol = (n - 1) % tilesPerRow
 *           srcRow = Math.floor((n - 1) / tilesPerRow)
 *
 * Only tiles that overlap the current viewport are drawn (frustum culling),
 * so large maps don't waste draw calls on off-screen tiles.
 */
import { SpriteSheet, type Frame } from './SpriteSheet'

export type TileMap = number[][]

export interface TileSet {
  sheet: SpriteSheet
  /** Source tile size in pixels (e.g. 32 for the desert pack). */
  srcTileSize: number
  /** How many tiles span the width of the sheet image. */
  tilesPerRow: number
}

export class TileRenderer {
  // Pre-allocated frame object — mutated in the tile loop to avoid per-tile heap allocations.
  private readonly frame: Frame = { sx: 0, sy: 0, sw: 0, sh: 0 }

  private tileSize: number

  constructor(tileSize = 32) {
    this.tileSize = tileSize
  }

  /**
   * Render one layer of a tile map.
   *
   * @param camX    Camera X offset (left edge of viewport in world pixels)
   * @param camY    Camera Y offset
   * @param viewW   Viewport width  (for frustum culling)
   * @param viewH   Viewport height (for frustum culling)
   * @param dstTileSize  Destination tile size in pixels. Defaults to tileSize.
   *   When larger than tileSize, each tile is drawn bigger and centred within
   *   its grid cell (bleeds symmetrically into neighbours). Suitable for
   *   single-tile props that need scaling; for multi-tile buildings use
   *   renderBlock() instead, which treats the entire N×M sprite as one unit.
   */
  renderLayer(
    ctx: CanvasRenderingContext2D,
    map: TileMap,
    tileSet: TileSet,
    camX: number,
    camY: number,
    viewW = 512,
    viewH = 288,
    dstTileSize = this.tileSize,
  ) {
    if (!tileSet.sheet.isLoaded()) return

    const { srcTileSize, tilesPerRow } = tileSet
    const ts    = this.tileSize
    const bleed = Math.ceil((dstTileSize - ts) / 2)
    const buf   = 1 + Math.ceil(bleed / ts)

    const minCol = Math.max(0, Math.floor(camX / ts) - buf)
    const maxCol = Math.min((map[0]?.length ?? 0) - 1, Math.floor((camX + viewW) / ts) + buf)
    const minRow = Math.max(0, Math.floor(camY / ts) - buf)
    const maxRow = Math.min(map.length - 1, Math.floor((camY + viewH) / ts) + buf)

    const f = this.frame
    f.sw = srcTileSize
    f.sh = srcTileSize

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const idx = map[row]?.[col] ?? 0
        if (idx <= 0) continue

        f.sx = ((idx - 1) % tilesPerRow) * srcTileSize
        f.sy = Math.floor((idx - 1) / tilesPerRow) * srcTileSize

        tileSet.sheet.draw(ctx, f, col * ts - camX - bleed, row * ts - camY - bleed, dstTileSize, dstTileSize)
      }
    }
  }

  /**
   * Render a multi-tile building block as a single seamless unit at an
   * arbitrary pixel size. Each sub-tile is proportionally scaled so there
   * is no overlap or double-drawing at tile seams.
   *
   * @param tiles    2D array of tile indices (row-major, same convention as TileMap).
   * @param worldX   Top-left x of the block in world pixels.
   * @param worldY   Top-left y of the block in world pixels.
   * @param pixelW   Total render width in destination pixels.
   * @param pixelH   Total render height in destination pixels.
   */
  renderBlock(
    ctx: CanvasRenderingContext2D,
    tiles: TileMap,
    tileSet: TileSet,
    worldX: number,
    worldY: number,
    camX: number,
    camY: number,
    pixelW: number,
    pixelH: number,
    viewW = 512,
    viewH = 288,
  ) {
    if (!tileSet.sheet.isLoaded()) return

    const dstX = worldX - camX
    const dstY = worldY - camY
    if (dstX + pixelW < 0 || dstX > viewW || dstY + pixelH < 0 || dstY > viewH) return

    const { srcTileSize, tilesPerRow } = tileSet
    const rows  = tiles.length
    const cols  = tiles[0]?.length ?? 0
    if (rows === 0 || cols === 0) return

    const tileW = pixelW / cols
    const tileH = pixelH / rows

    const f = this.frame
    f.sw = srcTileSize
    f.sh = srcTileSize

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = tiles[r][c]
        if (idx <= 0) continue

        f.sx = ((idx - 1) % tilesPerRow) * srcTileSize
        f.sy = Math.floor((idx - 1) / tilesPerRow) * srcTileSize

        tileSet.sheet.draw(ctx, f, dstX + c * tileW, dstY + r * tileH, tileW, tileH)
      }
    }
  }
}
