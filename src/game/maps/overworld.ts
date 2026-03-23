/**
 * Overworld — 30×24 tile outdoor desert map (960×768 px).
 *
 * DESERT TILESET 32x32.png — 19 cols × 14 rows, 32px each.
 * Index formula: idx = (row0 * 19) + col0 + 1  (row0/col0 are 0-indexed)
 * Render:  srcCol = (idx-1) % 19,  srcRow = floor((idx-1) / 19)
 *
 * Layout (1-indexed Row, Col):
 *   Rows 1-3, Cols 1-3  — GRASS autotile  (outer border corners/edges)
 *   Rows 4-6, Cols 1-3  — PATH/DARK SAND autotile
 *   Rows 7-9, Cols 1-3  — WATER/OASIS autotile  (outer border corners/edges)
 *   Rows 1-9, Cols 4-6  — INVERSE autotiles (inner corners on sand background)
 *     ★ (R2,C5) = THE flat uniform sand tile — idx 24, pixel (128,32) ★
 *   Row  10, Cols 1-2  — packed 16×16 icon tiles (skip)
 *   Rows 10-12, Cols 3-5  — single-tile props (one complete sprite per cell)
 *   Rows 10-11, Cols 6-7  — Tent (2×2 block)
 *   Rows 10-12, Cols 8-9  — Palm variety 1 (3×2 block)
 *   Rows 10-12, Cols 10-11 — Palm variety 2 (3×2 block)
 *   Rows 10-12, Cols 12-14 — Temple (3×3 block)
 *   Rows 10-12, Cols 15-17 — Castle/Tower (3×3 block)
 *   Rows 10-12, Cols 18-19 — Hut (C20 overflows tilesPerRow=19, omitted)
 *
 * Three exports for rendering:
 *   terrainLayer    — ground: idx 24 (flat sand) for 80%+ of map; water autotiles at NE oasis
 *   decorationLayer — palms, props, tent drawn on top (32 px/tile, native scale)
 *   buildings       — temple, castle, hut as BuildingBlock[] rendered via TileRenderer.renderBlock
 *
 * Collision:  terrain === 0 → 0 (wall);  terrain > 0 → 1 (walkable)
 *
 * Map overview:
 *   Row  0          top border wall
 *   Rows 1–6        open sandy area; oasis patch in NE (cols 24–28)
 *   Rows 7–10       two 4×4 wall blocks (cols 8–11 and 18–21)
 *   Rows 11–14      open centre; SPAWN at (col 15, row 12)
 *   Rows 15–16      barrier walls with central gap (cols 5–10 and 19–24)
 *   Rows 17–22      open lower half
 *   Row 23          bottom border wall
 */
import type { TileMap } from '../TileRenderer'
import type { TileType } from '../CollisionMap'

export const COLS      = 30
export const ROWS      = 24
export const TILE_SIZE = 32

export const MAP_PIXEL_W = COLS * TILE_SIZE   // 960
export const MAP_PIXEL_H = ROWS * TILE_SIZE   // 768

/** Player spawn — centre of tile (col 15, row 12). */
export const SPAWN = {
  x: 15 * TILE_SIZE + TILE_SIZE / 2,  // 496
  y: 12 * TILE_SIZE + TILE_SIZE / 2,  // 400
}

// ─── Ground tile indices (1-indexed, formula: idx = (R-1)*19 + (C-1) + 1) ────
// THE ground fill — (R2,C5) flat uniform sand — pixel (128, 32) in spritesheet
const SN  = 24   // flat sand  ← 80%+ of every walkable tile

// Water/oasis autotile — OUTER border (Rows 7-9, Cols 1-3)
const WTL = 115  // water TL corner   (R7,C1)
const WTE = 116  // water top edge    (R7,C2)
const WTR = 117  // water TR corner   (R7,C3)
const WLE = 134  // water left edge   (R8,C1)
const WC  = 135  // water center fill (R8,C2)
const WRE = 136  // water right edge  (R8,C3)
const WBL = 153  // water BL corner   (R9,C1)
const WBE = 154  // water bot edge    (R9,C2)
const WBR = 155  // water BR corner   (R9,C3)

// Wall (idx 0 = skip, dark background shows through)
const W   = 0

