import type { CollisionRect, TileType } from '../CollisionMap'
import { DUNGEON_PROP_FRAMES } from '../InteriorDeco'
import type { Direction } from '../Player'
import type { RectDoorDef, RoomData, DoorDef, InteractionRectDef } from '../RoomManager'
import type { Frame } from '../SpriteSheet'
import type { TileMap } from '../TileRenderer'

export const COLS = 32
export const ROWS = 24
export const TILE_SIZE = 32

export const MAP_PIXEL_W = COLS * TILE_SIZE
export const MAP_PIXEL_H = ROWS * TILE_SIZE

export const SPAWN = {
  x: 20 * TILE_SIZE + TILE_SIZE / 2,
  y: 18 * TILE_SIZE + TILE_SIZE / 2,
}

export type OverworldSheetKey = 'desert' | 'pyramidDoor' | 'pyramid' | 'sphinx' | 'pillar' | 'dungeonProps'

export interface OverworldStaticSpriteDef {
  id: string
  sheetKey: OverworldSheetKey
  frame: Frame
  worldX: number
  worldY: number
  renderW: number
  renderH: number
  label?: string
  occlusionStartY?: number
}

export interface OverworldAmbientDef {
  id: string
  type: 'camel' | 'snake'
  facing: 'left' | 'right'
  animation?: 'idle' | 'eating'
  worldX: number
  worldY: number
  renderW?: number
  renderH?: number
  fps?: number
}

export interface OverworldNpcDef {
  id: string
  sheetKey: 'mummy' | 'chest'
  worldX: number
  worldY: number
  sourceX: number
  sourceY: number
  sourceW: number
  sourceH: number
  frameStrideX: number
  frameCount: number
  renderW: number
  renderH: number
  fps?: number
  label?: string
}

interface AutoTileSet {
  topLeft: number
  top: number
  topRight: number
  left: number
  center: number
  right: number
  bottomLeft: number
  bottom: number
  bottomRight: number
}

interface ReturnSpawn {
  x: number
  y: number
  direction: Direction
}

const W: TileType = 0
const F: TileType = 1

const SAND = 24

const GRASS_TILES: AutoTileSet = {
  topLeft: 1,
  top: 2,
  topRight: 3,
  left: 20,
  center: 21,
  right: 22,
  bottomLeft: 39,
  bottom: 40,
  bottomRight: 41,
}

const PATH_TILES: AutoTileSet = {
  topLeft: 58,
  top: 59,
  topRight: 60,
  left: 77,
  center: 78,
  right: 79,
  bottomLeft: 96,
  bottom: 97,
  bottomRight: 98,
}

const WATER_TILES: AutoTileSet = {
  topLeft: 115,
  top: 116,
  topRight: 117,
  left: 134,
  center: 135,
  right: 136,
  bottomLeft: 153,
  bottom: 154,
  bottomRight: 155,
}

const DESERT_FRAMES = {
  temple: { sx: 363, sy: 295, sw: 74, sh: 54 },
  tower: { sx: 456, sy: 299, sw: 74, sh: 73 },
  hut: { sx: 547, sy: 294, sw: 59, sh: 53 },
  tent: { sx: 170, sy: 296, sw: 46, sh: 37 },
  palmA: { sx: 237, sy: 305, sw: 39, sh: 60 },
  palmB: { sx: 302, sy: 308, sw: 38, sh: 58 },
  brokenWheel: { sx: 101, sy: 290, sw: 24, sh: 26 },
  barrel: { sx: 134, sy: 295, sw: 20, sh: 17 },
  skull: { sx: 97, sy: 325, sw: 28, sh: 21 },
  hornedSkull: { sx: 99, sy: 352, sw: 25, sh: 32 },
  sign: { sx: 133, sy: 324, sw: 22, sh: 26 },
  fernA: { sx: 1, sy: 304, sw: 15, sh: 15 },
  fernB: { sx: 17, sy: 304, sw: 14, sh: 14 },
  tallCactusA: { sx: 6, sy: 322, sw: 20, sh: 28 },
  pricklyPearA: { sx: 38, sy: 324, sw: 22, sh: 26 },
  columnCactus: { sx: 73, sy: 321, sw: 13, sh: 29 },
  flowerCactus: { sx: 4, sy: 357, sw: 23, sh: 23 },
  pricklyPearB: { sx: 34, sy: 358, sw: 26, sh: 24 },
  tallCactusB: { sx: 70, sy: 353, sw: 21, sh: 29 },
  hayPatch: { sx: 64, sy: 292, sw: 32, sh: 22 },
}

