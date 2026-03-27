/**
 * Secret Room — hidden personal hideout, accessed via fake wall in the Sphinx.
 * Cozy, atmospheric room with 5 interactive stations:
 *   Debug Terminal (back wall center), Bookshelf (left wall),
 *   Snake Game console (right wall), Bulletin Board (back wall left),
 *   Jukebox (back wall right).
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'
import { DUNGEON_PROP_FRAMES, placeInteriorDeco } from '../InteriorDeco'
import { OVERWORLD_RETURN_SPAWNS } from './overworld'

const COLS = 12
const ROWS = 10
const T = 32

const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// ── Collision grid ──────────────────────────────────────────────────────────
// Layout: cozy hideout with stations along the walls, open floor in the center.
// Back wall (row 1): bulletin board (cols 2-3), terminal screen (cols 6-7), jukebox (cols 10-11)
// Left wall: bookshelf (col 1, rows 5-6 backing)
// Right wall: arcade cabinet (col 12, rows 5-6 backing)
// prettier-ignore
const collisionGrid: TileType[][] = [
// col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13
/* 0 */[W, W, W, W, W, W, W, W, W, W, W, W],
/* 1 */[W, W, W, W, W, W, W, W, W, W, W, W],
/* 2 */[W, F, F, F, F, F, F, F, F, F, F, W],
/* 3 */[W, F, F, F, F, F, F, F, F, F, F, W],
/* 4 */[W, W, F, F, F, F, F, F, F, F, W, W],
/* 5 */[W, F, F, F, F, F, F, F, F, F, F, W],
/* 6 */[W, F, F, F, F, F, F, F, F, F, F, W],
/* 7 */[W, F, F, F, F, F, F, F, F, F, F, W],
/* 8 */[W, F, F, F, F, F, F, F, F, F, F, W],
/* 9 */[W, W, W, W, W, D, D, W, W, W, W, W],
]

// ── Interaction tiles ───────────────────────────────────────────────────────
// Back wall stations: interact from row 2
collisionGrid[2][3]  = I  // bulletin board
collisionGrid[2][6]  = I  // debug terminal (left half)
collisionGrid[2][7]  = I  // debug terminal (right half)
collisionGrid[2][9] = I  // jukebox

// Side wall stations: interact from row 5
collisionGrid[5][1]  = I  // bookshelf
collisionGrid[5][10] = I  // arcade cabinet (snake game)

// ── Exported decoration metadata ────────────────────────────────────────────

export interface SecretStation {
  id: string
  label: string
  col: number
  row: number
  /** Wall tiles that form the station's visual prop (backing) */
  propTiles: Array<{ col: number; row: number }>
  color: string
  icon: 'terminal' | 'bookshelf' | 'arcade' | 'bulletin' | 'jukebox'
}

export const secretStations: SecretStation[] = [
  {
    id: 'debug-terminal',
    label: 'TERMINAL',
    col: 6, row: 2,   // left interaction tile
    propTiles: [{ col: 5, row: 1 }, { col: 6, row: 1 }],
    color: '#00ff41',
    icon: 'terminal',
  },
  {
    id: 'debug-terminal',
    label: '',          // only one label for the pair
    col: 6, row: 2,    // right interaction tile
    propTiles: [],
    color: '#00ff41',
    icon: 'terminal',
  },
  {
    id: 'bulletin-board',
    label: 'NOTICES',
    col: 3, row: 2,
    propTiles: [{ col: 2, row: 1 }, { col: 3, row: 1 }],
    color: '#d4a030',
    icon: 'bulletin',
  },
  {
    id: 'jukebox',
    label: 'JUKEBOX',
    col: 10, row: 2,
    propTiles: [{ col: 8, row: 1 }, { col: 9, row: 1 }],
    color: '#e060a0',
    icon: 'jukebox',
  },
  {
    id: 'bookshelf',
    label: 'BOOKS',
    col: 1, row: 5,
    propTiles: [{ col: 1, row: 4 }],
    color: '#8B4513',
    icon: 'bookshelf',
  },
  {
    id: 'arcade-cabinet',
    label: 'SNAKE',
    col: 10, row: 5,
    propTiles: [{ col: 10, row: 4 }],
    color: '#40c040',
    icon: 'arcade',
  },
]

