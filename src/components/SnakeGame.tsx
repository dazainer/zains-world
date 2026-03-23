/**
 * SnakeGame — classic Snake mini-game playable in the Secret Room.
 * Canvas-based. Arrow keys to move, Escape to close.
 * Keeps a session high score.
 */
import { useEffect, useRef, useState } from 'react'

interface Props {
  onClose: () => void
}

const GRID = 20
const CELL = 14
const CANVAS_SIZE = GRID * CELL  // 280px

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Pos = { x: number; y: number }

let sessionHighScore = 0

export default function SnakeGame({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(sessionHighScore)
  const [gameOver, setGameOver] = useState(false)

  const snake = useRef<Pos[]>([{ x: 10, y: 10 }])
  const food = useRef<Pos>(randomFood([{ x: 10, y: 10 }]))
  const dir = useRef<Dir>('RIGHT')
  const nextDir = useRef<Dir>('RIGHT')
  const rafId = useRef<number | null>(null)
  const lastTick = useRef(0)
  const TICK_MS = 120

  function randomFood(snakeBody: Pos[]): Pos {
    let pos: Pos
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
    } while (snakeBody.some((s) => s.x === pos.x && s.y === pos.y))
    return pos
  }

  function restart() {
    snake.current = [{ x: 10, y: 10 }]
    food.current = randomFood(snake.current)
    dir.current = 'RIGHT'
    nextDir.current = 'RIGHT'
    setScore(0)
    setGameOver(false)
  }

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { onClose(); return }
      if (e.code === 'ArrowUp'    && dir.current !== 'DOWN')  nextDir.current = 'UP'
      if (e.code === 'ArrowDown'  && dir.current !== 'UP')    nextDir.current = 'DOWN'
      if (e.code === 'ArrowLeft'  && dir.current !== 'RIGHT') nextDir.current = 'LEFT'
      if (e.code === 'ArrowRight' && dir.current !== 'LEFT')  nextDir.current = 'RIGHT'
      e.preventDefault()
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

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
        setGameOver(true)
        if (rafId.current) cancelAnimationFrame(rafId.current)
        return
      }
      // Self collision
      if (snake.current.some((s) => s.x === newHead.x && s.y === newHead.y)) {
        setGameOver(true)
        if (rafId.current) cancelAnimationFrame(rafId.current)
        return
      }

      const ateFood = newHead.x === food.current.x && newHead.y === food.current.y
      const newSnake = [newHead, ...snake.current]
      if (!ateFood) newSnake.pop()
      else {
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

    rafId.current = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('keydown', handleKey)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [onClose])

  return (
    <div style={styles.backdrop}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <span style={styles.headerText}>SNAKE</span>
          <span style={styles.headerText}>Score: {score} | Best: {highScore}</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={styles.canvas}
        />
        {gameOver && (
          <div style={styles.gameOver}>
            <p style={styles.gameOverText}>GAME OVER</p>
            <button style={styles.restartBtn} onClick={restart}>Play Again</button>
          </div>
        )}
        <p style={styles.hint}>Arrow keys to move · Esc to close</p>
      </div>
    </div>
  )
}

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
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '0.4rem 0.75rem',
    borderBottom: '1px solid #00ff41',
    gap: '1rem',
  },
  headerText: {
    color: '#00ff41',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#00ff41',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.6rem',
  },
  canvas: {
    display: 'block',
    imageRendering: 'pixelated',
  },
  gameOver: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  gameOverText: {
    color: '#ff4444',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '1rem',
  },
  restartBtn: {
    background: '#00ff41',
    color: '#0d1117',
    border: 'none',
    padding: '0.5rem 1rem',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.6rem',
    cursor: 'pointer',
  },
  hint: {
    color: '#4a8a4a',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.45rem',
    padding: '0.4rem',
  },
}
