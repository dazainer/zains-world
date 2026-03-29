/**
 * SnakeGame — classic Snake mini-game playable in the Secret Room.
 * Canvas-based. Arrow keys to move, Escape to close.
 * Keeps a session high score + online leaderboard.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  INITIAL_SNAKE_DIRECTION,
  SNAKE_CELL,
  SNAKE_GRID,
  SNAKE_TICK_MS,
  createInitialSnake,
  createSeededSnakeRng,
  nextSnakeFood,
  type SnakeDirection,
  type SnakePosition,
  type SnakeRunSession,
  type SnakeTurnEvent,
} from '../lib/snakeAntiCheat'
import { takeSnakeRunSession } from '../lib/snakeRunSession'

interface Props {
  onClose: () => void
}

const GRID = SNAKE_GRID
const CELL = SNAKE_CELL
const CANVAS_SIZE = GRID * CELL  // 280px
const DISPLAY_SCALE = 1.85
const DISPLAY_SIZE = Math.round(CANVAS_SIZE * DISPLAY_SCALE)

type Dir = SnakeDirection
type Pos = SnakePosition
type MobileSnakeDirection = 'up' | 'down' | 'left' | 'right'

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

interface ApiErrorPayload {
  error?: string
}

let sessionHighScore = 0

const API_URL = '/api/snake-leaderboard'
const isTouchDevice = 'ontouchstart' in window

async function readApiPayload<T>(res: Response): Promise<T | ApiErrorPayload> {
  const text = await res.text()
  if (!text) return {}

  try {
    return JSON.parse(text) as T | ApiErrorPayload
  } catch {
    return { error: text }
  }
}

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
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  // Submission state
  const [username, setUsername] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [runSession, setRunSession] = useState<SnakeRunSession | null>(null)
  const [runLoading, setRunLoading] = useState(true)
  const [runError, setRunError] = useState<string | null>(null)
  const [showRunLoadingFallback, setShowRunLoadingFallback] = useState(false)

  const snake = useRef<Pos[]>(createInitialSnake())
  const food = useRef<Pos | null>(null)
  const dir = useRef<Dir>(INITIAL_SNAKE_DIRECTION)
  const nextDir = useRef<Dir>(INITIAL_SNAKE_DIRECTION)
  const rafId = useRef<number | null>(null)
  const lastTick = useRef(0)
  const foodRng = useRef<(() => number) | null>(null)
  const tickCountRef = useRef(0)
  const turnEventsRef = useRef<SnakeTurnEvent[]>([])

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

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
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

  const drawBoard = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.fillStyle = '#00ff41'
    snake.current.forEach(({ x, y }) => ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2))

    if (food.current) {
      ctx.fillStyle = '#ff4444'
      ctx.fillRect(food.current.x * CELL + 2, food.current.y * CELL + 2, CELL - 4, CELL - 4)
    }
  }, [])

  useEffect(() => {
    const stopOnHide = () => {
      if (document.visibilityState === 'hidden') {
        stopAllSfx()
      }
    }

    document.addEventListener('visibilitychange', stopOnHide)
    window.addEventListener('pagehide', stopAllSfx)
    return () => {
      document.removeEventListener('visibilitychange', stopOnHide)
      window.removeEventListener('pagehide', stopAllSfx)
    }
  }, [])

  // ---------- leaderboard fetch ----------

  const fetchLeaderboard = useCallback(async () => {
    setLbLoading(true)
    setLbError(null)
    try {
      const res = await fetch(API_URL)
      const data = await readApiPayload<LeaderboardData>(res)
      if (!res.ok) {
        throw new Error(('error' in data && data.error) || 'Unable to load leaderboard')
      }
      setLeaderboard(data as LeaderboardData)
    } catch (error) {
      setLbError(error instanceof Error ? error.message : 'Unable to load leaderboard')
    } finally {
      setLbLoading(false)
    }
  }, [])

  // Fetch on mount
  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const initializeVerifiedRun = useCallback((session: SnakeRunSession) => {
    const startingSnake = createInitialSnake()
    const rng = createSeededSnakeRng(session.seed)
    const firstFood = nextSnakeFood(startingSnake, rng)

    if (!firstFood) {
      throw new Error('Unable to start a verified run')
    }

    snake.current = startingSnake
    food.current = firstFood
    foodRng.current = rng
    dir.current = INITIAL_SNAKE_DIRECTION
    nextDir.current = INITIAL_SNAKE_DIRECTION
    lastTick.current = 0
    tickCountRef.current = 0
    turnEventsRef.current = []
    finalScoreRef.current = 0

    setRunSession(session)
    setRunError(null)
    setScore(0)
    setGameOver(false)
    setSubmitted(false)
    setSubmitError(null)
    setUsername('')
    setShowLeaderboard(false)
    setRunId((i) => i + 1)
  }, [])

  const requestVerifiedRun = useCallback(async (forceFresh = false) => {
    snake.current = createInitialSnake()
    food.current = null
    foodRng.current = null
    dir.current = INITIAL_SNAKE_DIRECTION
    nextDir.current = INITIAL_SNAKE_DIRECTION
    lastTick.current = 0
    tickCountRef.current = 0
    turnEventsRef.current = []
    finalScoreRef.current = 0

    setRunLoading(true)
    setRunError(null)
    setRunSession(null)
    setScore(0)
    setGameOver(false)
    setSubmitted(false)
    setSubmitError(null)
    setUsername('')

    try {
      const session = await takeSnakeRunSession(forceFresh)
      initializeVerifiedRun(session)
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Unable to start verified run')
    } finally {
      setRunLoading(false)
    }
  }, [initializeVerifiedRun])

  useEffect(() => {
    void requestVerifiedRun()
  }, [requestVerifiedRun])

  useEffect(() => {
    if (!runLoading || runError) {
      setShowRunLoadingFallback(false)
      return
    }

    const timeoutId = window.setTimeout(() => setShowRunLoadingFallback(true), 450)
    return () => window.clearTimeout(timeoutId)
  }, [runError, runLoading])

  // ---------- qualification check ----------

  const qualifiesForTop10 = useCallback((s: number): boolean => {
    if (s <= 0) return false
    if (!leaderboard) return false
    if (leaderboard.entries.length < 10) return true
    if (leaderboard.cutoffScore === null) return true
    return s > leaderboard.cutoffScore
  }, [leaderboard])

  // ---------- submit ----------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = username.trim()
    if (!trimmed || !runSession) {
      setSubmitError('This run could not be verified. Start a new game and try again.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          username: trimmed,
          score: finalScoreRef.current,
          runToken: runSession.runToken,
          turns: turnEventsRef.current,
        }),
      })
      const data = await readApiPayload<{ success?: boolean }>(res)
      if (!res.ok) {
        setSubmitError(('error' in data && data.error) || 'Unable to submit score')
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
    void requestVerifiedRun(true)
  }

  // ---------- game loop ----------

  const queueDirection = useCallback((next: Dir) => {
    let candidate: Dir | null = null
    if (next === 'UP' && dir.current !== 'DOWN') candidate = 'UP'
    if (next === 'DOWN' && dir.current !== 'UP') candidate = 'DOWN'
    if (next === 'LEFT' && dir.current !== 'RIGHT') candidate = 'LEFT'
    if (next === 'RIGHT' && dir.current !== 'LEFT') candidate = 'RIGHT'
    if (!candidate) return

    nextDir.current = candidate

    const scheduledTick = tickCountRef.current + 1
    const events = turnEventsRef.current
    const lastEvent = events[events.length - 1]

    if (lastEvent?.tick === scheduledTick) {
      if (candidate === dir.current) {
        events.pop()
      } else {
        lastEvent.direction = candidate
      }
      return
    }

    if (candidate !== dir.current) {
      events.push({ tick: scheduledTick, direction: candidate })
    }
  }, [])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    drawBoard(ctx)

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

      if (runLoading || runError) {
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

      if (e.code === 'ArrowUp' || (!inputFocused && e.code === 'KeyW')) {
        queueDirection('UP')
        handled = true
      }
      if (e.code === 'ArrowDown' || (!inputFocused && e.code === 'KeyS')) {
        queueDirection('DOWN')
        handled = true
      }
      if (e.code === 'ArrowLeft' || (!inputFocused && e.code === 'KeyA')) {
        queueDirection('LEFT')
        handled = true
      }
      if (e.code === 'ArrowRight' || (!inputFocused && e.code === 'KeyD')) {
        queueDirection('RIGHT')
        handled = true
      }

      if (handled) e.preventDefault()
    }

    const handleMobileDirection = (event: Event) => {
      if (showLeaderboard || gameOver || runLoading || runError) return
      const { detail } = event as CustomEvent<MobileSnakeDirection>
      if (detail === 'up') queueDirection('UP')
      if (detail === 'down') queueDirection('DOWN')
      if (detail === 'left') queueDirection('LEFT')
      if (detail === 'right') queueDirection('RIGHT')
    }

    window.addEventListener('keydown', handleKey)
    window.addEventListener('snake-mobile-direction', handleMobileDirection as EventListener)

    if (runLoading || runError || !runSession) {
      return () => {
        window.removeEventListener('keydown', handleKey)
        window.removeEventListener('snake-mobile-direction', handleMobileDirection as EventListener)
      }
    }

    const finishRun = (finalScore: number) => {
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

    const loop = (ts: number) => {
      rafId.current = requestAnimationFrame(loop)
      if (ts - lastTick.current < SNAKE_TICK_MS) return
      lastTick.current = ts

      tickCountRef.current += 1
      dir.current = nextDir.current
      const head = snake.current[0]
      const newHead: Pos = {
        x: head.x + (dir.current === 'RIGHT' ? 1 : dir.current === 'LEFT' ? -1 : 0),
        y: head.y + (dir.current === 'DOWN'  ? 1 : dir.current === 'UP'   ? -1 : 0),
      }

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
        finishRun(snake.current.length - 1)
        return
      }
      // Self collision
      if (snake.current.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        finishRun(snake.current.length - 1)
        return
      }

      const ateFood = food.current !== null && newHead.x === food.current.x && newHead.y === food.current.y
      const newSnake = [newHead, ...snake.current]
      if (!ateFood) newSnake.pop()
      else {
        playSfx(sfxEat.current)
        const newScore = newSnake.length - 1
        setScore(newScore)
        if (newScore > sessionHighScore) {
          sessionHighScore = newScore
          setHighScore(newScore)
        }

        if (newSnake.length >= GRID * GRID) {
          snake.current = newSnake
          food.current = null
          finishRun(newScore)
          drawBoard(ctx)
          return
        }

        food.current = foodRng.current ? nextSnakeFood(newSnake, foodRng.current) : null
        if (!food.current) {
          snake.current = newSnake
          finishRun(newScore)
          drawBoard(ctx)
          return
        }
      }
      snake.current = newSnake

      drawBoard(ctx)
    }

    rafId.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('snake-mobile-direction', handleMobileDirection as EventListener)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [drawBoard, gameOver, onClose, qualifiesForTop10, queueDirection, runError, runId, runLoading, runSession, showLeaderboard])

  // ---------- render helpers ----------

  const canSubmitScore = Boolean(runSession) && !runLoading && !runError
  const qualifies = gameOver && canSubmitScore && qualifiesForTop10(score)

  const topScoreDisplay = leaderboard?.topScore
    ? `${leaderboard.topScore.username} - ${leaderboard.topScore.score}`
    : lbLoading ? '...' : '—'
  const compactMobile = isTouchDevice && viewport.width > viewport.height
  const touchControlsReserve = isTouchDevice ? (compactMobile ? 110 : 146) : 0
  const chromeReserve = compactMobile ? 138 : 216
  const boardPx = Math.round(Math.max(
    compactMobile ? 170 : 180,
    Math.min(
      DISPLAY_SIZE,
      viewport.width - (compactMobile ? 96 : 26),
      viewport.height - chromeReserve - touchControlsReserve,
    ),
  ))
  const panelWidth = isTouchDevice
    ? Math.min(viewport.width - 12, Math.max(boardPx + 6, compactMobile ? 290 : 320))
    : undefined
  const mobileButtonColumn = isTouchDevice
  const mobileInputColumn = isTouchDevice && !compactMobile

  return (
    <div
      style={{
        ...styles.backdrop,
        padding: isTouchDevice
          ? (compactMobile ? '0.6rem 0.6rem 6.6rem' : '0.6rem 0.6rem 9rem')
          : '1rem',
      }}
    >
      <div
        style={{
          ...styles.panel,
          width: panelWidth ? `${panelWidth}px` : 'auto',
          maxWidth: isTouchDevice ? 'calc(100vw - 0.75rem)' : 'unset',
          maxHeight: isTouchDevice ? `calc(100vh - ${compactMobile ? '7.3rem' : '9.5rem'})` : 'unset',
        }}
      >
        {/* Header */}
        <div style={{ ...styles.header, padding: compactMobile ? '0.42rem 0.65rem' : styles.header.padding }}>
          <span style={{ ...styles.headerText, fontSize: compactMobile ? '0.52rem' : styles.headerText.fontSize }}>SNAKE</span>
          <span style={{ ...styles.headerText, fontSize: compactMobile ? '0.48rem' : styles.headerText.fontSize }}>
            Score: {score} | Best: {highScore}
          </span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Leaderboard high score bar */}
        <div style={{ ...styles.lbBar, padding: compactMobile ? '0.3rem 0.65rem' : styles.lbBar.padding }}>
          <span style={{ ...styles.lbBarText, fontSize: compactMobile ? '0.4rem' : styles.lbBarText.fontSize }}>
            Leaderboard High Score: {topScoreDisplay}
          </span>
          <button
            style={{ ...styles.viewLbBtn, fontSize: compactMobile ? '0.38rem' : styles.viewLbBtn.fontSize }}
            onClick={() => { stopAllSfx(); setShowLeaderboard(true) }}
          >
            View Leaderboard
          </button>
        </div>

        {/* Game board */}
        <div style={{ ...styles.boardWrap, width: `${boardPx}px`, height: `${boardPx}px` }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={styles.canvas}
          />

          {/* Verified run startup overlay */}
          {!showLeaderboard && (runError || (runLoading && showRunLoadingFallback)) && (
            <div style={styles.gameOver}>
              <p style={styles.gameOverText}>{runLoading ? 'VERIFYING RUN' : 'RUN UNAVAILABLE'}</p>
              <p style={styles.lbMsg}>
                {runLoading
                  ? 'Starting a server-verified run...'
                  : 'Leaderboard submissions stay locked until a verified run starts.'}
              </p>
              {runError && <p style={styles.errorText}>{runError}</p>}
              <div
                style={{
                  ...styles.gameOverBtns,
                  flexDirection: mobileButtonColumn ? 'column' : 'row',
                  width: mobileButtonColumn ? '100%' : undefined,
                }}
              >
                <button
                  style={{
                    ...styles.restartBtn,
                    width: mobileButtonColumn ? '100%' : undefined,
                    maxWidth: mobileButtonColumn ? '13rem' : undefined,
                    opacity: runLoading ? 0.5 : 1,
                  }}
                  onClick={restart}
                  disabled={runLoading}
                >
                  {runLoading ? 'Starting...' : 'Retry'}
                </button>
                <button
                  style={{
                    ...styles.viewLbBtnAlt,
                    width: mobileButtonColumn ? '100%' : undefined,
                    maxWidth: mobileButtonColumn ? '13rem' : undefined,
                  }}
                  onClick={() => { stopAllSfx(); setShowLeaderboard(true) }}
                >
                  View Leaderboard
                </button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {gameOver && !showLeaderboard && (
            <div style={styles.gameOver}>
              <p style={styles.gameOverText}>GAME OVER</p>
              <p style={styles.gameOverScore}>Score: {score}</p>

              {/* Qualification form */}
              {qualifies && !submitted && (
                <div style={styles.submitSection}>
                  <p style={styles.qualifyText}>Top 10 score! Enter a username to submit:</p>
                  <form
                    onSubmit={handleSubmit}
                    style={{
                      ...styles.submitForm,
                      flexDirection: mobileInputColumn ? 'column' : 'row',
                      width: mobileInputColumn ? '100%' : undefined,
                    }}
                  >
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      maxLength={16}
                      minLength={3}
                      autoFocus
                      style={{
                        ...styles.usernameInput,
                        width: mobileInputColumn ? '100%' : styles.usernameInput.width,
                        maxWidth: mobileInputColumn ? '13rem' : undefined,
                      }}
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

              <div
                style={{
                  ...styles.gameOverBtns,
                  flexDirection: mobileButtonColumn ? 'column' : 'row',
                  width: mobileButtonColumn ? '100%' : undefined,
                }}
              >
                <button
                  style={{
                    ...styles.restartBtn,
                    width: mobileButtonColumn ? '100%' : undefined,
                    maxWidth: mobileButtonColumn ? '13rem' : undefined,
                  }}
                  onClick={restart}
                >
                  Play Again
                </button>
                <button
                  style={{
                    ...styles.viewLbBtnAlt,
                    width: mobileButtonColumn ? '100%' : undefined,
                    maxWidth: mobileButtonColumn ? '13rem' : undefined,
                  }}
                  onClick={() => { stopAllSfx(); setShowLeaderboard(true) }}
                >
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
        <p style={{ ...styles.hint, fontSize: compactMobile ? '0.42rem' : styles.hint.fontSize, padding: compactMobile ? '0.42rem 0.5rem' : styles.hint.padding }}>
          {isTouchDevice ? 'Arrow keys, WASD, or mobile arrows · Esc to close' : 'Arrow keys or WASD to move · Esc to close'}
        </p>
      </div>
    </div>
  )
}

// ---------- styles ----------

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
    gap: '0.72rem',
    background: 'rgba(13, 17, 23, 0.95)',
    padding: '1.2rem',
    overflowY: 'auto',
  },
  lbTitle: {
    margin: 0,
    color: '#ffd700',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '1.32rem',
    textAlign: 'center',
    textShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
  },
  lbMsg: {
    margin: 0,
    color: '#4a8a4a',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.6rem',
  },
  lbList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.36rem',
    width: '100%',
    maxWidth: '21.6rem',
  },
  lbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.36rem 0.6rem',
    borderBottom: '1px solid rgba(0,255,65,0.1)',
  },
  lbRowFirst: {
    background: 'rgba(255, 215, 0, 0.08)',
    borderBottom: '1px solid rgba(255,215,0,0.25)',
  },
  lbRank: {
    color: '#4a8a4a',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.6rem',
    width: '2.4rem',
    textAlign: 'center',
    flexShrink: 0,
  },
  lbName: {
    color: '#00ff41',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.6rem',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  lbScore: {
    color: '#ffd700',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.66rem',
    flexShrink: 0,
  },
  lbCloseBtn: {
    background: '#00ff41',
    color: '#0d1117',
    border: 'none',
    padding: '0.6rem 1.2rem',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.66rem',
    cursor: 'pointer',
    marginTop: '0.36rem',
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
