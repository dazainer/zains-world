/**
 * DebugTerminal — functional retro terminal in the Secret Room.
 * Commands: help, whoami, ls, cat about.txt, cat books.txt,
 *           play snake, sudo hire zain, clear.
 * "sudo hire zain" triggers canvas confetti + mailto link.
 * "play snake" opens SnakeGame overlay on top of the terminal.
 */
import { useState, useRef, useEffect } from 'react'
import { terminalCommands } from '../data/terminalCommands'
import SnakeGame from './SnakeGame'

interface Props {
  onClose: () => void
}

interface HistoryEntry {
  type: 'input' | 'output'
  text: string
}

export default function DebugTerminal({ onClose }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', text: "Zain's World Terminal v1.0.0 — type 'help' to begin" },
  ])
  const [input, setInput] = useState('')
  const [showSnake, setShowSnake] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const confettiRef = useRef<HTMLCanvasElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  // Focus input on mount and when returning from snake
  useEffect(() => {
    if (!showSnake) inputRef.current?.focus()
  }, [showSnake])

  // Escape to close (only when snake isn't shown — snake handles its own Escape)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !showSnake) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, showSnake])

  // ── Confetti particle animation ──────────────────────────────────────────
  useEffect(() => {
    if (!showConfetti) return
    const canvas = confettiRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const colors = ['#ff0', '#f0f', '#0ff', '#f44', '#4f4', '#44f', '#ff8800', '#c8a850']
    const particles = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 80,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 10 - 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 5 + 2,
      life: 1,
    }))

    let raf: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.25
        p.life -= 0.007
        if (p.life <= 0) continue
        alive = true
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)
      }
      ctx.globalAlpha = 1
      if (alive) raf = requestAnimationFrame(animate)
      else setShowConfetti(false)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [showConfetti])

  // ── Command handler ──────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cmd = input.trim().toLowerCase()
    if (!cmd) return

    const newHistory: HistoryEntry[] = [...history, { type: 'input', text: `$ ${input}` }]

    if (cmd === 'clear') {
      setHistory([])
      setInput('')
      return
    }

    if (cmd === 'play snake') {
      newHistory.push({ type: 'output', text: 'Launching Snake...' })
      setHistory(newHistory)
      setInput('')
      setTimeout(() => setShowSnake(true), 300)
      return
    }

    if (cmd === 'sudo hire zain') {
      newHistory.push({
        type: 'output',
        text: 'Access granted. Redirecting to z7khalil@uwaterloo.ca...',
      })
      setHistory(newHistory)
      setInput('')
      setShowConfetti(true)
      setTimeout(() => {
        window.open('mailto:z7khalil@uwaterloo.ca', '_blank')
      }, 1500)
      return
    }

    const response = terminalCommands[cmd]
    if (response) {
      const text = typeof response === 'function' ? response() : response
      newHistory.push({ type: 'output', text })
    } else {
      newHistory.push({ type: 'output', text: `zsh: command not found: ${input.trim()}. Try 'help'` })
    }

    setHistory(newHistory)
    setInput('')
  }

  // ── Snake overlay (rendered on top of terminal) ──────────────────────────
  if (showSnake) {
    return <SnakeGame onClose={() => setShowSnake(false)} />
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.terminal} onClick={e => { e.stopPropagation(); inputRef.current?.focus() }}>
        {showConfetti && (
          <canvas ref={confettiRef} style={styles.confettiCanvas} />
        )}
        <div style={styles.titleBar}>
          <span>terminal — zains-world</span>
          <button style={styles.closeBtn} onClick={onClose}>x</button>
        </div>
        <div style={styles.output}>
          {history.map((entry, i) => (
            <pre key={i} style={entry.type === 'input' ? styles.inputLine : styles.outputLine}>
              {entry.text}
            </pre>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} style={styles.inputRow}>
          <span style={styles.prompt}>$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            style={styles.input}
            autoComplete="off"
            spellCheck={false}
          />
        </form>
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
    zIndex: 40,
  },
  terminal: {
    position: 'relative',
    width: '560px',
    maxWidth: '90vw',
    background: '#0d1117',
    border: '2px solid #00ff41',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '70vh',
    fontFamily: "'Courier New', monospace",
  },
  confettiCanvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 10,
  },
  titleBar: {
    background: '#1a2e1a',
    color: '#00ff41',
    padding: '0.4rem 0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    borderBottom: '1px solid #00ff41',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#00ff41',
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontFamily: "'Courier New', monospace",
  },
  output: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.75rem',
    color: '#00ff41',
    fontSize: '0.8rem',
    lineHeight: 1.5,
  },
  inputLine: {
    color: '#aaffaa',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  outputLine: {
    color: '#00ff41',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    borderTop: '1px solid #00ff41',
    gap: '0.5rem',
  },
  prompt: {
    color: '#00ff41',
    fontSize: '0.8rem',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#00ff41',
    fontFamily: "'Courier New', monospace",
    fontSize: '0.8rem',
    caretColor: '#00ff41',
  },
}
