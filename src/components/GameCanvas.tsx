/**
 * GameCanvas — mounts the HTML5 canvas and drives the game engine.
 *
 * Native resolution: 512x288 (16:9). CSS scales it to fill the viewport.
 * Routes interaction events from the engine to the appropriate UI overlays.
 * Shows a loading screen while assets load.
 */
import { useRef, useEffect, useState } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import DialogueBox from './DialogueBox'
import InteractionPrompt from './InteractionPrompt'
import ProjectPanel from './ProjectPanel'
import ContactPanel from './ContactPanel'
import DebugTerminal from './DebugTerminal'
import BookshelfPanel from './BookshelfPanel'
import SnakeGame from './SnakeGame'
import MobileControls from './MobileControls'
import { projects } from '../data/projects'
import { personalInfo } from '../data/personalInfo'
import { experiences } from '../data/experience'
import { skills } from '../data/skills'
import { bulletinNotices } from '../data/bulletinNotices'

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const {
    showInteractionPrompt,
    interaction,
    clearInteraction,
    loadProgress,
    isReady,
    inputManager,
  } = useGameEngine(canvasRef)

  // Mobile prompt: only shown for small touch screens (< 480px).
  // Stored in state so "Try anyway" can dismiss it.
  const [showMobilePrompt, setShowMobilePrompt] = useState(
    () => 'ontouchstart' in window && window.innerWidth < 480,
  )

  // ── Side-effect interactions (fire-and-forget on interaction) ────────────
  const sideEffectFired = useRef(false)
  useEffect(() => {
    if (!interaction) { sideEffectFired.current = false; return }
    if (sideEffectFired.current) return
    if (interaction.id === 'resume-chest') {
      sideEffectFired.current = true
      const a = document.createElement('a')
      a.href = '/resume.pdf'
      a.download = 'Zain_Khalil_Resume.pdf'
      a.click()
    } else if (interaction.id === 'jukebox') {
      sideEffectFired.current = true
      window.open('https://open.spotify.com', '_blank', 'noopener')
      clearInteraction()
    }
  }, [interaction, clearInteraction])

  // ── Derive overlay from interaction ─────────────────────────────────────
  let overlay: React.ReactNode = null

  if (interaction) {
    const { id, payload } = interaction

    if (id === 'npc-aboutme') {
      overlay = (
        <DialogueBox
          pages={personalInfo.bio}
          onComplete={clearInteraction}
        />
      )
    } else if (id === 'resume-chest') {
      overlay = (
        <DialogueBox
          pages={["You found Zain's resume! Downloading now..."]}
          onComplete={clearInteraction}
        />
      )
    } else if (id.startsWith('station-')) {
      const project = projects.find(p => p.id === payload)
      if (project) {
        overlay = <ProjectPanel project={project} onClose={clearInteraction} />
      }
    } else if (id.startsWith('exp-')) {
      const exp = experiences.find(e => e.id === payload)
      if (exp) {
        const pages = [
          `${exp.role} — ${exp.organization}\n${exp.period} | ${exp.location}`,
          exp.highlights.map(h => `- ${h}`).join('\n'),
        ]
        overlay = <DialogueBox pages={pages} onComplete={clearInteraction} />
      }
    } else if (id.startsWith('skill-')) {
      const skill = skills.find(s => s.name === payload)
      if (skill) {
        const tierLabel = skill.tier.charAt(0).toUpperCase() + skill.tier.slice(1)
        overlay = (
          <DialogueBox
            pages={[`${skill.name} — ${tierLabel}`]}
            onComplete={clearInteraction}
          />
        )
      }
    } else if (id === 'contact-portal') {
      overlay = <ContactPanel onClose={clearInteraction} />
    } else if (id === 'debug-terminal') {
      overlay = <DebugTerminal onClose={clearInteraction} />
    } else if (id === 'bookshelf') {
      overlay = <BookshelfPanel onClose={clearInteraction} />
    } else if (id === 'arcade-cabinet') {
      overlay = <SnakeGame onClose={clearInteraction} />
    } else if (id === 'bulletin-board') {
      const notice = bulletinNotices[Math.floor(Math.random() * bulletinNotices.length)]
      overlay = <DialogueBox pages={[notice]} onComplete={clearInteraction} />
    }

    // Jukebox is handled purely via useEffect (no overlay needed).
    // For all other unmatched interactions, clear so the engine unpauses.
    if (!overlay && id !== 'jukebox') {
      clearInteraction()
    }
  }

  // ── Mobile prompt (< 480px touch device) ────────────────────────────────
  if (showMobilePrompt) {
    return (
      <div style={styles.mobilePrompt}>
        <p style={styles.mobileTitle}>Zain's World</p>
        <p style={styles.mobileText}>This experience is best on desktop.</p>
        <div style={styles.mobileButtons}>
          <button
            style={styles.mobileBtn}
            onClick={() => setShowMobilePrompt(false)}
          >
            Try anyway
          </button>
          <a href="/portfolio" style={styles.mobileBtnAlt}>View portfolio</a>
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

      {/* Loading overlay */}
      {!isReady && (
        <div style={styles.loadingOverlay}>
          <p style={styles.loadingTitle}>Loading Zain's World...</p>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: `${Math.round(loadProgress * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {showInteractionPrompt && !overlay && <InteractionPrompt />}
      {overlay}
      <MobileControls inputManager={inputManager} />
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
    width: 'min(100vw, calc(100vh * 16 / 9))',
    height: 'min(100vh, calc(100vw * 9 / 16))',
    imageRendering: 'pixelated',
    display: 'block',
  },

  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: '#1a1008',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.25rem',
    zIndex: 60,
  },
  loadingTitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.85rem',
    color: '#c8a850',
  },
  progressBar: {
    width: '200px',
    height: '6px',
    background: '#3a2510',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#c8a850',
    borderRadius: '3px',
    transition: 'width 0.15s ease-out',
  },

  // Mobile prompt
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
  mobileTitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '1rem',
    color: '#c8a850',
    marginBottom: '0.5rem',
  },
  mobileText: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.65rem',
    lineHeight: 1.8,
    color: '#a89070',
  },
  mobileButtons: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '0.5rem',
  },
  mobileBtn: {
    padding: '0.75rem 1.5rem',
    background: '#c8a850',
    color: '#1a1008',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    textDecoration: 'none',
  },
  mobileBtnAlt: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    color: '#c8a850',
    border: '2px solid #c8a850',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    textDecoration: 'none',
    display: 'inline-block',
  },
}
