/**
 * Experience Tower — 3 gallery floors, each dedicated to one experience.
 * Floor 1: Debate & WSC Club (3 paintings)
 * Floor 2: Teachers' Day Speech (3 paintings)
 * Floor 3: OMAM MUN (3 paintings)
 *
 * Each floor has framed photo paintings on the north wall with interaction
 * zones in front. Stairs connect floors; exit door on floor 1.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'
import { EGYPT_VASE_FRAMES, placeInteriorDeco } from '../InteriorDeco'
import { OVERWORLD_RETURN_SPAWNS } from './overworld'

const COLS = 12
const ROWS = 10
const T = 32

const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// ── Gallery painting metadata (consumed by GameEngine) ──────────────────────

export interface GalleryPainting {
  photo: string        // path to optimized web photo in public/assets/photos/web/
  experienceId: string // payload for exp-* interaction handler
  col: number          // left column of 2-tile-wide painting (rendered on rows 0-1)
}

export interface FloorGalleryData {
  title: string
  titleColor: string
  paintings: GalleryPainting[]
}

export interface PaintingInteractionOverlay {
  photo: string
  experienceId: string
}

export const towerGalleryData: Record<string, FloorGalleryData> = {
  experienceTower_1: {
    title: 'Debate & WSC Club',
    titleColor: '#7ec8e3',
    paintings: [
      { photo: '/assets/photos/web/debate1.jpg', experienceId: 'debate-club', col: 1 },
      { photo: '/assets/photos/web/debate2.jpg', experienceId: 'debate-club', col: 4 },
      { photo: '/assets/photos/web/debate3.jpg', experienceId: 'debate-club', col: 7 },
    ],
  },
  experienceTower_2: {
    title: 'School President',
    titleColor: '#e8c170',
    paintings: [
      { photo: '/assets/photos/web/speech1.jpg', experienceId: 'school-president', col: 1 },
      { photo: '/assets/photos/web/speech2.jpg', experienceId: 'school-president', col: 4 },
      { photo: '/assets/photos/web/speech3.jpg', experienceId: 'school-president', col: 7 },
    ],
  },
  experienceTower_3: {
    title: 'OMAM Model United Nations',
    titleColor: '#c9a0dc',
    paintings: [
      { photo: '/assets/photos/web/omam1.jpg', experienceId: 'omam-mun', col: 1 },
      { photo: '/assets/photos/web/omam3.jpg', experienceId: 'omam-mun', col: 4 },
      { photo: '/assets/photos/web/omam4.jpg', experienceId: 'omam-mun', col: 7 },
    ],
  },
}

export const towerPaintingOverlayByInteractionId: Record<string, PaintingInteractionOverlay> = {
  'exp-painting-1a': { photo: '/assets/photos/web/debate1.jpg', experienceId: 'debate-club' },
  'exp-painting-1b': { photo: '/assets/photos/web/debate2.jpg', experienceId: 'debate-club' },
  'exp-painting-1c': { photo: '/assets/photos/web/debate3.jpg', experienceId: 'debate-club' },
  'exp-painting-2a': { photo: '/assets/photos/web/speech1.jpg', experienceId: 'school-president' },
  'exp-painting-2b': { photo: '/assets/photos/web/speech2.jpg', experienceId: 'school-president' },
  'exp-painting-2c': { photo: '/assets/photos/web/speech3.jpg', experienceId: 'school-president' },
  'exp-painting-3a': { photo: '/assets/photos/web/omam1.jpg', experienceId: 'omam-mun' },
  'exp-painting-3b': { photo: '/assets/photos/web/omam3.jpg', experienceId: 'omam-mun' },
  'exp-painting-3c': { photo: '/assets/photos/web/omam4.jpg', experienceId: 'omam-mun' },
}

// ── Grid builder ────────────────────────────────────────────────────────────

function makeGalleryGrid(hasExitDoor: boolean, hasStairsUp: boolean, hasStairsDown: boolean): TileType[][] {
  // prettier-ignore
  const grid: TileType[][] = [
  // col: 0  1  2  3  4  5  6  7  8  9 10 11
  /* 0 */[W, W, W, W, W, W, W, W, W, W, W, W],
  /* 1 */[W, W, W, W, W, W, W, W, W, W, W, W],
  /* 2 */[W, I, I, F, I, I, F, I, I, F, F, W],
  /* 3 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 4 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 5 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 6 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 7 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 8 */[W, F, F, F, F, F, F, F, F, F, F, W],
  /* 9 */[W, W, W, W, W, W, W, W, W, W, W, W],
  ]

  if (hasExitDoor) {
    grid[9][5] = D
    grid[9][6] = D
  }

  if (hasStairsUp) {
    grid[2][9] = D
    grid[2][10] = D
  }

  if (hasStairsDown) {
    grid[8][9] = D
    grid[8][10] = D
  }

  return grid
}

const towerReturn = OVERWORLD_RETURN_SPAWNS.experienceTower

// ── Floor 1: Debate & WSC Club ──────────────────────────────────────────────

const floor1Grid = makeGalleryGrid(true, true, false)

const floor1Doors: DoorDef[] = [
  { col: 5, row: 9, targetRoom: 'overworld', spawnX: towerReturn.x, spawnY: towerReturn.y, spawnDirection: towerReturn.direction },
  { col: 6, row: 9, targetRoom: 'overworld', spawnX: towerReturn.x, spawnY: towerReturn.y, spawnDirection: towerReturn.direction },
  { col: 9,  row: 2, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 7 * T + T / 2, spawnDirection: 'up' },
  { col: 10, row: 2, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 7 * T + T / 2, spawnDirection: 'up' },
]