const PYRAMID_FRAME = { sx: 60, sy: 30, sw: 138, sh: 130 }
const SPHINX_FRAME = { sx: 33, sy: 19, sw: 62, sh: 108 }
const PILLAR_FRAME = { sx: 46, sy: 29, sw: 35, sh: 83 }

function makeTileLayer(fill: number): TileMap {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(fill))
}

function makeMask(): boolean[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false))
}

function paintRect(mask: boolean[][], col1: number, row1: number, col2: number, row2: number) {
  for (let row = row1; row <= row2; row++) {
    for (let col = col1; col <= col2; col++) {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue
      mask[row][col] = true
    }
  }
}

function paintAutotile(layer: TileMap, mask: boolean[][], tiles: AutoTileSet) {
  const has = (col: number, row: number) =>
    row >= 0 && row < ROWS && col >= 0 && col < COLS && mask[row][col]

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!mask[row][col]) continue

      const north = has(col, row - 1)
      const south = has(col, row + 1)
      const west = has(col - 1, row)
      const east = has(col + 1, row)

      let tile = tiles.center

      if (!north && !west) tile = tiles.topLeft
      else if (!north && !east) tile = tiles.topRight
      else if (!south && !west) tile = tiles.bottomLeft
      else if (!south && !east) tile = tiles.bottomRight
      else if (!north) tile = tiles.top
      else if (!south) tile = tiles.bottom
      else if (!west) tile = tiles.left
      else if (!east) tile = tiles.right

      layer[row][col] = tile
    }
  }
}

function desertTileIndex(row0: number, col0: number): number {
  return row0 * 19 + col0 + 1
}

function setTerrainTile(mapCol: number, mapRow: number, sheetRow0: number, sheetCol0: number) {
  terrain[mapRow][mapCol] = desertTileIndex(sheetRow0, sheetCol0)
}

function buildCollisionRect(
  x: number,
  y: number,
  width: number,
  height: number,
  doorWidth?: number,
  doorId?: string,
): CollisionRect {
  const rect: CollisionRect = { x, y, width, height }

  if (doorWidth && doorId) {
    rect.doorZone = {
      x: x + Math.floor((width - doorWidth) / 2),
      y,
      width: doorWidth,
      height,
      doorId,
    }
  }

  return rect
}

function makeReturnSpawn(rect: CollisionRect): ReturnSpawn {
  const centerX = rect.doorZone
    ? rect.doorZone.x + rect.doorZone.width / 2
    : rect.x + rect.width / 2

  return {
    x: centerX,
    y: rect.y + rect.height + 18,
    direction: 'down',
  }
}

const terrain = makeTileLayer(SAND)
const decoration = makeTileLayer(0)

const grassMask = makeMask()
paintRect(grassMask, 2, 2, 3, 3)
paintRect(grassMask, 28, 11, 29, 22)
paintRect(grassMask, 26, 21, 27, 22)
paintRect(grassMask, 30, 11, 31, 23)
paintRect(grassMask, 28, 23, 29, 23)
// Thin grass strait south of the pond channel (r12, c13-14)
grassMask[12][13] = true
grassMask[12][14] = true
paintAutotile(terrain, grassMask, GRASS_TILES)

const waterMask = makeMask()
waterMask[1][1] = true
waterMask[1][2] = true
waterMask[1][3] = true
waterMask[2][1] = true
waterMask[3][1] = true
// Main oasis
paintRect(waterMask, 18, 10, 23, 16)
paintRect(waterMask, 23, 13, 24, 18)
paintRect(waterMask, 22, 17, 24, 20)
paintRect(waterMask, 21, 21, 24, 23)
// Small pond (2x2) + thin water strait flowing east from top row
paintRect(waterMask, 10, 11, 11, 12)   // 2x2 pond body
waterMask[11][12] = true                // strait c12
waterMask[11][13] = true                // strait c13
waterMask[11][14] = true                // strait c14
paintAutotile(terrain, waterMask, WATER_TILES)

