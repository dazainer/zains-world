/**
 * Secret Room — 14×12 interior, accessible via the fake wall in NE overworld.
 * Contains: Debug Terminal, Bookshelf, Bulletin Board, Jukebox, Arcade Cabinet.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'

const COLS = 14
const ROWS = 12
const T = 32

const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// prettier-ignore
const collisionGrid: TileType[][] = [
// col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13
/* 0 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W],
/* 1 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W],
/* 2 */[W, F, W, F, F, F, F, F, F, F, W, F, F, W],  // bookshelf col 2, bulletin col 10
/* 3 */[W, F, I, F, F, F, F, F, F, F, I, F, F, W],  // interact: bookshelf, bulletin
/* 4 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 5 */[W, F, F, F, W, F, W, W, F, F, F, F, W, W],  // terminal col 6-7, jukebox col 12-13
/* 6 */[W, F, F, F, I, F, I, I, F, F, F, F, I, W],  // interact: arcade col 4, terminal col 6-7, jukebox col 12
/* 7 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 8 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 9 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*10 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*11 */[W, W, W, W, W, W, D, D, W, W, W, W, W, W],  // exit door cols 6-7
]

const doors: DoorDef[] = [
  // Exit → overworld (west of fake wall: col 27, row 2)
  { col: 6, row: 11, targetRoom: 'overworld', spawnX: 27 * T + T / 2, spawnY: 2 * T + T / 2, spawnDirection: 'left' },
  { col: 7, row: 11, targetRoom: 'overworld', spawnX: 27 * T + T / 2, spawnY: 2 * T + T / 2, spawnDirection: 'left' },
]

const interactionZones: InteractionZoneDef[] = [
  { col: 2,  row: 3, id: 'bookshelf',       payload: 'bookshelf' },
  { col: 10, row: 3, id: 'bulletin-board',   payload: 'bulletin' },
  { col: 4,  row: 6, id: 'arcade-cabinet',   payload: 'snake-game' },
  { col: 6,  row: 6, id: 'debug-terminal',   payload: 'terminal' },
  { col: 7,  row: 6, id: 'debug-terminal',   payload: 'terminal' },
  { col: 12, row: 6, id: 'jukebox',          payload: 'jukebox' },
]

function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)
  const positions = [
    { col: 1, row: 0 },
    { col: 6, row: 0 },
    { col: 12, row: 0 },
  ]
  return positions.map((pos, i) => {
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

export const secretRoomData: RoomData = {
  id: 'secretRoom',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 7 * T, y: 10 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
}
