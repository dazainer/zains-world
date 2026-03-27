/**
 * Contact Portal — mystical portal room inside the Contact Hut.
 * Central glowing portal with diamond-pattern lighter floor tiles.
 * 3 wall stations: Mail Scroll (left), Code Archive (back), Connect To Me (right).
 * Atmospheric torches surrounding the portal.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'
import { EGYPT_VASE_FRAMES, placeInteriorDeco } from '../InteriorDeco'
import { OVERWORLD_RETURN_SPAWNS } from './overworld'

const COLS = 9
const ROWS = 9
const T = 32

const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// ── Collision grid ──────────────────────────────────────────────────────────
// prettier-ignore
const collisionGrid: TileType[][] = [
// col: 0  1  2  3  4  5  6  7  8  9 10
/* 0 */[W, W, W, W, W, W, W, W, W],
/* 1 */[W, W, W, W, W, W, W, W, W],
/* 2 */[W, W, F, F, F, F, F, W, W],
/* 3 */[W, F, F, F, I, F, F, F, W],
/* 4 */[W, I, F, I, I, I, F, I, W],
/* 5 */[W, F, F, F, I, F, F, F, W],
/* 6 */[W, F, F, F, F, F, F, F, W],
/* 7 */[W, F, F, F, F, F, F, F, W],
/* 8 */[W, W, W, W, D, W, W, W, W],
]

// Wall station interaction tiles
collisionGrid[2][4] = I   // code archive (back wall center)
collisionGrid[5][1] = I   // mail scroll (left wall)
collisionGrid[5][7] = I   // connect to me (right wall)

// ── Doors ───────────────────────────────────────────────────────────────────
const portalReturn = OVERWORLD_RETURN_SPAWNS.contactPortal

const doors: DoorDef[] = [
  { col: 4, row: 8, targetRoom: 'overworld', spawnX: portalReturn.x, spawnY: portalReturn.y, spawnDirection: portalReturn.direction },
]

// ── Interaction zones ───────────────────────────────────────────────────────
const interactionZones: InteractionZoneDef[] = [
  // Central portal (diamond shape — 7 tiles)
  { col: 4, row: 3, id: 'contact-portal', payload: 'contact' },
  { col: 3, row: 4, id: 'contact-portal', payload: 'contact' },
  { col: 4, row: 4, id: 'contact-portal', payload: 'contact' },
  { col: 5, row: 4, id: 'contact-portal', payload: 'contact' },
  { col: 4, row: 5, id: 'contact-portal', payload: 'contact' },
  // Wall stations
  { col: 1, row: 4, id: 'mail-scroll',     payload: 'email' },
  { col: 7, row: 4, id: 'connection-tome', payload: 'linkedin' },
  { col: 4, row: 2, id: 'code-archive',    payload: 'github' },
]

// ── Exported decoration metadata ────────────────────────────────────────────

/** Portal tile positions for special rendering (diamond pattern) */
export const portalTiles: Array<{ col: number; row: number }> = [
  { col: 4, row: 3 },
  { col: 3, row: 4 }, { col: 4, row: 4 }, { col: 5, row: 4 },
  { col: 4, row: 5 },
]

/** Wall station metadata for rendering props and labels */
export interface ContactStation {
  id: string
  label: string
  col: number
  row: number
  /** Shelf backing wall tile */
  shelfCol: number
  shelfRow: number
  color: string
}

export const contactStations: ContactStation[] = [
  { id: 'mail-scroll',     label: 'MAIL SCROLL',     col: 1, row: 4, shelfCol: 1, shelfRow: 3, color: '#e0a050' },
  { id: 'connection-tome', label: 'CONNECT TO ME',   col: 7, row: 4, shelfCol: 7, shelfRow: 3, color: '#5090d0' },
  { id: 'code-archive',    label: 'CODE ARCHIVE',    col: 4, row: 2, shelfCol: 4, shelfRow: 1, color: '#a0d0a0' },
]

const spriteDecos = [
  placeInteriorDeco('portal-bowl-left', 'vase', EGYPT_VASE_FRAMES.bowl, 2, 1, 18, 14, 7, 10),
  placeInteriorDeco('portal-bowl-right', 'vase', EGYPT_VASE_FRAMES.bowl, 6, 1, 18, 14, 7, 10),
  placeInteriorDeco('portal-urn-left', 'vase', EGYPT_VASE_FRAMES.urn, 2, 6, 20, 20, 6, 8),
  placeInteriorDeco('portal-urn-right', 'vase', EGYPT_VASE_FRAMES.jar, 6, 6, 18, 20, 7, 8),
]

// ── Ambient sprites (torches surrounding the portal) ────────────────────────
function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)

  const torchPositions = [
    // Portal-surrounding torches (diamond corners)
    { col: 2, row: 2 },   // top-left of portal
    { col: 6, row: 2, offsetX: -16 },   // top-right of portal
    { col: 2, row: 6 },   // bottom-left of portal
    { col: 6, row: 6, offsetX: -16 },   // bottom-right of portal
    // Wall torches near stations
    { col: 1, row: 1 },   // left of code archive
    { col: 7, row: 1, offsetX: -16 },   // right of code archive
    // Near door
    { col: 2, row: 7 },   // bottom-left
    { col: 6, row: 7, offsetX: -16 },   // bottom-right
  ]

  return torchPositions.map((pos, i) => {
    const torch = new AmbientSprite({
      type: 'torch',
      x: pos.col * T + 8 + (pos.offsetX ?? 0),
      y: pos.row * T - 16,
      renderW: 32,
      renderH: 64,
    })
    torch.init(fireSheet, frames, 8, i)
    return torch
  })
}

// ── Room data ───────────────────────────────────────────────────────────────
export const contactPortalRoom: RoomData = {
  id: 'contactPortal',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 4.5 * T, y: 7 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
  spriteDecos,
}