const pathMask = makeMask()
paintRect(pathMask, 1, 10, 6, 11)
paintRect(pathMask, 1, 11, 2, 18)
paintRect(pathMask, 1, 18, 20, 20)
paintRect(pathMask, 19, 16, 21, 18)
paintRect(pathMask, 17, 1, 18, 6)
paintRect(pathMask, 13, 6, 27, 7)
paintRect(pathMask, 26, 7, 27, 18)
paintRect(pathMask, 25, 18, 29, 20)
paintAutotile(terrain, pathMask, PATH_TILES)

setTerrainTile(20, 18, 3, 3)
setTerrainTile(19, 18, 5, 5)
setTerrainTile(18, 16, 8, 9)
setTerrainTile(19, 15, 8, 1)
setTerrainTile(20, 15, 8, 1)
setTerrainTile(21, 15, 8, 1)
setTerrainTile(18, 15, 8, 15)
setTerrainTile(22, 15, 6, 5)
setTerrainTile(22, 16, 7, 0)
setTerrainTile(28, 21, 0, 1)
setTerrainTile(29, 21, 0, 2)
setTerrainTile(26, 18, 5, 5)
setTerrainTile(27, 18, 5, 3)
setTerrainTile(28, 17, 2, 0)
setTerrainTile(29, 17, 2, 1)
setTerrainTile(30, 17, 0, 5)
setTerrainTile(23, 13, 8, 3)
setTerrainTile(2, 11, 3, 3)
setTerrainTile(2, 18, 5, 3)
setTerrainTile(17, 6, 5, 5)
setTerrainTile(18, 6, 5, 3)
setTerrainTile(26, 7, 3, 5)
setTerrainTile(22, 19, 8, 0)
setTerrainTile(23, 19, 8, 1)
setTerrainTile(24, 19, 8, 2)
setTerrainTile(22, 20, 1, 4)
setTerrainTile(23, 20, 1, 4)
setTerrainTile(24, 20, 1, 4)
setTerrainTile(22, 21, 6, 1)
setTerrainTile(23, 21, 6, 1)
setTerrainTile(24, 21, 6, 2)
setTerrainTile(29, 22, 2, 3)
setTerrainTile(30, 18, 1, 0)
setTerrainTile(30, 19, 1, 0)
setTerrainTile(30, 20, 1, 0)
setTerrainTile(30, 21, 1, 0)
setTerrainTile(30, 22, 2, 5)
setTerrainTile(28, 22, 0, 5)

// Pond + strait manual tile fixes
setTerrainTile(3, 1, 8, 11)
setTerrainTile(2, 1, 6, 7)
setTerrainTile(1, 1, 6, 6)
setTerrainTile(1, 2, 7, 6)
setTerrainTile(1, 3, 7, 6)
setTerrainTile(1, 4, 7, 6)
setTerrainTile(1, 5, 8, 9)
setTerrainTile(2, 3, 1, 0)
setTerrainTile(3, 3, 1, 2)
setTerrainTile(2, 4, 1, 0)
setTerrainTile(3, 4, 1, 2)
setTerrainTile(2, 5, 2, 0)
setTerrainTile(3, 5, 2, 2)
setTerrainTile(9, 11, 0, 11)
setTerrainTile(9, 12, 2, 9)
setTerrainTile(12, 12, 0, 9)   // grass tile
setTerrainTile(13, 12, 2, 7)   // grass tile
setTerrainTile(14, 12, 2, 11)  // grass tile
setTerrainTile(11, 11, 7, 18)  // water→pond transition
setTerrainTile(12, 11, 6, 7)   // thin water strait
setTerrainTile(13, 11, 6, 7)   // thin water strait
setTerrainTile(14, 11, 8, 11)  // water strait end

export const terrainLayer = terrain
export const decorationLayer = decoration

const doorPyramid = {
  worldX: 288,
  worldY: 91,
  renderW: 128,
  renderH: 101,
}

