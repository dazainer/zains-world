/**
 * Minesweeper — Desert-themed mini-game overlay for the Secret Room.
 *
 * Instead of mines the player avoids scorpions buried under sand tiles.
 * Three difficulties. First click is always safe. Flood-fill on empty cells.
 * Timer starts on first click. Best times persisted in localStorage per
 * difficulty.
 *
 * Left-click  → reveal cell
 * Right-click → flag / unflag
 * R           → restart with same difficulty
 * Escape      → close
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  DIFF_CONFIG,
  NUMBER_COLORS,
  checkWin,
  countFlags,
  createEmptyBoard,
  exposeScorpions,
  formatTime,
  loadStats,
  placeScorpions,
  recordLoss,
  recordWin,
  revealFrom,
  toggleFlag,
  type Board,
  type Difficulty,
  type GamePhase,
  type MinesweeperStats,
} from '../lib/minesweeper'

import {
  qualifies as qualifiesLocal,
  addEntry,
  getPlayerName,
  setPlayerName,
} from '../lib/leaderboard'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  onViewLeaderboard?: () => void
}

// ── SFX helpers ───────────────────────────────────────────────────────────────

function makeAudio(src: string, vol: number): HTMLAudioElement {
  const a = new Audio(src)
  a.volume = vol
  a.preload = 'auto'
  return a
}

function playSfx(audio: HTMLAudioElement | null) {
  if (!audio) return
  const clone = audio.cloneNode() as HTMLAudioElement
  clone.volume = audio.volume
  clone.play().catch(() => {})
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   'EASY',
  medium: 'MEDIUM',
  hard:   'HARD',
}

const DIFFICULTY_DESCS: Record<Difficulty, string> = {
  easy:   '8×8 · 10 scorpions',
  medium: '12×12 · 25 scorpions',
  hard:   '16×16 · 50 scorpions',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Minesweeper({ onClose, onViewLeaderboard }: Props) {
  // ── Screen state ──────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<'difficulty' | 'game'>('difficulty')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  // ── Game state ────────────────────────────────────────────────────────────
  const [board, setBoard] = useState<Board>(() =>
    createEmptyBoard(DIFF_CONFIG.medium.rows, DIFF_CONFIG.medium.cols),
  )
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [hitCell, setHitCell] = useState<[number, number] | null>(null)
  const [stats, setStats] = useState<MinesweeperStats>(() => loadStats('medium'))
  const [newBest, setNewBest] = useState(false)

  // Local leaderboard state
  const [lbPending, setLbPending]     = useState(false)
  const [lbNameInput, setLbNameInput] = useState('')
  const [lbNameError, setLbNameError] = useState<string | null>(null)
  const [lbSaved, setLbSaved]         = useState(false)

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sfxReveal = useRef<HTMLAudioElement | null>(null)
  const sfxWin    = useRef<HTMLAudioElement | null>(null)
  const sfxLose   = useRef<HTMLAudioElement | null>(null)
  const timerRef  = useRef<number | null>(null)

  // ── SFX setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    sfxReveal.current = makeAudio('/assets/sfx/interact_default.wav', 0.08)
    sfxWin.current    = makeAudio('/assets/sfx/snake_hs.wav', 0.35)
    sfxLose.current   = makeAudio('/assets/sfx/snake_lose.wav', 0.24)
    return () => {
      sfxReveal.current = null
      sfxWin.current    = null
      sfxLose.current   = null
    }
  }, [])

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = window.setInterval(() => {
        setElapsed(t => t + 1)
      }, 1000)
    } else {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase])

  // ── Initialise / restart ──────────────────────────────────────────────────
  const initGame = useCallback((diff: Difficulty) => {
    const cfg = DIFF_CONFIG[diff]
    setDifficulty(diff)
    setBoard(createEmptyBoard(cfg.rows, cfg.cols))
    setPhase('idle')
    setElapsed(0)
    setHitCell(null)
    setNewBest(false)
    setStats(loadStats(diff))
    setLbPending(false)
    setLbNameInput('')
    setLbNameError(null)
    setLbSaved(false)
    setScreen('game')
  }, [])

  const restartGame = useCallback(() => {
    initGame(difficulty)
  }, [difficulty, initGame])

  // ── Left click — reveal ───────────────────────────────────────────────────
  const handleReveal = useCallback((row: number, col: number) => {
    if (phase === 'won' || phase === 'lost') return
    const cell = board[row][col]
    if (cell.revealed || cell.flagged) return

    let nextBoard = board
    let nextPhase = phase

    // First click — place scorpions, then reveal
    if (phase === 'idle') {
      const cfg = DIFF_CONFIG[difficulty]
      nextBoard = placeScorpions(board, row, col, cfg.scorpions)
      nextPhase = 'playing'
      setPhase('playing')
    }

    // Hit a scorpion
    if (nextBoard[row][col].scorpion) {
      const exposed = exposeScorpions(nextBoard, row, col)
      setBoard(exposed)
      setHitCell([row, col])
      setPhase('lost')
      const newStats = recordLoss(difficulty)
      setStats(newStats)
      playSfx(sfxLose.current)
      return
    }

    playSfx(sfxReveal.current)

    const revealed = revealFrom(nextBoard, row, col)
    setBoard(revealed)

    if (checkWin(revealed)) {
      setPhase('won')
      const newStats = recordWin(difficulty, elapsed + (nextPhase === 'playing' ? 0 : 0))
      const wasNewBest = newStats.bestTime === elapsed || newStats.wins === 1
      setStats(newStats)
      setNewBest(wasNewBest)
      playSfx(sfxWin.current)

      // Local leaderboard
      if (qualifiesLocal('minesweeper', elapsed)) {
        const stored = getPlayerName()
        if (stored) {
          addEntry('minesweeper', stored, elapsed, `${DIFFICULTY_LABELS[difficulty]} · ${formatTime(elapsed)}`)
          setLbSaved(true)
        } else {
          setLbPending(true)
        }
      }
    }
  }, [board, difficulty, elapsed, phase])

  // ── Right click — flag ────────────────────────────────────────────────────
  const handleFlag = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    if (phase === 'won' || phase === 'lost') return
    const cell = board[row][col]
    if (cell.revealed) return
    setBoard(b => toggleFlag(b, row, col))
  }, [board, phase])

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape') { e.preventDefault(); onClose(); return }
      if (e.code === 'KeyR' && screen === 'game') { e.preventDefault(); restartGame(); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, restartGame, screen])

  // ── Local leaderboard save ────────────────────────────────────────────────

  function handleLbSave() {
    const validation = setPlayerName(lbNameInput)
    if (!validation.ok) {
      setLbNameError(validation.error)
      return
    }
    addEntry('minesweeper', validation.name, elapsed, `${DIFFICULTY_LABELS[difficulty]} · ${formatTime(elapsed)}`)
    setLbSaved(true)
    setLbPending(false)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const cfg        = DIFF_CONFIG[difficulty]
  const minesLeft  = cfg.scorpions - countFlags(board)
  const timerText  = formatTime(elapsed)
  const isGameOver = phase === 'won' || phase === 'lost'

  // ── Render ────────────────────────────────────────────────────────────────

  if (screen === 'difficulty') {
    return (
      <div style={s.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div style={s.panel}>
          <div style={s.header}>
            <span style={s.headerText}>DESERT MINESWEEPER</span>
            <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div style={s.diffBody}>
            <p style={s.diffTitle}>SELECT DIFFICULTY</p>

            <div style={s.diffList}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  type="button"
                  style={s.diffBtn}
                  onClick={() => initGame(d)}
                >
                  <span style={s.diffBtnLabel}>{DIFFICULTY_LABELS[d]}</span>
                  <span style={s.diffBtnDesc}>{DIFFICULTY_DESCS[d]}</span>
                  {loadStats(d).bestTime !== null && (
                    <span style={s.diffBtnBest}>
                      best: {formatTime(loadStats(d).bestTime!)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <p style={s.hint}>Left-click reveal · Right-click flag · R restart · ESC close</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────

  const faceEmoji = phase === 'won' ? '😎' : phase === 'lost' ? '💀' : '🔍'

  return (
    <div style={s.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...s.panel, width: 'fit-content' }}>
        {/* Header bar */}
        <div style={s.header}>
          <span style={s.headerText}>
            {DIFFICULTY_LABELS[difficulty]} · 🦂 {minesLeft}
          </span>
          <span style={s.headerText}>{timerText}</span>
          <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Board + result overlay wrapper */}
        <div style={{ ...s.boardWrap, position: 'relative' }}>
          {/* Face / restart button row */}
          <div style={s.controlRow}>
            <button type="button" style={s.faceBtn} onClick={restartGame} title="Restart (R)">
              {faceEmoji}
            </button>
            <button type="button" style={s.changeDiffBtn} onClick={() => setScreen('difficulty')}>
              CHANGE DIFF
            </button>
          </div>

          {/* Grid */}
          <div
            style={{
              ...s.grid,
              gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cellPx}px)`,
              gridTemplateRows: `repeat(${cfg.rows}, ${cfg.cellPx}px)`,
            }}
            // Prevent browser context menu over the whole grid
            onContextMenu={e => e.preventDefault()}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isHit = hitCell?.[0] === r && hitCell?.[1] === c
                const canClick = !cell.revealed && !cell.flagged && phase !== 'won' && phase !== 'lost'
                return (
                  <div
                    key={`${r}-${c}`}
                    role="button"
                    tabIndex={-1}
                    aria-label={
                      cell.flagged
                        ? `Flagged ${r},${c}`
                        : cell.revealed
                        ? `${cell.scorpion ? 'Scorpion' : cell.adjacent || 'Empty'} at ${r},${c}`
                        : `Hidden ${r},${c}`
                    }
                    style={{
                      ...s.cell,
                      width: cfg.cellPx,
                      height: cfg.cellPx,
                      fontSize: cfg.cellPx <= 18 ? '9px' : cfg.cellPx <= 24 ? '11px' : '13px',
                      ...(cell.revealed
                        ? (cell.scorpion
                          ? (isHit ? s.cellHit : s.cellScorpion)
                          : s.cellRevealed)
                        : s.cellHidden),
                      cursor: canClick ? 'pointer' : 'default',
                      color: cell.revealed && !cell.scorpion && cell.adjacent > 0
                        ? NUMBER_COLORS[cell.adjacent]
                        : undefined,
                    }}
                    onClick={() => handleReveal(r, c)}
                    onContextMenu={e => handleFlag(e, r, c)}
                  >
                    {cell.revealed
                      ? (cell.scorpion
                        ? (isHit ? '💥' : '🦂')
                        : (cell.adjacent > 0 ? cell.adjacent : ''))
                      : (cell.flagged ? '🚩' : '')}
                  </div>
                )
              }),
            )}
          </div>

          {/* Stats footer */}
          <div style={s.statsRow}>
            <span style={s.statChip}>
              W<span style={{ color: ACCENT }}> {stats.wins}</span>
            </span>
            <span style={s.statChip}>
              L<span style={{ color: '#f44747' }}> {stats.losses}</span>
            </span>
            {stats.bestTime !== null && (
              <span style={s.statChip}>
                BEST<span style={{ color: '#ffd700' }}> {formatTime(stats.bestTime)}</span>
              </span>
            )}
          </div>

          {/* Result overlay */}
          {isGameOver && (
            <div style={s.resultOverlay}>
              <p style={{
                ...s.resultTitle,
                color: phase === 'won' ? ACCENT : '#f44747',
              }}>
                {phase === 'won' ? 'CLEARED!' : 'SCORPION!'}
              </p>

              {phase === 'won' && (
                <>
                  <p style={s.resultSub}>Time: {formatTime(elapsed)}</p>
                  {newBest && (
                    <p style={{ ...s.resultSub, color: '#ffd700' }}>★ NEW BEST ★</p>
                  )}
                </>
              )}

              {phase === 'lost' && (
                <p style={s.resultSub}>Better luck next time...</p>
              )}

              {/* Local leaderboard prompt (won only) */}
              {phase === 'won' && lbPending && !lbSaved && (
                <div style={s.lbSection}>
                  <p style={s.lbLabel}>Save to Hall of Records?</p>
                  <div style={s.lbInputRow}>
                    <input
                      type="text"
                      value={lbNameInput}
                      onChange={e => { setLbNameInput(e.target.value); setLbNameError(null) }}
                      placeholder="Your name"
                      maxLength={16}
                      autoFocus
                      style={s.lbInput}
                    />
                    <button type="button" style={s.lbSaveBtn} onClick={handleLbSave}>
                      SAVE
                    </button>
                  </div>
                  {lbNameError && <p style={s.lbError}>{lbNameError}</p>}
                </div>
              )}
              {phase === 'won' && lbSaved && (
                <p style={s.lbSavedMsg}>✓ Saved to Hall of Records</p>
              )}

              <div style={s.resultBtns}>
                <button type="button" style={s.primaryBtn} onClick={restartGame}>
                  RETRY  (R)
                </button>
                <button type="button" style={s.secondaryBtn} onClick={() => setScreen('difficulty')}>
                  CHANGE DIFF
                </button>
              </div>

              {onViewLeaderboard && (
                <button type="button" style={s.ghostBtn} onClick={onViewLeaderboard}>
                  VIEW LEADERBOARD
                </button>
              )}
            </div>
          )}
        </div>

        <p style={s.hint}>Left-click reveal · Right-click flag · R restart · ESC close</p>
      </div>
    </div>
  )
}

// ── Palette ───────────────────────────────────────────────────────────────────

const BG           = '#0d1117'
const ACCENT       = '#c8a850'      // gold — desert theme
const FONT         = "'Press Start 2P', monospace"

// Sand cell colours
const SAND_HIDDEN  = '#5C3A1A'      // dark sand — unrevealed
const SAND_SHADE   = '#3D2410'      // darker shade for hidden border
const SAND_OPEN    = '#C4924A'      // light sand — revealed
const SAND_OPEN_BG = '#D4A85E'      // slightly lighter for open border

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  panel: {
    background: BG,
    border: `2px solid ${ACCENT}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.8rem',
    borderBottom: `1px solid ${ACCENT}`,
    gap: '0.8rem',
    flexShrink: 0,
  },
  headerText: {
    color: ACCENT,
    fontFamily: FONT,
    fontSize: '0.55rem',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
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
  },

  // ── Difficulty screen ────────────────────────────────────────────────────

  diffBody: {
    padding: '1.1rem 1.2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.8rem',
    minWidth: '280px',
  },
  diffTitle: {
    margin: 0,
    color: ACCENT,
    fontFamily: FONT,
    fontSize: '0.7rem',
    letterSpacing: '0.06em',
  },
  diffList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },
  diffBtn: {
    background: 'rgba(200,168,80,0.05)',
    border: `1px solid rgba(200,168,80,0.3)`,
    color: ACCENT,
    cursor: 'pointer',
    padding: '0.75rem 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.6rem',
    width: '100%',
    textAlign: 'left',
    transition: 'background 0.1s, border-color 0.1s',
  },
  diffBtnLabel: {
    fontFamily: FONT,
    fontSize: '0.55rem',
    letterSpacing: '0.04em',
    flexShrink: 0,
  },
  diffBtnDesc: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.72rem',
    color: 'rgba(200,168,80,0.65)',
    flex: 1,
    textAlign: 'center',
  },
  diffBtnBest: {
    fontFamily: FONT,
    fontSize: '0.4rem',
    color: '#ffd700',
    flexShrink: 0,
  },

  // ── Game screen ──────────────────────────────────────────────────────────

  boardWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.7rem',
    gap: '0.5rem',
    overflowX: 'auto',
  },
  controlRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: '0.35rem',
  },
  faceBtn: {
    background: 'none',
    border: `1px solid rgba(200,168,80,0.3)`,
    cursor: 'pointer',
    fontSize: '1.1rem',
    lineHeight: 1,
    padding: '0.2rem 0.4rem',
    borderRadius: '3px',
  },
  changeDiffBtn: {
    background: 'none',
    border: `1px solid rgba(200,168,80,0.25)`,
    color: 'rgba(200,168,80,0.5)',
    cursor: 'pointer',
    fontFamily: FONT,
    fontSize: '0.35rem',
    padding: '0.3rem 0.5rem',
    letterSpacing: '0.03em',
  },

  // ── Grid cells ───────────────────────────────────────────────────────────

  grid: {
    display: 'grid',
    gap: '1px',
    background: SAND_SHADE,
    border: `2px solid ${SAND_SHADE}`,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: FONT,
    fontWeight: 'bold',
    lineHeight: 1,
    transition: 'background 0.05s',
    boxSizing: 'border-box',
  },
  cellHidden: {
    background: SAND_HIDDEN,
    border: `1px solid ${SAND_SHADE}`,
    boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.3)`,
  },
  cellRevealed: {
    background: SAND_OPEN,
    border: `1px solid ${SAND_OPEN_BG}`,
  },
  cellScorpion: {
    background: '#3A1A1A',
    border: `1px solid #5A2020`,
    fontSize: '1rem',
  },
  cellHit: {
    background: '#7A1A1A',
    border: `1px solid #B03030`,
    fontSize: '1rem',
  },

  // ── Stats ────────────────────────────────────────────────────────────────

  statsRow: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '0.2rem',
  },
  statChip: {
    fontFamily: FONT,
    fontSize: '0.42rem',
    color: 'rgba(200,168,80,0.55)',
  },

  // ── Result overlay ────────────────────────────────────────────────────────

  resultOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(13,17,23,0.88)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.55rem',
    padding: '1rem',
  },
  resultTitle: {
    margin: 0,
    fontFamily: FONT,
    fontSize: '1.1rem',
    letterSpacing: '0.06em',
    textAlign: 'center',
    textShadow: '0 0 16px currentColor',
  },
  resultSub: {
    margin: 0,
    fontFamily: FONT,
    fontSize: '0.52rem',
    color: ACCENT,
    textAlign: 'center',
  },
  resultBtns: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '0.2rem',
  },
  primaryBtn: {
    background: ACCENT,
    color: BG,
    border: 'none',
    padding: '0.6rem 1rem',
    fontFamily: FONT,
    fontSize: '0.5rem',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  secondaryBtn: {
    background: 'none',
    border: `1px solid ${ACCENT}`,
    color: ACCENT,
    padding: '0.6rem 1rem',
    fontFamily: FONT,
    fontSize: '0.42rem',
    cursor: 'pointer',
    letterSpacing: '0.03em',
  },
  ghostBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(200,168,80,0.45)',
    padding: '0.3rem',
    fontFamily: FONT,
    fontSize: '0.36rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  // ── Shared ────────────────────────────────────────────────────────────────

  hint: {
    margin: 0,
    color: 'rgba(200,168,80,0.35)',
    fontFamily: FONT,
    fontSize: '0.33rem',
    textAlign: 'center',
    padding: '0.5rem 0.8rem',
    borderTop: `1px solid rgba(200,168,80,0.12)`,
    flexShrink: 0,
    lineHeight: 1.8,
  },

  // ── Local leaderboard ─────────────────────────────────────────────────────

  lbSection: {
    width: '100%',
    background: 'rgba(200,168,80,0.05)',
    border: `1px solid rgba(200,168,80,0.22)`,
    padding: '0.55rem',
    marginTop: '0.2rem',
  },
  lbLabel: {
    margin: '0 0 0.4rem',
    fontFamily: FONT,
    fontSize: '0.38rem',
    color: 'rgba(200,168,80,0.85)',
    textAlign: 'center',
  },
  lbInputRow: {
    display: 'flex',
    gap: '0.35rem',
    width: '100%',
  },
  lbInput: {
    flex: 1,
    background: '#0d1117',
    border: `1px solid rgba(200,168,80,0.4)`,
    color: '#f5e6c8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.78rem',
    padding: '0.3rem 0.45rem',
    outline: 'none',
    minWidth: 0,
  },
  lbSaveBtn: {
    background: ACCENT,
    color: BG,
    border: 'none',
    fontFamily: FONT,
    fontSize: '0.38rem',
    padding: '0.3rem 0.6rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  lbError: {
    margin: '0.3rem 0 0',
    color: '#f44747',
    fontFamily: FONT,
    fontSize: '0.36rem',
    textAlign: 'center',
  },
  lbSavedMsg: {
    margin: '0.25rem 0',
    color: '#4ec9b0',
    fontFamily: FONT,
    fontSize: '0.42rem',
    textAlign: 'center',
  },
}
