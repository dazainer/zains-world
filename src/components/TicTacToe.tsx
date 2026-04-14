/**
 * TicTacToe — Mummy vs Player mini-game overlay.
 *
 * Player = X (Eye of Horus: 𓂀), Mummy = O (Ankh: ☥)
 * Three difficulty levels. Mummy uses minimax on hard (unbeatable).
 * Random taunt before each game; result commentary after.
 * Stats (W/L/D + best streak) persisted in localStorage per difficulty.
 *
 * Keyboard: Arrow keys navigate cells, Space/Enter to place, R to restart, Escape to close.
 * Mouse:    Click any empty cell to place.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  emptyBoard,
  checkWinner,
  getWinningLine,
  getMummyMove,
  loadStats,
  updateStats,
  randomTaunt,
  resultComment,
  type Board,
  type Cell,
  type Difficulty,
  type GameResult,
  type TTTStats,
} from '../lib/tictactoe'

import {
  fetchRemoteLeaderboard,
  getPlayerIdentity,
  setPlayerName,
  submitRemoteLeaderboardEntry,
  type RemoteLeaderboardData,
} from '../lib/leaderboard'

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  onViewLeaderboard?: () => void
}

// ── Screen flow ──────────────────────────────────────────────────────────────
//  difficulty → taunt → playing → result
//              (press to continue)

type Screen = 'difficulty' | 'taunt' | 'playing' | 'result'

// ── SFX ──────────────────────────────────────────────────────────────────────

function makeAudio(src: string, volume: number): HTMLAudioElement {
  const a = new Audio(src)
  a.volume = volume
  a.preload = 'auto'
  return a
}

function playSfx(audio: HTMLAudioElement | null) {
  if (!audio) return
  const clone = audio.cloneNode() as HTMLAudioElement
  clone.volume = audio.volume
  clone.play().catch(() => {})
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const MUMMY_DELAY_MS = 480

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   'EASY',
  medium: 'MEDIUM',
  hard:   'HARD',
}

const DIFFICULTY_SUBLABELS: Record<Difficulty, string> = {
  easy:   'The napping mummy',
  medium: 'The half-awake mummy',
  hard:   '3,000 years of practice',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TicTacToe({ onClose, onViewLeaderboard }: Props) {
  const [screen, setScreen]           = useState<Screen>('difficulty')
  const [difficulty, setDifficulty]   = useState<Difficulty>('medium')
  const [tauntText, setTauntText]     = useState('')
  const [board, setBoard]             = useState<Board>(emptyBoard())
  const [currentTurn, setCurrentTurn] = useState<Cell>('X')
  const [result, setResult]           = useState<GameResult>(null)
  const [winLine, setWinLine]         = useState<readonly [number, number, number] | null>(null)
  const [selectedCell, setSelectedCell] = useState(4)   // keyboard cursor, starts center
  const [mummyThinking, setMummyThinking] = useState(false)
  const [stats, setStats]             = useState<TTTStats>(() => loadStats('medium'))
  const [commentary, setCommentary]   = useState('')

  // Local leaderboard state
  const [lbPending, setLbPending]           = useState(false)
  const [lbPendingScore, setLbPendingScore] = useState(0)
  const [lbNameInput, setLbNameInput]       = useState('')
  const [lbNameError, setLbNameError]       = useState<string | null>(null)
  const [lbSaved, setLbSaved]               = useState(false)
  const [remoteLeaderboards, setRemoteLeaderboards] = useState<Partial<Record<Difficulty, RemoteLeaderboardData>>>({})

  // SFX refs (created once)
  const sfxMove = useRef<HTMLAudioElement | null>(null)
  const sfxWin  = useRef<HTMLAudioElement | null>(null)
  const sfxLose = useRef<HTMLAudioElement | null>(null)
  const mummyMoveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    sfxMove.current = makeAudio('/assets/sfx/interact_default.wav', 0.12)
    sfxWin.current  = makeAudio('/assets/sfx/snake_hs.wav', 0.35)
    sfxLose.current = makeAudio('/assets/sfx/snake_lose.wav', 0.24)
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetchRemoteLeaderboard('tictactoe', difficulty)
      .then((data) => {
        if (cancelled) return
        setRemoteLeaderboards((prev) => ({ ...prev, [difficulty]: data }))
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [difficulty])

  const remoteLeaderboard = remoteLeaderboards[difficulty] ?? null

  const qualifiesForGlobal = useCallback((score: number, playerName?: string) => {
    if (score <= 0 || !remoteLeaderboard) return true
    if (playerName) {
      const existing = remoteLeaderboard.entries.find((entry) => entry.username.toLowerCase() === playerName.toLowerCase())
      if (existing) return score > existing.score
    }
    if (remoteLeaderboard.entries.length < 10 || remoteLeaderboard.cutoffScore === null) return true
    return score > remoteLeaderboard.cutoffScore
  }, [remoteLeaderboard])

  const saveGlobalScore = useCallback(async (playerName: string, score: number, diff: Difficulty) => {
    const result = await submitRemoteLeaderboardEntry('tictactoe', playerName, score, diff, diff)
    if (!result.keptExisting) {
      setLbSaved(true)
    }
    const refreshed = await fetchRemoteLeaderboard('tictactoe', diff)
    setRemoteLeaderboards((prev) => ({ ...prev, [diff]: refreshed }))
  }, [])

  // ── Game state helpers ────────────────────────────────────────────────────

  const startGame = useCallback((diff: Difficulty) => {
    if (mummyMoveTimerRef.current !== null) {
      window.clearTimeout(mummyMoveTimerRef.current)
      mummyMoveTimerRef.current = null
    }
    setDifficulty(diff)
    setStats(loadStats(diff))
    setTauntText(randomTaunt())
    setScreen('taunt')
  }, [])

  const initBoard = useCallback(() => {
    if (mummyMoveTimerRef.current !== null) {
      window.clearTimeout(mummyMoveTimerRef.current)
      mummyMoveTimerRef.current = null
    }
    setBoard(emptyBoard())
    setCurrentTurn('X')
    setResult(null)
    setWinLine(null)
    setSelectedCell(4)
    setMummyThinking(false)
    setCommentary('')
    setLbPending(false)
    setLbPendingScore(0)
    setLbNameInput('')
    setLbNameError(null)
    setLbSaved(false)
    setScreen('playing')
  }, [])

  const finaliseResult = useCallback((b: Board, r: GameResult, diff: Difficulty) => {
    if (mummyMoveTimerRef.current !== null) {
      window.clearTimeout(mummyMoveTimerRef.current)
      mummyMoveTimerRef.current = null
    }
    setResult(r)
    setWinLine(getWinningLine(b))
    setCommentary(resultComment(r, diff))
    const newStats = updateStats(diff, r)
    setStats(newStats)
    setMummyThinking(false)
    setScreen('result')

    if (r === 'X') {
      playSfx(sfxWin.current)
      const streak = newStats.currentWinStreak
      const stored = getPlayerIdentity()
      if (stored) {
        if (qualifiesForGlobal(streak, stored.display)) {
          void saveGlobalScore(stored.raw, streak, diff).catch((error: unknown) => {
            setLbNameError(error instanceof Error ? error.message : 'Unable to save score')
          })
        }
      } else if (qualifiesForGlobal(streak)) {
        setLbPendingScore(streak)
        setLbPending(true)
      }
    } else if (r === 'O') {
      playSfx(sfxLose.current)
    }
  }, [qualifiesForGlobal, saveGlobalScore])

  // ── Player move ───────────────────────────────────────────────────────────

  const placePlayerMove = useCallback((index: number) => {
    if (
      screen !== 'playing' ||
      currentTurn !== 'X' ||
      board[index] !== null ||
      mummyThinking ||
      result !== null
    ) return

    playSfx(sfxMove.current)

    const next = [...board] as Board
    next[index] = 'X'
    setBoard(next)

    const r = checkWinner(next)
    if (r) {
      finaliseResult(next, r, difficulty)
      return
    }

    // Pass to mummy
    setCurrentTurn('O')
    setMummyThinking(true)

    mummyMoveTimerRef.current = window.setTimeout(() => {
      mummyMoveTimerRef.current = null
      const move = getMummyMove(next, difficulty)
      playSfx(sfxMove.current)

      const afterMummy = [...next] as Board
      afterMummy[move] = 'O'
      setBoard(afterMummy)

      const r2 = checkWinner(afterMummy)
      if (r2) {
        finaliseResult(afterMummy, r2, difficulty)
      } else {
        setCurrentTurn('X')
        setMummyThinking(false)
      }
    }, MUMMY_DELAY_MS)
  }, [screen, currentTurn, board, mummyThinking, result, difficulty, finaliseResult])

  useEffect(() => {
    return () => {
      if (mummyMoveTimerRef.current !== null) {
        window.clearTimeout(mummyMoveTimerRef.current)
      }
    }
  }, [])

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return

      if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (screen === 'difficulty') {
        // D-pad cycles difficulties; Enter starts chosen one
        if (e.code === 'ArrowLeft') {
          setDifficulty(d => d === 'hard' ? 'medium' : d === 'medium' ? 'easy' : 'easy')
        } else if (e.code === 'ArrowRight') {
          setDifficulty(d => d === 'easy' ? 'medium' : d === 'medium' ? 'hard' : 'hard')
        } else if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          startGame(difficulty)
        }
        return
      }

      if (screen === 'taunt') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          initBoard()
        }
        return
      }

      if (screen === 'result') {
        if (e.code === 'KeyR') {
          e.preventDefault()
          initBoard()
        }
        return
      }

      if (screen === 'playing') {
        if (e.code === 'KeyR') {
          e.preventDefault()
          initBoard()
          return
        }

        // Arrow navigation
        const COL_OFFSET: Record<string, number> = {
          ArrowLeft:  -1,
          ArrowRight:  1,
          ArrowUp:    -3,
          ArrowDown:   3,
        }
        if (e.code in COL_OFFSET) {
          e.preventDefault()
          setSelectedCell(prev => {
            const next = prev + COL_OFFSET[e.code]
            if (next < 0 || next > 8) return prev
            // Keep same row for horizontal
            if ((e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
              const prevRow = Math.floor(prev / 3)
              const nextRow = Math.floor(next / 3)
              if (prevRow !== nextRow) return prev
            }
            return next
          })
          return
        }

        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          placePlayerMove(selectedCell)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, difficulty, selectedCell, placePlayerMove, startGame, initBoard, onClose])

  // ── Local leaderboard save ────────────────────────────────────────────────

  async function handleLbSave() {
    const validation = setPlayerName(lbNameInput)
    if (!validation.ok) {
      setLbNameError(validation.error)
      return
    }
    try {
      await saveGlobalScore(validation.submitValue, lbPendingScore, difficulty)
      setLbPending(false)
    } catch (error) {
      setLbNameError(error instanceof Error ? error.message : 'Unable to save score')
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────

  const cellSymbol = (cell: Cell) => {
    if (cell === 'X') return '𓂀'
    if (cell === 'O') return '☥'
    return ''
  }

  const cellColor = (cell: Cell) => {
    if (cell === 'X') return PLAYER_COLOR
    if (cell === 'O') return MUMMY_COLOR
    return 'transparent'
  }

  const isWinCell = (i: number) => winLine?.includes(i) ?? false

  // ── Screens ───────────────────────────────────────────────────────────────

  const renderDifficultyScreen = () => (
    <div style={s.screenWrap}>
      <p style={s.screenTitle}>TIC-TAC-TOE</p>
      <p style={s.screenSub}>vs THE MUMMY</p>

      <p style={{ ...s.label, marginTop: '1.4rem' }}>SELECT DIFFICULTY</p>

      <div style={s.diffRow}>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button
            key={d}
            type="button"
            style={{
              ...s.diffBtn,
              ...(difficulty === d ? s.diffBtnActive : {}),
            }}
            onClick={() => startGame(d)}
            onMouseEnter={() => setDifficulty(d)}
          >
            <span style={s.diffBtnLabel}>{DIFFICULTY_LABELS[d]}</span>
            <span style={s.diffBtnSub}>{DIFFICULTY_SUBLABELS[d]}</span>
          </button>
        ))}
      </div>

      <p style={s.hint}>← → to choose  ·  ENTER to start</p>
    </div>
  )

  const renderTauntScreen = () => (
    <div style={s.screenWrap}>
      <div style={s.mummyAvatar}>☥</div>
      <p style={s.mummyName}>THE MUMMY</p>
      <div style={s.speechBubble}>
        <p style={s.speechText}>{tauntText}</p>
      </div>
      <button type="button" style={s.primaryBtn} onClick={initBoard}>
        ACCEPT THE CHALLENGE
      </button>
      <p style={s.hint}>SPACE to continue</p>
    </div>
  )

  const renderBoard = () => {
    const statusText = () => {
      if (mummyThinking) return 'The mummy ponders...'
      if (currentTurn === 'X') return 'Your turn (𓂀)'
      return 'Mummy thinking...'
    }

    return (
      <div style={s.boardWrap}>
        {/* Status bar */}
        <div style={s.statusBar}>
          <span style={{ ...s.statusText, color: currentTurn === 'X' && !mummyThinking ? PLAYER_COLOR : MUMMY_COLOR }}>
            {statusText()}
          </span>
          <span style={s.diffBadge}>{DIFFICULTY_LABELS[difficulty]}</span>
        </div>

        {/* Board grid */}
        <div style={s.grid}>
          {board.map((cell, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const isSelected = selectedCell === i && currentTurn === 'X' && !mummyThinking && !result
            const isWin = isWinCell(i)

            return (
              <button
                key={i}
                type="button"
                style={{
                  ...s.cell,
                  ...(row < 2 ? s.cellBorderBottom : {}),
                  ...(col < 2 ? s.cellBorderRight : {}),
                  ...(isSelected ? s.cellSelected : {}),
                  ...(isWin ? s.cellWin : {}),
                  color: cellColor(cell),
                  cursor: cell === null && currentTurn === 'X' && !mummyThinking ? 'pointer' : 'default',
                }}
                onClick={() => placePlayerMove(i)}
                onMouseEnter={() => {
                  if (currentTurn === 'X' && !mummyThinking && !result) {
                    setSelectedCell(i)
                  }
                }}
                aria-label={`Cell ${i}, ${cell ?? 'empty'}`}
              >
                <span style={s.cellSymbol}>{cellSymbol(cell)}</span>
              </button>
            )
          })}
        </div>

        {/* Stats strip */}
        <div style={s.statsStrip}>
          <span style={{ ...s.statItem, color: PLAYER_COLOR }}>𓂀 {stats.wins}W</span>
          <span style={s.statItem}>{stats.draws}D</span>
          <span style={{ ...s.statItem, color: MUMMY_COLOR }}>☥ {stats.losses}L</span>
          <span style={{ ...s.statItem, color: '#ffd700' }}>
            🔥 {stats.currentWinStreak > 0 ? stats.currentWinStreak : stats.bestWinStreak}
          </span>
        </div>

        <p style={s.hint}>Arrows + SPACE to place  ·  R restart  ·  ESC close</p>
      </div>
    )
  }

  const renderResultScreen = () => {
    const resultLabel = result === 'X' ? 'YOU WIN!' : result === 'O' ? 'MUMMY WINS' : 'DRAW'
    const resultColor = result === 'X' ? PLAYER_COLOR : result === 'O' ? MUMMY_COLOR : '#ffd700'

    return (
      <div style={s.screenWrap}>
        {/* Show the final board */}
        <div style={{ ...s.grid, pointerEvents: 'none', opacity: 0.8 }}>
          {board.map((cell, i) => {
            const row = Math.floor(i / 3)
            const col = i % 3
            const isWin = isWinCell(i)
            return (
              <div
                key={i}
                style={{
                  ...s.cell,
                  ...(row < 2 ? s.cellBorderBottom : {}),
                  ...(col < 2 ? s.cellBorderRight : {}),
                  ...(isWin ? s.cellWin : {}),
                  color: cellColor(cell),
                  cursor: 'default',
                }}
              >
                <span style={s.cellSymbol}>{cellSymbol(cell)}</span>
              </div>
            )
          })}
        </div>

        <p style={{ ...s.resultLabel, color: resultColor }}>{resultLabel}</p>

        <div style={s.mummyAvatar}>☥</div>
        <div style={s.speechBubble}>
          <p style={s.speechText}>{commentary}</p>
        </div>

        {/* Stats */}
        <div style={s.statsFull}>
          <span style={{ ...s.statItem, color: PLAYER_COLOR }}>𓂀 {stats.wins}W</span>
          <span style={s.statItem}>{stats.draws}D</span>
          <span style={{ ...s.statItem, color: MUMMY_COLOR }}>☥ {stats.losses}L</span>
          {stats.bestWinStreak > 0 && (
            <span style={{ ...s.statItem, color: '#ffd700' }}>best: {stats.bestWinStreak}</span>
          )}
        </div>

        {/* Local leaderboard prompt */}
        {lbPending && !lbSaved && (
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
        {lbSaved && (
          <p style={s.lbSavedMsg}>✓ Saved to Hall of Records</p>
        )}

        <div style={s.btnRow}>
          <button type="button" style={s.primaryBtn} onClick={initBoard}>
            REMATCH  (R)
          </button>
          <button type="button" style={s.secondaryBtn} onClick={() => setScreen('difficulty')}>
            CHANGE DIFFICULTY
          </button>
        </div>

        {onViewLeaderboard && (
          <button type="button" style={s.ghostBtn} onClick={onViewLeaderboard}>
            VIEW LEADERBOARD
          </button>
        )}

        <p style={s.hint}>R to rematch  ·  ESC to close</p>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div style={s.backdrop} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <span style={s.headerText}>TIC-TAC-TOE · {DIFFICULTY_LABELS[difficulty]}</span>
          <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Screen content */}
        <div style={s.body}>
          {screen === 'difficulty' && renderDifficultyScreen()}
          {screen === 'taunt'      && renderTauntScreen()}
          {screen === 'playing'    && renderBoard()}
          {screen === 'result'     && renderResultScreen()}
        </div>
      </div>
    </div>
  )
}

// ── Colors ────────────────────────────────────────────────────────────────────

const PLAYER_COLOR = '#4ec9b0'  // teal — player (Eye of Horus 𓂀)
const MUMMY_COLOR  = '#c8a850'  // gold — mummy (Ankh ☥)
const BG           = '#0d1117'
const BORDER       = '#c8a850'
const DIM          = 'rgba(200,168,80,0.22)'
const FONT         = "'Press Start 2P', monospace"

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
    border: `2px solid ${BORDER}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    minWidth: '360px',
    maxWidth: '420px',
    width: '90vw',
    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.55rem 0.9rem',
    borderBottom: `1px solid ${BORDER}`,
  },
  headerText: {
    color: MUMMY_COLOR,
    fontFamily: FONT,
    fontSize: '0.58rem',
    letterSpacing: '0.04em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: MUMMY_COLOR,
    cursor: 'pointer',
    fontFamily: FONT,
    fontSize: '0.7rem',
    padding: '0 0.2rem',
    lineHeight: 1,
  },
  body: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // ── Screens ────────────────────────────────────────────────────────────────

  screenWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
    width: '100%',
  },
  screenTitle: {
    margin: 0,
    color: MUMMY_COLOR,
    fontFamily: FONT,
    fontSize: '1.05rem',
    letterSpacing: '0.06em',
    textAlign: 'center',
  },
  screenSub: {
    margin: 0,
    color: 'rgba(200,168,80,0.6)',
    fontFamily: FONT,
    fontSize: '0.55rem',
    textAlign: 'center',
  },
  label: {
    margin: 0,
    color: 'rgba(200,168,80,0.7)',
    fontFamily: FONT,
    fontSize: '0.5rem',
    textAlign: 'center',
  },

  // ── Difficulty ─────────────────────────────────────────────────────────────

  diffRow: {
    display: 'flex',
    gap: '0.5rem',
    width: '100%',
    marginTop: '0.4rem',
  },
  diffBtn: {
    flex: 1,
    background: 'none',
    border: `1px solid ${DIM}`,
    color: 'rgba(200,168,80,0.55)',
    fontFamily: FONT,
    cursor: 'pointer',
    padding: '0.6rem 0.3rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.35rem',
    transition: 'border-color 0.12s, color 0.12s, background 0.12s',
  },
  diffBtnActive: {
    border: `1px solid ${BORDER}`,
    color: MUMMY_COLOR,
    background: 'rgba(200,168,80,0.07)',
  },
  diffBtnLabel: {
    fontFamily: FONT,
    fontSize: '0.52rem',
  },
  diffBtnSub: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.6rem',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 1.3,
  },

  // ── Taunt / Avatar ─────────────────────────────────────────────────────────

  mummyAvatar: {
    fontSize: '2.2rem',
    color: MUMMY_COLOR,
    marginTop: '0.4rem',
  },
  mummyName: {
    margin: 0,
    color: MUMMY_COLOR,
    fontFamily: FONT,
    fontSize: '0.55rem',
    letterSpacing: '0.08em',
  },
  speechBubble: {
    background: 'rgba(200,168,80,0.06)',
    border: `1px solid ${DIM}`,
    borderRadius: '6px',
    padding: '0.75rem 0.9rem',
    width: '100%',
    marginTop: '0.2rem',
    marginBottom: '0.4rem',
  },
  speechText: {
    margin: 0,
    color: '#f5e6c8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.82rem',
    lineHeight: 1.55,
    textAlign: 'center',
  },

  // ── Board ──────────────────────────────────────────────────────────────────

  boardWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0.3rem 0',
  },
  statusText: {
    fontFamily: FONT,
    fontSize: '0.48rem',
  },
  diffBadge: {
    fontFamily: FONT,
    fontSize: '0.4rem',
    color: 'rgba(200,168,80,0.55)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    width: '240px',
    height: '240px',
    border: `2px solid ${BORDER}`,
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    outline: 'none',
    transition: 'background 0.08s',
    padding: 0,
  },
  cellBorderBottom: {
    borderBottom: `2px solid ${BORDER}`,
  },
  cellBorderRight: {
    borderRight: `2px solid ${BORDER}`,
  },
  cellSelected: {
    background: 'rgba(200,168,80,0.1)',
  },
  cellWin: {
    background: 'rgba(200,168,80,0.18)',
  },
  cellSymbol: {
    fontSize: '2.8rem',
    lineHeight: 1,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },

  // ── Stats ──────────────────────────────────────────────────────────────────

  statsStrip: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '0.35rem',
  },
  statsFull: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '0.3rem',
  },
  statItem: {
    fontFamily: FONT,
    fontSize: '0.48rem',
    color: 'rgba(200,168,80,0.7)',
  },

  // ── Result ────────────────────────────────────────────────────────────────

  resultLabel: {
    margin: '0.5rem 0 0.2rem',
    fontFamily: FONT,
    fontSize: '1rem',
    letterSpacing: '0.06em',
    textAlign: 'center',
  },

  // ── Buttons ───────────────────────────────────────────────────────────────

  btnRow: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '0.3rem',
  },
  primaryBtn: {
    background: MUMMY_COLOR,
    color: BG,
    border: 'none',
    padding: '0.65rem 1rem',
    fontFamily: FONT,
    fontSize: '0.52rem',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  secondaryBtn: {
    background: 'none',
    border: `1px solid ${BORDER}`,
    color: MUMMY_COLOR,
    padding: '0.65rem 1rem',
    fontFamily: FONT,
    fontSize: '0.42rem',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  ghostBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(200,168,80,0.5)',
    padding: '0.4rem',
    fontFamily: FONT,
    fontSize: '0.38rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  // ── Common ────────────────────────────────────────────────────────────────

  hint: {
    margin: '0.1rem 0 0',
    color: 'rgba(200,168,80,0.38)',
    fontFamily: FONT,
    fontSize: '0.36rem',
    textAlign: 'center',
    lineHeight: 1.6,
  },

  // ── Local leaderboard ─────────────────────────────────────────────────────

  lbSection: {
    width: '100%',
    background: 'rgba(200,168,80,0.05)',
    border: `1px solid rgba(200,168,80,0.22)`,
    padding: '0.6rem',
    marginTop: '0.35rem',
  },
  lbLabel: {
    margin: '0 0 0.4rem',
    fontFamily: FONT,
    fontSize: '0.4rem',
    color: 'rgba(200,168,80,0.85)',
    textAlign: 'center',
  },
  lbInputRow: {
    display: 'flex',
    gap: '0.4rem',
    width: '100%',
  },
  lbInput: {
    flex: 1,
    background: '#0d1117',
    border: `1px solid rgba(200,168,80,0.4)`,
    color: '#f5e6c8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.8rem',
    padding: '0.35rem 0.5rem',
    outline: 'none',
    minWidth: 0,
  },
  lbSaveBtn: {
    background: MUMMY_COLOR,
    color: BG,
    border: 'none',
    fontFamily: FONT,
    fontSize: '0.4rem',
    padding: '0.35rem 0.65rem',
    cursor: 'pointer',
    flexShrink: 0,
  },
  lbError: {
    margin: '0.3rem 0 0',
    color: '#f44747',
    fontFamily: FONT,
    fontSize: '0.38rem',
    textAlign: 'center',
  },
  lbSavedMsg: {
    margin: '0.3rem 0',
    color: PLAYER_COLOR,
    fontFamily: FONT,
    fontSize: '0.42rem',
    textAlign: 'center',
  },
}
