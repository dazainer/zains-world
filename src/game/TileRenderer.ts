/**
 * TileRenderer — draws tile-based maps from a 2D tile-index array.
 * Each tile index maps to a source rectangle in a tile sheet image.
 */
import { SpriteSheet, type Frame } from './SpriteSheet'

export type TileMap = number[][]

export interface TileSet {
  sheet: SpriteSheet
  tileSize: number            // source tile size in the sheet (e.g. 32)
  tilesPerRow: number         // how many tiles wide the sheet is
}

export class TileRenderer {
  constructor(private tileSize = 32) {}

  /**
   * Render a tile map layer.
   * @param ctx       Canvas context
   * @param map       2D array of tile indices (0 = skip / transparent)
   * @param tileSet   The tile sheet to source tiles from
   * @param offsetX   Camera X offset (subtract from render position)
   * @param offsetY   Camera Y offset
   */
  renderLayer(
    ctx: CanvasRenderingContext2D,
    map: TileMap,
    tileSet: TileSet,
    offsetX: number,
    offsetY: number,
  ) {
    const { sheet, tileSize: srcSize, tilesPerRow } = tileSet
    if (!sheet.isLoaded()) return

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        const idx = map[row][col]
        if (idx <= 0) continue // 0 = empty/transparent

        const srcCol = (idx - 1) % tilesPerRow
        const srcRow = Math.floor((idx - 1) / tilesPerRow)

        const frame: Frame = {
          sx: srcCol * srcSize,
          sy: srcRow * srcSize,
          sw: srcSize,
          sh: srcSize,
        }

        const dx = col * this.tileSize - offsetX
        const dy = row * this.tileSize - offsetY

        sheet.draw(ctx, frame, dx, dy, this.tileSize, this.tileSize)
      }
    }
  }
}