// Build a lookup for prop tiles used in rendering
const propTileSet = new Set<string>()
for (const s of secretStations) {
  for (const t of s.propTiles) {
    propTileSet.add(`${t.col},${t.row}`)
  }
}

/** Check if a tile position is a station prop (for special wall rendering) */
export function isSecretPropTile(col: number, row: number): SecretStation | null {
  for (const s of secretStations) {
    for (const t of s.propTiles) {
      if (t.col === col && t.row === row) return s
    }
  }
  return null
}

const spriteDecos = [
  placeInteriorDeco('hideout-pot-left', 'props', DUNGEON_PROP_FRAMES.potB, 2, 6, 22, 22, 5, 5),
  placeInteriorDeco('hideout-pot-right', 'props', DUNGEON_PROP_FRAMES.potC, 9, 6, 22, 22, 5, 5),
  placeInteriorDeco('hideout-crate', 'props', DUNGEON_PROP_FRAMES.crate, 2, 7, 24, 24, 4, 4),
  placeInteriorDeco('hideout-barrel', 'props', DUNGEON_PROP_FRAMES.barrel, 9, 7, 24, 24, 4, 4),
  placeInteriorDeco('hideout-key', 'props', DUNGEON_PROP_FRAMES.goldKey, 3, 7, 14, 14, 9, 14),
  placeInteriorDeco('hideout-gem', 'props', DUNGEON_PROP_FRAMES.blueGem, 8, 7, 16, 16, 8, 12),
]

// ── Doors ───────────────────────────────────────────────────────────────────
const sphinxReturn = OVERWORLD_RETURN_SPAWNS.secretRoom

const doors: DoorDef[] = [
  { col: 5, row: 9, targetRoom: 'overworld', spawnX: sphinxReturn.x, spawnY: sphinxReturn.y, spawnDirection: sphinxReturn.direction },
  { col: 6, row: 9, targetRoom: 'overworld', spawnX: sphinxReturn.x, spawnY: sphinxReturn.y, spawnDirection: sphinxReturn.direction },
]

// ── Interaction zones ───────────────────────────────────────────────────────
const interactionZones: InteractionZoneDef[] = [
  { col: 5,  row: 2, id: 'debug-terminal',   payload: 'terminal' },
  { col: 6,  row: 2, id: 'debug-terminal',   payload: 'terminal' },
  { col: 3,  row: 2, id: 'bulletin-board',    payload: 'bulletin' },
  { col: 9, row: 2, id: 'jukebox',           payload: 'jukebox' },
  { col: 1,  row: 5, id: 'bookshelf',         payload: 'bookshelf' },
  { col: 10, row: 5, id: 'arcade-cabinet',    payload: 'snake-game' },
]

// ── Ambient sprites (torches for atmosphere) ────────────────────────────────
function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)

  const torchPositions = [
    // Back wall between stations
    { col: 4,  row: 1 },   // between bulletin and terminal
    { col: 7,  row: 1 },   // between terminal and jukebox
    // Side walls
    { col: 1,  row: 7 },   // left wall lower
    { col: 10, row: 7 },   // right wall lower
    // Near door
    { col: 3,  row: 8 },   // left of door
    { col: 8,  row: 8 },   // right of door
  ]

  return torchPositions.map((pos, i) => {
    const torch = new AmbientSprite({
      type: 'torch',
      x: pos.col * T + 8,
      y: pos.row * T - 16,
      renderW: 32,
      renderH: 64,
    })
    torch.init(fireSheet, frames, 8, i)
    return torch
  })
}

// ── Room data ───────────────────────────────────────────────────────────────
export const secretRoomData: RoomData = {
  id: 'secretRoom',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 6 * T, y: 8 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
  spriteDecos,
}
