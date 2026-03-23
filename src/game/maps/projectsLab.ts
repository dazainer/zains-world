/**
 * Projects Lab — interior room.
 * 3 workstation stations (SpecGuard, Expense Tracker, AI Meeting Copilot).
 * Uses Desert Dungeon Pack tiles for floor/walls, torches on walls.
 */
import type { TileMap } from '../TileRenderer'
import type { TileType } from '../CollisionMap'

export const COLS = 16
export const ROWS = 16
export const TILE_SIZE = 32

export const floorLayer: TileMap = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1),
)

export const wallLayer: TileMap = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 0),
)

export const collisionMap: TileType[][] = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1 as TileType),
)

/** Interaction zones — walk up + Space to open ProjectPanel */
export const interactionZones = [
  { id: 'station-specguard',       col: 3,  row: 5, projectId: 'specguard'      },
  { id: 'station-expense-tracker', col: 8,  row: 5, projectId: 'expense-tracker' },
  { id: 'station-meeting-copilot', col: 13, row: 5, projectId: 'meeting-copilot' },
]

export const doors = [
  { col: 8, row: 15, destination: 'overworld', spawnCol: 15, spawnRow: 4 },
]
