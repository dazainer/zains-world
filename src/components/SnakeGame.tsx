/**
 * SnakeGame — classic Snake mini-game playable in the Secret Room.
 * Canvas-based. Arrow keys to move, Escape to close.
 * Keeps a session high score + online leaderboard.
 */
import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  onClose: () => void
}

const GRID = 20
const CELL = 14
const CANVAS_SIZE = GRID * CELL  // 280px
const DISPLAY_SCALE = 1.85
const DISPLAY_SIZE = Math.round(CANVAS_SIZE * DISPLAY_SCALE)

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Pos = { x: number; y: number }

interface LeaderboardEntry {
  rank: number
  username: string
  score: number
}

interface LeaderboardData {
  topScore: { username: string; score: number } | null
  entries: LeaderboardEntry[]
  cutoffScore: number | null
}

let sessionHighScore = 0

const API_URL = '/api/snake-leaderboard'

export default function SnakeGame({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(sessionHighScore)
  const [gameOver, setGameOver] = useState(false)
  const [runId, setRunId] = useState(0)

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  const [lbLoading, setLbLoading] = useState(true)
  const [lbError, setLbError] = useState<string | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Submission state
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const snake = useRef<Pos[]>([{ x: 10, y: 10 }])
  const food = useRef<Pos>(randomFood([{ x: 10, y: 10 }]))
  const dir = useRef<Dir>('RIGHT')
  const nextDir = useRef<Dir>('RIGHT')
  const rafId = useRef<number | null>(null)
  const lastTick = useRef(0)
  const TICK_MS = 120

  // Track final score for game-over qualification check
  const finalScoreRef = useRef(0)

  // SFX
  const sfxEat = useRef<HTMLAudioElement | null>(null)
  const sfxLose = useRef<HTMLAudioElement | null>(null)
  const sfxHs = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    sfxEat.current = new Audio('/assets/sfx/snake_eat.wav')
    sfxEat.current.volume = 0.12
    sfxLose.current = new Audio('/assets/sfx/snake_lose.wav')
    sfxLose.current.volume = 0.24
    sfxHs.current = new Audio('/assets/sfx/snake_hs.wav')
    sfxHs.current.volume = 0.4
  }, [])

  function playSfx(audio: HTMLAudioElement | null) {
    if (!audio) return
    audio.currentTime = 0
    audio.play().catch(() => {})
  }

  function stopAllSfx() {
    for (const ref of [sfxEat, sfxLose, sfxHs]) {
      if (ref.current) { ref.current.pause(); ref.current.currentTime = 0 }
    }
  }

  function randomFood(snakeBody: Pos[]): Pos {
    let pos: Pos
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
    } while (snakeBody.some((s) => s.x === pos.x && s.y === pos.y))
    return pos
  }

  // ---------- leaderboard fetch ----------

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true)
    setLbError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: LeaderboardData = await res.json()
      setLeaderboard(data)
    } catch {
      setLbError('Unable to load leaderboard')
    } finally {
      setLbLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  // ---------- qualification check ----------

  function qualifiesForTop10(s: number): boolean {
    if (s <= 0) return false
    if (!leaderboard) return false
    if (leaderboard.entries.length < 10) return true
    if (leaderboard.cutoffScore === null) return true
    return s > leaderboard.cutoffScore
  }

  // ---------- submit ----------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed, score: finalScoreRef.current }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Unable to submit score')
        return
      }
      setSubmitted(true)
      await fetchLeaderboard()
    } catch {
      setSubmitError('Unable to submit score')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- restart ----------

  function restart() {
    snake.current = [{ x: 10, y: 10 }]
    food.current = randomFood(snake.current)
    dir.current = 'RIGHT'
    nextDir.current = 'RIGHT'
    lastTick.current = 0
    finalScoreRef.current = 0
    setScore(0)
    setGameOver(false)
    setSubmitted(false)
    setSubmitError(null)
    setUsername('')
    setRunId((i) => i + 1)
  }

  // ---------- game loop ----------

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const handleKey = (e: KeyboardEvent) => {
      // Don't intercept keys when leaderboard is open or submitting
      if (showLeaderboard) {
        if (e.code === 'Escape') { e.preventDefault(); setShowLeaderboard(false) }
        return
      }

      if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (gameOver && (e.code === 'Enter' || e.code === 'NumpadEnter')) {
        // Don't restart if actively in the username input
        const active = document.activeElement
        if (active && active.tagName === 'INPUT') return
        e.preventDefault()
        restart()
        return
      }

      // Skip WASD movement keys when an input is focused (username entry)
      const active = document.activeElement
      const inputFocused = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')

      let handled = false

      if ((e.code === 'ArrowUp' || (!inputFocused && e.code === 'KeyW')) && dir.current !== 'DOWN') {
        nextDir.current = 'UP'
        handled = true
      }
      if ((e.code === 'ArrowDown' || (!inputFocused && e.code === 'KeyS')) && dir.current !== 'UP') {
        nextDir.current = 'DOWN'
        handled = true
      }
      if ((e.code === 'ArrowLeft' || (!inputFocused && e.code === 'KeyA')) && dir.current !== 'RIGHT') {
        nextDir.current = 'LEFT'
        handled = true
      }
      if ((e.code === 'ArrowRight' || (!inputFocused && e.code === 'KeyD')) && dir.current !== 'LEFT') {
        nextDir.current = 'RIGHT'
        handled = true
      }

      if (handled) e.preventDefault()
    }
    window.addEventListener('keydown', handleKey)

    const loop = (ts: number) => {
      rafId.current = requestAnimationFrame(loop)
      if (ts - lastTick.current < TICK_MS) return
      lastTick.current = ts

      dir.current = nextDir.current
      const head = snake.current[0]
      const newHead: Pos = {
        x: head.x + (dir.current === 'RIGHT' ? 1 : dir.current === 'LEFT' ? -1 : 0),
        y: head.y + (dir.current === 'DOWN'  ? 1 : dir.current === 'UP'   ? -1 : 0),
      }

      const die = () => {
        const finalScore = snake.current.length - 1
        finalScoreRef.current = finalScore
        const isNewHs = finalScore > sessionHighScore
        const isLbQualifier = qualifiesForTop10(finalScore)
        if (isNewHs || isLbQualifier) {
          playSfx(sfxHs.current)
        } else {
          playSfx(sfxLose.current)
        }
        setGameOver(true)
        if (rafId.current) cancelAnimationFrame(rafId.current)
      }

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
        die()
        return
      }
      // Self collision
      if (snake.current.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        die()
        return
      }

      const ateFood = newHead.x === food.current.x && newHead.y === food.current.y
      const newSnake = [newHead, ...snake.current]
      if (!ateFood) newSnake.pop()
      else {
        playSfx(sfxEat.current)
        food.current = randomFood(newSnake)
        const newScore = newSnake.length - 1
        setScore(newScore)
        if (newScore > sessionHighScore) {
          sessionHighScore = newScore
          setHighScore(newScore)
        }
      }
      snake.current = newSnake

      // Draw
      ctx.fillStyle = '#0d1117'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.fillStyle = '#00ff41'
      snake.current.forEach(({ x, y }) => ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2))

      ctx.fillStyle = '#ff4444'
      ctx.fillRect(food.current.x * CELL + 2, food.current.y * CELL + 2, CELL - 4, CELL - 4)
    }

    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.fillStyle = '#00ff41'
    snake.current.forEach(({ x, y }) => ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2))
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(food.current.x * CELL + 2, food.current.y * CELL + 2, CELL - 4, CELL - 4)

    rafId.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('keydown', handleKey)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [gameOver, onClose, runId, showLeaderboard])

  // ---------- render helpers ----------

  const qualifies = gameOver && qualifiesForTop10(score)

  const topScoreDisplay = leaderboard?.topScore
    ? `${leaderboard.topScore.username} - ${leaderboard.topScore.score}`
    : lbLoading ? '...' : '—'

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerText}>SNAKE</span>
          <span style={styles.headerText}>Score: {score} | Best: {highScore}</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Leaderboard high score bar */}
        <div style={styles.lbBar}>
          <span style={styles.lbBarText}>
            Leaderboard High Score: {topScoreDisplay}
          </span>
          <button
            style={styles.viewLbBtn}
            onClick={() => { stopAllSfx(); setShowLeaderboard(true) }}
          >
            View Leaderboard
          </button>
        </div>

        {/* Game board */}
        <div style={styles.boardWrap}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={styles.canvas}
          />

          {/* Game over overlay */}
          {gameOver && !showLeaderboard && (
            <div style={styles.gameOver}>
              <p style={styles.gameOverText}>GAME OVER</p>
              <p style={styles.gameOverScore}>Score: {score}</p>

              {/* Qualification form */}
              {qualifies && !submitted && (
                <div style={styles.submitSection}>
                  <p style={styles.qualifyText}>Top 10 score! Enter a username to submit:</p>
                  <form onSubmit={handleSubmit} style={styles.submitForm}>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      maxLength={16}
                      minLength={3}
                      autoFocus
                      style={styles.usernameInput}
                      disabled={submitting}
                    />
                    <button
                      type="submit"
                      style={{
                        ...styles.submitBtn,
                        opacity: submitting || username.trim().length < 3 ? 0.5 : 1,
                      }}
                      disabled={submitting || username.trim().length < 3}
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </form>
                  {submitError && <p style={styles.errorText}>{submitError}</p>}
                </div>
              )}

              {/* Post-submit confirmation */}
              {submitted && (
                <p style={styles.successText}>Score submitted!</p>
              )}

              <div style={styles.gameOverBtns}>
                <button style={styles.restartBtn} onClick={restart}>Play Again</button>
                <button style={styles.viewLbBtnAlt} onClick={() => { stopAllSfx(); setShowLeaderboard(true) }}>
                  View Leaderboard
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard overlay */}
          {showLeaderboard && (
            <div style={styles.leaderboardOverlay}>
              <p style={styles.lbTitle}>LEADERBOARD</p>
              {lbLoading && <p style={styles.lbMsg}>Loading...</p>}
              {lbError && <p style={styles.errorText}>{lbError}</p>}
              {!lbLoading && !lbError && leaderboard && (
                <div style={styles.lbList}>
                  {leaderboard.entries.length === 0 && (
                    <p style={styles.lbMsg}>No scores yet. Be the first!</p>
                  )}
                  {leaderboard.entries.map((entry) => (
                    <div
                      key={entry.rank}
                      style={{
                        ...styles.lbRow,
                        ...(entry.rank === 1 ? styles.lbRowFirst : {}),
                      }}
                    >
                      <span style={styles.lbRank}>
                        {entry.rank === 1 ? '👑' : `#${entry.rank}`}
                      </span>
                      <span style={styles.lbName}>{entry.username}</span>
                      <span style={styles.lbScore}>{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}
              <button
                style={styles.lbCloseBtn}
                onClick={() => setShowLeaderboard(false)}
                autoFocus
              >
                Close
              </button>
            </div>
          )}
        </div>
        <p style={styles.hint}>Arrow keys or WASD to move · Esc to close</p>
      </div>
    </div>
  )
}

// ---------- styles ----------

const boardSize = `min(90vw, 72vh, ${DISPLAY_SIZE}px)`

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  panel: {
    background: '#0d1117',
    border: '2px solid #00ff41',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0.5rem 0.85rem',
    borderBottom: '1px solid #00ff41',
    gap: '1rem',
  },
  headerText: {
    color: '#00ff41',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.62rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#00ff41',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.68rem',
  },
  lbBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0.35rem 0.85rem',
    borderBottom: '1px solid rgba(0,255,65,0.25)',
    gap: '0.6rem',
  },
  lbBarText: {
    color: '#ffd700',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.48rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  viewLbBtn: {
    background: 'none',
    border: '1px solid #00ff41',
    color: '#00ff41',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.42rem',
    padding: '0.25rem 0.5rem',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  boardWrap: {
    position: 'relative',
    width: boardSize,
    height: boardSize,
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    imageRendering: 'pixelated',
  },
  gameOver: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    background: 'rgba(13, 17, 23, 0.85)',
    overflowY: 'auto',
    padding: '1rem',
  },
  gameOverText: {
    margin: 0,
    color: '#ff4444',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '2.1rem',
    textAlign: 'center',
    textShadow: '0 0 12px rgba(255, 68, 68, 0.22)',
  },
  gameOverScore: {
    margin: 0,
    color: '#00ff41',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.7rem',
  },
  submitSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.2rem',
  },
  qualifyText: {
    margin: 0,
    color: '#ffd700',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    textAlign: 'center',
  },
  submitForm: {
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'center',
  },
  usernameInput: {
    background: '#161b22',
    border: '1px solid #00ff41',
    color: '#00ff41',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    padding: '0.4rem 0.5rem',
    outline: 'none',
    width: '10rem',
  },
  submitBtn: {
    background: '#00ff41',
    color: '#0d1117',
    border: 'none',
    padding: '0.4rem 0.7rem',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  errorText: {
    margin: 0,
    color: '#ff4444',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.45rem',
    textAlign: 'center',
  },
  successText: {
    margin: 0,
    color: '#00ff41',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
  },
  gameOverBtns: {
    display: 'flex',
    gap: '0.6rem',
    marginTop: '0.3rem',
  },
  restartBtn: {
    background: '#00ff41',
    color: '#0d1117',
    border: 'none',
    padding: '0.6rem 1.1rem',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.62rem',
    cursor: 'pointer',
  },
  viewLbBtnAlt: {
    background: 'none',
    border: '1px solid #00ff41',
    color: '#00ff41',
    padding: '0.6rem 1.1rem',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.52rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  // Leaderboard overlay
  leaderboardOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    background: 'rgba(13, 17, 23, 0.95)',
    padding: '1rem',
    overflowY: 'auto',
  },
  lbTitle: {
    margin: 0,
    color: '#ffd700',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '1.1rem',
    textAlign: 'center',
    textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
  },
  lbMsg: {
    margin: 0,
    color: '#4a8a4a',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
  },
  lbList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    width: '100%',
    maxWidth: '18rem',
  },
  lbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.3rem 0.5rem',
    borderBottom: '1px solid rgba(0,255,65,0.1)',
  },
  lbRowFirst: {
    background: 'rgba(255, 215, 0, 0.08)',
    borderBottom: '1px solid rgba(255,215,0,0.25)',
  },
  lbRank: {
    color: '#4a8a4a',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    width: '2rem',
    textAlign: 'center',
    flexShrink: 0,
  },
  lbName: {
    color: '#00ff41',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  lbScore: {
    color: '#ffd700',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    flexShrink: 0,
  },
  lbCloseBtn: {
    background: '#00ff41',
    color: '#0d1117',
    border: 'none',
    padding: '0.5rem 1rem',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    cursor: 'pointer',
    marginTop: '0.3rem',
  },
  hint: {
    color: '#4a8a4a',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    padding: '0.5rem 0.6rem',
    margin: 0,
    textAlign: 'center',
  },
}
