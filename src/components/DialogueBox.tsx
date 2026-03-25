/**
 * DialogueBox — RPG-style text box with typewriter effect.
 * Anchored to bottom of screen, ~80% width, centered.
 * Space advances pages; last page auto-closes.
 */
import { useState, useEffect, useCallback } from 'react'

export interface DialogueState {
  pages: string[]
  onComplete: () => void
}

interface Props extends DialogueState {}

const CHARS_PER_SECOND = 30

export default function DialogueBox({ pages, onComplete }: Props) {
  const [pageIndex, setPageIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const currentText = pages[pageIndex] ?? ''

  // Typewriter effect
  useEffect(() => {
    setDisplayed('')
    setIsComplete(false)

    if (currentText.length === 0) {
      setIsComplete(true)
      return
    }

    let charIndex = 0
    const interval = setInterval(() => {
      charIndex++
      setDisplayed(currentText.slice(0, charIndex))
      if (charIndex >= currentText.length) {
        clearInterval(interval)
        setIsComplete(true)
      }
    }, 1000 / CHARS_PER_SECOND)

    return () => clearInterval(interval)
  }, [pageIndex, currentText])

  const advance = useCallback(() => {
    if (!isComplete) {
      // Skip to end of current page
      setDisplayed(currentText)
      setIsComplete(true)
      return
    }
    if (pageIndex < pages.length - 1) {
      setPageIndex((i) => i + 1)
    } else {
      onComplete()
    }
  }, [isComplete, pageIndex, pages.length, currentText, onComplete])

  // Space key advances
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance])

  return (
    <div style={styles.overlay} onClick={advance}>
      <div style={styles.box}>
        <p style={styles.text}>{displayed}</p>
        {isComplete && <span style={styles.indicator}>▼</span>}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    maxWidth: '640px',
    cursor: 'pointer',
    zIndex: 20,
  },
  box: {
    background: 'rgba(20, 12, 4, 0.92)',
    border: '3px solid #c8a850',
    padding: '1rem 1.25rem',
    minHeight: '80px',
    position: 'relative',
  },
  text: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: '#f5e6c8',
    margin: 0,
    whiteSpace: 'pre-line',
  },
  indicator: {
    position: 'absolute',
    bottom: '0.5rem',
    right: '0.75rem',
    color: '#c8a850',
    fontSize: '0.75rem',
    animation: 'blink 0.8s step-end infinite',
  },
}
