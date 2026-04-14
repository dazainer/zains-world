interface OverlayPhase {
  r: number
  g: number
  b: number
  a: number
}

const DEFAULT_CYCLE_DURATION_MS = 10 * 60 * 1000

const PHASES: OverlayPhase[] = [
  { r: 255, g: 200, b: 100, a: 0.05 }, // dawn
  { r: 0, g: 0, b: 0, a: 0 },          // day
  { r: 255, g: 120, b: 50, a: 0.1 },   // dusk
  { r: 30, g: 30, b: 80, a: 0.15 },    // night
]

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t
}

export class DayNightCycle {
  private readonly cycleDurationMs: number
  private readonly startTimeMs: number

  constructor(cycleDurationMs = DEFAULT_CYCLE_DURATION_MS) {
    this.cycleDurationMs = cycleDurationMs
    const randomOffsetMs = Math.random() * cycleDurationMs
    this.startTimeMs = performance.now() - randomOffsetMs
  }

  getOverlayColor(nowMs = performance.now()): string {
    const elapsedMs = Math.max(0, nowMs - this.startTimeMs)
    const normalizedCycle = (elapsedMs % this.cycleDurationMs) / this.cycleDurationMs
    const segmentFloat = normalizedCycle * PHASES.length
    const segmentIndex = Math.floor(segmentFloat) % PHASES.length
    const nextIndex = (segmentIndex + 1) % PHASES.length
    const localT = segmentFloat - Math.floor(segmentFloat)

    // Sine easing keeps the color drift gentle instead of linearly mechanical.
    const easedT = 0.5 - 0.5 * Math.cos(localT * Math.PI)
    const current = PHASES[segmentIndex]
    const next = PHASES[nextIndex]

    const r = Math.round(lerp(current.r, next.r, easedT))
    const g = Math.round(lerp(current.g, next.g, easedT))
    const b = Math.round(lerp(current.b, next.b, easedT))
    const a = lerp(current.a, next.a, easedT)

    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`
  }
}
