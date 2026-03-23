/**
 * GameCanvas — mounts the HTML5 canvas and drives the game engine.
 *
 * Native resolution: 512×288 (16:9). The canvas element has those exact pixel
 * dimensions. CSS scales it to fill the viewport while maintaining aspect ratio
 * via CSS min() so pixels stay perfectly square (pixelated rendering).
 *
 * Layout:
 *   - width  = min(100vw, 100vh × 16/9)
 *   - height = min(100vh, 100vw × 9/16)
 * On a 16:9 screen the canvas fills edge-to-edge. On other ratios it letterboxes
 * (dark bars) rather than stretching.
 */
import { useRef } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import DialogueBox from './DialogueBox'
import InteractionPrompt from './InteractionPrompt'
import MobileControls from './MobileControls'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { showInteractionPrompt, dialogueState } = useGameEngine(canvasRef)

  const isMobile = 'ontouchstart' in window && window.innerWidth < 480

  if (isMobile) {
    return (
      <div style={styles.mobilePrompt}>
        <p style={styles.mobileText}>This experience is best on desktop.</p>
        <div style={styles.mobileButtons}>
          <button style={styles.mobileBtn} onClick={() => window.location.reload()}>
            Try anyway
          </button>
          <a href="/portfolio" style={styles.mobileBtn}>View portfolio</a>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <canvas
        ref={canvasRef}
        width={512}
        height={288}
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
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1008',
    overflow: 'hidden',
  },
  canvas: {
    // Scale up from 512×288 to fill the viewport while preserving 16:9 aspect ratio.
    // CSS min() picks whichever dimension is the bottleneck.
    width:  'min(100vw, calc(100vh * 16 / 9))',
    height: 'min(100vh, calc(100vw * 9 / 16))',
    imageRendering: 'pixelated',
    display: 'block',
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
