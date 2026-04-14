/**
 * Pyramid Lore — condensed skills + builder workshop exhibit inside the Door Pyramid.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'
import { EGYPT_VASE_FRAMES, placeInteriorDeco } from '../InteriorDeco'
import { OVERWORLD_RETURN_SPAWNS } from './overworld'
import { skills, type Skill } from '../../data/skills'
import { workshopStations } from '../../data/buildersWorkshop'

const COLS = 12
const ROWS = 12
const T = 32

const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// ── Collision grid ──────────────────────────────────────────────────────────
// S = shelf (wall tile, rendered as a shelf surface)
// Layout: border walls, shelf rows along walls, open walkway in the middle
// prettier-ignore
const collisionGrid: TileType[][] = [
// col: 0  1  2  3  4  5  6  7  8  9 10 11
/* 0 */[W, W, W, W, W, W, W, W, W, W, W, W],
/* 1 */[W, W, W, W, W, W, W, W, W, W, W, W],  // top shelf backing (languages)
/* 2 */[W, F, F, F, F, F, F, F, F, F, F, W],  // language interaction row
/* 3 */[W, F, F, F, F, F, F, F, F, F, F, W],  // walkway
/* 4 */[W, W, W, F, F, F, F, F, F, W, W, W],  // lower skill shelf / open aisle
/* 5 */[W, F, F, F, F, F, F, F, F, F, F, W],  // side interaction row
/* 6 */[W, F, F, F, F, F, F, F, F, F, F, W],  // walkway
/* 7 */[W, W, F, F, F, F, F, F, F, F, W, W],  // workshop plaque row
/* 8 */[W, F, F, F, F, F, F, F, F, F, F, W],  // side interaction row / tools
/* 9 */[W, F, F, F, F, F, F, F, F, F, F, W],  // walkway
/*10 */[W, F, F, F, F, F, F, F, F, F, F, W],  // approach to door
/*11 */[W, W, W, W, W, D, D, W, W, W, W, W],  // bottom wall + exit door
]

interface SkillSpot {
  col: number
  row: number
  id: string
  payload: string
  skill: Skill
}

const skillByName = new Map(skills.map((skill) => [skill.name, skill]))

const skillLayout = [
  { name: 'Python',     col: 5, row: 2 },
  { name: 'C',          col: 6, row: 2 },
  { name: 'TypeScript', col: 2, row: 3 },
  { name: 'JavaScript', col: 3, row: 3 },
  { name: 'SQL',        col: 4, row: 3 },
  { name: 'Node.js',    col: 5, row: 3 },
  { name: 'PostgreSQL', col: 6, row: 3 },
  { name: 'FastAPI',    col: 7, row: 3 },
  { name: 'React',      col: 8, row: 3 },
  { name: 'Git',        col: 9, row: 3 },
  { name: 'Express',    col: 4, row: 4 },
  { name: 'REST APIs',  col: 5, row: 4 },
  { name: 'HTML/CSS',   col: 6, row: 4 },
  { name: 'Racket',     col: 7, row: 4 },
] as const

