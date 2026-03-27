/**
 * Skills Forge — 14×14 interior room.
 * Skills displayed as items on shelves with tier-based rendering.
 * 3 rows of shelves: 5 + 5 + 4 = 14 skills total.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'
import { OVERWORLD_RETURN_SPAWNS } from './overworld'

const COLS = 14
const ROWS = 14
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
/* 2 */[W, F, W, F, W, F, W, F, W, F, W, F, F, W], // shelf row 1: cols 2,4,6,8,10
/* 3 */[W, F, I, F, I, F, I, F, I, F, I, F, F, W], // interact row 1
/* 4 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 5 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 6 */[W, F, W, F, W, F, W, F, W, F, W, F, F, W], // shelf row 2: cols 2,4,6,8,10
/* 7 */[W, F, I, F, I, F, I, F, I, F, I, F, F, W], // interact row 2
/* 8 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 9 */[W, F, F, F, W, F, W, F, W, F, W, F, F, W], // shelf row 3: cols 4,6,8,10
/*10 */[W, F, F, F, I, F, I, F, I, F, I, F, F, W], // interact row 3
/*11 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*12 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*13 */[W, W, W, W, W, W, D, D, W, W, W, W, W, W], // exit door cols 6-7
]

const hutReturn = OVERWORLD_RETURN_SPAWNS.skillsForge

const doors: DoorDef[] = [
  { col: 6, row: 13, targetRoom: 'overworld', spawnX: hutReturn.x, spawnY: hutReturn.y, spawnDirection: hutReturn.direction },
  { col: 7, row: 13, targetRoom: 'overworld', spawnX: hutReturn.x, spawnY: hutReturn.y, spawnDirection: hutReturn.direction },
]

const interactionZones: InteractionZoneDef[] = [
  // Row 1: Legendary + top Rare skills
  { col: 2,  row: 3, id: 'skill-python',     payload: 'Python' },
  { col: 4,  row: 3, id: 'skill-c',          payload: 'C' },
  { col: 6,  row: 3, id: 'skill-typescript',  payload: 'TypeScript' },
  { col: 8,  row: 3, id: 'skill-javascript',  payload: 'JavaScript' },
  { col: 10, row: 3, id: 'skill-sql',         payload: 'SQL' },
  // Row 2: Rare skills
  { col: 2,  row: 7, id: 'skill-react',       payload: 'React' },
  { col: 4,  row: 7, id: 'skill-nodejs',      payload: 'Node.js' },
  { col: 6,  row: 7, id: 'skill-postgres',    payload: 'PostgreSQL' },
  { col: 8,  row: 7, id: 'skill-fastapi',     payload: 'FastAPI' },
  { col: 10, row: 7, id: 'skill-git',         payload: 'Git' },
  // Row 3: Common skills
  { col: 4,  row: 10, id: 'skill-html-css',   payload: 'HTML/CSS' },
  { col: 6,  row: 10, id: 'skill-express',    payload: 'Express' },
  { col: 8,  row: 10, id: 'skill-rest-apis',  payload: 'REST APIs' },
  { col: 10, row: 10, id: 'skill-racket',     payload: 'Racket' },
]

function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)

  const torchPositions = [
    { col: 1, row: 0 },
    { col: 6, row: 0 },
    { col: 12, row: 0 },
    { col: 1, row: 5 },
    { col: 12, row: 5 },
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

export const skillsForgeRoom: RoomData = {
  id: 'skillsForge',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 7 * T, y: 12 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
}
