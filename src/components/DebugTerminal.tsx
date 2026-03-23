/**
 * DebugTerminal — functional retro terminal in the Secret Room.
 * Commands: help, whoami, ls, cat about.txt, cat books.txt,
 *           play snake, sudo hire zain, clear.
 */
import { useState, useRef, useEffect } from 'react'
import { terminalCommands } from '../data/terminalCommands'

interface Props {
  onClose: () => void
  onLaunchSnake: () => void
}

interface HistoryEntry {
  type: 'input' | 'output'
  text: string
}

export default function DebugTerminal({ onClose, onLaunchSnake }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', text: "Zain's World Terminal v1.0.0 — type 'help' to begin" },
  ])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

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
      setTimeout(onLaunchSnake, 300)
      return
    }

    if (cmd === 'sudo hire zain') {
      newHistory.push({
        type: 'output',
        text: 'CONFETTI! Access granted. Redirecting to z7khalil@uwaterloo.ca...',
      })
      setHistory(newHistory)
      setInput('')
      setTimeout(() => {
        window.location.href = 'mailto:z7khalil@uwaterloo.ca'
      }, 1000)
      return
    }

    const response = terminalCommands[cmd]
    if (response) {
      const text = typeof response === 'function' ? response() : response
      newHistory.push({ type: 'output', text })
    } else {
      newHistory.push({ type: 'output', text: `zsh: command not found: ${input}. Try 'help'` })
    }

    setHistory(newHistory)
    setInput('')
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.terminal}>
        <div style={styles.titleBar}>
          <span>terminal — zains-world</span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
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
            onChange={(e) => setInput(e.target.value)}
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
    width: '560px',
    maxWidth: '90vw',
    background: '#0d1117',
    border: '2px solid #00ff41',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '70vh',
    fontFamily: "'Courier New', monospace",
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
