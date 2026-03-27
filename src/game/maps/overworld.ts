import type { CollisionRect, TileType } from '../CollisionMap'
import { DUNGEON_PROP_FRAMES } from '../InteriorDeco'
import type { Direction } from '../Player'
import type { RectDoorDef, RoomData } from '../RoomManager'
import type { Frame } from '../SpriteSheet'
import type { TileMap } from '../TileRenderer'

const INNER_COLS = 13
const NORTH_EXPANSION_ROWS = 5
const SOUTH_CONTENT_ROWS = 8
const BORDER_SAND_TILES = 1
const BORDER_WATER_TILES = 1
const CONTENT_TILE_INSET = BORDER_SAND_TILES + BORDER_WATER_TILES
const INNER_ROWS = SOUTH_CONTENT_ROWS + NORTH_EXPANSION_ROWS

export const COLS = INNER_COLS + CONTENT_TILE_INSET * 2
export const ROWS = INNER_ROWS + CONTENT_TILE_INSET * 2
export const TILE_SIZE = 32

export const MAP_PIXEL_W = COLS * TILE_SIZE
export const MAP_PIXEL_H = ROWS * TILE_SIZE
const CONTENT_PIXEL_INSET = CONTENT_TILE_INSET * TILE_SIZE
const SOUTH_PIXEL_OFFSET = (NORTH_EXPANSION_ROWS + CONTENT_TILE_INSET) * TILE_SIZE

export const SPAWN = {
  x: 6 * TILE_SIZE + TILE_SIZE / 2 + CONTENT_PIXEL_INSET,
  y: 6 * TILE_SIZE + TILE_SIZE / 2 + SOUTH_PIXEL_OFFSET,
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
  renderLayer?: 'default' | 'shrubbery'
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

export interface OverworldBorderTileDef {
  col: number
  row: number
  tile: number
}

interface ReturnSpawn {
  x: number
  y: number
  direction: Direction
}

interface LocalCollisionRect {
  x: number
  y: number
  width: number
  height: number
}

const F: TileType = 1
const SAND = 24
const DESERT_TILES_PER_ROW = 19
const PROJECTS_LAB_ROOM_SPAWN = {
  x: 7 * TILE_SIZE,
  y: 10 * TILE_SIZE + TILE_SIZE / 2,
  direction: 'up' as Direction,
}
const SECRET_ROOM_SPAWN = {
  x: 6 * TILE_SIZE,
  y: 8 * TILE_SIZE + TILE_SIZE / 2,
  direction: 'up' as Direction,
}
const EXPERIENCE_TOWER_ROOM_SPAWN = {
  x: 6 * TILE_SIZE,
  y: 8 * TILE_SIZE + TILE_SIZE / 2,
  direction: 'up' as Direction,
}
const CONTACT_PORTAL_ROOM_SPAWN = {
  x: 4.5 * TILE_SIZE,
  y: 7 * TILE_SIZE + TILE_SIZE / 2,
  direction: 'up' as Direction,
}

function makeTileLayer(fill: number): TileMap {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(fill))
}

function desertTile(row: number, col: number) {
  return row * DESERT_TILES_PER_ROW + col + 1
}

function contentCol(col: number) {
  return col + CONTENT_TILE_INSET
}

function contentX(x: number) {
  return x + CONTENT_PIXEL_INSET
}

function southRow(row: number) {
  return row + NORTH_EXPANSION_ROWS + CONTENT_TILE_INSET
}

