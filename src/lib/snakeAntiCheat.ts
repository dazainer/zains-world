export const SNAKE_GRID = 20
export const SNAKE_CELL = 14
export const SNAKE_TICK_MS = 120
export const SNAKE_TOTAL_CELLS = SNAKE_GRID * SNAKE_GRID
export const SNAKE_MAX_SCORE = SNAKE_TOTAL_CELLS - 1
export const SNAKE_RUN_TTL_MS = 2 * 60 * 60 * 1000
export const SNAKE_MAX_TICKS_PER_RUN = Math.floor(SNAKE_RUN_TTL_MS / SNAKE_TICK_MS)
export const SNAKE_MIN_ELAPSED_SLACK_MS = 1500

export type SnakeDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

export interface SnakePosition {
  x: number
  y: number
}

export interface SnakeTurnEvent {
  tick: number
  direction: SnakeDirection
}

export interface SnakeRunStartRequest {
  action: 'start'
}

export interface SnakeRunSubmitRequest {
  action: 'submit'
  username: string
  score: number
  runToken: string
  turns: SnakeTurnEvent[]
}

export interface SnakeRunSession {
  runToken: string
  seed: number
  issuedAt: number
  expiresAt: number
}

export type SnakeRunRequest = SnakeRunStartRequest | SnakeRunSubmitRequest

export interface SnakeSimulationResult {
  ended: boolean
  reason: 'wall' | 'self' | 'filled-board' | 'tick-limit' | 'invalid-turn'
  score: number
  ticks: number
  snakeLength: number
}

export const INITIAL_SNAKE_DIRECTION: SnakeDirection = 'RIGHT'
const INITIAL_SNAKE_POSITION: SnakePosition = { x: 10, y: 10 }

export function createInitialSnake(): SnakePosition[] {
  return [{ ...INITIAL_SNAKE_POSITION }]
}

export function isSnakeDirection(value: unknown): value is SnakeDirection {
  return value === 'UP' || value === 'DOWN' || value === 'LEFT' || value === 'RIGHT'
}

export function isOppositeDirection(a: SnakeDirection, b: SnakeDirection): boolean {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  )
}

export function createSeededSnakeRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function nextSnakeFood(
  snakeBody: SnakePosition[],
  rng: () => number,
): SnakePosition | null {
  if (snakeBody.length >= SNAKE_TOTAL_CELLS) return null

  let pos: SnakePosition
  do {
    pos = {
      x: Math.floor(rng() * SNAKE_GRID),
      y: Math.floor(rng() * SNAKE_GRID),
    }
  } while (snakeBody.some((segment) => segment.x === pos.x && segment.y === pos.y))

  return pos
}

export function simulateSnakeReplay(
  seed: number,
  turns: SnakeTurnEvent[],
): SnakeSimulationResult {
  const rng = createSeededSnakeRng(seed)
  let snake = createInitialSnake()
  let food = nextSnakeFood(snake, rng)
  let direction = INITIAL_SNAKE_DIRECTION
  let turnIndex = 0
  let score = 0

  for (let tick = 1; tick <= SNAKE_MAX_TICKS_PER_RUN; tick += 1) {
    const turn = turns[turnIndex]
    if (turn) {
      if (!Number.isInteger(turn.tick) || turn.tick < 1 || turn.tick < tick) {
        return { ended: false, reason: 'invalid-turn', score, ticks: tick - 1, snakeLength: snake.length }
      }
      if (turn.tick === tick) {
        if (!isSnakeDirection(turn.direction) || isOppositeDirection(turn.direction, direction)) {
          return { ended: false, reason: 'invalid-turn', score, ticks: tick - 1, snakeLength: snake.length }
        }
        direction = turn.direction
        turnIndex += 1
        if (turns[turnIndex]?.tick === tick) {
          return { ended: false, reason: 'invalid-turn', score, ticks: tick - 1, snakeLength: snake.length }
        }
      }
    }

    const head = snake[0]
    const newHead: SnakePosition = {
      x: head.x + (direction === 'RIGHT' ? 1 : direction === 'LEFT' ? -1 : 0),
      y: head.y + (direction === 'DOWN' ? 1 : direction === 'UP' ? -1 : 0),
    }

    if (newHead.x < 0 || newHead.x >= SNAKE_GRID || newHead.y < 0 || newHead.y >= SNAKE_GRID) {
      return { ended: true, reason: 'wall', score, ticks: tick, snakeLength: snake.length }
    }

    if (snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
      return { ended: true, reason: 'self', score, ticks: tick, snakeLength: snake.length }
    }

    const newSnake = [newHead, ...snake]
    const ateFood = food !== null && newHead.x === food.x && newHead.y === food.y

    if (!ateFood) {
      newSnake.pop()
    } else {
      score = newSnake.length - 1
      if (newSnake.length === SNAKE_TOTAL_CELLS) {
        return { ended: true, reason: 'filled-board', score, ticks: tick, snakeLength: newSnake.length }
      }

      food = nextSnakeFood(newSnake, rng)
      if (food === null) {
        return { ended: false, reason: 'invalid-turn', score, ticks: tick, snakeLength: newSnake.length }
      }
    }

    snake = newSnake
  }

  return {
    ended: false,
    reason: 'tick-limit',
    score,
    ticks: SNAKE_MAX_TICKS_PER_RUN,
    snakeLength: snake.length,
  }
}