const floor1Zones: InteractionZoneDef[] = [
  { col: 1, row: 2, id: 'exp-painting-1a', payload: 'debate-club' },
  { col: 2, row: 2, id: 'exp-painting-1a', payload: 'debate-club' },
  { col: 4, row: 2, id: 'exp-painting-1b', payload: 'debate-club' },
  { col: 5, row: 2, id: 'exp-painting-1b', payload: 'debate-club' },
  { col: 7, row: 2, id: 'exp-painting-1c', payload: 'debate-club' },
  { col: 8, row: 2, id: 'exp-painting-1c', payload: 'debate-club' },
]

// ── Floor 2: Teachers' Day Speech ────────────────────────────────────────────

const floor2Grid = makeGalleryGrid(false, true, true)

const floor2Doors: DoorDef[] = [
  { col: 9,  row: 8, targetRoom: 'experienceTower_1', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
  { col: 10, row: 8, targetRoom: 'experienceTower_1', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
  { col: 9,  row: 2, targetRoom: 'experienceTower_3', spawnX: 10 * T, spawnY: 7 * T + T / 2, spawnDirection: 'up' },
  { col: 10, row: 2, targetRoom: 'experienceTower_3', spawnX: 10 * T, spawnY: 7 * T + T / 2, spawnDirection: 'up' },
]

const floor2Zones: InteractionZoneDef[] = [
  { col: 1, row: 2, id: 'exp-painting-2a', payload: 'school-president' },
  { col: 2, row: 2, id: 'exp-painting-2a', payload: 'school-president' },
  { col: 4, row: 2, id: 'exp-painting-2b', payload: 'school-president' },
  { col: 5, row: 2, id: 'exp-painting-2b', payload: 'school-president' },
  { col: 7, row: 2, id: 'exp-painting-2c', payload: 'school-president' },
  { col: 8, row: 2, id: 'exp-painting-2c', payload: 'school-president' },
]

// ── Floor 3: OMAM MUN ──────────────────────────────────────────────────────

const floor3Grid = makeGalleryGrid(false, false, true)

const floor3Doors: DoorDef[] = [
  { col: 9,  row: 8, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
  { col: 10, row: 8, targetRoom: 'experienceTower_2', spawnX: 10 * T, spawnY: 3 * T + T / 2, spawnDirection: 'down' },
]

const floor3Zones: InteractionZoneDef[] = [
  { col: 1, row: 2, id: 'exp-painting-3a', payload: 'omam-mun' },
  { col: 2, row: 2, id: 'exp-painting-3a', payload: 'omam-mun' },
  { col: 4, row: 2, id: 'exp-painting-3b', payload: 'omam-mun' },
  { col: 5, row: 2, id: 'exp-painting-3b', payload: 'omam-mun' },
  { col: 7, row: 2, id: 'exp-painting-3c', payload: 'omam-mun' },
  { col: 8, row: 2, id: 'exp-painting-3c', payload: 'omam-mun' },
]

// ── Torch factory (gallery lighting — more torches for museum feel) ──────────

function buildGalleryAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)
  const positions = [
    { col: 0,  row: 1 },   // left of painting 1
    { col: 3,  row: 1 },   // between paintings 1-2
    { col: 6,  row: 1 },   // between paintings 2-3
    { col: 9,  row: 1 },   // right of painting 3
    { col: 1,  row: 6 },   // left wall mid
    { col: 10, row: 6 },   // right wall mid
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

const gallerySpriteDecos = [
  placeInteriorDeco('gallery-bowl-left', 'vase', EGYPT_VASE_FRAMES.bowl, 1, 3, 18, 14, 7, 10),
  placeInteriorDeco('gallery-bowl-right', 'vase', EGYPT_VASE_FRAMES.bowl, 10, 3, 18, 14, 7, 10),
  placeInteriorDeco('gallery-urn-left', 'vase', EGYPT_VASE_FRAMES.urn, 1, 8, 20, 20, 6, 8),
  placeInteriorDeco('gallery-urn-right', 'vase', EGYPT_VASE_FRAMES.urn, 10, 8, 20, 20, 6, 8),
  placeInteriorDeco('gallery-jar-left', 'vase', EGYPT_VASE_FRAMES.jar, 1, 6, 18, 20, 7, 8),
  placeInteriorDeco('gallery-jar-right', 'vase', EGYPT_VASE_FRAMES.jar, 10, 6, 18, 20, 7, 8),
]

// ── Exported room data objects ──────────────────────────────────────────────

export const experienceTower1Room: RoomData = {
  id: 'experienceTower_1',
  cols: COLS, rows: ROWS, tileSize: T,
  collisionGrid: floor1Grid,
  defaultSpawn: { x: 6 * T, y: 8 * T + T / 2 },
  doors: floor1Doors,
  interactionZones: floor1Zones,
  isInterior: true,
  buildAmbients: buildGalleryAmbients,
  spriteDecos: gallerySpriteDecos,
}

export const experienceTower2Room: RoomData = {
  id: 'experienceTower_2',
  cols: COLS, rows: ROWS, tileSize: T,
  collisionGrid: floor2Grid,
  defaultSpawn: { x: 6 * T, y: 6 * T + T / 2 },
  doors: floor2Doors,
  interactionZones: floor2Zones,
  isInterior: true,
  buildAmbients: buildGalleryAmbients,
  spriteDecos: gallerySpriteDecos,
}

export const experienceTower3Room: RoomData = {
  id: 'experienceTower_3',
  cols: COLS, rows: ROWS, tileSize: T,
  collisionGrid: floor3Grid,
  defaultSpawn: { x: 6 * T, y: 6 * T + T / 2 },
  doors: floor3Doors,
  interactionZones: floor3Zones,
  isInterior: true,
  buildAmbients: buildGalleryAmbients,
  spriteDecos: gallerySpriteDecos,
}
