/**
 * CollisionMap — 2D tile array describing walkability for a room.
 *
 * Tile values:
 *   0 = wall / solid (cannot walk through)
 *   1 = walkable
 *   2 = interaction zone (triggers InteractionPrompt when player stands on it)
 *   3 = door / room transition
 *   4 = fake wall (looks like 0 but acts like 1 — secret room entrance)
 */
export type TileType = 0 | 1 | 2 | 3 | 4

export class CollisionMap {
  private grid: TileType[][]
  readonly tileSize: number

  constructor(grid: TileType[][], tileSize = 32) {
    this.grid = grid
    this.tileSize = tileSize
  }

  get rows() { return this.grid.length }
  get cols() { return this.grid[0]?.length ?? 0 }
  get pixelWidth() { return this.cols * this.tileSize }
  get pixelHeight() { return this.rows * this.tileSize }

  getTileAt(col: number, row: number): TileType | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null
    return this.grid[row][col]
  }

  getTileAtPixel(px: number, py: number): TileType | null {
    return this.getTileAt(
      Math.floor(px / this.tileSize),
      Math.floor(py / this.tileSize),
    )
  }

  /** Returns true if the player bounding box can move to (px, py). */
  isWalkable(px: number, py: number, playerSize = 20): boolean {
    const half = playerSize / 2
    const corners: [number, number][] = [
      [px - half, py - half],
      [px + half, py - half],
      [px - half, py + half],
      [px + half, py + half],
    ]
    return corners.every(([cx, cy]) => {
      const tile = this.getTileAtPixel(cx, cy)
      // null = out of bounds = not walkable; 0 = wall
      if (tile === null || tile === 0) return false
      return true // 1, 2, 3, 4 are all walkable
    })
  }

  isInteractionZone(px: number, py: number): boolean {
    return this.getTileAtPixel(px, py) === 2
  }

  isDoor(px: number, py: number): boolean {
    return this.getTileAtPixel(px, py) === 3
  }
}
