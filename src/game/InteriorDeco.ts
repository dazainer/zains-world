import type { Frame } from './SpriteSheet'

export type InteriorDecoSheetKey = 'props' | 'vase'

export interface InteriorSpriteDeco {
  id: string
  sheetKey: InteriorDecoSheetKey
  frame: Frame
  x: number
  y: number
  renderW: number
  renderH: number
  alpha?: number
}

const frame = (sx: number, sy: number, sw: number, sh: number): Frame => ({ sx, sy, sw, sh })

export const DUNGEON_PROP_FRAMES = {
  crate: frame(0, 0, 16, 16),
  barrel: frame(16, 0, 16, 16),
  silverKey: frame(32, 0, 16, 16),
  goldKey: frame(48, 0, 16, 16),
  goldOrb: frame(0, 16, 16, 16),
  greenOrb: frame(16, 16, 16, 16),
  pinkOrb: frame(32, 16, 16, 16),
  blueOrb: frame(48, 16, 16, 16),
  bronzeToken: frame(0, 32, 16, 16),
  greenGem: frame(16, 32, 16, 16),
  pinkGem: frame(32, 32, 16, 16),
  blueGem: frame(48, 32, 16, 16),
  potA: frame(0, 48, 16, 16),
  potB: frame(16, 48, 16, 16),
  potC: frame(32, 48, 16, 16),
  bottleA: frame(0, 64, 16, 16),
  bottleB: frame(16, 64, 16, 16),
} as const

export const EGYPT_VASE_FRAMES = {
  bowl: frame(0, 0, 32, 24),
  hangingVase: frame(72, 0, 30, 32),
  urn: frame(0, 64, 32, 32),
  jar: frame(74, 72, 24, 28),
} as const

export function placeInteriorDeco(
  id: string,
  sheetKey: InteriorDecoSheetKey,
  frame: Frame,
  col: number,
  row: number,
  renderW: number,
  renderH: number,
  offsetX = 0,
  offsetY = 0,
  alpha?: number,
): InteriorSpriteDeco {
  return {
    id,
    sheetKey,
    frame,
    x: col * 32 + offsetX,
    y: row * 32 + offsetY,
    renderW,
    renderH,
    alpha,
  }
}
