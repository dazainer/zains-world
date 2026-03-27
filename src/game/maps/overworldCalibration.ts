import type { CollisionRect } from '../CollisionMap'
import type { RectDoorDef } from '../RoomManager'
import type { Frame } from '../SpriteSheet'

export type OverworldCalibrationSheetKey = 'desert' | 'pyramidDoor' | 'pyramid' | 'sphinx'

export interface OverworldCalibrationSpriteDef {
  id: string
  label: string
  sheetKey: OverworldCalibrationSheetKey
  frame: Frame
  worldX: number
  worldY: number
  renderW: number
  renderH: number
}

export interface OverworldStructureCalibrationDef extends OverworldCalibrationSpriteDef {
  collisionRect?: CollisionRect
  rectDoor?: RectDoorDef
}

const T = 32

function buildCollisionRect(
  worldX: number,
  worldY: number,
  renderW: number,
  renderH: number,
  collisionH: number,
  doorW?: number,
  doorId?: string,
): CollisionRect {
  const y = worldY + renderH - collisionH
  const rect: CollisionRect = {
    x: worldX,
    y,
    width: renderW,
    height: collisionH,
  }

  if (doorW && doorId) {
    rect.doorZone = {
      x: worldX + Math.floor((renderW - doorW) / 2),
      y,
      width: doorW,
      height: collisionH,
      doorId,
    }
  }

  return rect
}

const TOP_BASELINE_Y = 432
const LOWER_BASELINE_Y = 572

// Measured from the PNG alpha channel, not from the transparent canvas size.
// Door widths for copied calibrations are intentionally normalized around 24px
// so they comfortably fit the current player hitbox (18px wide, with 6px
// trimmed from the top) without becoming oversized.
export const overworldStructureCalibrations: OverworldStructureCalibrationDef[] = [
  {
    id: 'door-pyramid-solid',
    label: 'Door Pyramid solid',
    sheetKey: 'pyramidDoor',
    frame: { sx: 60, sy: 30, sw: 138, sh: 130 },
    worldX: 560,
    worldY: TOP_BASELINE_Y - 82,
    renderW: 104,
    renderH: 82,
    collisionRect: buildCollisionRect(560, TOP_BASELINE_Y - 82, 104, 82, 24, 24, 'doorPyramidSolidTest'),
    rectDoor: {
      doorId: 'doorPyramidSolidTest',
      targetRoom: 'pyramidLore',
      spawnX: 5 * T,
      spawnY: 6 * T + T / 2,
      spawnDirection: 'up',
    },
  },
  {
    id: 'decorative-pyramid-solid',
    label: 'Pyramid solid',
    sheetKey: 'pyramid',
    frame: { sx: 60, sy: 30, sw: 138, sh: 130 },
    worldX: 692,
    worldY: TOP_BASELINE_Y - 49,
    renderW: 69,
    renderH: 49,
    collisionRect: buildCollisionRect(692, TOP_BASELINE_Y - 49, 69, 49, 16),
  },
  {
    id: 'temple-solid',
    label: 'Temple solid',
    sheetKey: 'desert',
    frame: { sx: 363, sy: 295, sw: 74, sh: 54 },
    worldX: 796,
    worldY: TOP_BASELINE_Y - 72,
    renderW: 99,
    renderH: 72,
    collisionRect: buildCollisionRect(796, TOP_BASELINE_Y - 72, 99, 72, 24, 24, 'templeSolidTest'),
    rectDoor: {
      doorId: 'templeSolidTest',
      targetRoom: 'projectsLab',
      spawnX: 8 * T,
      spawnY: 14 * T + T / 2,
      spawnDirection: 'up',
    },
  },
  {
    id: 'hut-solid',
    label: 'Hut solid',
    sheetKey: 'desert',
    frame: { sx: 547, sy: 294, sw: 59, sh: 53 },
    worldX: 560,
    worldY: LOWER_BASELINE_Y - 53,
    renderW: 89,
    renderH: 53,
    collisionRect: buildCollisionRect(560, LOWER_BASELINE_Y - 53, 89, 53, 20, 24, 'hutSolidTest'),
    rectDoor: {
      doorId: 'hutSolidTest',
      targetRoom: 'skillsForge',
      spawnX: 7 * T,
      spawnY: 12 * T + T / 2,
      spawnDirection: 'up',
    },
  },
  {
    id: 'sphinx-solid',
    label: 'Sphinx solid',
    sheetKey: 'sphinx',
    frame: { sx: 33, sy: 19, sw: 62, sh: 108 },
    worldX: 688,
    worldY: LOWER_BASELINE_Y - 108,
    renderW: 62,
    renderH: 108,
    collisionRect: buildCollisionRect(688, LOWER_BASELINE_Y - 108, 62, 108, 28, 24, 'sphinxSolidTest'),
    rectDoor: {
      doorId: 'sphinxSolidTest',
      targetRoom: 'secretRoom',
      spawnX: 7 * T,
      spawnY: 10 * T + T / 2,
      spawnDirection: 'up',
    },
  },
  {
    id: 'tower-solid',
    label: 'Tower solid',
    sheetKey: 'desert',
    frame: { sx: 456, sy: 299, sw: 74, sh: 73 },
    worldX: 800,
    worldY: LOWER_BASELINE_Y - 97,
    renderW: 74,
    renderH: 97,
    collisionRect: buildCollisionRect(800, LOWER_BASELINE_Y - 97, 74, 97, 36, 24, 'towerSolidTest'),
    rectDoor: {
      doorId: 'towerSolidTest',
      targetRoom: 'experienceTower_1',
      spawnX: 6 * T,
      spawnY: 10 * T + T / 2,
      spawnDirection: 'up',
    },
  },
]

