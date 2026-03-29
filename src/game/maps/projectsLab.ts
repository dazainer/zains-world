/**
 * Projects Lab — compact workshop interior.
 * 3 workstations along the north wall (SpecGuard, Expense Tracker, Meeting Copilot).
 * Each station has a desk (wall blocks), a colored marker above, and interaction tiles.
 * Decorative props (pots, barrels, crates) scattered around the room.
 * Exit door at bottom-centre returns to overworld at the Temple building.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'
import { DUNGEON_PROP_FRAMES, placeInteriorDeco } from '../InteriorDeco'
import { OVERWORLD_RETURN_SPAWNS } from './overworld'

const COLS = 14
const ROWS = 12
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
/* 0 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W],
/* 1 */[W, W, W, W, W, W, W, W, W, W, W, W, W, W],
/* 2 */[W, F, W, W, F, W, W, F, W, W, F, F, F, W],
/* 3 */[W, F, W, W, F, W, W, F, W, W, F, F, F, W],
/* 4 */[W, F, I, I, F, I, I, F, I, I, F, F, F, W],
/* 5 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 6 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 7 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 8 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/* 9 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*10 */[W, F, F, F, F, F, F, F, F, F, F, F, F, W],
/*11 */[W, W, W, W, W, W, D, D, W, W, W, W, W, W],
]

const templeReturn = OVERWORLD_RETURN_SPAWNS.projectsLab

// ── Doors ───────────────────────────────────────────────────────────────────
const doors: DoorDef[] = [
  { col: 6, row: 11, targetRoom: 'overworld', spawnX: templeReturn.x, spawnY: templeReturn.y, spawnDirection: templeReturn.direction },
  { col: 7, row: 11, targetRoom: 'overworld', spawnX: templeReturn.x, spawnY: templeReturn.y, spawnDirection: templeReturn.direction },
]

// ── Interaction zones ───────────────────────────────────────────────────────
const interactionZones: InteractionZoneDef[] = [
  { col: 2,  row: 4, id: 'station-specguard',        payload: 'specguard' },
  { col: 3,  row: 4, id: 'station-specguard',        payload: 'specguard' },
  { col: 5,  row: 4, id: 'station-expense-tracker',   payload: 'expense-tracker' },
  { col: 6,  row: 4, id: 'station-expense-tracker',   payload: 'expense-tracker' },
  { col: 8,  row: 4, id: 'station-meeting-copilot',   payload: 'meeting-copilot' },
  { col: 9,  row: 4, id: 'station-meeting-copilot',   payload: 'meeting-copilot' },
]

// ── Station decoration metadata (consumed by GameEngine.renderInterior) ─────
export interface StationDeco {
  label: string
  color: string           // marker/accent color
  deskCols: [number, number]  // which columns have the desk surface
  deskRow: number         // row for desk blocks (wall blocks in grid)
  markerRow: number       // row above desk for colored marker
}

export const stationDecos: StationDeco[] = [
  { label: 'SpecGuard',        color: '#4ec9b0', deskCols: [2, 3], deskRow: 3, markerRow: 2 },
  { label: 'Expense Tracker',  color: '#dcdcaa', deskCols: [5, 6], deskRow: 3, markerRow: 2 },
  { label: 'Meeting Copilot',  color: '#ce9178', deskCols: [8, 9], deskRow: 3, markerRow: 2 },
]

const spriteDecos = [
  placeInteriorDeco('crate-west', 'props', DUNGEON_PROP_FRAMES.crate, 1, 6, 24, 24, 4, 4),
  placeInteriorDeco('crate-east', 'props', DUNGEON_PROP_FRAMES.crate, 11, 6, 24, 24, 4, 4),
  placeInteriorDeco('barrel-south-west', 'props', DUNGEON_PROP_FRAMES.barrel, 2, 8, 24, 24, 4, 4),
  placeInteriorDeco('barrel-south-east', 'props', DUNGEON_PROP_FRAMES.barrel, 10, 8, 24, 24, 4, 4),
  placeInteriorDeco('pot-west', 'props', DUNGEON_PROP_FRAMES.potA, 1, 9, 24, 24, 4, 4),
  placeInteriorDeco('pot-east', 'props', DUNGEON_PROP_FRAMES.potB, 11, 9, 24, 24, 4, 4),
]

// ── Ambient sprites (torches on walls) ──────────────────────────────────────
function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)

  const torchPositions = [
    { col: 1,  row: 1 },  // left of station 1
    { col: 4,  row: 1 },  // between station 1 & 2
    { col: 8,  row: 1 },  // between station 2 & 3
    { col: 11, row: 1 },  // right of station 3
    { col: 1,  row: 8 },  // left wall mid
    { col: 12, row: 8 },  // right wall mid
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
export const projectsLabRoom: RoomData = {
  id: 'projectsLab',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 7 * T, y: 10 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
  spriteDecos,
}
