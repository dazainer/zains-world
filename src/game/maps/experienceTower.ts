/**
 * Experience Tower — multi-floor interior.
 * Floor 1: Debate & WSC Club, Floor 2: Student Council, Floor 3: OMAM MUN.
 * Interactive paintings (with real photos) and plaques on walls.
 */
import type { TileMap } from '../TileRenderer'
import type { TileType } from '../CollisionMap'

export const COLS = 12
export const ROWS = 16
export const TILE_SIZE = 32

/** Each floor is a separate tile map / collision map loaded on transition. */
export const floors: Record<number, { floorLayer: TileMap; collisionMap: TileType[][] }> = {
  1: {
    floorLayer: Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 1)),
    collisionMap: Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 1 as TileType)),
  },
  2: {
    floorLayer: Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 1)),
    collisionMap: Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 1 as TileType)),
  },
  3: {
    floorLayer: Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 1)),
    collisionMap: Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 1 as TileType)),
  },
}

export const interactionZones = [
  // Floor 1
  { id: 'exp-debate-club',     floor: 1, col: 6, row: 4, experienceId: 'debate-club'     },
  // Floor 2
  { id: 'exp-student-council', floor: 2, col: 6, row: 4, experienceId: 'student-council' },
  // Floor 3
  { id: 'exp-omam-mun',        floor: 3, col: 6, row: 4, experienceId: 'omam-mun'        },
]

export const doors = [
  { col: 6, row: 15, destination: 'overworld', spawnCol: 24, spawnRow: 12 },
]

export const stairs = [
  { floor: 1, direction: 'up',   col: 10, row: 8, targetFloor: 2 },
  { floor: 2, direction: 'down', col: 10, row: 8, targetFloor: 1 },
  { floor: 2, direction: 'up',   col: 10, row: 4, targetFloor: 3 },
  { floor: 3, direction: 'down', col: 10, row: 4, targetFloor: 2 },
]
