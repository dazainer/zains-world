/**
 * DialogueBox — RPG-style text box with typewriter effect.
 * Anchored to bottom of screen, ~80% width, centered.
 * Space advances pages; last page auto-closes.
 */
import { useState, useEffect, useCallback, useRef } from 'react'

export interface DialogueState {
  pages: string[]
  onComplete: () => void
  onTypingStateChange?: (typing: boolean) => void
  onTypingProgress?: (visibleChars: number) => void
}

interface Props extends DialogueState {}

const CHARS_PER_SECOND = 30

export default function DialogueBox({ pages, onComplete, onTypingStateChange, onTypingProgress }: Props) {
  const [pageIndex, setPageIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const timerRef = useRef<number | null>(null)

  const currentText = pages[pageIndex] ?? ''

  // Typewriter effect
  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    setDisplayed('')
    setIsComplete(false)

    if (currentText.length === 0) {
      onTypingStateChange?.(false)
      onTypingProgress?.(0)
      setIsComplete(true)
      return
    }

    onTypingStateChange?.(true)
    onTypingProgress?.(0)

    let charIndex = 0
    timerRef.current = window.setInterval(() => {
      charIndex++
      setDisplayed(currentText.slice(0, charIndex))
      onTypingProgress?.(charIndex)
      if (charIndex >= currentText.length) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }
        onTypingStateChange?.(false)
        setIsComplete(true)
      }
    }, 1000 / CHARS_PER_SECOND)

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      onTypingStateChange?.(false)
      onTypingProgress?.(0)
    }
  }, [pageIndex, currentText, onTypingProgress, onTypingStateChange])

  const revealFullPage = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    onTypingStateChange?.(false)
    onTypingProgress?.(currentText.length)
    setDisplayed(currentText)
    setIsComplete(true)
  }, [currentText, onTypingProgress, onTypingStateChange])

  const advance = useCallback(() => {
    if (!isComplete) {
      revealFullPage()
      return
    }
    if (pageIndex < pages.length - 1) {
      setPageIndex((i) => i + 1)
    } else {
      onComplete()
    }
  }, [isComplete, pageIndex, pages.length, onComplete, revealFullPage])

  // Space/Enter advance, Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape') {
        e.preventDefault()
        onComplete()
        return
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance, onComplete])

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
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '86%',
    maxWidth: '760px',
    cursor: 'pointer',
    zIndex: 20,
  },
  box: {
    background: 'rgba(20, 12, 4, 0.92)',
    border: '3px solid #c8a850',
    padding: '1.2rem 1.45rem',
    minHeight: '104px',
    position: 'relative',
    borderRadius: '10px',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
  },
  text: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '1.08rem',
    lineHeight: 1.6,
    color: '#f5e6c8',
    margin: 0,
    whiteSpace: 'pre-line',
  },
  indicator: {
    position: 'absolute',
    bottom: '0.65rem',
    right: '0.9rem',
    color: '#c8a850',
    fontSize: '0.95rem',
    animation: 'blink 0.8s step-end infinite',
  },
}
