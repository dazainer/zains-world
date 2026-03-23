/**
 * Overworld — main outdoor desert/Egypt map.
 *
 * Layout (each cell = 32×32 px):
 *   - Sandy terrain base
 *   - Projects Lab (north), Skills Forge (west), Experience Tower (east), Contact Portal (south)
 *   - About Me NPC and Resume Chest near spawn
 *   - Fake wall (tile 4) in NE corner leading to Secret Room
 *   - Ambient camel near Skills Forge, snake near NE corner
 *
 * TODO: fill in full tile map arrays (terrain + decoration layers) once tile sheets are analyzed.
 */
import type { TileMap } from '../TileRenderer'
import type { TileType } from '../CollisionMap'

export const OVERWORLD_COLS = 30
export const OVERWORLD_ROWS = 24
export const TILE_SIZE = 32

/** Spawn position in pixels */
export const SPAWN = {
  x: 15 * TILE_SIZE,
  y: 12 * TILE_SIZE,
}

/** Ground / terrain layer tile indices (referencing DESERT TILESET 32x32.png) */
export const terrainLayer: TileMap = Array.from({ length: OVERWORLD_ROWS }, () =>
  Array.from({ length: OVERWORLD_COLS }, () => 1), // placeholder: all sandy ground
)

/** Decoration / props layer (0 = transparent) */
export const decorationLayer: TileMap = Array.from({ length: OVERWORLD_ROWS }, () =>
  Array.from({ length: OVERWORLD_COLS }, () => 0),
)

/**
 * Collision map.
 * 0=wall, 1=walkable, 2=interaction, 3=door, 4=fake wall
 */
export const collisionMap: TileType[][] = Array.from({ length: OVERWORLD_ROWS }, () =>
  Array.from({ length: OVERWORLD_COLS }, () => 1 as TileType),
)

/** Room transition definitions (door tiles → destination rooms) */
export const doors = [
  { col: 15, row: 3,  destination: 'projectsLab',     spawnCol: 7,  spawnRow: 14 },
  { col: 5,  row: 12, destination: 'skillsForge',      spawnCol: 14, spawnRow: 14 },
  { col: 24, row: 12, destination: 'experienceTower',  spawnCol: 1,  spawnRow: 14 },
  { col: 15, row: 20, destination: 'contactPortal',    spawnCol: 7,  spawnRow: 1  },
  { col: 28, row: 3,  destination: 'secretRoom',       spawnCol: 2,  spawnRow: 7  }, // fake wall
]
