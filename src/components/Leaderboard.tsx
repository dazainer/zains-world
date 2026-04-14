/**
 * Leaderboard — "Hall of Records" overlay for all local mini-game scores.
 *
 * Three tabs: Snake · Tic-Tac-Toe · Minesweeper
 * Reads from localStorage via leaderboard.ts. Zero world integration required.
 *
 * Keyboard:
 *   ← / → or Tab / Shift+Tab  — switch tabs
 *   Escape                     — close
 */
import { useCallback, useEffect, useState } from 'react'

import {
  fetchRemoteLeaderboard,
  formatDate,
  formatScore,
  getPlayerName,
  type LeaderboardEntry,
  type LeaderboardGame,
} from '../lib/leaderboard'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  initialTab?: LeaderboardGame
}

// ── Tab definitions ───────────────────────────────────────────────────────────

interface TabDef {
  game: LeaderboardGame
  label: string
  icon: string
  emptyLine1: string
  emptyLine2: string
  scoreLabel: string
  metaLabel: string
}

const TABS: TabDef[] = [
  {
    game:       'snake',
    label:      'SNAKE',
    icon:       '🐍',
    emptyLine1: 'No snake runs recorded yet.',
    emptyLine2: 'Play Snake in the secret room\nto set your first score!',
    scoreLabel: 'SCORE',
    metaLabel:  '—',
  },
  {
    game:       'tictactoe',
    label:      'TIC-TAC-TOE',
    icon:       '☥',
    emptyLine1: 'No TTT records yet.',
    emptyLine2: 'Defeat the mummy in the secret\nroom to set a streak!',
    scoreLabel: 'STREAK',
    metaLabel:  'DIFF',
  },
  {
    game:       'minesweeper',
    label:      'MINESWEEPER',
    icon:       '🦂',
    emptyLine1: 'No minesweeper times yet.',
    emptyLine2: 'Clear the scorpion field\nto post your best time!',
    scoreLabel: 'TIME',
    metaLabel:  'DIFF',
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Leaderboard({ onClose, initialTab = 'snake' }: Props) {
  const initialIndex = TABS.findIndex(t => t.game === initialTab)
  const [tabIndex, setTabIndex] = useState(initialIndex >= 0 ? initialIndex : 0)

  // Read entries fresh on every tab switch (localStorage may have changed)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const playerName = getPlayerName()

  const activeTab = TABS[tabIndex]

  // Reload entries when tab changes
  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setLoadError(null)
    void fetchRemoteLeaderboard(activeTab.game)
      .then((data) => {
        if (cancelled) return
        setEntries(data.entries.map((entry) => ({
          id: `remote-${activeTab.game}-${entry.username.toLowerCase()}`,
          playerName: entry.username,
          game: activeTab.game,
          score: entry.score,
          metadata: entry.metadata ?? null,
          timestamp: entry.timestamp ?? '',
        })))
      })
      .catch((error) => {
        if (cancelled) return
        setEntries([])
        setLoadError(error instanceof Error ? error.message : 'Unable to load snake leaderboard')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [activeTab.game])

  const prevTab = useCallback(() => {
    setTabIndex(i => (i - 1 + TABS.length) % TABS.length)
  }, [])

  const nextTab = useCallback(() => {
    setTabIndex(i => (i + 1) % TABS.length)
  }, [])

  // ── Keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't steal input from text fields
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.code === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.code === 'ArrowLeft' || (e.code === 'Tab' && e.shiftKey)) {
        e.preventDefault()
        prevTab()
        return
      }
      if (e.code === 'ArrowRight' || (e.code === 'Tab' && !e.shiftKey)) {
        e.preventDefault()
        nextTab()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prevTab, nextTab])

  // ── Rank medal ──────────────────────────────────────────────────────────────
  function rankDisplay(rank: number): string {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  // ── Is this the current player's entry? ─────────────────────────────────────
  // All local entries belong to this device; highlight matching player name.
  function isOwn(entry: LeaderboardEntry): boolean {
    if (!playerName) return false
    return entry.playerName.toLowerCase() === playerName.toLowerCase()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={s.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.panel}>

        {/* ── Title bar ─────────────────────────────────────────────────── */}
        <div style={s.titleBar}>
          <span style={s.title}>HALL OF RECORDS</span>
          <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────── */}
        <div style={s.tabBar} role="tablist">
          {TABS.map((tab, i) => (
            <button
              key={tab.game}
              type="button"
              role="tab"
              aria-selected={i === tabIndex}
              style={{
                ...s.tab,
                ...(i === tabIndex ? s.tabActive : s.tabInactive),
              }}
              onClick={() => setTabIndex(i)}
            >
              <span style={s.tabIcon}>{tab.icon}</span>
              <span style={s.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div style={s.content}>
          {loading ? (
            <div style={s.emptyWrap}>
              <span style={s.emptyIcon}>{activeTab.icon}</span>
              <p style={s.emptyLine1}>Loading records...</p>
            </div>
          ) : loadError ? (
            <div style={s.emptyWrap}>
              <span style={s.emptyIcon}>{activeTab.icon}</span>
              <p style={s.emptyLine1}>Records unavailable.</p>
              <p style={s.emptyLine2}>{loadError}</p>
            </div>
          ) : entries.length === 0 ? (
            // ── Empty state ───────────────────────────────────────────────
            <div style={s.emptyWrap}>
              <span style={s.emptyIcon}>{activeTab.icon}</span>
              <p style={s.emptyLine1}>{activeTab.emptyLine1}</p>
              <p style={s.emptyLine2}>{activeTab.emptyLine2}</p>
            </div>
          ) : (
            // ── Entry table ───────────────────────────────────────────────
            <div style={s.table}>
              {/* Column headers */}
              <div style={{ ...s.row, ...s.headerRow }}>
                <span style={{ ...s.col, ...s.colRank,  ...s.headerCell }}>#</span>
                <span style={{ ...s.col, ...s.colName,  ...s.headerCell }}>NAME</span>
                <span style={{ ...s.col, ...s.colScore, ...s.headerCell }}>{activeTab.scoreLabel}</span>
                {activeTab.metaLabel !== '—' && (
                  <span style={{ ...s.col, ...s.colMeta, ...s.headerCell }}>{activeTab.metaLabel}</span>
                )}
                <span style={{ ...s.col, ...s.colDate, ...s.headerCell }}>WHEN</span>
              </div>

              {/* Data rows */}
              {entries.map((entry, idx) => {
                const own = isOwn(entry)
                return (
                  <div
                    key={entry.id}
                    style={{
                      ...s.row,
                      ...(own ? s.rowOwn : {}),
                      ...(idx % 2 === 0 && !own ? s.rowEven : {}),
                    }}
                  >
                    <span style={{
                      ...s.col,
                      ...s.colRank,
                      ...(idx === 0 ? s.gold : idx === 1 ? s.silver : idx === 2 ? s.bronze : s.rankDim),
                    }}>
                      {rankDisplay(idx + 1)}
                    </span>

                    <span style={{ ...s.col, ...s.colName, color: own ? ACCENT : TEXT }}>
                      {own && <span style={s.youBadge}>YOU</span>}
                      {entry.playerName}
                    </span>

                    <span style={{ ...s.col, ...s.colScore, color: own ? ACCENT : TEXT_BRIGHT }}>
                      {formatScore(entry.game, entry.score)}
                    </span>

                    {activeTab.metaLabel !== '—' && (
                      <span style={{ ...s.col, ...s.colMeta }}>
                        {entry.metadata ?? '—'}
                      </span>
                    )}

                    <span style={{ ...s.col, ...s.colDate }}>
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={s.footer}>
          {playerName
            ? <span style={s.footerText}>playing as <span style={{ color: ACCENT }}>{playerName}</span></span>
            : <span style={s.footerText}>name not set yet — play a game first</span>
          }
          <span style={s.footerHint}>← → switch tabs · ESC close</span>
        </div>

      </div>
    </div>
  )
}

// ── Palette ───────────────────────────────────────────────────────────────────

const BG         = '#0d1117'
const PANEL_BG   = '#0d1117'
const ACCENT     = '#c8a850'          // gold — desert theme
const ACCENT_DIM = 'rgba(200,168,80,0.18)'
const BORDER     = `rgba(200,168,80,0.35)`
const BORDER_ACT = ACCENT
const TEXT       = '#d4c9b0'
const TEXT_DIM   = 'rgba(212,201,176,0.45)'
const TEXT_BRIGHT= '#f5e6c8'
const FONT       = "'Press Start 2P', monospace"

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.82)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  panel: {
    background: PANEL_BG,
    border: `2px solid ${ACCENT}`,
    display: 'flex',
    flexDirection: 'column',
    width: 'min(560px, 96vw)',
    maxHeight: '88vh',
    boxShadow: `0 0 48px rgba(200,168,80,0.12), 0 20px 60px rgba(0,0,0,0.7)`,
    overflow: 'hidden',
  },

  // ── Title bar ────────────────────────────────────────────────────────────
  titleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.7rem 1rem',
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
    background: `rgba(200,168,80,0.04)`,
  },
  title: {
    color: ACCENT,
    fontFamily: FONT,
    fontSize: '0.72rem',
    letterSpacing: '0.08em',
    textShadow: `0 0 12px rgba(200,168,80,0.3)`,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: ACCENT,
    cursor: 'pointer',
    fontFamily: FONT,
    fontSize: '0.7rem',
    padding: '0 0.2rem',
    lineHeight: 1,
    opacity: 0.8,
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────
  tabBar: {
    display: 'flex',
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.55rem 0.4rem',
    border: 'none',
    borderRight: `1px solid ${BORDER}`,
    cursor: 'pointer',
    transition: 'background 0.1s',
    outline: 'none',
  },
  tabActive: {
    background: ACCENT_DIM,
    borderBottom: `2px solid ${BORDER_ACT}`,
    color: ACCENT,
  },
  tabInactive: {
    background: 'none',
    color: TEXT_DIM,
  },
  tabIcon: {
    fontSize: '1rem',
    lineHeight: 1,
  },
  tabLabel: {
    fontFamily: FONT,
    fontSize: '0.38rem',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },

  // ── Content ──────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    overflowY: 'auto',
    minHeight: '160px',
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  emptyWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.7rem',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '2.2rem',
    opacity: 0.45,
  },
  emptyLine1: {
    margin: 0,
    color: TEXT_DIM,
    fontFamily: FONT,
    fontSize: '0.5rem',
  },
  emptyLine2: {
    margin: 0,
    color: TEXT_DIM,
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.78rem',
    lineHeight: 1.55,
    opacity: 0.7,
    whiteSpace: 'pre-line',
  },

  // ── Table ────────────────────────────────────────────────────────────────
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.45rem 0.9rem',
    borderBottom: `1px solid rgba(200,168,80,0.07)`,
    gap: '0.5rem',
    minHeight: '2.2rem',
  },
  headerRow: {
    background: `rgba(200,168,80,0.06)`,
    borderBottom: `1px solid ${BORDER}`,
    position: 'sticky',
    top: 0,
  },
  rowEven: {
    background: `rgba(255,255,255,0.015)`,
  },
  rowOwn: {
    background: `rgba(200,168,80,0.07)`,
    borderLeft: `2px solid ${ACCENT}`,
  },

  // ── Columns ──────────────────────────────────────────────────────────────
  col: {
    fontFamily: FONT,
    fontSize: '0.46rem',
    color: TEXT,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerCell: {
    color: TEXT_DIM,
    fontSize: '0.38rem',
    letterSpacing: '0.06em',
  },
  colRank: {
    width: '2.6rem',
    flexShrink: 0,
    textAlign: 'center',
    fontSize: '0.78rem',  // emoji needs larger size
  },
  colName: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    minWidth: 0,
    fontSize: '0.46rem',
  },
  colScore: {
    width: '4.5rem',
    flexShrink: 0,
    textAlign: 'right',
  },
  colMeta: {
    width: '4rem',
    flexShrink: 0,
    textAlign: 'center',
    color: TEXT_DIM,
    fontSize: '0.4rem',
  },
  colDate: {
    width: '4.5rem',
    flexShrink: 0,
    textAlign: 'right',
    color: TEXT_DIM,
    fontSize: '0.4rem',
  },

  // ── Rank colours ─────────────────────────────────────────────────────────
  gold:    { color: '#ffd700' },
  silver:  { color: '#c0c0c0' },
  bronze:  { color: '#cd7f32' },
  rankDim: { color: TEXT_DIM, fontSize: '0.44rem' },

  // ── "YOU" badge ──────────────────────────────────────────────────────────
  youBadge: {
    display: 'inline-block',
    background: ACCENT,
    color: BG,
    fontFamily: FONT,
    fontSize: '0.3rem',
    padding: '0.1rem 0.3rem',
    borderRadius: '2px',
    flexShrink: 0,
    letterSpacing: '0.04em',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.55rem 0.9rem',
    borderTop: `1px solid ${BORDER}`,
    flexShrink: 0,
    gap: '1rem',
  },
  footerText: {
    fontFamily: FONT,
    fontSize: '0.38rem',
    color: TEXT_DIM,
    flexShrink: 0,
  },
  footerHint: {
    fontFamily: FONT,
    fontSize: '0.33rem',
    color: `rgba(200,168,80,0.3)`,
    textAlign: 'right',
  },
}
