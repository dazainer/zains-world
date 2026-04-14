/**
 * WelcomeScreen — cinematic intro overlay shown on first page load.
 *
 * Sequence:
 *   1. Black screen → "Zain's World" fades in (gold, Press Start 2P)
 *   2. After 1s → subtitle fades in
 *   3. After 1.5s more → "Press any key to begin" blinks
 *   4. Any keypress/tap → entire screen fades out over 500ms → unmounts
 *
 * Uses sessionStorage plus reload detection so refresh re-shows it while
 * navigating to /portfolio and back does not.
 */
import { useState, useEffect, useCallback } from 'react'

const SESSION_KEY = 'zw-welcome-seen'
const WELCOME_SCREEN_ENABLED = true
const DEV_SKIP_INTRO_PARAM = 'devSkipIntro'

function shouldSkipWelcomeForDev(): boolean {
  if (!import.meta.env.DEV || typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get(DEV_SKIP_INTRO_PARAM) === '1'
}

function isReloadNavigation(): boolean {
  const navEntry = performance.getEntriesByType('navigation')[0]
  return navEntry instanceof PerformanceNavigationTiming && navEntry.type === 'reload'
}

if (WELCOME_SCREEN_ENABLED && typeof window !== 'undefined' && isReloadNavigation()) {
  sessionStorage.removeItem(SESSION_KEY)
}

/** Returns true if the welcome screen should be shown. */
export function shouldShowWelcome(): boolean {
  if (!WELCOME_SCREEN_ENABLED) return false
  if (shouldSkipWelcomeForDev()) return false
  return sessionStorage.getItem(SESSION_KEY) !== '1'
}

interface Props {
  onDismissStart?: () => void
  onDismiss: () => void
}

export default function WelcomeScreen({ onDismissStart, onDismiss }: Props) {
  // Phase drives what's visible. 'init' is the first render (everything hidden).
  const [phase, setPhase] = useState<'init' | 'title' | 'subtitle' | 'ready' | 'fadeout'>('init')

  // Timed sequence: init → title (fade in) → subtitle → ready
  useEffect(() => {
    // Trigger title fade-in on next frame so the CSS transition fires
    const t0 = requestAnimationFrame(() => setPhase('title'))
    const t1 = setTimeout(() => setPhase('subtitle'), 1000)
    const t2 = setTimeout(() => setPhase('ready'), 2500)
    return () => { cancelAnimationFrame(t0); clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Dismiss handler
  const dismiss = useCallback(() => {
    if (phase === 'fadeout') return
    onDismissStart?.()
    sessionStorage.setItem(SESSION_KEY, '1')
    setPhase('fadeout')
    setTimeout(onDismiss, 500)
  }, [onDismiss, onDismissStart, phase])

  // Listen for any keypress or pointer/touch
  useEffect(() => {
    if (phase !== 'ready') return
    const onKey = () => dismiss()
    const onPointer = () => dismiss()
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [phase, dismiss])

  const isFadeout = phase === 'fadeout'
  const showTitle = phase !== 'init'
  const showSubtitle = phase === 'subtitle' || phase === 'ready' || isFadeout
  const showPrompt = phase === 'ready' || isFadeout

  return (
    <div
      style={{
        ...styles.backdrop,
        opacity: isFadeout ? 0 : 1,
        transition: 'opacity 500ms ease-out',
      }}
    >
      <div style={styles.content}>
        <h1
          style={{
            ...styles.title,
            opacity: showTitle ? 1 : 0,
            transition: 'opacity 800ms ease-in',
          }}
        >
          Zain's World
        </h1>

        <p
          style={{
            ...styles.subtitle,
            opacity: showSubtitle ? 1 : 0,
            transition: 'opacity 800ms ease-in',
          }}
        >
          Use arrow keys to explore. Space to interact.
        </p>

        <p
          style={{
            ...styles.prompt,
            opacity: showPrompt ? 1 : 0,
            visibility: showPrompt ? 'visible' : 'hidden',
            animation: showPrompt && !isFadeout ? 'wsBlink 1.2s step-end infinite' : 'none',
          }}
        >
          Press any key to begin
        </p>
      </div>

      {/* Injected keyframes */}
      <style>{`
        @keyframes wsBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Trigger initial title fade-in on mount via a zero-delay trick ─────────
// The title starts invisible and fades in; the backdrop is already opaque
// from the start, so the user sees black → title.

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: '#0a0804',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 70,
    pointerEvents: 'auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1.25rem',
    userSelect: 'none',
  },
  title: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 'clamp(1.2rem, 4vw, 2rem)',
    color: '#c8a850',
    margin: 0,
    textShadow: '0 0 20px rgba(200, 168, 80, 0.4)',
    opacity: 0,           // starts invisible, set to 1 via inline override
  },
  subtitle: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 'clamp(0.45rem, 1.3vw, 0.65rem)',
    color: '#a89070',
    margin: 0,
    lineHeight: 1.8,
    textAlign: 'center',
    opacity: 0,
  },
  prompt: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 'clamp(0.4rem, 1.1vw, 0.55rem)',
    color: '#f5e6c8',
    margin: 0,
    marginTop: '1.5rem',
    opacity: 0,
  },
}