const westPyramid = {
  worldX: 160,
  worldY: 124,
  renderW: 96,
  renderH: 68,
}

const decorativePyramid = {
  worldX: 448,
  worldY: 124,
  renderW: 96,
  renderH: 68,
}

const temple = {
  worldX: 660,
  worldY: 120,
  renderW: 99,
  renderH: 72,
}

const tower = {
  worldX: 107,
  worldY: 223,
  renderW: 74,
  renderH: 97,
}

const hut = {
  worldX: 98,
  worldY: 511,
  renderW: 89,
  renderH: 53,
}

const sphinx = {
  worldX: 276,
  worldY: 438,
  renderW: 78,
  renderH: 136,
}

export const overworldStructures: OverworldStaticSpriteDef[] = [
  {
    id: 'west-pyramid',
    label: 'West Pyramid',
    sheetKey: 'pyramid',
    frame: PYRAMID_FRAME,
    occlusionStartY: 5 * TILE_SIZE + 3,
    ...westPyramid,
  },
  {
    id: 'door-pyramid',
    label: 'Door Pyramid',
    sheetKey: 'pyramidDoor',
    frame: PYRAMID_FRAME,
    occlusionStartY: 4 * TILE_SIZE + TILE_SIZE / 2 + 2,
    ...doorPyramid,
  },
  {
    id: 'decorative-pyramid',
    label: 'Decorative Pyramid',
    sheetKey: 'pyramid',
    frame: PYRAMID_FRAME,
    occlusionStartY: 5 * TILE_SIZE + 3,
    ...decorativePyramid,
  },
  {
    id: 'temple',
    label: 'Projects Temple',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.temple,
    occlusionStartY: temple.worldY + 34,
    ...temple,
  },
  {
    id: 'tower',
    label: 'Experience Tower',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tower,
    occlusionStartY: tower.worldY + 67,
    ...tower,
  },
  {
    id: 'hut',
    label: 'Contact Hut',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.hut,
    occlusionStartY: hut.worldY + 29,
    ...hut,
  },
  {
    id: 'sphinx',
    label: 'Secret Sphinx',
    sheetKey: 'sphinx',
    frame: SPHINX_FRAME,
    occlusionStartY: sphinx.worldY + 8,
    ...sphinx,
  },
]