// ─── Terrain layer ───────────────────────────────────────────────────────────
// Base fill: SN everywhere. Water autotile block at NE oasis (rows 2-4, cols 25-27).
// prettier-ignore
export const terrainLayer: TileMap = [
//col   0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18   19   20   21   22   23   24   25   26   27   28   29
/* 00 */[W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W],
/* 01 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 02 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  WTL, WTE, WTR, SN,  W],
/* 03 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  WLE, WC,  WRE, SN,  W],
/* 04 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  WBL, WBE, WBR, SN,  W],
/* 05 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 06 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
// Buildings: temple (3×3) at cols 8-10, castle (3×3) at cols 19-21 — rows 7-9.
// Terrain is SN (sand shows under sprites); collision patched to 0 below.
// Row 10 is open sand (walkable ground in front of buildings)
/* 07 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 08 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 09 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 10 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 11 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 12 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],  // ← spawn
/* 13 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 14 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
// Barrier walls: cols 5–10 and 19–24, central gap cols 11–18
/* 15 */[W,   SN,  SN,  SN,  SN,  W,   W,   W,   W,   W,   W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W,   W,   W,   W,   W,   W,   SN,  SN,  SN,  SN,  W],
/* 16 */[W,   SN,  SN,  SN,  SN,  W,   W,   W,   W,   W,   W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W,   W,   W,   W,   W,   W,   SN,  SN,  SN,  SN,  W],
/* 17 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 18 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 19 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
/* 20 */[W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W],
// Small corner blocks: cols 5–8 and 21–24
/* 21 */[W,   SN,  SN,  SN,  SN,  W,   W,   W,   W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W,   W,   W,   W,   SN,  SN,  SN,  SN,  W],
/* 22 */[W,   SN,  SN,  SN,  SN,  W,   W,   W,   W,   SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  SN,  W,   W,   W,   W,   SN,  SN,  SN,  SN,  W],
/* 23 */[W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W,   W],
]

// ─── Collision map (derived from terrain) ────────────────────────────────────
// Building footprints are SN in terrain but must block movement.
// Footprints are sized to match the renderBlock pixel extents in buildings[].
export const collisionMap: TileType[][] = terrainLayer.map((row) =>
  row.map((t) => (t === 0 ? 0 : 1) as TileType),
)

function blockCollision(r1: number, r2: number, c1: number, c2: number) {
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) collisionMap[r][c] = 0
}
// Temple  — 128×128 px at (col 8, row 7) → visual cols 8-11, rows 7-9
blockCollision(7, 9, 8, 11)
// Castle  — 96×128 px at (col 19, row 7) → visual cols 19-21, rows 7-9
blockCollision(7, 9, 19, 21)
// Hut     — 96×96 px at (col 12, row 19) → visual cols 12-14, rows 19-21
blockCollision(19, 21, 12, 14)

// ─── Decoration layer ─────────────────────────────────────────────────────────
// Prop sprites drawn ON TOP of the terrain layer (second render pass).
// Multi-tile structures are composed by placing each sub-tile at its own map
// cell — the TileRenderer assembles the full visual from the individual cells.
//
// idx formula: (R-1)*19 + (C-1) + 1  (R,C are 1-indexed tileset coordinates)

// ── Scatter props — R10-12, C3-5 (one complete sprite per 32×32 cell) ────────
// R10,C1 and R10,C2 are packed 16×16 icon tiles — skip. R12,C5 is empty — skip.
const PROP_A = 174  // (R10,C3) — verify visually which prop this is
const PROP_B = 175  // (R10,C4) — verify visually which prop this is
const PROP_C = 176  // (R10,C5) — verify visually which prop this is

// ── Tent: 2 rows × 2 cols (R10-11, C6-7) ────────────────────────────────────
const TENT_TL = 177; const TENT_TR = 178   // (R10,C6) (R10,C7)
const TENT_BL = 196; const TENT_BR = 197   // (R11,C6) (R11,C7)

// ── Palm variety 1: 3 rows × 2 cols (R10-12, C8-9) ───────────────────────────
const P1_TL = 179; const P1_TR = 180   // (R10,C8) (R10,C9)
const P1_ML = 198; const P1_MR = 199   // (R11,C8) (R11,C9)
const P1_BL = 217; const P1_BR = 218   // (R12,C8) (R12,C9)

// ── Palm variety 2: 3 rows × 2 cols (R10-12, C10-11) ─────────────────────────
const P2_TL = 181; const P2_TR = 182   // (R10,C10) (R10,C11)
const P2_ML = 200; const P2_MR = 201   // (R11,C10) (R11,C11)
const P2_BL = 219; const P2_BR = 220   // (R12,C10) (R12,C11)

// ── Temple: 3 rows × 3 cols (R10-12, C12-14) ─────────────────────────────────
const TM_TL = 183; const TM_TM = 184; const TM_TR = 185  // (R10,C12-14)
const TM_ML = 202; const TM_MM = 203; const TM_MR = 204  // (R11,C12-14)
const TM_BL = 221; const TM_BM = 222; const TM_BR = 223  // (R12,C12-14)

