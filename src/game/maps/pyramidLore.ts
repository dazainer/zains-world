/**
 * Pyramid Lore — Skills Forge interior for the Door Pyramid.
 * Armory/workshop feel with shelves along the walls, skills grouped by category.
 * Languages (north wall), Backend (west wall), Frontend (east wall), Tools (near door).
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'
import { EGYPT_VASE_FRAMES, placeInteriorDeco } from '../InteriorDeco'
import { OVERWORLD_RETURN_SPAWNS } from './overworld'
import { skills, type Skill } from '../../data/skills'

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
/* 4 */[W, W, W, W, F, F, F, F, F, W, W, W],  // side shelf backing (extended for backend/frontend)
/* 5 */[W, F, F, F, F, F, F, F, F, F, F, W],  // side interaction row
/* 6 */[W, F, F, F, F, F, F, F, F, F, F, W],  // walkway
/* 7 */[W, W, W, F, F, W, F, F, F, F, W, W],  // lower side shelf backing + tools shelf
/* 8 */[W, F, F, F, F, F, F, F, F, F, F, W],  // side interaction row / tools
/* 9 */[W, F, F, F, F, F, F, F, F, F, F, W],  // walkway
/*10 */[W, F, F, F, F, F, F, F, F, F, F, W],  // approach to door
/*11 */[W, W, W, W, W, D, D, W, W, W, W, W],  // bottom wall + exit door
]

// ── Skill placement by category ─────────────────────────────────────────────
// Languages: north wall (row 2, facing shelves on row 1)
// Backend: west wall shelves (rows 5 and 8 col 1)
// Frontend: east wall shelves (rows 5 and 8 col 10)
// Tools: near the door (row 8)

interface SkillSpot {
  col: number
  row: number
  id: string
  payload: string
  skill: Skill
}

const byCategory = {
  language: skills.filter(s => s.category === 'language'),
  backend:  skills.filter(s => s.category === 'backend'),
  frontend: skills.filter(s => s.category === 'frontend'),
  tool:     skills.filter(s => s.category === 'tool'),
}

const skillSpots: SkillSpot[] = []

// Languages along north wall — row 2, cols 1–10 (centered for 6 skills)
const langStart = Math.floor((10 - byCategory.language.length) / 2) + 1
byCategory.language.forEach((skill, i) => {
  skillSpots.push({
    col: langStart + i,
    row: 2,
    id: `skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    payload: skill.name,
    skill,
  })
})

// Backend along west side — col 1 row 5, then col 1 row 8, then spill to col 2
// 5 backend skills: Node.js, PostgreSQL, FastAPI, Express, REST APIs
const backendPositions = [
  { col: 1, row: 5 },   // west shelf upper
  { col: 2, row: 5 },
  { col: 3, row: 5 },
  { col: 1, row: 8 },   // west shelf lower
  { col: 2, row: 8 },
]
byCategory.backend.forEach((skill, i) => {
  const pos = backendPositions[i]
  if (!pos) return
  skillSpots.push({
    col: pos.col,
    row: pos.row,
    id: `skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    payload: skill.name,
    skill,
  })
})

// Frontend along east side — col 10 rows 5 and 8
// 2 frontend skills: React, HTML/CSS
const frontendPositions = [
  { col: 10, row: 5 },  // east shelf upper
  { col: 9,  row: 5 },
]
byCategory.frontend.forEach((skill, i) => {
  const pos = frontendPositions[i]
  if (!pos) return
  skillSpots.push({
    col: pos.col,
    row: pos.row,
    id: `skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    payload: skill.name,
    skill,
  })
})

// Tools near the door — row 8, centered
byCategory.tool.forEach((skill, i) => {
  skillSpots.push({
    col: 5 + i,
    row: 8,
    id: `skill-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    payload: skill.name,
    skill,
  })
})

// Stamp interaction zones into grid
for (const spot of skillSpots) {
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
  { label: 'LANGUAGES',  x: 6 * T,    y: 0.5 * T,  color: '#c8a850' },
  { label: 'BACKEND',    x: 0.5 * T,  y: 3.5 * T,  color: '#4ec9b0' },
  { label: 'FRONTEND',   x: 11.5 * T, y: 3.5 * T,  color: '#569cd6' },
  { label: 'TOOLS',      x: 5.5 * T,  y: 7.5 * T,  color: '#9a9a9a' },
]

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
const interactionZones: InteractionZoneDef[] = skillSpots.map(({ col, row, id, payload }) => ({
  col,
  row,
  id,
  payload,
}))

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