function southY(y: number) {
  return y + SOUTH_PIXEL_OFFSET
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

function placePropAtTileBase(
  id: string,
  frame: Frame,
  renderW: number,
  renderH: number,
  col: number,
  row: number,
  dx = 0,
  dy = 0,
  renderLayer: 'default' | 'shrubbery' = 'default',
): OverworldStaticSpriteDef {
  const baseCenterX = contentCol(col) * TILE_SIZE + TILE_SIZE / 2
  const baseY = (row + 1) * TILE_SIZE

  return {
    id,
    sheetKey: 'desert',
    frame,
    worldX: Math.round(baseCenterX - renderW / 2 + dx),
    worldY: Math.round(baseY - renderH + dy),
    renderW,
    renderH,
    renderLayer,
  }
}

function placeAmbientAtWorldCenter(
  id: string,
  type: 'camel' | 'snake',
  facing: 'left' | 'right',
  centerX: number,
  centerY: number,
  renderW: number,
  renderH: number,
  animation: 'idle' | 'eating' = 'idle',
  fps?: number,
): OverworldAmbientDef {
  return {
    id,
    type,
    facing,
    animation,
    worldX: Math.round(centerX - renderW / 2),
    worldY: Math.round(centerY - renderH / 2),
    renderW,
    renderH,
    fps,
  }
}

function placeAmbientAtTileCenter(
  id: string,
  type: 'camel' | 'snake',
  facing: 'left' | 'right',
  col: number,
  row: number,
  renderW: number,
  renderH: number,
  animation: 'idle' | 'eating' = 'idle',
  fps?: number,
): OverworldAmbientDef {
  return placeAmbientAtWorldCenter(
    id,
    type,
    facing,
    contentCol(col) * TILE_SIZE + TILE_SIZE / 2,
    row * TILE_SIZE + TILE_SIZE / 2,
    renderW,
    renderH,
    animation,
    fps,
  )
}

function placeTileCollisionRects(
  col: number,
  row: number,
  rects: LocalCollisionRect[],
): CollisionRect[] {
  const worldX = col * TILE_SIZE
  const worldY = row * TILE_SIZE

  return rects.map((rect) => ({
    x: worldX + rect.x,
    y: worldY + rect.y,
    width: rect.width,
    height: rect.height,
  }))
}

function placeContentTileCollisionRects(
  col: number,
  row: number,
  rects: LocalCollisionRect[],
): CollisionRect[] {
  return placeTileCollisionRects(col + CONTENT_TILE_INSET, row + CONTENT_TILE_INSET, rects)
}

export const terrainLayer = makeTileLayer(SAND)
export const decorationLayer = makeTileLayer(0)

const WATER_RING = {
  topLeft: desertTile(6, 6),
  top: desertTile(6, 7),
  topRight: desertTile(6, 8),
  left: desertTile(7, 6),
  right: desertTile(7, 8),
  bottomLeft: desertTile(8, 6),
  bottom: desertTile(8, 7),
  bottomRight: desertTile(8, 8),
}

for (let col = 0; col < COLS; col++) {
  terrainLayer[0][col] =
    col === 0 ? WATER_RING.topLeft : col === COLS - 1 ? WATER_RING.topRight : WATER_RING.top
  terrainLayer[ROWS - 1][col] =
    col === 0
      ? WATER_RING.bottomLeft
      : col === COLS - 1
        ? WATER_RING.bottomRight
        : WATER_RING.bottom
}

for (let row = 1; row < ROWS - 1; row++) {
  terrainLayer[row][0] = WATER_RING.left
  terrainLayer[row][COLS - 1] = WATER_RING.right
}

const DESERT_FRAMES = {
  temple: { sx: 363, sy: 295, sw: 74, sh: 54 },
  tower: { sx: 456, sy: 299, sw: 74, sh: 73 },
  hut: { sx: 547, sy: 294, sw: 59, sh: 53 },
  tent: { sx: 170, sy: 296, sw: 46, sh: 37 },
  shrubGreen1: { sx: 2, sy: 296, sw: 11, sh: 6 },
  shrubGreen2: { sx: 1, sy: 304, sw: 15, sh: 15 },
  shrubYellow1: { sx: 17, sy: 290, sw: 13, sh: 12 },
  shrubYellow2: { sx: 17, sy: 304, sw: 14, sh: 14 },
  shrubYellow3: { sx: 40, sy: 289, sw: 19, sh: 13 },
  sandHole: { sx: 33, sy: 305, sw: 26, sh: 14 },
  palm1: { sx: 237, sy: 305, sw: 39, sh: 60 },
  palm2: { sx: 302, sy: 308, sw: 38, sh: 58 },
  cactus1: { sx: 6, sy: 322, sw: 20, sh: 28 },
  cactus2: { sx: 38, sy: 324, sw: 22, sh: 26 },
  cactus3: { sx: 73, sy: 321, sw: 13, sh: 29 },
  cactus4: { sx: 4, sy: 357, sw: 23, sh: 23 },
  cactus5: { sx: 34, sy: 358, sw: 26, sh: 24 },
  cactus6: { sx: 70, sy: 353, sw: 21, sh: 29 },
  prop13: { sx: 64, sy: 292, sw: 32, sh: 22 },
  prop14: { sx: 101, sy: 290, sw: 24, sh: 26 },
  prop15: { sx: 134, sy: 295, sw: 20, sh: 17 },
  prop16: { sx: 97, sy: 325, sw: 28, sh: 21 },
  prop17: { sx: 99, sy: 352, sw: 25, sh: 32 },
  sign: { sx: 133, sy: 324, sw: 22, sh: 26 },
}
const PYRAMID_FRAME = { sx: 60, sy: 30, sw: 138, sh: 130 }
const SPHINX_FRAME = { sx: 33, sy: 19, sw: 62, sh: 108 }
const PILLAR_FRAME = { sx: 46, sy: 29, sw: 35, sh: 83 }
const PYRAMID_NORTH_SHIFT = 80

const terrainOverrides: Array<{ x: number; y: number; row: number; col: number }> = [
  { x: 0, y: 3, row: 3, col: 7 },
  { x: 1, y: 3, row: 3, col: 7 },
  { x: 0, y: 6, row: 3, col: 7 },
  { x: 1, y: 6, row: 3, col: 7 },
  { x: 5, y: 2, row: 3, col: 7 },
  { x: 7, y: 2, row: 3, col: 7 },
  { x: 8, y: 2, row: 3, col: 7 },
  { x: 6, y: 0, row: 4, col: 6 },
  { x: 6, y: 1, row: 4, col: 6 },
  { x: 9, y: 3, row: 5, col: 9 },
  { x: 2, y: 3, row: 5, col: 11 },
  { x: 4, y: 2, row: 3, col: 9 },
  { x: 6, y: 2, row: 5, col: 10 },
  { x: 2, y: 6, row: 3, col: 8 },
  { x: 9, y: 2, row: 3, col: 8 },
  { x: 2, y: 7, row: 4, col: 15 },
  { x: 3, y: 7, row: 3, col: 1 },
  { x: 4, y: 7, row: 3, col: 1 },
  { x: 5, y: 7, row: 3, col: 1 },
  { x: 6, y: 7, row: 5, col: 14 },
  { x: 6, y: 6, row: 3, col: 0 },
  { x: 7, y: 6, row: 3, col: 2 },
  { x: 7, y: 7, row: 5, col: 2 },
  { x: 6, y: 3, row: 6, col: 0 },
  { x: 7, y: 3, row: 6, col: 1 },
  { x: 8, y: 3, row: 6, col: 2 },
  { x: 6, y: 4, row: 7, col: 0 },
  { x: 7, y: 4, row: 7, col: 1 },
  { x: 6, y: 5, row: 8, col: 0 },
  { x: 7, y: 5, row: 8, col: 1 },
  { x: 8, y: 4, row: 8, col: 3 },
  { x: 8, y: 5, row: 6, col: 5 },
  { x: 9, y: 4, row: 6, col: 2 },
  { x: 9, y: 5, row: 7, col: 2 },
  { x: 9, y: 6, row: 8, col: 2 },
  { x: 8, y: 6, row: 8, col: 15 },
  { x: 8, y: 7, row: 7, col: 6 },
  { x: 9, y: 7, row: 0, col: 0 },
  { x: 11, y: 6, row: 0, col: 2 },
  { x: 10, y: 6, row: 1, col: 15 },
  { x: 10, y: 7, row: 2, col: 5 },
  { x: 11, y: 7, row: 1, col: 2 },
  { x: 10, y: 5, row: 1, col: 6 },
  { x: 10, y: 4, row: 0, col: 11 },
]

for (const { x, y, row, col } of terrainOverrides) {
  terrainLayer[southRow(y)][contentCol(x)] = desertTile(row, col)
}

// Direct live-map terrain fixes use the actual on-screen debug coordinates.
terrainLayer[4 + CONTENT_TILE_INSET][1 + CONTENT_TILE_INSET] = desertTile(3, 9)
terrainLayer[4 + CONTENT_TILE_INSET][2 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][3 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][4 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][5 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][6 + CONTENT_TILE_INSET] = desertTile(3, 10)
terrainLayer[4 + CONTENT_TILE_INSET][7 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][8 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][9 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][10 + CONTENT_TILE_INSET] = desertTile(3, 7)
terrainLayer[4 + CONTENT_TILE_INSET][11 + CONTENT_TILE_INSET] = desertTile(5, 11)
terrainLayer[10][1] = desertTile(3, 9)
terrainLayer[13][1] = desertTile(3, 9)
terrainLayer[14][1] = desertTile(6, 12)
terrainLayer[14][2] = desertTile(0, 9)
terrainLayer[14][3] = desertTile(2, 11)
terrainLayer[14][6] = desertTile(4, 18)
terrainLayer[14][7] = desertTile(3, 7)
terrainLayer[14][8] = desertTile(5, 17)
terrainLayer[14][10] = desertTile(8, 9)
terrainLayer[15][2] = desertTile(3, 9)
terrainLayer[15][3] = desertTile(3, 7)
terrainLayer[15][4] = desertTile(5, 17)
terrainLayer[15][5] = desertTile(5, 1)
terrainLayer[15][6] = desertTile(5, 2)
terrainLayer[15][11] = desertTile(2, 0)
terrainLayer[15][12] = desertTile(2, 1)
terrainLayer[15][13] = desertTile(2, 2)

const WATER_TILE_RECTS: Record<string, LocalCollisionRect[]> = {
  r6c0: [{ x: 7, y: 8, width: 25, height: 24 }],
  r6c1: [{ x: 0, y: 7, width: 32, height: 25 }],
  r6c2: [{ x: 0, y: 8, width: 25, height: 24 }],
  r7c0: [{ x: 7, y: 0, width: 25, height: 32 }],
  r7c1: [{ x: 0, y: 0, width: 32, height: 32 }],
  r7c2: [{ x: 0, y: 0, width: 25, height: 32 }],
  r8c0: [{ x: 7, y: 0, width: 25, height: 25 }],
  r8c1: [{ x: 0, y: 0, width: 32, height: 26 }],
  r8c2: [{ x: 0, y: 0, width: 25, height: 25 }],
  r6c5: [{ x: 0, y: 0, width: 32, height: 32 }],
  r7c6: [{ x: 7, y: 0, width: 18, height: 32 }],
  r8c3: [{ x: 0, y: 0, width: 32, height: 32 }],
  r8c15: [{ x: 7, y: 0, width: 25, height: 32 }],
}

const waterCollisionRects = [
  ...placeContentTileCollisionRects(6, 8, WATER_TILE_RECTS.r6c0),
  ...placeContentTileCollisionRects(7, 8, WATER_TILE_RECTS.r6c1),
  ...placeContentTileCollisionRects(8, 8, WATER_TILE_RECTS.r6c2),
  ...placeContentTileCollisionRects(6, 9, WATER_TILE_RECTS.r7c0),
  ...placeContentTileCollisionRects(7, 9, WATER_TILE_RECTS.r7c1),
  ...placeContentTileCollisionRects(8, 9, WATER_TILE_RECTS.r8c3),
  ...placeContentTileCollisionRects(9, 9, WATER_TILE_RECTS.r6c2),
  ...placeContentTileCollisionRects(6, 10, WATER_TILE_RECTS.r8c0),
  ...placeContentTileCollisionRects(7, 10, WATER_TILE_RECTS.r8c1),
  ...placeContentTileCollisionRects(8, 10, WATER_TILE_RECTS.r6c5),
  ...placeContentTileCollisionRects(9, 10, WATER_TILE_RECTS.r7c2),
  ...placeContentTileCollisionRects(8, 11, WATER_TILE_RECTS.r8c15),
  ...placeContentTileCollisionRects(9, 11, WATER_TILE_RECTS.r8c2),
  ...placeContentTileCollisionRects(8, 12, WATER_TILE_RECTS.r7c6),
]

const doorPyramid = {
  worldX: contentX(144 + 5 * TILE_SIZE),
  worldY: 91 - PYRAMID_NORTH_SHIFT + TILE_SIZE / 2 + CONTENT_PIXEL_INSET,
  renderW: 128,
  renderH: 101,
}

const sidePyramid = {
  worldX: contentX((7 + 1) * TILE_SIZE - 96 + TILE_SIZE),
  worldY: (2 + 1) * TILE_SIZE - 68 + CONTENT_PIXEL_INSET,
  renderW: 96,
  renderH: 68,
}

const smallSidePyramid = {
  worldX: contentX((3 + 1) * TILE_SIZE + TILE_SIZE / 2 - 64 + TILE_SIZE),
  worldY: (1 + 1) * TILE_SIZE - 45 + CONTENT_PIXEL_INSET,
  renderW: 64,
  renderH: 45,
}

const sphinx = {
  worldX: contentX(1 * TILE_SIZE + TILE_SIZE / 2 - 62 / 2),
  worldY: 3 * TILE_SIZE + TILE_SIZE / 2 - 108 + CONTENT_PIXEL_INSET,
  renderW: 62,
  renderH: 108,
}

const sphinxCenterX = sphinx.worldX + sphinx.renderW / 2
const pillarBaseY = (1 + 1 + CONTENT_TILE_INSET) * TILE_SIZE
const rightPillarBaseCenterX = (3 + CONTENT_TILE_INSET) * TILE_SIZE
const leftPillarBaseCenterX = sphinxCenterX - (rightPillarBaseCenterX - sphinxCenterX)

const rightPillar = {
  worldX: Math.round(rightPillarBaseCenterX - 14),
  worldY: pillarBaseY - 66,
  renderW: 28,
  renderH: 66,
}

const leftPillar = {
  worldX: Math.round(leftPillarBaseCenterX - 14),
  worldY: pillarBaseY - 66,
  renderW: 28,
  renderH: 66,
}

const tower = {
  worldX: contentX(1 * TILE_SIZE + TILE_SIZE / 2 - DESERT_FRAMES.tower.sw / 2 - 6),
  worldY: southY((2 + 1) * TILE_SIZE - DESERT_FRAMES.tower.sh + 3),
  renderW: 74,
  renderH: 73,
}

const temple = {
  worldX: contentX(8 * TILE_SIZE + 4 - DESERT_FRAMES.temple.sw / 2),
  worldY: southY((1 + 1) * TILE_SIZE + 3 - DESERT_FRAMES.temple.sh),
  renderW: 74,
  renderH: 54,
}

const hut = {
  worldX: contentX(2 * TILE_SIZE - 5 - DESERT_FRAMES.hut.sw / 2),
  worldY: southY((5 + 1) * TILE_SIZE + 2 - DESERT_FRAMES.hut.sh),
  renderW: 59,
  renderH: 53,
}

const tent = {
  worldX: contentX(7 * TILE_SIZE - 1 - DESERT_FRAMES.tent.sw / 2),
  worldY: southY((6 + 1) * TILE_SIZE - 6 - DESERT_FRAMES.tent.sh),
  renderW: 46,
  renderH: 37,
}

const doorPyramidRect: CollisionRect = {
  x: doorPyramid.worldX + 3,
  y: 143 - PYRAMID_NORTH_SHIFT + TILE_SIZE / 2 + CONTENT_PIXEL_INSET,
  width: 4 * TILE_SIZE - 6,
  height: TILE_SIZE + TILE_SIZE / 2 + 1,
  doorZone: {
    x: doorPyramid.worldX + 48,
    y: 160 - PYRAMID_NORTH_SHIFT + TILE_SIZE / 2 + CONTENT_PIXEL_INSET,
    width: TILE_SIZE,
    height: TILE_SIZE,
    doorId: 'doorPyramidDoor',
  },
}

const sidePyramidRect: CollisionRect = {
  x: sidePyramid.worldX + 3,
  y: sidePyramid.worldY + 36,
  width: 3 * TILE_SIZE - 6,
  height: 32,
}

const smallSidePyramidRect: CollisionRect = {
  x: smallSidePyramid.worldX + 2,
  y: smallSidePyramid.worldY + 23,
  width: 60,
  height: 22,
}

const sphinxTopRect: CollisionRect = {
  x: sphinx.worldX,
  y: sphinx.worldY,
  width: sphinx.renderW,
  height: 74,
}

const sphinxLeftRect: CollisionRect = {
  x: sphinx.worldX,
  y: sphinx.worldY + 74,
  width: 17,
  height: 34,
}

const sphinxDoorRect: CollisionRect = {
  x: sphinx.worldX + 17,
  y: sphinx.worldY + 74,
  width: 28,
  height: 24,
  doorZone: {
    x: sphinx.worldX + 17,
    y: sphinx.worldY + 74,
    width: 28,
    height: 24,
    doorId: 'sphinxDoor',
  },
}

const sphinxRightRect: CollisionRect = {
  x: sphinx.worldX + 45,
  y: sphinx.worldY + 74,
  width: 17,
  height: 34,
}

const leftPillarRect: CollisionRect = {
  x: leftPillar.worldX + 3,
  y: leftPillar.worldY + 51,
  width: leftPillar.renderW - 6,
  height: 11,
}

const rightPillarRect: CollisionRect = {
  x: rightPillar.worldX + 3,
  y: rightPillar.worldY + 51,
  width: rightPillar.renderW - 6,
  height: 11,
}

const towerRect = buildCollisionRect(
  tower.worldX + 3,
  tower.worldY + 50,
  tower.renderW - 6,
  23,
  36,
  'towerDoor',
)

const templeRect: CollisionRect = {
  x: temple.worldX,
  y: temple.worldY + 26,
  width: temple.renderW,
  height: 26,
  doorZone: {
    x: temple.worldX + Math.floor((temple.renderW - 28) / 2),
    y: temple.worldY + 33,
    width: 28,
    height: 19,
    doorId: 'templeDoor',
  },
}

const hutRectX = hut.worldX + 6
const hutRectY = hut.worldY + 29
const hutRectWidth = hut.renderW - 12
const hutRectHeight = 21
const hutDoorZone = {
  x: hutRectX + Math.floor((hutRectWidth - 36) / 2),
  y: hutRectY,
  width: 36,
  height: 18,
  doorId: 'hutDoor',
}

const hutLeftRect: CollisionRect = {
  x: hutRectX,
  y: hutRectY,
  width: hutDoorZone.x - hutRectX,
  height: hutRectHeight,
}

const hutDoorRect: CollisionRect = {
  x: hutDoorZone.x,
  y: hutDoorZone.y,
  width: hutDoorZone.width,
  height: hutDoorZone.height,
  doorZone: hutDoorZone,
}

const hutRightRect: CollisionRect = {
  x: hutDoorZone.x + hutDoorZone.width,
  y: hutRectY,
  width: hutRectX + hutRectWidth - (hutDoorZone.x + hutDoorZone.width),
  height: hutRectHeight,
}

export const overworldStructures: OverworldStaticSpriteDef[] = [
  {
    id: 'small-side-pyramid',
    label: 'Small Side Pyramid',
    sheetKey: 'pyramid',
    frame: PYRAMID_FRAME,
    worldX: smallSidePyramid.worldX,
    worldY: smallSidePyramid.worldY,
    renderW: smallSidePyramid.renderW,
    renderH: smallSidePyramid.renderH,
    occlusionStartY: smallSidePyramidRect.y,
  },
  {
    id: 'side-pyramid',
    label: 'Side Pyramid',
    sheetKey: 'pyramid',
    frame: PYRAMID_FRAME,
    worldX: sidePyramid.worldX,
    worldY: sidePyramid.worldY,
    renderW: sidePyramid.renderW,
    renderH: sidePyramid.renderH,
    occlusionStartY: sidePyramidRect.y,
  },
  {
    id: 'door-pyramid',
    label: 'Door Pyramid',
    sheetKey: 'pyramidDoor',
    frame: PYRAMID_FRAME,
    worldX: doorPyramid.worldX,
    worldY: doorPyramid.worldY,
    renderW: doorPyramid.renderW,
    renderH: doorPyramid.renderH,
    occlusionStartY: doorPyramidRect.y,
  },
  {
    id: 'sphinx',
    label: 'Secret Sphinx',
    sheetKey: 'sphinx',
    frame: SPHINX_FRAME,
    worldX: sphinx.worldX,
    worldY: sphinx.worldY,
    renderW: sphinx.renderW,
    renderH: sphinx.renderH,
    occlusionStartY: sphinx.worldY,
  },
  {
    id: 'left-sphinx-pillar',
    label: 'Left Sphinx Pillar',
    sheetKey: 'pillar',
    frame: PILLAR_FRAME,
    worldX: leftPillar.worldX,
    worldY: leftPillar.worldY,
    renderW: leftPillar.renderW,
    renderH: leftPillar.renderH,
    occlusionStartY: leftPillarRect.y,
  },
  {
    id: 'right-sphinx-pillar',
    label: 'Right Sphinx Pillar',
    sheetKey: 'pillar',
    frame: PILLAR_FRAME,
    worldX: rightPillar.worldX,
    worldY: rightPillar.worldY,
    renderW: rightPillar.renderW,
    renderH: rightPillar.renderH,
    occlusionStartY: rightPillarRect.y,
  },
  {
    id: 'temple',
    label: 'Projects Temple',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.temple,
    worldX: temple.worldX,
    worldY: temple.worldY,
    renderW: temple.renderW,
    renderH: temple.renderH,
    occlusionStartY: templeRect.y,
  },
  {
    id: 'tower',
    label: 'Experience Tower',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tower,
    worldX: tower.worldX,
    worldY: tower.worldY,
    renderW: tower.renderW,
    renderH: tower.renderH,
    occlusionStartY: towerRect.y,
  },
  {
    id: 'hut',
    label: 'Contact Hut',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.hut,
    worldX: hut.worldX,
    worldY: hut.worldY,
    renderW: hut.renderW,
    renderH: hut.renderH,
    occlusionStartY: hutRectY,
  },
]
export const overworldProps: OverworldStaticSpriteDef[] = [
  {
    id: 'tent',
    label: 'Tent',
    sheetKey: 'desert',
    frame: DESERT_FRAMES.tent,
    worldX: tent.worldX,
    worldY: tent.worldY,
    renderW: tent.renderW,
    renderH: tent.renderH,
  },
  placePropAtTileBase('cactus1-a', DESERT_FRAMES.cactus1, 20, 28, 12, southRow(7), -8, 0),
  placePropAtTileBase('cactus1-b', DESERT_FRAMES.cactus1, 20, 28, 10, southRow(1), -16, 0),
  placePropAtTileBase('cactus1-c', DESERT_FRAMES.cactus1, 20, 28, 3, southRow(2)),
  placePropAtTileBase('cactus2-a', DESERT_FRAMES.cactus2, 22, 26, 5, southRow(1), 10, 0),
  placePropAtTileBase('cactus2-b', DESERT_FRAMES.cactus2, 22, 26, 11, southRow(6), 0, -10),
  placePropAtTileBase('cactus3-a', DESERT_FRAMES.cactus3, 13, 29, 0, southRow(4)),
  placePropAtTileBase('cactus3-b', DESERT_FRAMES.cactus3, 13, 29, 3, southRow(4), 0, 4),
  placePropAtTileBase('cactus4-a', DESERT_FRAMES.cactus4, 23, 23, 9, southRow(7), 8, 0),
  placePropAtTileBase('cactus4-b', DESERT_FRAMES.cactus4, 23, 23, 3, southRow(0)),
  placePropAtTileBase('cactus5-a', DESERT_FRAMES.cactus5, 26, 24, 5, southRow(5), 10, -10),
  placePropAtTileBase('cactus5-b', DESERT_FRAMES.cactus5, 26, 24, 12, southRow(0)),
  placePropAtTileBase('cactus6-a', DESERT_FRAMES.cactus6, 21, 29, 8, southRow(2), 10, 0),
  placePropAtTileBase('cactus6-b', DESERT_FRAMES.cactus6, 21, 29, 5, southRow(6), 4, 3),
  placePropAtTileBase('shrub-green-1', DESERT_FRAMES.shrubGreen1, 11, 6, 10, southRow(4), 0, 4, 'shrubbery'),
  placePropAtTileBase('shrub-green-2', DESERT_FRAMES.shrubGreen2, 15, 15, 10, southRow(7), 10, -4, 'shrubbery'),
  placePropAtTileBase('shrub-yellow-1a', DESERT_FRAMES.shrubYellow1, 13, 12, 9, southRow(3), -12, 3, 'shrubbery'),
  placePropAtTileBase('shrub-yellow-1b', DESERT_FRAMES.shrubYellow1, 13, 12, 3, southRow(2), -6, 2, 'shrubbery'),
  placePropAtTileBase('shrub-yellow-1c', DESERT_FRAMES.shrubYellow1, 13, 12, 10, southRow(2), 2, -1, 'shrubbery'),
  placePropAtTileBase('shrub-yellow-2a', DESERT_FRAMES.shrubYellow2, 14, 14, 5, southRow(6), -3, 4, 'shrubbery'),
  placePropAtTileBase('shrub-yellow-2b', DESERT_FRAMES.shrubYellow2, 14, 14, 9, southRow(1), 0, 0, 'shrubbery'),
  placePropAtTileBase('shrub-yellow-3a', DESERT_FRAMES.shrubYellow3, 19, 13, 1, southRow(5), -16, 0, 'shrubbery'),
  placePropAtTileBase('shrub-yellow-3b', DESERT_FRAMES.shrubYellow3, 19, 13, 6, southRow(5), 0, 0, 'shrubbery'),
  placePropAtTileBase('sand-hole-a', DESERT_FRAMES.sandHole, 25, 14, 4, southRow(3), -6, 8),
  placePropAtTileBase('sand-hole-b', DESERT_FRAMES.sandHole, 25, 14, 12, southRow(5)),
  placePropAtTileBase('prop13-a', DESERT_FRAMES.prop13, 32, 22, 3, southRow(4), -4, 8),
  placePropAtTileBase('prop14-a', DESERT_FRAMES.prop14, 24, 26, 5, southRow(3), 8, -7),
  placePropAtTileBase('prop15-a', DESERT_FRAMES.prop15, 18, 18, 0, southRow(0)),
  placePropAtTileBase('prop16-a', DESERT_FRAMES.prop16, 28, 21, 10, southRow(2), -5, -2),
  placePropAtTileBase('sign-a', DESERT_FRAMES.sign, 22, 26, 4, southRow(1), 0, 3),
  placePropAtTileBase('prop17-a', DESERT_FRAMES.prop17, 25, 32, 3, southRow(6)),
  {
    id: 'resume-loot-gold',
    sheetKey: 'dungeonProps',
    frame: DUNGEON_PROP_FRAMES.goldOrb,
    worldX: 70,
    worldY: 456,
    renderW: 14,
    renderH: 14,
  },
  {
    id: 'resume-loot-gem',
    sheetKey: 'dungeonProps',
    frame: { sx: 13, sy: 32, sw: 22, sh: 16 },
    worldX: 138,
    worldY: 454,
    renderW: 14,
    renderH: 14,
  },
  {
    id: 'resume-loot-key',
    sheetKey: 'dungeonProps',
    frame: DUNGEON_PROP_FRAMES.goldKey,
    worldX: 103,
    worldY: 486,
    renderW: 14,
    renderH: 14,
  },
  placePropAtTileBase('shrub-green-2b', DESERT_FRAMES.shrubGreen2, 15, 15, 2, 14, -64, -12, 'shrubbery'),
  placePropAtTileBase('palm1-a', DESERT_FRAMES.palm1, 39, 60, 11, southRow(7), -12, 0),
  placePropAtTileBase('palm2-a', DESERT_FRAMES.palm2, 38, 56, 10, southRow(4), 0, -4),
]
export const overworldAmbientDefs: OverworldAmbientDef[] = [
  placeAmbientAtTileCenter('snake-west-border', 'snake', 'right', -1, 4 + CONTENT_TILE_INSET, 32, 32, 'idle', 6),
  placeAmbientAtWorldCenter(
    'snake-bottom-left',
    'snake',
    'right',
    1 * TILE_SIZE + TILE_SIZE / 2,
    15 * TILE_SIZE + TILE_SIZE / 2,
    32,
    32,
    'idle',
    6,
  ),
  placeAmbientAtWorldCenter('snake-top-right', 'snake', 'left', contentX(12 * TILE_SIZE), southY(1 * TILE_SIZE), 32, 32, 'idle', 6),
  placeAmbientAtWorldCenter('camel-mid-lower', 'camel', 'right', contentX(5 * TILE_SIZE), southY(5 * TILE_SIZE + TILE_SIZE / 2), 41, 36, 'eating', 8),
  placeAmbientAtWorldCenter('camel-mid-upper', 'camel', 'right', contentX(5 * TILE_SIZE), southY(3 * TILE_SIZE), 36, 36, 'idle', 5),
  placeAmbientAtTileCenter('camel-bottom', 'camel', 'left', 7, southRow(7), 36, 36, 'idle', 5),
  placeAmbientAtTileCenter('camel-east', 'camel', 'left', 12, southRow(6), 41, 36, 'eating', 8),
]
export const overworldBorderTiles: OverworldBorderTileDef[] = []
const welcomeMummy: OverworldNpcDef = {
  id: 'welcome-mummy',
  sheetKey: 'mummy',
  worldX: Math.round(contentX(6 * TILE_SIZE + TILE_SIZE / 2 - 21 / 2 - 16)),
  worldY: Math.round((12 + 1 + CONTENT_TILE_INSET) * TILE_SIZE - 20 - 16),
  sourceX: 1,
  sourceY: 0,
  sourceW: 14,
  sourceH: 16,
  frameStrideX: 16,
  frameCount: 6,
  renderW: 20,
  renderH: 20,
  fps: 4,
  label: 'Welcome Mummy',
}

const resumeChest: OverworldNpcDef = {
  id: 'resume-chest',
  sheetKey: 'chest',
  worldX: 3 * TILE_SIZE + TILE_SIZE / 2 - 12,
  worldY: 14 * TILE_SIZE + TILE_SIZE / 2 - 14,
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
}

const resumeChestRect: CollisionRect = {
  x: resumeChest.worldX + 1,
  y: resumeChest.worldY + 7,
  width: 18,
  height: 11,
}

const interactionRects: RoomData['interactionRects'] = [
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

export const overworldNpcDefs: OverworldNpcDef[] = [welcomeMummy, resumeChest]
export const collisionRects: CollisionRect[] = [
  resumeChestRect,
  ...waterCollisionRects,
  smallSidePyramidRect,
  sidePyramidRect,
  doorPyramidRect,
  leftPillarRect,
  rightPillarRect,
  sphinxTopRect,
  sphinxLeftRect,
  sphinxDoorRect,
  sphinxRightRect,
  templeRect,
  towerRect,
  hutLeftRect,
  hutDoorRect,
  hutRightRect,
]
export const rectDoors: RectDoorDef[] = [
  {
    doorId: 'doorPyramidDoor',
    targetRoom: 'pyramidLore',
    spawnX: 5 * TILE_SIZE,
    spawnY: 6 * TILE_SIZE + TILE_SIZE / 2,
    spawnDirection: 'up',
  },
  {
    doorId: 'sphinxDoor',
    targetRoom: 'secretRoom',
    spawnX: SECRET_ROOM_SPAWN.x,
    spawnY: SECRET_ROOM_SPAWN.y,
    spawnDirection: SECRET_ROOM_SPAWN.direction,
  },
  {
    doorId: 'templeDoor',
    targetRoom: 'projectsLab',
    spawnX: PROJECTS_LAB_ROOM_SPAWN.x,
    spawnY: PROJECTS_LAB_ROOM_SPAWN.y,
    spawnDirection: PROJECTS_LAB_ROOM_SPAWN.direction,
  },
  {
    doorId: 'towerDoor',
    targetRoom: 'experienceTower_1',
    spawnX: EXPERIENCE_TOWER_ROOM_SPAWN.x,
    spawnY: EXPERIENCE_TOWER_ROOM_SPAWN.y,
    spawnDirection: EXPERIENCE_TOWER_ROOM_SPAWN.direction,
  },
  {
    doorId: 'hutDoor',
    targetRoom: 'contactPortal',
    spawnX: CONTACT_PORTAL_ROOM_SPAWN.x,
    spawnY: CONTACT_PORTAL_ROOM_SPAWN.y,
    spawnDirection: CONTACT_PORTAL_ROOM_SPAWN.direction,
  },
]

export const OVERWORLD_RETURN_SPAWNS: Record<
  'projectsLab' | 'experienceTower' | 'skillsForge' | 'secretRoom' | 'pyramidLore' | 'contactPortal',
  ReturnSpawn
> = {
  projectsLab: makeReturnSpawn(templeRect),
  experienceTower: makeReturnSpawn(towerRect),
  skillsForge: {
    x: contentX(1 * TILE_SIZE + TILE_SIZE / 2),
    y: southY(6 * TILE_SIZE + TILE_SIZE / 2),
    direction: 'down',
  },
  secretRoom: makeReturnSpawn(sphinxDoorRect),
  pyramidLore: makeReturnSpawn(doorPyramidRect),
  contactPortal: makeReturnSpawn(hutDoorRect),
}

export const collisionMap: TileType[][] = terrainLayer.map((row) =>
  row.map(() => F),
)

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    if (
      row < BORDER_WATER_TILES ||
      row >= ROWS - BORDER_WATER_TILES ||
      col < BORDER_WATER_TILES ||
      col >= COLS - BORDER_WATER_TILES
    ) {
      collisionMap[row][col] = 0
    }
  }
}

export const overworldRoom: RoomData = {
  id: 'overworld',
  cols: COLS,
  rows: ROWS,
  tileSize: TILE_SIZE,
  collisionGrid: collisionMap,
  defaultSpawn: SPAWN,
  doors: [],
  interactionZones: [],
  interactionRects,
  isInterior: false,
  collisionRects,
  rectDoors,
}
