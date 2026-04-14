/**
 * Minesweeper — Desert-themed mini-game overlay for the Secret Room.
 *
 * Instead of mines the player avoids scorpions buried under sand tiles.
 * Three difficulties. First click is always safe. Flood-fill on empty cells.
 * Timer starts on first click. Best times persisted in localStorage per
 * difficulty.
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

interface Props {
  onClose: () => void
  onViewLeaderboard?: () => void
}

function makeAudio(src: string, vol: number): HTMLAudioElement {
  const audio = new Audio(src)
  audio.volume = vol
  audio.preload = 'auto'
  return audio
}

function playSfx(audio: HTMLAudioElement | null) {
  if (!audio) return
  const clone = audio.cloneNode() as HTMLAudioElement
  clone.volume = audio.volume
  void clone.play().catch(() => {})
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
}

const DIFFICULTY_DESCS: Record<Difficulty, string> = {
  easy: '8×8 · 10 scorpions',
  medium: '12×12 · 25 scorpions',
  hard: '16×16 · 50 scorpions',
}

export default function Minesweeper({ onClose, onViewLeaderboard }: Props) {
  const [screen, setScreen] = useState<'difficulty' | 'game'>('difficulty')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [board, setBoard] = useState<Board>(() =>
    createEmptyBoard(DIFF_CONFIG.medium.rows, DIFF_CONFIG.medium.cols),
  )
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [hitCell, setHitCell] = useState<[number, number] | null>(null)
  const [stats, setStats] = useState<MinesweeperStats>(() => loadStats('medium'))
  const [newBest, setNewBest] = useState(false)

  const sfxReveal = useRef<HTMLAudioElement | null>(null)
  const sfxWin = useRef<HTMLAudioElement | null>(null)
  const sfxLose = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    sfxReveal.current = makeAudio('/assets/sfx/interact_default.wav', 0.08)
    sfxWin.current = makeAudio('/assets/sfx/snake_hs.wav', 0.35)
    sfxLose.current = makeAudio('/assets/sfx/snake_lose.wav', 0.24)
    return () => {
      sfxReveal.current = null
      sfxWin.current = null
      sfxLose.current = null
    }
  }, [])

  useEffect(() => {
    if (phase === 'playing') {
      timerRef.current = window.setInterval(() => {
        setElapsed((t) => t + 1)
      }, 1000)
    } else if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase])

  const initGame = useCallback((diff: Difficulty) => {
    const cfg = DIFF_CONFIG[diff]
    setDifficulty(diff)
    setBoard(createEmptyBoard(cfg.rows, cfg.cols))
    setPhase('idle')
    setElapsed(0)
    setHitCell(null)
    setNewBest(false)
    setStats(loadStats(diff))
    setScreen('game')
  }, [])

  const restartGame = useCallback(() => {
    initGame(difficulty)
  }, [difficulty, initGame])

  const handleReveal = useCallback((row: number, col: number) => {
    if (phase === 'won' || phase === 'lost') return
    const cell = board[row][col]
    if (cell.revealed || cell.flagged) return

    let nextBoard = board
    let nextPhase = phase

    if (phase === 'idle') {
      const cfg = DIFF_CONFIG[difficulty]
      nextBoard = placeScorpions(board, row, col, cfg.scorpions)
      nextPhase = 'playing'
      setPhase('playing')
    }

    if (nextBoard[row][col].scorpion) {
      const exposed = exposeScorpions(nextBoard, row, col)
      setBoard(exposed)
      setHitCell([row, col])
      setPhase('lost')
      setStats(recordLoss(difficulty))
      playSfx(sfxLose.current)
      return
    }

    playSfx(sfxReveal.current)
    const revealed = revealFrom(nextBoard, row, col)
    setBoard(revealed)

    if (checkWin(revealed)) {
      setPhase('won')
      const newStats = recordWin(difficulty, elapsed)
      setNewBest(newStats.bestTime === elapsed || newStats.wins === 1)
      setStats(newStats)
      playSfx(sfxWin.current)
      return
    }

    if (nextPhase === 'playing' && phase === 'idle') {
      setPhase('playing')
    }
  }, [board, difficulty, elapsed, phase])

  const handleFlag = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    if (phase === 'won' || phase === 'lost') return
    if (board[row][col].revealed) return
    setBoard((current) => toggleFlag(current, row, col))
  }, [board, phase])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.code === 'KeyR' && screen === 'game') {
        e.preventDefault()
        restartGame()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, restartGame, screen])

  const cfg = DIFF_CONFIG[difficulty]
  const minesLeft = cfg.scorpions - countFlags(board)
  const timerText = formatTime(elapsed)
  const isGameOver = phase === 'won' || phase === 'lost'

  if (screen === 'difficulty') {
    return (
      <div style={s.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div style={s.panel}>
          <div style={s.header}>
            <span style={s.headerText}>DESERT MINESWEEPER</span>
            <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div style={s.diffBody}>
            <p style={s.diffTitle}>SELECT DIFFICULTY</p>

            <div style={s.diffList}>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
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

  const faceEmoji = phase === 'won' ? '😎' : phase === 'lost' ? '💀' : '🔍'

  return (
    <div style={s.backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...s.panel, width: 'fit-content' }}>
        <div style={s.header}>
          <span style={s.headerText}>
            {DIFFICULTY_LABELS[difficulty]} · 🦂 {minesLeft}
          </span>
          <span style={s.headerText}>{timerText}</span>
          <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div style={{ ...s.boardWrap, position: 'relative' }}>
          <div style={s.controlRow}>
            <button type="button" style={s.faceBtn} onClick={restartGame} title="Restart (R)">
              {faceEmoji}
            </button>
            <button type="button" style={s.changeDiffBtn} onClick={() => setScreen('difficulty')}>
              CHANGE DIFF
            </button>
          </div>

          <div
            style={{
              ...s.grid,
              gridTemplateColumns: `repeat(${cfg.cols}, ${cfg.cellPx}px)`,
              gridTemplateRows: `repeat(${cfg.rows}, ${cfg.cellPx}px)`,
            }}
            onContextMenu={(e) => e.preventDefault()}
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
                        ? (cell.scorpion ? (isHit ? s.cellHit : s.cellScorpion) : s.cellRevealed)
                        : s.cellHidden),
                      cursor: canClick ? 'pointer' : 'default',
                      color: cell.revealed && !cell.scorpion && cell.adjacent > 0
                        ? NUMBER_COLORS[cell.adjacent]
                        : undefined,
                    }}
                    onClick={() => handleReveal(r, c)}
                    onContextMenu={(e) => handleFlag(e, r, c)}
                  >
                    {cell.revealed
                      ? (cell.scorpion ? (isHit ? '💥' : '🦂') : (cell.adjacent > 0 ? cell.adjacent : ''))
                      : (cell.flagged ? '🚩' : '')}
                  </div>
                )
              }),
            )}
          </div>

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

          {isGameOver && (
            <div style={s.resultOverlay}>
              <p
                style={{
                  ...s.resultTitle,
                  color: phase === 'won' ? ACCENT : '#f44747',
                }}
              >
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

const BG = '#0d1117'
const ACCENT = '#c8a850'
const FONT = "'Press Start 2P', monospace"

const SAND_HIDDEN = '#5C3A1A'
const SAND_SHADE = '#3D2410'
const SAND_OPEN = '#C4924A'
const SAND_OPEN_BG = '#D4A85E'

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
    border: '1px solid rgba(200,168,80,0.3)',
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
    border: '1px solid rgba(200,168,80,0.3)',
    cursor: 'pointer',
    fontSize: '1.1rem',
    lineHeight: 1,
    padding: '0.2rem 0.4rem',
    borderRadius: '3px',
  },
  changeDiffBtn: {
    background: 'none',
    border: '1px solid rgba(200,168,80,0.25)',
    color: 'rgba(200,168,80,0.5)',
    cursor: 'pointer',
    fontFamily: FONT,
    fontSize: '0.35rem',
    padding: '0.3rem 0.5rem',
    letterSpacing: '0.03em',
  },
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
    boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.3)',
  },
  cellRevealed: {
    background: SAND_OPEN,
    border: `1px solid ${SAND_OPEN_BG}`,
  },
  cellScorpion: {
    background: '#3A1A1A',
    border: '1px solid #5A2020',
    fontSize: '1rem',
  },
  cellHit: {
    background: '#7A1A1A',
    border: '1px solid #B03030',
    fontSize: '1rem',
  },
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
  hint: {
    margin: 0,
    color: 'rgba(200,168,80,0.35)',
    fontFamily: FONT,
    fontSize: '0.33rem',
    textAlign: 'center',
    padding: '0.5rem 0.8rem',
    borderTop: '1px solid rgba(200,168,80,0.12)',
    flexShrink: 0,
    lineHeight: 1.8,
  },
}
