/**
 * Contact Portal — 10×10 interior room.
 * Small room with a glowing portal area in the centre.
 * Walking onto the portal zone triggers the contact overlay.
 */
import type { TileType } from '../CollisionMap'
import type { RoomData, DoorDef, InteractionZoneDef } from '../RoomManager'
import { SpriteSheet } from '../SpriteSheet'
import { AmbientSprite } from '../AmbientSprite'

const COLS = 10
const ROWS = 10
const T = 32

const W: TileType = 0
const F: TileType = 1
const I: TileType = 2
const D: TileType = 3

// prettier-ignore
const collisionGrid: TileType[][] = [
// col: 0  1  2  3  4  5  6  7  8  9
/* 0 */[W, W, W, W, W, W, W, W, W, W],
/* 1 */[W, W, W, W, W, W, W, W, W, W],
/* 2 */[W, F, F, F, F, F, F, F, F, W],
/* 3 */[W, F, F, F, I, I, F, F, F, W],  // portal zone top
/* 4 */[W, F, F, F, I, I, F, F, F, W],  // portal zone mid
/* 5 */[W, F, F, F, I, I, F, F, F, W],  // portal zone bottom
/* 6 */[W, F, F, F, F, F, F, F, F, W],
/* 7 */[W, F, F, F, F, F, F, F, F, W],
/* 8 */[W, F, F, F, F, F, F, F, F, W],
/* 9 */[W, W, W, W, D, D, W, W, W, W],  // exit door cols 4-5
]

const doors: DoorDef[] = [
  // Exit → overworld (south of Hut building: col 13, row 22)
  { col: 4, row: 9, targetRoom: 'overworld', spawnX: 13 * T + T / 2, spawnY: 22 * T + T / 2, spawnDirection: 'down' },
  { col: 5, row: 9, targetRoom: 'overworld', spawnX: 13 * T + T / 2, spawnY: 22 * T + T / 2, spawnDirection: 'down' },
]

// The portal zone triggers contact overlay — all 6 tiles share the same id
const interactionZones: InteractionZoneDef[] = [
  { col: 4, row: 3, id: 'contact-portal', payload: 'contact' },
  { col: 5, row: 3, id: 'contact-portal', payload: 'contact' },
  { col: 4, row: 4, id: 'contact-portal', payload: 'contact' },
  { col: 5, row: 4, id: 'contact-portal', payload: 'contact' },
  { col: 4, row: 5, id: 'contact-portal', payload: 'contact' },
  { col: 5, row: 5, id: 'contact-portal', payload: 'contact' },
]

function buildAmbients(): AmbientSprite[] {
  const fireSheet = new SpriteSheet('/assets/tiles/dungeon/Fire.png')
  const frames = SpriteSheet.buildRow(0, 0, 16, 32, 6)
  const positions = [
    { col: 1, row: 0 },
    { col: 8, row: 0 },
    { col: 3, row: 0 },
    { col: 6, row: 0 },
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

export const contactPortalRoom: RoomData = {
  id: 'contactPortal',
  cols: COLS,
  rows: ROWS,
  tileSize: T,
  collisionGrid,
  defaultSpawn: { x: 5 * T, y: 8 * T + T / 2 },
  doors,
  interactionZones,
  isInterior: true,
  buildAmbients,
}
