/**
 * Skills Forge — interior room.
 * Skills displayed as items with tier-based visual treatment.
 * Legendary = golden glow, Rare = subtle glow, Common = no glow.
 */
import type { TileMap } from '../TileRenderer'
import type { TileType } from '../CollisionMap'

export const COLS = 14
export const ROWS = 14
export const TILE_SIZE = 32

export const floorLayer: TileMap = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1),
)

export const collisionMap: TileType[][] = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1 as TileType),
)

/** Skill item interaction zones */
export const interactionZones = [
  { id: 'skill-python',     col: 2,  row: 4  },
  { id: 'skill-c',          col: 4,  row: 4  },
  { id: 'skill-typescript', col: 6,  row: 4  },
  { id: 'skill-react',      col: 8,  row: 4  },
  { id: 'skill-nodejs',     col: 10, row: 4  },
  { id: 'skill-postgres',   col: 2,  row: 8  },
  { id: 'skill-fastapi',    col: 4,  row: 8  },
  { id: 'skill-sql',        col: 6,  row: 8  },
  { id: 'skill-git',        col: 8,  row: 8  },
  { id: 'skill-javascript', col: 10, row: 8  },
]

export const doors = [
  { col: 7, row: 13, destination: 'overworld', spawnCol: 5, spawnRow: 12 },
]
