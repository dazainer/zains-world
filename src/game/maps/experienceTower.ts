/**
 * Experience Tower — 3 separate 12×12 floor rooms.
 * Floor 1: Debate & WSC Club, Floor 2: Student Council, Floor 3: OMAM MUN.
 * Stairs (type-3 doors) connect floors. Exit door on floor 1 returns to overworld.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'

const COLS = 12
const ROWS = 12
const T = 32

const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// ── Shared floor layout helper ──────────────────────────────────────────────
function makeFloorGrid(hasExitDoor: boolean, hasStairsUp: boolean, hasStairsDown: boolean): TileType[][] {
  // prettier-ignore
  const grid: TileType[][] = [
  // col: 0  1  2  3  4  5  6  7  8  9 10 11
  /* 0 */[W, W, W, W, W, W, W, W, W, W, W, W],
  /* 1 */[W, W, W, W, W, W, W, W, W, W, W, W],
  /* 2 */[W, F, F, F, F, W, W, F, F, F, F, W],  // exhibit blocks at cols 4-5 and 5-6
  /* 3 */[W, F, F, I, I, F, F, I, I, F, F, W],  // interaction zones: cols 3-4 (plaque), cols 7-8 (painting)
  /* 4 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 5 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 6 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 7 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 8 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 9 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /*10 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /*11 */[W, W, W, W, W, W, W, W, W, W, W, W],
  ]

  // Exit door at bottom (floor 1 only)
  if (hasExitDoor) {
    grid[11][5] = D
    grid[11][6] = D
  }

  // Stairs up: top-right area (cols 9-10, row 2)
  if (hasStairsUp) {
    grid[2][9] = D
    grid[2][10] = D
  }

  // Stairs down: bottom-right area (cols 9-10, row 10)
  if (hasStairsDown) {
    grid[10][9] = D
    grid[10][10] = D
  }

  return grid
}

// ── Floor 1: Debate & WSC Club ──────────────────────────────────────────────
const floor1Grid = makeFloorGrid(true, true, false)

const floor1Doors: DoorDef[] = [
  // Exit → overworld (south of Castle building: col 20, row 10)
  { col: 5, row: 11, targetRoom: 'overworld', spawnX: 20 * T + T / 2, spawnY: 10 * T + T / 2, spawnDirection: 'down' },
  { col: 6, row: 11, targetRoom: 'overworld', spawnX: 20 * T + T / 2, spawnY: 10 * T + T / 2, spawnDirection: 'down' },
  // Stairs up → floor 2 (land near stairs-down on floor 2)
  { col: 9,  row: 2, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 9 * T + T / 2, spawnDirection: 'up' },
  { col: 10, row: 2, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 9 * T + T / 2, spawnDirection: 'up' },
]

const floor1Zones: InteractionZoneDef[] = [
  { col: 3, row: 3, id: 'exp-debate-club', payload: 'debate-club' },
  { col: 4, row: 3, id: 'exp-debate-club', payload: 'debate-club' },
  { col: 7, row: 3, id: 'exp-debate-club-detail', payload: 'debate-club' },
  { col: 8, row: 3, id: 'exp-debate-club-detail', payload: 'debate-club' },
]

// ── Floor 2: Student Council ────────────────────────────────────────────────
const floor2Grid = makeFloorGrid(false, true, true)

const floor2Doors: DoorDef[] = [
  // Stairs down → floor 1 (land near stairs-up on floor 1)
  { col: 9,  row: 10, targetRoom: 'experienceTower_1', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
  { col: 10, row: 10, targetRoom: 'experienceTower_1', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
  // Stairs up → floor 3
  { col: 9,  row: 2, targetRoom: 'experienceTower_3', spawnX: 10 * T, spawnY: 9 * T + T / 2, spawnDirection: 'up' },
  { col: 10, row: 2, targetRoom: 'experienceTower_3', spawnX: 10 * T, spawnY: 9 * T + T / 2, spawnDirection: 'up' },
]

const floor2Zones: InteractionZoneDef[] = [
  { col: 3, row: 3, id: 'exp-student-council', payload: 'student-council' },
  { col: 4, row: 3, id: 'exp-student-council', payload: 'student-council' },
  { col: 7, row: 3, id: 'exp-student-council-detail', payload: 'student-council' },
  { col: 8, row: 3, id: 'exp-student-council-detail', payload: 'student-council' },
]

// ── Floor 3: OMAM MUN ──────────────────────────────────────────────────────
const floor3Grid = makeFloorGrid(false, false, true)

const floor3Doors: DoorDef[] = [
  // Stairs down → floor 2
  { col: 9,  row: 10, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
  { col: 10, row: 10, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
]

const floor3Zones: InteractionZoneDef[] = [
  { col: 3, row: 3, id: 'exp-omam-mun', payload: 'omam-mun' },
  { col: 4, row: 3, id: 'exp-omam-mun', payload: 'omam-mun' },
  { col: 7, row: 3, id: 'exp-omam-mun-detail', payload: 'omam-mun' },
  { col: 8, row: 3, id: 'exp-omam-mun-detail', payload: 'omam-mun' },
]

// ── Torch factory (shared by all floors) ────────────────────────────────────
function buildTowerAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)
  const positions = [
    { col: 2, row: 0 },
    { col: 9, row: 0 },
    { col: 1, row: 5 },
    { col: 10, row: 5 },
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

// ── Exported room data objects ──────────────────────────────────────────────
export const experienceTower1Room: RoomData = {
  id: 'experienceTower_1',
  cols: COLS, rows: ROWS, tileSize: T,
  collisionGrid: floor1Grid,
  defaultSpawn: { x: 6 * T, y: 10 * T + T / 2 },
  doors: floor1Doors,
  interactionZones: floor1Zones,
  isInterior: true,
  buildAmbients: buildTowerAmbients,
}

export const experienceTower2Room: RoomData = {
  id: 'experienceTower_2',
  cols: COLS, rows: ROWS, tileSize: T,
  collisionGrid: floor2Grid,
  defaultSpawn: { x: 6 * T, y: 6 * T + T / 2 },
  doors: floor2Doors,
  interactionZones: floor2Zones,
  isInterior: true,
  buildAmbients: buildTowerAmbients,
}

export const experienceTower3Room: RoomData = {
  id: 'experienceTower_3',
  cols: COLS, rows: ROWS, tileSize: T,
  collisionGrid: floor3Grid,
  defaultSpawn: { x: 6 * T, y: 6 * T + T / 2 },
  doors: floor3Doors,
  interactionZones: floor3Zones,
  isInterior: true,
  buildAmbients: buildTowerAmbients,
}
