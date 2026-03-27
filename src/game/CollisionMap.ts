/**
 * CollisionMap — tile grid + pixel-based collision rectangles.
 *
 * Tile values (used for terrain: borders, water, paths, sand):
 *   0 = wall / solid (cannot walk through)
 *   1 = walkable
 *   2 = interaction zone (triggers InteractionPrompt when player stands on it)
 *   3 = door / room transition (tile-based, e.g. Contact Portal)
 *   4 = fake wall (looks like 0 but acts like 1)
 *
 * CollisionRects (used for buildings/structures):
 *   Pixel-precise rectangles that block movement. Each rect can have an
 *   optional doorZone — a walkable gap within the rect that triggers a
 *   room transition when the player steps inside it.
 */
export type TileType = 0 | 1 | 2 | 3 | 4
export const DEFAULT_PLAYER_COLLISION_WIDTH = 18
export const DEFAULT_PLAYER_COLLISION_HEIGHT = 12
export const DEFAULT_PLAYER_COLLISION_Y_OFFSET = 3

export function getPlayerCollisionBounds(px: number, py: number) {
  const halfW = DEFAULT_PLAYER_COLLISION_WIDTH / 2
  const halfH = DEFAULT_PLAYER_COLLISION_HEIGHT / 2
  const centerY = py + DEFAULT_PLAYER_COLLISION_Y_OFFSET

  return {
    x: px - halfW,
    y: centerY - halfH,
    width: DEFAULT_PLAYER_COLLISION_WIDTH,
    height: DEFAULT_PLAYER_COLLISION_HEIGHT,
    left: px - halfW,
    right: px + halfW,
    top: centerY - halfH,
    bottom: centerY + halfH,
  }
}

export interface CollisionRect {
  x: number       // world pixel x (left edge)
  y: number       // world pixel y (top edge)
  width: number
  height: number
  doorZone?: {
    x: number     // world pixel x (absolute, not relative to rect)
    y: number     // world pixel y (absolute)
    width: number
    height: number
    doorId: string // matches RectDoorDef.doorId for room transition lookup
  }
}

export class CollisionMap {
  private grid: TileType[][]
  private rects: CollisionRect[]
  readonly tileSize: number

  constructor(grid: TileType[][], tileSize = 32, rects: CollisionRect[] = []) {
    this.grid = grid
    this.tileSize = tileSize
    this.rects = rects
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
  isWalkable(px: number, py: number): boolean {
    const bounds = getPlayerCollisionBounds(px, py)
    const corners: [number, number][] = [
      [bounds.left, bounds.top],
      [bounds.right, bounds.top],
      [bounds.left, bounds.bottom],
      [bounds.right, bounds.bottom],
    ]
    return corners.every(([cx, cy]) => {
      // 1. Tile check (terrain: borders, water, etc.)
      const tile = this.getTileAtPixel(cx, cy)
      if (tile === null || tile === 0) return false

      // 2. Rect check (buildings/structures)
      for (const rect of this.rects) {
        if (cx >= rect.x && cx < rect.x + rect.width &&
            cy >= rect.y && cy < rect.y + rect.height) {
          // Corner is inside this rect — check if it's in the door zone
          const dz = rect.doorZone
          if (dz && cx >= dz.x && cx < dz.x + dz.width &&
                    cy >= dz.y && cy < dz.y + dz.height) {
            continue // inside door zone — not blocked by this rect
          }
          return false // inside solid part of rect — blocked
        }
      }

      return true
    })
  }

  /**
   * Check if the player centre is inside any rect's door zone.
   * Returns the doorId if so, null otherwise.
   */
  getRectDoor(px: number, py: number): string | null {
    for (const rect of this.rects) {
      const dz = rect.doorZone
      if (!dz) continue
      if (px >= dz.x && px < dz.x + dz.width &&
          py >= dz.y && py < dz.y + dz.height) {
        return dz.doorId
      }
    }
    return null
  }

  isInteractionZone(px: number, py: number): boolean {
    return this.getTileAtPixel(px, py) === 2
  }

  isDoor(px: number, py: number): boolean {
    return this.getTileAtPixel(px, py) === 3
  }
}
