/**
 * DialogueBox — RPG-style text box with typewriter effect.
 * Supports both the original page-based flow and branching dialogue trees.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

import type { DialogueNode } from '../data/dialogueTree'

export interface DialogueState {
  pages: string[]
  onComplete: () => void
  onTypingStateChange?: (typing: boolean) => void
  onTypingProgress?: (visibleChars: number) => void
}

export interface DialogueTreeState {
  tree: Record<string, DialogueNode>
  startId: string
  onComplete: () => void
  onTypingStateChange?: (typing: boolean) => void
  onTypingProgress?: (visibleChars: number) => void
}

type Props = DialogueState | DialogueTreeState

const CHARS_PER_SECOND = 30

function isTreeDialogue(props: Props): props is DialogueTreeState {
  return 'tree' in props
}

export default function DialogueBox(props: Props) {
  const { onComplete, onTypingStateChange, onTypingProgress } = props
  const treeMode = isTreeDialogue(props)

  const pages = useMemo(
    () => (!treeMode ? props.pages : []),
    [props, treeMode],
  )

  const [pageIndex, setPageIndex] = useState(0)
  const [nodeId, setNodeId] = useState(treeMode ? props.startId : '')
  const [displayed, setDisplayed] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [choiceIndex, setChoiceIndex] = useState(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (treeMode) {
      setNodeId(props.startId)
      setChoiceIndex(0)
    }
  }, [props, treeMode])

  const currentNode = treeMode ? props.tree[nodeId] ?? null : null
  const currentText = treeMode
    ? (currentNode?.text ?? '')
    : (pages[pageIndex] ?? '')
  const choices = treeMode ? currentNode?.choices ?? [] : []
  const speakerLabel = treeMode
    ? currentNode?.speaker === 'player'
      ? 'YOU'
      : 'MUMMY'
    : null

  useEffect(() => {
    setChoiceIndex(0)
  }, [nodeId, pageIndex])

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
  }, [currentText, onTypingProgress, onTypingStateChange])

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

    if (treeMode) {
      if (!currentNode) {
        onComplete()
        return
      }

      if (choices.length > 0) {
        const nextId = choices[choiceIndex]?.nextId
        if (nextId) setNodeId(nextId)
        return
      }

      if (currentNode.nextId) {
        setNodeId(currentNode.nextId)
        return
      }

      onComplete()
      return
    }

    if (pageIndex < pages.length - 1) {
      setPageIndex((i) => i + 1)
    } else {
      onComplete()
    }
  }, [choiceIndex, choices, currentNode, isComplete, onComplete, pageIndex, pages.length, revealFullPage, treeMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape') {
        e.preventDefault()
        onComplete()
        return
      }

      if (treeMode && isComplete && choices.length > 0) {
        if (e.code === 'ArrowUp') {
          e.preventDefault()
          setChoiceIndex((i) => (i - 1 + choices.length) % choices.length)
          return
        }
        if (e.code === 'ArrowDown') {
          e.preventDefault()
          setChoiceIndex((i) => (i + 1) % choices.length)
          return
        }
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [advance, choices.length, isComplete, onComplete, treeMode])

  const handleChoiceClick = useCallback((index: number) => {
    if (!isComplete) {
      revealFullPage()
      return
    }
    setChoiceIndex(index)
    const nextId = choices[index]?.nextId
    if (nextId) setNodeId(nextId)
  }, [choices, isComplete, revealFullPage])

  return (
    <div style={styles.overlay} onClick={choices.length > 0 && isComplete ? undefined : advance}>
      <div style={styles.box}>
        {speakerLabel && <div style={styles.speakerTag}>{speakerLabel}</div>}
        <p style={styles.text}>{displayed}</p>

        {isComplete && choices.length > 0 && (
          <div style={styles.choiceList} onClick={(e) => e.stopPropagation()}>
            {choices.map((choice, index) => {
              const selected = index === choiceIndex
              return (
                <button
                  key={`${choice.label}-${choice.nextId}`}
                  type="button"
                  style={{
                    ...styles.choiceBtn,
                    ...(selected ? styles.choiceBtnSelected : null),
                  }}
                  onMouseEnter={() => setChoiceIndex(index)}
                  onClick={() => handleChoiceClick(index)}
                >
                  <span style={styles.choiceCursor}>{selected ? '>' : ' '}</span>
                  <span>{choice.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {isComplete && choices.length === 0 && <span style={styles.indicator}>▼</span>}
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
    background: 'rgba(20, 12, 4, 0.94)',
    border: '3px solid #c8a850',
    padding: '1rem 1.45rem 1.2rem',
    minHeight: '104px',
    position: 'relative',
    borderRadius: '10px',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.28)',
  },
  speakerTag: {
    display: 'inline-block',
    marginBottom: '0.8rem',
    padding: '0.28rem 0.55rem',
    border: '2px solid rgba(200, 168, 80, 0.7)',
    background: 'rgba(0, 0, 0, 0.22)',
    color: '#f0d494',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    letterSpacing: '0.08em',
  },
  text: {
    fontFamily: 'system-ui, sans-serif',
    fontSize: '1.08rem',
    lineHeight: 1.6,
    color: '#f5e6c8',
    margin: 0,
    whiteSpace: 'pre-line',
  },
  choiceList: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  choiceBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    width: '100%',
    background: 'rgba(32, 18, 6, 0.88)',
    border: '2px solid rgba(200, 168, 80, 0.28)',
    color: '#f5e6c8',
    padding: '0.7rem 0.8rem',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    lineHeight: 1.8,
  },
  choiceBtnSelected: {
    border: '2px solid #c8a850',
    background: 'rgba(56, 32, 10, 0.95)',
    boxShadow: '0 0 0 1px rgba(255, 226, 153, 0.2) inset',
  },
  choiceCursor: {
    color: '#f0d494',
    width: '0.75rem',
    flex: '0 0 auto',
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