export const overworldProps: OverworldStaticSpriteDef[] = [
  {
    id: 'nw-oasis-palm',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.palmB,
    worldX: 64,
    worldY: 50,
    renderW: 44,
    renderH: 68,
  },
  {
    id: 'nw-oasis-cactus',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearA,
    worldX: 136,
    worldY: 96,
    renderW: 24,
    renderH: 28,
  },
  {
    id: 'temple-cactus-left',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearA,
    worldX: 548,
    worldY: 158,
    renderW: 34,
    renderH: 40,
  },
  {
    id: 'temple-cactus-right',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tallCactusB,
    worldX: 814,
    worldY: 150,
    renderW: 34,
    renderH: 48,
  },
  {
    id: 'tower-pillars-left',
    sheetKey: 'pillar',
    frame: PILLAR_FRAME,
    occlusionStartY: 5 * TILE_SIZE + TILE_SIZE / 2 + 5,
    worldX: 8 * TILE_SIZE + 2,
    worldY: 4 * TILE_SIZE + 2,
    renderW: 28,
    renderH: 66,
  },
  {
    id: 'tower-pillars-right',
    sheetKey: 'pillar',
    frame: PILLAR_FRAME,
    occlusionStartY: 5 * TILE_SIZE + TILE_SIZE / 2 + 5,
    worldX: 13 * TILE_SIZE + 2,
    worldY: 4 * TILE_SIZE + 2,
    renderW: 28,
    renderH: 66,
  },
  {
    id: 'pond-barrel',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.barrel,
    worldX: 428,
    worldY: 322,
    renderW: 24,
    renderH: 20,
  },
  {
    id: 'pond-cactus-left',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tallCactusA,
    worldX: 646,
    worldY: 238,
    renderW: 34,
    renderH: 48,
  },
  {
    id: 'pond-cactus-bottom',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tallCactusB,
    worldX: 596,
    worldY: 555,
    renderW: 24,
    renderH: 33,
  },
  {
    id: 'hut-cactus-left',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.columnCactus,
    worldX: 102,
    worldY: 414,
    renderW: 22,
    renderH: 48,
  },
  {
    id: 'hut-flower-cactus',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.flowerCactus,
    worldX: 464,
    worldY: 470,
    renderW: 32,
    renderH: 32,
  },
  {
    id: 'tent',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tent,
    worldX: 632,
    worldY: 549,
    renderW: 46,
    renderH: 37,
  },
  {
    id: 'sphinx-skull',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.hornedSkull,
    worldX: 202,
    worldY: 586,
    renderW: 42,
    renderH: 54,
  },
  {
    id: 'temple-skull',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.skull,
    worldX: 882,
    worldY: 226,
    renderW: 44,
    renderH: 32,
  },
  {
    id: 'grass-palm-top',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.palmA,
    worldX: 901,
    worldY: 409,
    renderW: 52,
    renderH: 81,
  },
  {
    id: 'grass-palm-east',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.palmB,
    worldX: 951,
    worldY: 370,
    renderW: 50,
    renderH: 78,
  },
  {
    id: 'grass-palm-bottom',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.palmB,
    worldX: 887,
    worldY: 658,
    renderW: 50,
    renderH: 78,
  },
  {
    id: 'grass-bush',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.flowerCactus,
    worldX: 848,
    worldY: 674,
    renderW: 34,
    renderH: 34,
  },
  {
    id: 'grass-cactus',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearB,
    worldX: 934,
    worldY: 56,
    renderW: 36,
    renderH: 34,
  },
  {
    id: 'grass-fern-left',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.fernA,
    worldX: 12 * TILE_SIZE + 7,
    worldY: 12 * TILE_SIZE + 4,
    renderW: 16,
    renderH: 16,
  },
  {
    id: 'grass-fern-right',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.fernB,
    worldX: 13 * TILE_SIZE + 8,
    worldY: 12 * TILE_SIZE + 10,
    renderW: 16,
    renderH: 16,
  },
  {
    id: 'grass-fern-upper',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.fernA,
    worldX: 28 * TILE_SIZE + 8,
    worldY: 14 * TILE_SIZE + 16,
    renderW: 16,
    renderH: 16,
  },
  {
    id: 'grass-fern-east-base',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.fernB,
    worldX: 30 * TILE_SIZE + 10,
    worldY: 13 * TILE_SIZE + 18,
    renderW: 16,
    renderH: 16,
  },
  {
    id: 'grass-fern-lower',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.fernB,
    worldX: 27 * TILE_SIZE + 12,
    worldY: 21 * TILE_SIZE + 14,
    renderW: 16,
    renderH: 16,
  },
  {
    id: 'grass-flower-cactus-top',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.flowerCactus,
    worldX: 28 * TILE_SIZE + 16,
    worldY: 11 * TILE_SIZE + 8,
    renderW: 28,
    renderH: 28,
  },
  {
    id: 'grass-cactus-bottom',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tallCactusA,
    worldX: 940,
    worldY: 620,
    renderW: 32,
    renderH: 44,
  },
  {
    id: 'oasis-cactus-west',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearA,
    worldX: 538,
    worldY: 362,
    renderW: 30,
    renderH: 36,
  },
  {
    id: 'tower-road-cactus',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearA,
    worldX: 214,
    worldY: 276,
    renderW: 28,
    renderH: 34,
  },
  {
    id: 'grass-patch-cactus-copy',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearA,
    worldX: 9 * TILE_SIZE + 2,
    worldY: 12 * TILE_SIZE + TILE_SIZE - 50,
    renderW: 28,
    renderH: 34,
  },
  {
    id: 'nw-strait-cactus-copy',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearA,
    worldX: 3 * TILE_SIZE + Math.round(TILE_SIZE / 3) - 20,
    worldY: 5 * TILE_SIZE + TILE_SIZE - 54,
    renderW: 28,
    renderH: 34,
  },
  {
    id: 'east-ridge-cactus-copy',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.pricklyPearA,
    worldX: 30 * TILE_SIZE + 2,
    worldY: 17 * TILE_SIZE + TILE_SIZE - 34,
    renderW: 28,
    renderH: 34,
  },
  {
    id: 'oasis-wheel-west',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.brokenWheel,
    worldX: 494,
    worldY: 392,
    renderW: 24,
    renderH: 26,
  },
  {
    id: 'hut-skull-shoulder',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.skull,
    worldX: 188,
    worldY: 540,
    renderW: 30,
    renderH: 22,
  },
  {
    id: 'tent-hay',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.hayPatch,
    worldX: 680,
    worldY: 534,
    renderW: 32,
    renderH: 22,
  },
  {
    id: 'tent-barrel-right',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.barrel,
    worldX: 468,
    worldY: 556,
    renderW: 24,
    renderH: 20,
  },
  {
    id: 'resume-loot-gold',
    sheetKey: 'dungeonProps',
    frame: DUNGEON_PROP_FRAMES.goldOrb,
    worldX: 27 * TILE_SIZE - 12,
    worldY: 19 * TILE_SIZE + 20,
    renderW: 14,
    renderH: 14,
  },
  {
    id: 'resume-loot-gem',
    sheetKey: 'dungeonProps',
    frame: { sx: 15, sy: 32, sw: 18, sh: 16 },
    worldX: 27 * TILE_SIZE + 26,
    worldY: 19 * TILE_SIZE + 18,
    renderW: 14,
    renderH: 14,
  },
  {
    id: 'resume-loot-key',
    sheetKey: 'dungeonProps',
    frame: DUNGEON_PROP_FRAMES.goldKey,
    worldX: 27 * TILE_SIZE + 10,
    worldY: 19 * TILE_SIZE + 30,
    renderW: 14,
    renderH: 14,
  },
  {
    id: 'temple-sign',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.sign,
    worldX: 616,
    worldY: 154,
    renderW: 24,
    renderH: 28,
  },
  {
    id: 'east-ridge-cactus',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tallCactusA,
    worldX: 966,
    worldY: 172,
    renderW: 28,
    renderH: 40,
  },
]

