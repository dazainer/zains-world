/**
 * Projects Lab — 16×16 interior room.
 * 3 workstations against the north wall (SpecGuard, Expense Tracker, AI Meeting Copilot).
 * Exit door at bottom-centre returns to overworld at the Temple building.
 * Uses dungeon-pack rendering (canvas-drawn walls/floors + Door.png + Fire.png).
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'

const COLS = 16
const ROWS = 16
const T = 32

// ── Collision grid ──────────────────────────────────────────────────────────
// 0=wall  1=walkable  2=interaction  3=door
const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// prettier-ignore
const collisionGrid: TileType[][] = [
// col: 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
/* 0 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
/* 1 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W, W, W],
/* 2 */[W, F, W, W, F, F, W, W, F, F, W, W, F, F, F, W], // workbenches at cols 2-3, 6-7, 10-11
/* 3 */[W, F, I, I, F, F, I, I, F, F, I, I, F, F, F, W], // interaction zones in front
/* 4 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 5 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 6 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 7 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 8 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 9 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*10 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*11 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*12 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*13 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*14 */[W, F, F, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*15 */[W, W, W, W, W, W, W, D, D, W, W, W, W, W, W, W], // exit door cols 7-8
]

// ── Doors ───────────────────────────────────────────────────────────────────
const doors: DoorDef[] = [
  // Exit → overworld (just south of Temple building, row 10, centered on cols 9-10)
  { col: 7, row: 15, targetRoom: 'overworld', spawnX: 10 * T, spawnY: 10 * T + T / 2, spawnDirection: 'down' },
  { col: 8, row: 15, targetRoom: 'overworld', spawnX: 10 * T, spawnY: 10 * T + T / 2, spawnDirection: 'down' },
]

// ── Interaction zones ───────────────────────────────────────────────────────
const interactionZones: InteractionZoneDef[] = [
  { col: 2,  row: 3, id: 'station-specguard',       payload: 'specguard' },
  { col: 3,  row: 3, id: 'station-specguard',       payload: 'specguard' },
  { col: 6,  row: 3, id: 'station-expense-tracker',  payload: 'expense-tracker' },
  { col: 7,  row: 3, id: 'station-expense-tracker',  payload: 'expense-tracker' },
  { col: 10, row: 3, id: 'station-meeting-copilot',  payload: 'meeting-copilot' },
  { col: 11, row: 3, id: 'station-meeting-copilot',  payload: 'meeting-copilot' },
]

// ── Ambient sprites (torches on walls) ──────────────────────────────────────
function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)

  const torchPositions = [
    { col: 3, row: 0 },   // above workstation 1
    { col: 7, row: 0 },   // above workstation 2
    { col: 11, row: 0 },  // above workstation 3
    { col: 1, row: 7 },   // left wall
    { col: 14, row: 7 },  // right wall
  ]

  return torchPositions.map((pos, i) => {
    const torch = new AmbientSprite({
      type: 'torch',
      x: pos.col * T + 8,    // centre the 32-wide torch in the tile
      y: pos.row * T - 16,   // offset up so flame is above the wall
      renderW: 32,
      renderH: 64,
    })
    torch.init(fireSheet, frames, 8, i)  // stagger start frames
    return torch
  })
}

// ── Room data ───────────────────────────────────────────────────────────────
export const projectsLabRoom: RoomData = {
  id: 'projectsLab',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 8 * T, y: 14 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
}
