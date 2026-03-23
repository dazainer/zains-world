/**
 * Contact Portal — glowing blue/teal portal interior.
 * Walking into the portal center triggers the contact overlay menu.
 */
import type { TileMap } from '../TileRenderer'
import type { TileType } from '../CollisionMap'

export const COLS = 10
export const ROWS = 10
export const TILE_SIZE = 32

export const floorLayer: TileMap = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1),
)

export const collisionMap: TileType[][] = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1 as TileType),
)

/** Walking into this zone opens the contact menu */
export const portalZone = { col: 5, row: 3, width: 2, height: 3 }

export const doors = [
  { col: 5, row: 9, destination: 'overworld', spawnCol: 15, spawnRow: 19 },
]