const templeRect: CollisionRect = {
  x: temple.worldX,
  y: temple.worldY + 34,
  width: temple.renderW,
  height: 34,
  doorZone: {
    x: temple.worldX + Math.floor((temple.renderW - 36) / 2),
    y: temple.worldY + 44,
    width: 36,
    height: 24,
    doorId: 'templeDoor',
  },
}
const towerRect = buildCollisionRect(tower.worldX + 3, tower.worldY + 67, tower.renderW - 6, 30, 36, 'towerDoor')
const hutRect = buildCollisionRect(hut.worldX, hut.worldY + 29, hut.renderW, 24, 36, 'hutDoor')
const sphinxRect: CollisionRect = {
  x: sphinx.worldX + 4,
  y: sphinx.worldY + 8,
  width: 70,
  height: 120,
  doorZone: {
    x: sphinx.worldX + 21,
    y: sphinx.worldY + 94,
    width: 36,
    height: 34,
    doorId: 'sphinxDoor',
  },
}

const doorPyramidRect: CollisionRect = {
  x: 9 * TILE_SIZE + 3,
  y: 4 * TILE_SIZE + TILE_SIZE / 2 + 2,
  width: 4 * TILE_SIZE - 6,
  height: TILE_SIZE + TILE_SIZE / 2 - 2,
  doorZone: {
    x: 10 * TILE_SIZE + TILE_SIZE / 2,
    y: 5 * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE,
    doorId: 'doorPyramidDoor',
  },
}

const westPyramidRect: CollisionRect = {
  x: 5 * TILE_SIZE + 3,
  y: 5 * TILE_SIZE + 3,
  width: 3 * TILE_SIZE - 6,
  height: TILE_SIZE - 3,
}

const decorativePyramidRect: CollisionRect = {
  x: 14 * TILE_SIZE + 3,
  y: 5 * TILE_SIZE + 3,
  width: 3 * TILE_SIZE - 6,
  height: TILE_SIZE - 3,
}

const leftPillarBaseRect: CollisionRect = {
  x: 8 * TILE_SIZE + 5,
  y: 5 * TILE_SIZE + TILE_SIZE / 2 + 5,
  width: TILE_SIZE - 10,
  height: TILE_SIZE / 2 - 5,
}

