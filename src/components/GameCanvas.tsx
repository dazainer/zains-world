/**
 * GameCanvas — mounts the HTML5 canvas and starts the GameEngine.
 * Renders at a native low resolution (NATIVE_W × NATIVE_H) then scales
 * up via CSS to fill the viewport with `image-rendering: pixelated`.
 */
import { useEffect, useRef } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import DialogueBox from './DialogueBox'
import InteractionPrompt from './InteractionPrompt'
import MobileControls from './MobileControls'

const NATIVE_W = 512
const NATIVE_H = 288

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { showInteractionPrompt, dialogueState } = useGameEngine(canvasRef)

  const isMobile = 'ontouchstart' in window && window.innerWidth < 480

  if (isMobile) {
    return (
      <div style={styles.mobilePrompt}>
        <p style={styles.mobileText}>This experience is best on desktop.</p>
        <div style={styles.mobileButtons}>
          <button style={styles.mobileBtn} onClick={() => {}}>Try anyway</button>
          <a href="/portfolio" style={styles.mobileBtn}>View portfolio</a>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={NATIVE_W}
        height={NATIVE_H}
        style={styles.canvas}
      />
      {showInteractionPrompt && <InteractionPrompt />}
      {dialogueState && (
        <DialogueBox
          pages={dialogueState.pages}
          onComplete={dialogueState.onComplete}
        />
      )}
      <MobileControls />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1008',
    overflow: 'hidden',
  },
  canvas: {
    width: '100vw',
    height: '100vh',
    objectFit: 'contain',
    imageRendering: 'pixelated',
  },
  mobilePrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '1rem',
    padding: '2rem',
    textAlign: 'center',
    background: '#1a1008',
    color: '#f5e6c8',
  },
  mobileText: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.75rem',
    lineHeight: 1.8,
  },
  mobileButtons: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mobileBtn: {
    padding: '0.75rem 1.5rem',
    background: '#c8a850',
    color: '#1a1008',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.6rem',
    textDecoration: 'none',
    display: 'inline-block',
  },
}