function placeLooseProp(
  id: string,
  label: string,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  slotX: number,
  baseY: number,
): OverworldCalibrationSpriteDef {
  return {
    id,
    label,
    sheetKey: 'desert',
    frame: { sx, sy, sw, sh },
    worldX: slotX + Math.floor((32 - sw) / 2),
    worldY: baseY - sh,
    renderW: sw,
    renderH: sh,
  }
}

function placeLoosePropAt(
  id: string,
  label: string,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  worldX: number,
  worldY: number,
): OverworldCalibrationSpriteDef {
  return {
    id,
    label,
    sheetKey: 'desert',
    frame: { sx, sy, sw, sh },
    worldX,
    worldY,
    renderW: sw,
    renderH: sh,
  }
}

const PROP_SLOT_X = [536, 592, 648, 704, 760]
const PROP_BASELINES = [624, 676, 724]
const PROP_ROW0_TILE_TOP = PROP_BASELINES[0] - 32

export const overworldPropCalibrations: OverworldCalibrationSpriteDef[] = [
  // Tile r9 c0 is not a single prop. It contains 4 disconnected bush/fern pieces.
  placeLoosePropAt('fern-pack-top-left', '', 2, 296, 11, 6, PROP_SLOT_X[0] + 2, PROP_ROW0_TILE_TOP + 8),
  placeLoosePropAt('fern-pack-top-right', '', 17, 290, 13, 12, PROP_SLOT_X[0] + 17, PROP_ROW0_TILE_TOP + 2),
  placeLoosePropAt('fern-pack-bottom-left', 'Fern pack x4', 1, 304, 15, 15, PROP_SLOT_X[0] + 1, PROP_ROW0_TILE_TOP + 16),
  placeLoosePropAt('fern-pack-bottom-right', '', 17, 304, 14, 14, PROP_SLOT_X[0] + 17, PROP_ROW0_TILE_TOP + 16),
  // Tile r9 c1 is also a split filler tile with 2 disconnected bone pieces.
  placeLoosePropAt('bone-pack-top', '', 40, 289, 19, 13, PROP_SLOT_X[1] + 8, PROP_ROW0_TILE_TOP + 1),
  placeLoosePropAt('bone-pack-bottom', 'Bone pack x2', 33, 305, 26, 14, PROP_SLOT_X[1] + 1, PROP_ROW0_TILE_TOP + 17),
  placeLooseProp('hay-patch', 'Hay patch', 64, 292, 32, 22, PROP_SLOT_X[2], PROP_BASELINES[0]),
  placeLooseProp('broken-wheel', 'Broken wheel', 101, 290, 24, 26, PROP_SLOT_X[3], PROP_BASELINES[0]),
  placeLooseProp('barrel', 'Barrel', 134, 295, 20, 17, PROP_SLOT_X[4], PROP_BASELINES[0]),

  // Full tent bbox measured across a 2x2 source region (tiles r9-10 c5-6).
  placeLooseProp('tent', 'Tent', 170, 296, 46, 37, PROP_SLOT_X[0], PROP_BASELINES[1]),
  placeLooseProp('tall-cactus-a', 'Tall cactus A', 6, 322, 20, 28, PROP_SLOT_X[1], PROP_BASELINES[1]),
  placeLooseProp('prickly-pear-a', 'Prickly pear A', 38, 324, 22, 26, PROP_SLOT_X[2], PROP_BASELINES[1]),
  placeLooseProp('column-cactus', 'Column cactus', 73, 321, 13, 29, PROP_SLOT_X[3], PROP_BASELINES[1]),
  placeLooseProp('skull', 'Skull', 97, 325, 28, 21, PROP_SLOT_X[4], PROP_BASELINES[1]),

  placeLooseProp('wooden-sign', 'Wooden sign', 133, 324, 22, 26, PROP_SLOT_X[0], PROP_BASELINES[2]),
  placeLooseProp('flower-cactus', 'Flower cactus', 4, 357, 23, 23, PROP_SLOT_X[1], PROP_BASELINES[2]),
  placeLooseProp('prickly-pear-b', 'Prickly pear B', 34, 358, 26, 24, PROP_SLOT_X[2], PROP_BASELINES[2]),
  placeLooseProp('tall-cactus-b', 'Tall cactus B', 70, 353, 21, 29, PROP_SLOT_X[3], PROP_BASELINES[2]),
  placeLooseProp('horned-skull', 'Horned skull', 99, 352, 25, 32, PROP_SLOT_X[4], PROP_BASELINES[2]),
]

export const overworldCalibrationCollisionRects: CollisionRect[] =
  overworldStructureCalibrations.flatMap((entry) => (entry.collisionRect ? [entry.collisionRect] : []))

export const overworldCalibrationRectDoors: RectDoorDef[] =
  overworldStructureCalibrations.flatMap((entry) => (entry.rectDoor ? [entry.rectDoor] : []))