const rightPillarBaseRect: CollisionRect = {
  x: 13 * TILE_SIZE + 5,
  y: 5 * TILE_SIZE + TILE_SIZE / 2 + 5,
  width: TILE_SIZE - 10,
  height: TILE_SIZE / 2 - 5,
}

const resumeChestRect: CollisionRect = {
  x: 27 * TILE_SIZE + 7,
  y: 19 * TILE_SIZE + 18,
  width: 18,
  height: 11,
}

const oasisNorthEdgeRect: CollisionRect = {
  x: 22 * TILE_SIZE,
  y: 19 * TILE_SIZE,
  width: 3 * TILE_SIZE,
  height: 24,
}

const oasisSouthEdgeRect: CollisionRect = {
  x: 22 * TILE_SIZE,
  y: 21 * TILE_SIZE + 8,
  width: 3 * TILE_SIZE,
  height: 24,
}

export const collisionRects: CollisionRect[] = [
  resumeChestRect,
  oasisNorthEdgeRect,
  oasisSouthEdgeRect,
  westPyramidRect,
  doorPyramidRect,
  decorativePyramidRect,
  leftPillarBaseRect,
  rightPillarBaseRect,
  templeRect,
  towerRect,
  hutRect,
  sphinxRect,
]

export const OVERWORLD_RETURN_SPAWNS = {
  projectsLab: makeReturnSpawn(templeRect),
  experienceTower: makeReturnSpawn(towerRect),
  skillsForge: makeReturnSpawn(hutRect),
  secretRoom: makeReturnSpawn(sphinxRect),
  pyramidLore: makeReturnSpawn(doorPyramidRect),
  contactPortal: makeReturnSpawn(hutRect),
}

export const rectDoors: RectDoorDef[] = [
  {
    doorId: 'doorPyramidDoor',
    targetRoom: 'pyramidLore',
    spawnX: 5 * TILE_SIZE,
    spawnY: 6 * TILE_SIZE + TILE_SIZE / 2,
    spawnDirection: 'up',
  },
  {
    doorId: 'templeDoor',
    targetRoom: 'projectsLab',
    spawnX: 8 * TILE_SIZE,
    spawnY: 14 * TILE_SIZE + TILE_SIZE / 2,
    spawnDirection: 'up',
  },
  {
    doorId: 'towerDoor',
    targetRoom: 'experienceTower_1',
    spawnX: 6 * TILE_SIZE,
    spawnY: 10 * TILE_SIZE + TILE_SIZE / 2,
    spawnDirection: 'up',
  },
  {
    doorId: 'hutDoor',
    targetRoom: 'contactPortal',
    spawnX: 5 * TILE_SIZE,
    spawnY: 8 * TILE_SIZE + TILE_SIZE / 2,
    spawnDirection: 'up',
  },
  {
    doorId: 'sphinxDoor',
    targetRoom: 'secretRoom',
    spawnX: 7 * TILE_SIZE,
    spawnY: 10 * TILE_SIZE + TILE_SIZE / 2,
    spawnDirection: 'up',
  },
]

