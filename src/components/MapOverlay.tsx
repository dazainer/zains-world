/**
 * MapOverlay — terrain-based overworld map with labeled points of interest.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react'
import type { GameEngine } from '../game/GameEngine'
import {
  COLS,
  MAP_PIXEL_H as MAP_H,
  MAP_PIXEL_W as MAP_W,
  ROWS,
  TILE_SIZE,
  terrainLayer,
  overworldNpcDefs,
  overworldProps,
  overworldStructures,
} from '../game/maps/overworld'

interface Props {
  engineRef: RefObject<GameEngine | null>
  onClose: () => void
}

interface MapRegionLabel {
  id: string
  text: string
  worldX: number
  worldY: number
  kind?: 'major' | 'minor'
}

interface FootprintLabelSpec {
  id: string
  sourceId: string
  text: string
  fontSize?: string
  minWidth?: number
  minHeight?: number
  background?: string
  borderColor?: string
  color?: string
  multiline?: boolean
}

const ROOM_MARKER_SOURCE_BY_ROOM_ID: Record<string, string> = {
  projectsLab: 'temple',
  experienceTower_1: 'tower',
  experienceTower_2: 'tower',
  experienceTower_3: 'tower',
  contactPortal: 'hut',
  secretRoom: 'sphinx',
  pyramidLore: 'door-pyramid',
  skillsForge: 'hut',
}

const DESERT_TILESET_PATH = '/assets/tiles/desert/DESERT TILESET 32x32.png'
const DESERT_TILES_PER_ROW = 19
const PLAYER_SPRITE_PATH = '/assets/sprites/Player.png'

const MAP_REGION_LABELS: MapRegionLabel[] = [
  { id: 'necropolis', text: 'Necropolis', worldX: 8.5 * TILE_SIZE, worldY: 2.2 * TILE_SIZE, kind: 'major' },
  { id: 'oasis', text: 'Oasis', worldX: 9.35 * TILE_SIZE, worldY: 11.4 * TILE_SIZE, kind: 'major' },
]

const FOOTPRINT_LABELS: FootprintLabelSpec[] = [
  {
    id: 'small-side-pyramid',
    sourceId: 'small-side-pyramid',
    text: 'Pyramid',
    fontSize: '0.36rem',
    background: 'rgba(136, 103, 48, 0.58)',
    borderColor: 'rgba(241, 207, 132, 0.68)',
    color: '#fff1bf',
  },
  {
    id: 'side-pyramid',
    sourceId: 'side-pyramid',
    text: 'Pyramid',
    fontSize: '0.4rem',
    background: 'rgba(136, 103, 48, 0.58)',
    borderColor: 'rgba(241, 207, 132, 0.68)',
    color: '#fff1bf',
  },
  {
    id: 'door-pyramid',
    sourceId: 'door-pyramid',
    text: 'Lore Pyramid',
    fontSize: '0.44rem',
    background: 'rgba(148, 109, 42, 0.62)',
    borderColor: 'rgba(247, 211, 116, 0.72)',
    color: '#fff1c3',
  },
  {
    id: 'sphinx',
    sourceId: 'sphinx',
    text: 'Sphinx\nof\nSecrets',
    fontSize: '0.36rem',
    background: 'rgba(122, 86, 50, 0.62)',
    borderColor: 'rgba(229, 189, 137, 0.7)',
    color: '#fff0d4',
    multiline: true,
  },
  {
    id: 'tower',
    sourceId: 'tower',
    text: 'Experience\nTower',
    fontSize: '0.34rem',
    minHeight: 54,
    background: 'rgba(144, 109, 64, 0.62)',
    borderColor: 'rgba(245, 217, 176, 0.68)',
    color: '#fff3db',
    multiline: true,
  },
  {
    id: 'temple',
    sourceId: 'temple',
    text: 'Projects\nTemple',
    fontSize: '0.34rem',
    minHeight: 42,
    background: 'rgba(132, 88, 42, 0.64)',
    borderColor: 'rgba(241, 192, 115, 0.7)',
    color: '#fff0cb',
    multiline: true,
  },
  {
    id: 'hut',
    sourceId: 'hut',
    text: 'Contact Hut',
    fontSize: '0.38rem',
    background: 'rgba(121, 86, 50, 0.64)',
    borderColor: 'rgba(214, 171, 125, 0.68)',
    color: '#fff0d7',
  },
  {
    id: 'tent',
    sourceId: 'tent',
    text: 'Camp Tent',
    fontSize: '0.34rem',
    background: 'rgba(124, 72, 49, 0.62)',
    borderColor: 'rgba(228, 156, 132, 0.62)',
    color: '#ffe5d8',
  },
  {
    id: 'resume-chest',
    sourceId: 'resume-chest',
    text: 'Resume\nChest',
    fontSize: '0.28rem',
    minWidth: 52,
    minHeight: 28,
    background: 'rgba(133, 94, 28, 0.76)',
    borderColor: 'rgba(255, 218, 104, 0.82)',
    color: '#fff4cd',
    multiline: true,
  },
]

export default function MapOverlay({ engineRef, onClose }: Props) {
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number } | null>(null)
  const [markerBright, setMarkerBright] = useState(true)
  const [tilesReady, setTilesReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const structureLookup = useMemo(
    () => new Map([...overworldStructures, ...overworldProps, ...overworldNpcDefs].map((entry) => [entry.id, entry])),
    [],
  )

  useEffect(() => {
    const update = () => {
      const engine = engineRef.current
      if (!engine) return
      const pos = engine.getPlayerPosition()
      const roomId = engine.getCurrentRoomId()
      if (roomId === 'overworld') {
        setPlayerPos(pos)
        return
      }

      const anchorId = ROOM_MARKER_SOURCE_BY_ROOM_ID[roomId]
      const anchor = anchorId ? structureLookup.get(anchorId) : null
      if (anchor) {
        setPlayerPos({
          x: anchor.worldX + anchor.renderW / 2,
          y: anchor.worldY + anchor.renderH / 2,
        })
      } else {
        setPlayerPos(null)
      }
    }

    update()
    const interval = window.setInterval(update, 100)
    return () => window.clearInterval(interval)
  }, [engineRef, structureLookup])

  useEffect(() => {
    const interval = window.setInterval(() => setMarkerBright((value) => !value), 700)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    image.src = DESERT_TILESET_PATH
    image.onload = () => {
      ctx.clearRect(0, 0, MAP_W, MAP_H)
      ctx.imageSmoothingEnabled = false

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const index = terrainLayer[row]?.[col] ?? 0
          if (index <= 0) continue

          const srcCol = (index - 1) % DESERT_TILES_PER_ROW
          const srcRow = Math.floor((index - 1) / DESERT_TILES_PER_ROW)

          ctx.drawImage(
            image,
            srcCol * TILE_SIZE,
            srcRow * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE,
            col * TILE_SIZE,
            row * TILE_SIZE,
            TILE_SIZE,
            TILE_SIZE,
          )
        }
      }

      ctx.save()
      ctx.strokeStyle = 'rgba(58, 41, 21, 0.22)'
      ctx.lineWidth = 1
      for (let col = 0; col <= COLS; col++) {
        const x = col * TILE_SIZE + 0.5
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, MAP_H)
        ctx.stroke()
      }
      for (let row = 0; row <= ROWS; row++) {
        const y = row * TILE_SIZE + 0.5
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(MAP_W, y)
        ctx.stroke()
      }
      ctx.restore()

      setTilesReady(true)
    }
  }, [])

  const { overlayW, overlayH, scale } = useMemo(() => {
    const baseOverlayW = 760
    const viewportW = typeof window !== 'undefined' ? window.innerWidth : baseOverlayW + 40
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : baseOverlayW + 120
    const size = Math.min(baseOverlayW, viewportW - 48, viewportH - 140)
    return {
      overlayW: size,
      overlayH: size,
      scale: size / MAP_W,
    }
  }, [])

  const sx = (x: number) => x * scale
  const sy = (y: number) => y * scale

  const footprintLabels = useMemo(
    () =>
      FOOTPRINT_LABELS.flatMap((entry) => {
        const target = structureLookup.get(entry.sourceId)
        if (!target) return []

        return [{
          id: entry.id,
          text: entry.text,
          x: sx(target.worldX),
          y: sy(target.worldY),
          w: Math.max(sx(target.renderW), entry.minWidth ?? 0),
          h: Math.max(sy(target.renderH), entry.minHeight ?? 0),
          fontSize: entry.fontSize,
          background: entry.background,
          borderColor: entry.borderColor,
          color: entry.color,
          multiline: entry.multiline,
        }]
      }),
    [scale, structureLookup],
  )

  return (
    <div style={styles.backdrop}>
      <div style={{ ...styles.container, width: overlayW + 32 }}>
        <div style={styles.title}>World Map</div>
        <div style={styles.subtitle}>Terrain layout with labeled landmarks</div>

        <div style={{ ...styles.mapFrame, width: overlayW, height: overlayH }}>
          <canvas
            ref={canvasRef}
            width={MAP_W}
            height={MAP_H}
            style={{
              ...styles.canvas,
              width: overlayW,
              height: overlayH,
              opacity: tilesReady ? 1 : 0.5,
            }}
          />

          {footprintLabels.map((label) => (
            <div
              key={label.id}
              style={{
                ...styles.footprintLabel,
                left: label.x,
                top: label.y,
                width: label.w,
                height: label.h,
                fontSize: label.fontSize ?? styles.footprintLabel.fontSize,
                background: label.background ?? styles.footprintLabel.background,
                borderColor: label.borderColor ?? styles.footprintLabel.borderColor,
                color: label.color ?? styles.footprintLabel.color,
                whiteSpace: label.multiline ? 'pre-line' : 'nowrap',
                lineHeight: label.multiline ? '1.25' : '1',
              }}
            >
              {label.text}
            </div>
          ))}

          {MAP_REGION_LABELS.map((label) => (
            <div
              key={label.id}
              style={{
                ...styles.label,
                ...(label.kind === 'major' ? styles.labelMajor : styles.labelMinor),
                left: sx(label.worldX),
                top: sy(label.worldY),
              }}
            >
              {label.text}
            </div>
          ))}

          {playerPos && (
            <div
              style={{
                ...styles.playerMarkerWrap,
                left: sx(playerPos.x),
                top: sy(playerPos.y),
              }}
            >
              <div
                style={{
                  ...styles.playerYou,
                  opacity: markerBright ? 1 : 0.72,
                }}
              >
                You
              </div>
              <div
                style={{
                  ...styles.playerMarkerGlow,
                  opacity: markerBright ? 1 : 0.72,
                  boxShadow: markerBright
                    ? '0 0 0 4px rgba(255, 226, 153, 0.14), 0 0 24px rgba(236, 193, 86, 0.72)'
                    : '0 0 0 3px rgba(255, 226, 153, 0.08), 0 0 14px rgba(236, 193, 86, 0.4)',
                }}
              >
                <div style={styles.playerMarkerFace} />
              </div>
            </div>
          )}
        </div>

        <div style={styles.legendRow}>
          <span style={styles.legendChip}>Water canal border</span>
          <span style={styles.legendChip}>Golden face marker = you</span>
        </div>

        <div style={styles.hint}>Press M or Esc to close</div>
      </div>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.9rem',
    color: '#e7c56f',
    letterSpacing: '0.06em',
    textShadow: '0 2px 0 rgba(0,0,0,0.45)',
  },
  subtitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.42rem',
    color: '#d8c39a',
    letterSpacing: '0.03em',
  },
  mapFrame: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    border: '3px solid #d1aa55',
    boxShadow: '0 14px 40px rgba(0,0,0,0.42)',
    background: '#2a1a0b',
  },
  canvas: {
    display: 'block',
    imageRendering: 'pixelated',
  },
  label: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    fontFamily: "'Press Start 2P', monospace",
    textAlign: 'center',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  labelMajor: {
    fontSize: '0.62rem',
    color: '#fff3cc',
    padding: '7px 10px',
    background: 'rgba(52, 30, 12, 0.68)',
    border: '1px solid rgba(233, 197, 114, 0.65)',
    borderRadius: 6,
    textShadow: '0 1px 0 rgba(0,0,0,0.55)',
  },
  labelMinor: {
    fontSize: '0.5rem',
    color: '#f2dfb2',
    padding: '5px 7px',
    background: 'rgba(50, 31, 14, 0.52)',
    borderRadius: 5,
    textShadow: '0 1px 0 rgba(0,0,0,0.45)',
  },
  footprintLabel: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.4rem',
    color: '#fff2c7',
    background: 'rgba(69, 40, 17, 0.48)',
    border: '1px solid rgba(233, 197, 114, 0.55)',
    textShadow: '0 1px 0 rgba(0,0,0,0.55)',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '2px',
  },
  playerMarkerWrap: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'none',
  },
  playerYou: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.45rem',
    color: '#f3d88b',
    textShadow: '0 1px 0 rgba(0,0,0,0.55)',
    transition: 'opacity 220ms ease',
  },
  playerMarkerGlow: {
    width: 40,
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    background: 'radial-gradient(circle at 50% 50%, rgba(255, 225, 130, 0.28) 0%, rgba(255, 199, 83, 0.12) 55%, rgba(255, 199, 83, 0) 100%)',
    border: '2px solid rgba(255, 236, 187, 0.72)',
    pointerEvents: 'none',
    transition: 'opacity 220ms ease, box-shadow 220ms ease',
  },
  playerMarkerFace: {
    width: 39,
    height: 22,
    borderRadius: 8,
    backgroundImage: `url(${PLAYER_SPRITE_PATH})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 0',
    backgroundSize: '192px 256px',
    imageRendering: 'pixelated',
    border: '2px solid rgba(248, 226, 170, 0.9)',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(37, 22, 8, 0.92)',
    pointerEvents: 'none',
  },
  legendRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 760,
  },
  legendChip: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.36rem',
    color: '#e2cfaa',
    background: 'rgba(58, 35, 16, 0.78)',
    border: '1px solid rgba(209, 170, 85, 0.35)',
    borderRadius: 999,
    padding: '6px 8px',
  },
  hint: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.42rem',
    color: '#a89070',
    marginTop: 2,
  },
}