// ── Castle/Tower: 3 rows × 3 cols (R10-12, C15-17) ───────────────────────────
const CT_TL = 186; const CT_TM = 187; const CT_TR = 188  // (R10,C15-17)
const CT_ML = 205; const CT_MM = 206; const CT_MR = 207  // (R11,C15-17)
const CT_BL = 224; const CT_BM = 225; const CT_BR = 226  // (R12,C15-17)

// ── Hut: 3 rows × 2 cols — C18-C19 only (C20 wraps with tilesPerRow=19) ──────
const HT_TL = 189; const HT_TM = 190   // (R10,C18) (R10,C19)
const HT_ML = 208; const HT_MM = 209   // (R11,C18) (R11,C19)
const HT_BL = 227; const HT_BM = 228   // (R12,C18) (R12,C19)

const decRow = (len = COLS): number[] => Array(len).fill(0)

// ─── Buildings — rendered via TileRenderer.renderBlock as single scaled units ─
// Each building is a compact tile grid + a world position + a target pixel size.
// renderBlock scales the N×M grid to exactly pixelW×pixelH with no tile overlap.
export interface BuildingBlock {
  tiles: TileMap
  worldX: number  // top-left world pixel
  worldY: number
  pixelW: number  // desired render width
  pixelH: number  // desired render height
}

export const buildings: BuildingBlock[] = [
  // Temple — NW area, 3×3 tiles rendered at 128×128 (≈ 4×4 visual tiles)
  {
    tiles: [
      [TM_TL, TM_TM, TM_TR],
      [TM_ML, TM_MM, TM_MR],
      [TM_BL, TM_BM, TM_BR],
    ],
    worldX: 8 * TILE_SIZE,
    worldY: 7 * TILE_SIZE,
    pixelW: 128,
    pixelH: 128,
  },
  // Castle/Tower — NE area, 3×3 tiles at 96×128 (3 wide × 4 tall — tower silhouette)
  {
    tiles: [
      [CT_TL, CT_TM, CT_TR],
      [CT_ML, CT_MM, CT_MR],
      [CT_BL, CT_BM, CT_BR],
    ],
    worldX: 19 * TILE_SIZE,
    worldY:  7 * TILE_SIZE,
    pixelW:  96,
    pixelH: 128,
  },
  // Hut — south area, 3×2 tiles at 96×96 (3×3 visual tiles)
  {
    tiles: [
      [HT_TL, HT_TM],
      [HT_ML, HT_MM],
      [HT_BL, HT_BM],
    ],
    worldX: 12 * TILE_SIZE,
    worldY: 19 * TILE_SIZE,
    pixelW: 96,
    pixelH: 96,
  },
]

// ─── Decoration layer (props, palms, tent — rendered at native 32 px/tile) ───
// prettier-ignore
export const decorationLayer: TileMap = (() => {
  const d: TileMap = Array.from({ length: ROWS }, () => decRow())

  // ── Palm variety 1 (3×2): tileset R10-12, C8-9 ───────────────────────────
  // Left of oasis (map rows 1-3, cols 23-24)
  d[1][23] = P1_TL; d[1][24] = P1_TR
  d[2][23] = P1_ML; d[2][24] = P1_MR
  d[3][23] = P1_BL; d[3][24] = P1_BR
  // Lower-right (map rows 17-19, cols 26-27)
  d[17][26] = P1_TL; d[17][27] = P1_TR
  d[18][26] = P1_ML; d[18][27] = P1_MR
  d[19][26] = P1_BL; d[19][27] = P1_BR

  // ── Palm variety 2 (3×2): tileset R10-12, C10-11 ─────────────────────────
  // Upper-left (map rows 3-5, cols 2-3)
  d[3][2] = P2_TL; d[3][3] = P2_TR
  d[4][2] = P2_ML; d[4][3] = P2_MR
  d[5][2] = P2_BL; d[5][3] = P2_BR

  // ── Tent (2×2): tileset R10-11, C6-7 ─────────────────────────────────────
  d[5][12] = TENT_TL; d[5][13] = TENT_TR
  d[6][12] = TENT_BL; d[6][13] = TENT_BR

  // ── Scatter props (R10-12, C3-5 tiles — identify visually) ───────────────
  d[2][8]   = PROP_A   // upper area
  d[5][20]  = PROP_B
  d[13][5]  = PROP_C
  d[18][2]  = PROP_A   // SW quadrant
  d[20][6]  = PROP_B
  d[22][3]  = PROP_A
  d[17][22] = PROP_B   // SE quadrant
  d[20][25] = PROP_C
  d[21][27] = PROP_A

  return d
})()