export const overworldAmbientDefs: OverworldAmbientDef[] = [
  { id: 'camel-nw-oasis', type: 'camel', facing: 'left', worldX: 214, worldY: 82, renderW: 36, renderH: 36, fps: 5 },
  { id: 'camel-temple-road', type: 'camel', facing: 'left', worldX: 594, worldY: 88, renderW: 38, renderH: 38, fps: 5 },
  { id: 'camel-top', type: 'camel', facing: 'left', worldX: 366, worldY: 284, renderW: 36, renderH: 36, fps: 5 },
  { id: 'camel-oasis-west', type: 'camel', facing: 'right', animation: 'eating', worldX: 268, worldY: 368, renderW: 36, renderH: 36, fps: 8 },
  { id: 'camel-mid', type: 'camel', facing: 'left', worldX: 402, worldY: 476, renderW: 36, renderH: 36, fps: 5 },
  { id: 'camel-camp', type: 'camel', facing: 'right', worldX: 524, worldY: 548, renderW: 38, renderH: 38, fps: 5 },
  { id: 'camel-bottom', type: 'camel', facing: 'right', worldX: 808, worldY: 598, renderW: 36, renderH: 36, fps: 5 },
  { id: 'camel-east-ridge', type: 'camel', facing: 'left', worldX: 942, worldY: 280, renderW: 36, renderH: 36, fps: 5 },
  { id: 'camel-right', type: 'camel', facing: 'right', animation: 'eating', worldX: 944, worldY: 536, renderW: 36, renderH: 36, fps: 8 },
  { id: 'camel-nw-eating', type: 'camel', facing: 'right', animation: 'eating', worldX: 72, worldY: 136, renderW: 36, renderH: 36, fps: 8 },
  { id: 'snake-top-right', type: 'snake', facing: 'left', worldX: 904, worldY: 128, fps: 6 },
  { id: 'snake-bottom-left', type: 'snake', facing: 'left', worldX: 70, worldY: 586, fps: 6 },
  { id: 'snake-oasis-edge', type: 'snake', facing: 'left', worldX: 904, worldY: 586, fps: 6 },
  { id: 'snake-temple-side', type: 'snake', facing: 'left', worldX: 616, worldY: 266, fps: 6 },
]

export const overworldNpcDefs: OverworldNpcDef[] = [
  {
    id: 'welcome-mummy',
    sheetKey: 'mummy',
    worldX: 610,
    worldY: 590,
    sourceX: 1,
    sourceY: 0,
    sourceW: 14,
    sourceH: 16,
    frameStrideX: 16,
    frameCount: 6,
    renderW: 21,
    renderH: 24,
    fps: 4,
    label: 'Welcome Mummy',
  },
  {
    id: 'resume-chest',
    sheetKey: 'chest',
    worldX: 27 * TILE_SIZE + 6,
    worldY: 19 * TILE_SIZE + 12,
    sourceX: 0,
    sourceY: 0,
    sourceW: 16,
    sourceH: 16,
    frameStrideX: 16,
    frameCount: 5,
    renderW: 20,
    renderH: 20,
    fps: 12,
    label: 'Resume Chest',
  },
]

const welcomeMummy = overworldNpcDefs[0]
const resumeChest = overworldNpcDefs[1]
const interactionRects: InteractionRectDef[] = [
  {
    x: Math.round(welcomeMummy.worldX + welcomeMummy.renderW / 2 - 20),
    y: Math.round(welcomeMummy.worldY + welcomeMummy.renderH / 2 - 20),
    width: 40,
    height: 40,
    id: 'npc-aboutme',
  },
  {
    x: Math.round(resumeChest.worldX + resumeChest.renderW / 2 - 20),
    y: Math.round(resumeChest.worldY + resumeChest.renderH / 2 - 20),
    width: 40,
    height: 40,
    id: 'resume-chest',
  },
]

export const collisionMap: TileType[][] = terrainLayer.map((row) =>
  row.map((tile) => (tile === 0 ? W : F)),
)

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    if (waterMask[row][col]) collisionMap[row][col] = W
  }
}

for (let row = 0; row < ROWS; row++) {
  collisionMap[row][0] = W
  collisionMap[row][COLS - 1] = W
}
for (let col = 0; col < COLS; col++) {
  collisionMap[0][col] = W
  collisionMap[ROWS - 1][col] = W
}

collisionMap[16][19] = F
collisionMap[16][20] = F
collisionMap[16][21] = F
collisionMap[20][22] = F
collisionMap[20][23] = F
collisionMap[20][24] = F
collisionMap[19][22] = F
collisionMap[19][23] = F
collisionMap[19][24] = F
collisionMap[21][22] = F
collisionMap[21][23] = F
collisionMap[21][24] = F
collisionMap[21][28] = F
collisionMap[22][28] = F
collisionMap[23][28] = F

const doors: DoorDef[] = []

export const overworldRoom: RoomData = {
  id: 'overworld',
  cols: COLS,
  rows: ROWS,
  tileSize: TILE_SIZE,
  collisionGrid: collisionMap,
  defaultSpawn: SPAWN,
  doors,
  interactionZones: [],
  interactionRects,
  isInterior: false,
  collisionRects,
  rectDoors,
}
