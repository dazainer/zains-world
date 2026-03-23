/**
 * Secret Room — hidden room accessible via fake wall in NE overworld corner.
 * Contains: Debug Terminal, Bookshelf, Snake Game (via terminal), Bulletin Board, Jukebox.
 */
import type { TileMap } from '../TileRenderer'
import type { TileType } from '../CollisionMap'

export const COLS = 14
export const ROWS = 12
export const TILE_SIZE = 32

export const floorLayer: TileMap = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1),
)

export const collisionMap: TileType[][] = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => 1 as TileType),
)

export const interactionZones = [
  { id: 'debug-terminal',  col: 6,  row: 5  },
  { id: 'bookshelf',       col: 2,  row: 2  },
  { id: 'bulletin-board',  col: 10, row: 2  },
  { id: 'jukebox',         col: 12, row: 5  },
  { id: 'arcade-cabinet',  col: 4,  row: 8  }, // alternate way to launch Snake game
]

export const doors = [
  { col: 7, row: 11, destination: 'overworld', spawnCol: 28, spawnRow: 4 },
]