const skillSpots: SkillSpot[] = skillLayout.flatMap(({ name, col, row }) => {
  const skill = skillByName.get(name)
  if (!skill) return []
  return [{
    col,
    row,
    id: `skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    payload: skill.name,
    skill,
  }]
})

interface WorkshopSpot {
  col: number
  row: number
  id: string
  payload: string
  title: string
  label: string
  placement: string
}

const workshopSpotById = {
  'workshop-assets':  { col: 4, row: 7 },
  'workshop-numbers': { col: 5, row: 7 },
  'workshop-engine':  { col: 6, row: 7 },
  'workshop-stack':   { col: 7, row: 7 },
} as const

const workshopSpots: WorkshopSpot[] = workshopStations
  .filter((station) => station.id in workshopSpotById)
  .map((station) => {
  const pos = workshopSpotById[station.id as keyof typeof workshopSpotById]
  return {
    col: pos.col,
    row: pos.row,
    id: station.id,
    payload: station.id,
    title: station.title,
    label: station.label,
    placement: station.placement,
  }
})

// Stamp interaction zones into grid
for (const spot of skillSpots) {
  collisionGrid[spot.row][spot.col] = I
}
for (const spot of workshopSpots) {
  collisionGrid[spot.row][spot.col] = I
}

// ── Exported decoration metadata (consumed by GameEngine.renderInterior) ────

export interface SkillPedestalDeco {
  col: number
  row: number
  name: string
  tier: 'legendary' | 'rare' | 'common'
  category: string
  /** The shelf-backing wall tile (row above for north shelf, col-adjacent for side shelves) */
  shelfRow: number
  shelfCol: number
}

export const skillPedestals: SkillPedestalDeco[] = skillSpots.map(spot => ({
  col: spot.col,
  row: spot.row,
  name: spot.skill.name,
  tier: spot.skill.tier,
  category: spot.skill.category,
  // Shelf backing is the wall row above the interaction row
  shelfRow: spot.row === 2 ? 1 : spot.row - 1,
  shelfCol: spot.col,
}))

/** Category label positions for rendering section headers on the walls */
export interface CategoryLabel {
  label: string
  x: number    // pixel x (center of label)
  y: number    // pixel y
  color: string
}

export const categoryLabels: CategoryLabel[] = [
  { label: "BUILDER'S WORKSHOP", x: 6 * T, y: 6.5 * T, color: '#f0d494' },
]

export interface WorkshopPlaqueDeco {
  col: number
  row: number
  title: string
  label: string
  placement: string
}

export const workshopPlaques: WorkshopPlaqueDeco[] = workshopSpots.map((spot) => ({
  col: spot.col,
  row: spot.row,
  title: spot.title,
  label: spot.label,
  placement: spot.placement,
}))

const spriteDecos = [
  placeInteriorDeco('top-left-bowl', 'vase', EGYPT_VASE_FRAMES.bowl, 1, 1, 18, 14, 7, 10),
  placeInteriorDeco('top-right-bowl', 'vase', EGYPT_VASE_FRAMES.bowl, 10, 1, 18, 14, 7, 10),
  placeInteriorDeco('west-mid-jar', 'vase', EGYPT_VASE_FRAMES.jar, 1, 7, 18, 20, 7, 8),
  placeInteriorDeco('east-mid-jar', 'vase', EGYPT_VASE_FRAMES.jar, 10, 7, 18, 20, 7, 8),
  placeInteriorDeco('bottom-left-urn', 'vase', EGYPT_VASE_FRAMES.urn, 1, 10, 20, 20, 6, 8),
  placeInteriorDeco('bottom-right-urn', 'vase', EGYPT_VASE_FRAMES.urn, 10, 10, 20, 20, 6, 8),
]

// ── Doors ───────────────────────────────────────────────────────────────────
const pyramidReturn = OVERWORLD_RETURN_SPAWNS.pyramidLore

const doors: DoorDef[] = [
  { col: 5, row: ROWS - 1, targetRoom: 'overworld', spawnX: pyramidReturn.x, spawnY: pyramidReturn.y, spawnDirection: pyramidReturn.direction },
  { col: 6, row: ROWS - 1, targetRoom: 'overworld', spawnX: pyramidReturn.x, spawnY: pyramidReturn.y, spawnDirection: pyramidReturn.direction },
]

// ── Interaction zones ───────────────────────────────────────────────────────
const interactionZones: InteractionZoneDef[] = [
  ...skillSpots.map(({ col, row, id, payload }) => ({
    col,
    row,
    id,
    payload,
  })),
  ...workshopSpots.map(({ col, row, id, payload }) => ({
    col,
    row,
    id,
    payload,
  })),
]

// ── Ambient sprites (torches on walls) ──────────────────────────────────────
function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)

  const torchPositions = [
    { col: 1,  row: 1 },   // top-left
    { col: 10, row: 1 },   // top-right
    { col: 1,  row: 7 },   // mid-left
    { col: 10, row: 7 },   // mid-right
    { col: 3,  row: 10 },  // bottom-left near door
    { col: 8,  row: 10 },  // bottom-right near door
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
export const pyramidLoreRoom: RoomData = {
  id: 'pyramidLore',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 6 * T, y: 10 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
  spriteDecos,
}
