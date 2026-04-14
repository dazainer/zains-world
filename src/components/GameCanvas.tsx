/**
 * GameCanvas — mounts the HTML5 canvas and drives the game engine.
 *
 * Native resolution: 512x288 (16:9). CSS scales it to fill the viewport.
 * Routes interaction events from the engine to the appropriate UI overlays.
 * Shows a loading screen while assets load.
 */
import { useRef, useEffect, useState, useCallback } from 'react'
import { useGameEngine } from '../hooks/useGameEngine'
import DialogueBox from './DialogueBox'
import InteractionPrompt from './InteractionPrompt'
import ProjectPanel from './ProjectPanel'
import ContactPanel from './ContactPanel'
import DebugTerminal from './DebugTerminal'
import BookshelfPanel from './BookshelfPanel'
import SnakeGame from './SnakeGame'
import TicTacToe from './TicTacToe'
import MobileControls from './MobileControls'
import MapOverlay from './MapOverlay'
import ResumePrompt from './ResumePrompt'
import WelcomeScreen, { shouldShowWelcome } from './WelcomeScreen'
import ExperiencePhotoPanel from './ExperiencePhotoPanel'
import { primeSnakeRunSession } from '../lib/snakeRunSession'
import { projects } from '../data/projects'
import { personalInfo } from '../data/personalInfo'
import { experiences } from '../data/experience'
import { skills } from '../data/skills'
import { bulletinNotices } from '../data/bulletinNotices'
import { towerPaintingOverlayByInteractionId } from '../game/maps/experienceTower'

const OVERWORLD_MUSIC_VOLUME = 0.15
const INTERIOR_MUSIC_VOLUME = 0.05
type TrackKey = 'main' | 'indoor'
type OneShotSfxKey =
  | 'mapopen'
  | 'mapclose'
  | 'welcomedismiss'
  | 'door'
  | 'interact_default'
  | 'interact_skill'
  | 'dialogue_close'
  | 'chest_open'

const ONE_SHOT_SFX: Record<OneShotSfxKey, string> = {
  mapopen: '/assets/sfx/mapopen.wav',
  mapclose: '/assets/sfx/mapclose.wav',
  welcomedismiss: '/assets/sfx/welcomedismiss.wav',
  door: '/assets/sfx/door.wav',
  interact_default: '/assets/sfx/interact_default.wav',
  interact_skill: '/assets/sfx/interact_skill.wav',
  dialogue_close: '/assets/sfx/dialogue_close.wav',
  chest_open: '/assets/sfx/chest_open.wav',
}

const SFX_VOLUMES: Record<OneShotSfxKey | 'footsteps' | 'dialogue_bleep', number> = {
  mapopen: 0.0243,
  mapclose: 0.0243,
  welcomedismiss: 0.132,
  door: 0.018,
  interact_default: 0.08,
  interact_skill: 0.045,
  dialogue_close: 0.0576,
  chest_open: 0.08,
  footsteps: 0.0325,
  dialogue_bleep: 0.192,
}
const FOOTSTEP_SAMPLE_INTERVAL_MS = Math.round(((60 / 225) * 1000) / 1.15)
const DIALOGUE_BLEEP_PLAYBACK_RATE = 3.2
const OUTDOOR_FOOTSTEP_PATHS = [
  '/assets/sfx/footstep_indoor_A.wav',
  '/assets/sfx/footstep_outdoor_B.wav',
] as const
const INDOOR_FOOTSTEP_PATHS = [
  '/assets/sfx/footstep_outdoor_A.wav',
  '/assets/sfx/footstep_indoor_B.wav',
] as const

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const photoOverlayRef = useRef<HTMLCanvasElement>(null)
  const mainMusicRef = useRef<HTMLAudioElement | null>(null)
  const indoorMusicRef = useRef<HTMLAudioElement | null>(null)
  const sfxClipsRef = useRef<Partial<Record<OneShotSfxKey, HTMLAudioElement>>>({})
  const footstepBasesRef = useRef<{ outdoor: HTMLAudioElement[]; indoor: HTMLAudioElement[] }>({ outdoor: [], indoor: [] })
  const dialogueBleepRef = useRef<HTMLAudioElement | null>(null)
  const footstepTimerRef = useRef<number | null>(null)
  const footstepIndexRef = useRef(0)
  const lastDialogueBleepCharRef = useRef(0)
  const activeTransientAudioRef = useRef<Set<HTMLAudioElement>>(new Set())
  const activeTrackRef = useRef<TrackKey | null>(null)
  const muteSnapshotRef = useRef<{ trackKey: TrackKey; time: number; mutedAt: number } | null>(null)
  const {
    showInteractionPrompt,
    interaction,
    clearInteraction,
    engineRef,
    loadProgress,
    isReady,
    inputManager,
  } = useGameEngine(canvasRef)

  // ── Photo overlay canvas (full-resolution, smooth rendering) ──────────
  useEffect(() => {
    const overlay = photoOverlayRef.current
    const engine = engineRef.current
    const gameCanvas = canvasRef.current
    if (!overlay || !engine || !gameCanvas) return

    engine.setPhotoOverlay(overlay)

    // Keep overlay canvas resolution matched to CSS display size
    const updateSize = () => {
      const rect = gameCanvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      overlay.width = Math.round(rect.width * dpr)
      overlay.height = Math.round(rect.height * dpr)
    }
    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(gameCanvas)
    return () => observer.disconnect()
  }, [isReady, engineRef])

  const [appVisible, setAppVisible] = useState(
    () => typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  )
  const [musicMuted, setMusicMuted] = useState(false)
  const [soundsMuted, setSoundsMuted] = useState(false)
  const [currentRoomId, setCurrentRoomId] = useState('overworld')
  const [playerWalking, setPlayerWalking] = useState(false)

  useEffect(() => {
    void primeSnakeRunSession().catch(() => {})
  }, [])

  const stopTransientAudio = useCallback(() => {
    for (const audio of activeTransientAudioRef.current) {
      audio.pause()
      audio.currentTime = 0
    }
    activeTransientAudioRef.current.clear()
    if (footstepTimerRef.current !== null) {
      window.clearInterval(footstepTimerRef.current)
      footstepTimerRef.current = null
    }
  }, [])

  const trackTransientAudio = useCallback((audio: HTMLAudioElement) => {
    activeTransientAudioRef.current.add(audio)
    const cleanup = () => {
      activeTransientAudioRef.current.delete(audio)
      audio.removeEventListener('ended', cleanup)
      audio.removeEventListener('error', cleanup)
    }
    audio.addEventListener('ended', cleanup)
    audio.addEventListener('error', cleanup)
  }, [])

  const playSfx = useCallback((key: OneShotSfxKey) => {
    if (soundsMuted || !appVisible) return
    const base = sfxClipsRef.current[key]
    if (!base) return

    const clip = base.cloneNode() as HTMLAudioElement
    clip.volume = base.volume
    trackTransientAudio(clip)
    void clip.play().catch(() => {})
  }, [appVisible, soundsMuted, trackTransientAudio])

  useEffect(() => {
    const clips: Partial<Record<OneShotSfxKey, HTMLAudioElement>> = {}
    for (const [key, src] of Object.entries(ONE_SHOT_SFX) as [OneShotSfxKey, string][]) {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.volume = SFX_VOLUMES[key]
      clips[key] = audio
    }

    const makeStepAudio = (src: string) => {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.volume = SFX_VOLUMES.footsteps
      return audio
    }

    const outdoor = OUTDOOR_FOOTSTEP_PATHS.map(makeStepAudio)
    const indoor = INDOOR_FOOTSTEP_PATHS.map(makeStepAudio)

    const dialogueBleep = new Audio('/assets/sfx/dialogue_bleep.wav')
    dialogueBleep.preload = 'auto'
    dialogueBleep.volume = SFX_VOLUMES.dialogue_bleep
    dialogueBleep.playbackRate = DIALOGUE_BLEEP_PLAYBACK_RATE

    sfxClipsRef.current = clips
    footstepBasesRef.current = { outdoor, indoor }
    dialogueBleepRef.current = dialogueBleep

    return () => {
      stopTransientAudio()
      dialogueBleep.pause()
      footstepBasesRef.current = { outdoor: [], indoor: [] }
      dialogueBleepRef.current = null
      sfxClipsRef.current = {}
    }
  }, [stopTransientAudio])

  useEffect(() => {
    const markHidden = () => setAppVisible(false)
    const markVisible = () => {
      if (document.visibilityState !== 'hidden') setAppVisible(true)
    }
    const handleVisibility = () => {
      setAppVisible(document.visibilityState !== 'hidden')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', markHidden)
    window.addEventListener('blur', markHidden)
    window.addEventListener('pageshow', markVisible)
    window.addEventListener('focus', markVisible)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', markHidden)
      window.removeEventListener('blur', markHidden)
      window.removeEventListener('pageshow', markVisible)
      window.removeEventListener('focus', markVisible)
    }
  }, [])

  useEffect(() => {
    if (!appVisible) {
      mainMusicRef.current?.pause()
      indoorMusicRef.current?.pause()
      dialogueBleepRef.current?.pause()
      stopTransientAudio()
    }
  }, [appVisible, stopTransientAudio])

  // ── Welcome screen (blocks input until dismissed) ─────────────────────────
  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome)

  // Pause engine while welcome is visible
  useEffect(() => {
    if (showWelcome && isReady) {
      engineRef.current?.setUIPaused(true)
    }
  }, [showWelcome, isReady, engineRef])

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false)
    engineRef.current?.suppressCurrentActionKeys()
    engineRef.current?.setUIPaused(false)
  }, [engineRef])

  // ── Map overlay (M key toggle) ──────────────────────────────────────────
  const [showMap, setShowMap] = useState(false)

  // Poll InputManager for M key presses (consumed-once pattern).
  // Don't open the map while another overlay (interaction) is active.
  useEffect(() => {
    if (!inputManager) return
    const id = setInterval(() => {
      if (inputManager.consumeMapToggle()) {
        setShowMap(prev => {
          if (showWelcome) return false // block all game input during intro
          if (!prev && interaction) return false // don't open during interaction
          const next = !prev
          playSfx(next ? 'mapopen' : 'mapclose')
          engineRef.current?.setUIPaused(next)
          return next
        })
      }
    }, 16) // ~60fps polling
    return () => clearInterval(id)
  }, [inputManager, engineRef, interaction, showWelcome])

  const closeMap = useCallback(() => {
    playSfx('mapclose')
    setShowMap(false)
    engineRef.current?.suppressCurrentActionKeys()
    engineRef.current?.setUIPaused(false)
  }, [engineRef, playSfx])

  // ── Soundtrack setup (overworld + interior loop) ────────────────────────
  useEffect(() => {
    const main = new Audio('/assets/soundtracks/main.ogg')
    const indoor = new Audio('/assets/soundtracks/indoor.ogg')

    main.loop = true
    indoor.loop = true
    main.preload = 'auto'
    indoor.preload = 'auto'
    main.volume = OVERWORLD_MUSIC_VOLUME
    indoor.volume = INTERIOR_MUSIC_VOLUME

    mainMusicRef.current = main
    indoorMusicRef.current = indoor

    return () => {
      activeTrackRef.current = null
      for (const track of [main, indoor]) {
        track.pause()
        track.currentTime = 0
      }
      mainMusicRef.current = null
      indoorMusicRef.current = null
    }
  }, [])

  // Poll the live room id so soundtrack changes immediately on room swaps.
  useEffect(() => {
    if (!isReady) return
    const id = setInterval(() => {
      const roomId = engineRef.current?.getCurrentRoomId()
      if (roomId) {
        setCurrentRoomId(prev => (prev === roomId ? prev : roomId))
      }
    }, 100)
    return () => clearInterval(id)
  }, [isReady, engineRef])

  useEffect(() => {
    if (!isReady) return
    const id = setInterval(() => {
      const nextWalking = engineRef.current?.isPlayerWalking() ?? false
      setPlayerWalking(prev => (prev === nextWalking ? prev : nextWalking))
    }, 60)
    return () => clearInterval(id)
  }, [isReady, engineRef])

  useEffect(() => {
    const main = mainMusicRef.current
    const indoor = indoorMusicRef.current
    if (!main || !indoor) return

    main.volume = OVERWORLD_MUSIC_VOLUME
    indoor.volume = INTERIOR_MUSIC_VOLUME

    const soundtrackEnabled = appVisible && isReady && !showWelcome
    const targetKey: TrackKey = currentRoomId === 'overworld' ? 'main' : 'indoor'
    const target = targetKey === 'main' ? main : indoor
    const other = targetKey === 'main' ? indoor : main
    const syncMutedTrack = () => {
      const snapshot = muteSnapshotRef.current
      if (!snapshot) return

      const track = snapshot.trackKey === 'main' ? main : indoor
      const duration = Number.isFinite(track.duration) && track.duration > 0 ? track.duration : null
      const elapsed = (performance.now() - snapshot.mutedAt) / 1000
      const nextTime = duration ? (snapshot.time + elapsed) % duration : snapshot.time

      track.currentTime = nextTime
      muteSnapshotRef.current = {
        trackKey: snapshot.trackKey,
        time: nextTime,
        mutedAt: performance.now(),
      }
    }

    if (!soundtrackEnabled) {
      main.pause()
      indoor.pause()
      activeTrackRef.current = null
      muteSnapshotRef.current = null
      return
    }

    if (musicMuted) {
      if (!muteSnapshotRef.current) {
        muteSnapshotRef.current = {
          trackKey: targetKey,
          time: target.currentTime,
          mutedAt: performance.now(),
        }
      } else if (muteSnapshotRef.current.trackKey !== targetKey) {
        syncMutedTrack()
        muteSnapshotRef.current = {
          trackKey: targetKey,
          time: target.currentTime,
          mutedAt: performance.now(),
        }
      }

      main.pause()
      indoor.pause()
      activeTrackRef.current = targetKey
      return
    }

    if (muteSnapshotRef.current?.trackKey === targetKey) {
      syncMutedTrack()
    }
    muteSnapshotRef.current = null

    if (activeTrackRef.current !== targetKey) {
      other.pause()
    }

    activeTrackRef.current = targetKey

    if (target.paused) {
      void target.play().catch(() => {})
    }
  }, [appVisible, currentRoomId, isReady, musicMuted, showWelcome])

  useEffect(() => {
    const shouldPlay =
      isReady &&
      appVisible &&
      !showWelcome &&
      !showMap &&
      !interaction &&
      playerWalking &&
      !soundsMuted

    if (!shouldPlay) {
      if (footstepTimerRef.current !== null) {
        window.clearInterval(footstepTimerRef.current)
        footstepTimerRef.current = null
      }
      return
    }

    const bank = currentRoomId === 'overworld'
      ? footstepBasesRef.current.outdoor
      : footstepBasesRef.current.indoor

    if (bank.length === 0) return

    const playStep = () => {
      const base = bank[footstepIndexRef.current % bank.length]
      footstepIndexRef.current += 1
      const clip = base.cloneNode() as HTMLAudioElement
      clip.volume = base.volume
      trackTransientAudio(clip)
      void clip.play().catch(() => {})
    }

    playStep()
    footstepTimerRef.current = window.setInterval(playStep, FOOTSTEP_SAMPLE_INTERVAL_MS)

    return () => {
      if (footstepTimerRef.current !== null) {
        window.clearInterval(footstepTimerRef.current)
        footstepTimerRef.current = null
      }
    }
  }, [appVisible, currentRoomId, interaction, isReady, playerWalking, showMap, showWelcome, soundsMuted, trackTransientAudio])

  const previousRoomIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isReady) return
    const previousRoomId = previousRoomIdRef.current
    if (previousRoomId && previousRoomId !== currentRoomId) {
      playSfx('door')
    }
    previousRoomIdRef.current = currentRoomId
  }, [currentRoomId, isReady, playSfx])

  const previousInteractionIdRef = useRef<string | null>(null)
  useEffect(() => {
    const nextId = interaction?.id ?? null
    const previousId = previousInteractionIdRef.current

    if (nextId && previousId !== nextId) {
      if (nextId.startsWith('skill-')) {
        playSfx('interact_skill')
      } else {
        playSfx('interact_default')
      }

      if (nextId === 'resume-chest') {
        playSfx('chest_open')
      }
    }

    previousInteractionIdRef.current = nextId
  }, [interaction, playSfx])

  useEffect(() => {
    engineRef.current?.setResumeChestPromptOpen(interaction?.id === 'resume-chest')
  }, [engineRef, interaction])

  // ── Side-effect interactions (fire-and-forget on interaction) ────────────
  const sideEffectFired = useRef(false)
  useEffect(() => {
    if (!interaction) { sideEffectFired.current = false; return }
    if (sideEffectFired.current) return
    if (interaction.id === 'jukebox') {
      sideEffectFired.current = true
      window.open('https://youtu.be/dQw4w9WgXcQ?si=u61zpPlj8Kx06Jxn', '_blank', 'noopener')
      clearInteraction()
    } else if (interaction.id === 'mail-scroll') {
      sideEffectFired.current = true
      window.location.href = 'mailto:z7khalil@uwaterloo.ca'
      clearInteraction()
    } else if (interaction.id === 'connection-tome') {
      sideEffectFired.current = true
      window.open('https://www.linkedin.com/in/zainskhalil', '_blank', 'noopener')
      clearInteraction()
    } else if (interaction.id === 'code-archive') {
      sideEffectFired.current = true
      window.open('https://github.com/dazainer', '_blank', 'noopener')
      clearInteraction()
    }
  }, [interaction, clearInteraction])

  const closeTextOverlay = useCallback(() => {
    playSfx('dialogue_close')
    clearInteraction()
  }, [clearInteraction, playSfx])

  const handleDialogueTypingProgress = useCallback((visibleChars: number) => {
    if (visibleChars === 0) {
      lastDialogueBleepCharRef.current = 0
      return
    }
    if (soundsMuted || !appVisible) return
    if (visibleChars - lastDialogueBleepCharRef.current < 2) return

    lastDialogueBleepCharRef.current = visibleChars
    const base = dialogueBleepRef.current
    if (!base) return

    const clip = base.cloneNode() as HTMLAudioElement
    clip.volume = base.volume
    clip.playbackRate = DIALOGUE_BLEEP_PLAYBACK_RATE
    trackTransientAudio(clip)
    void clip.play().catch(() => {})
  }, [appVisible, soundsMuted, trackTransientAudio])

  // ── Derive overlay from interaction ─────────────────────────────────────
  let overlay: React.ReactNode = null

  if (interaction) {
    const { id, payload } = interaction

    if (id === 'npc-aboutme') {
      overlay = (
        <DialogueBox
          pages={personalInfo.bio}
          onComplete={closeTextOverlay}
          onTypingProgress={handleDialogueTypingProgress}
        />
      )
    } else if (id === 'resume-chest') {
      overlay = <ResumePrompt onClose={clearInteraction} />
    } else if (id.startsWith('station-')) {
      const project = projects.find(p => p.id === payload)
      if (project) {
        overlay = <ProjectPanel project={project} onClose={closeTextOverlay} />
      }
    } else if (id.startsWith('exp-')) {
      const exp = experiences.find(e => e.id === payload)
      if (exp) {
        const paintingOverlay = towerPaintingOverlayByInteractionId[id]
        overlay = (
          <ExperiencePhotoPanel
            experience={exp}
            photo={paintingOverlay?.photo ?? exp.photo}
            onClose={closeTextOverlay}
          />
        )
      }
    } else if (id.startsWith('skill-')) {
      const skill = skills.find(s => s.name === payload)
      if (skill) {
        const tierLabel = skill.tier.charAt(0).toUpperCase() + skill.tier.slice(1)
        overlay = (
          <DialogueBox
            pages={[`${skill.name} — ${tierLabel}`]}
            onComplete={closeTextOverlay}
            onTypingProgress={handleDialogueTypingProgress}
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
    } else if (id === 'tictactoe-table') {
      overlay = <TicTacToe onClose={clearInteraction} />
    } else if (id === 'bulletin-board') {
      const notice = bulletinNotices[Math.floor(Math.random() * bulletinNotices.length)]
      overlay = <DialogueBox pages={[notice]} onComplete={closeTextOverlay} onTypingProgress={handleDialogueTypingProgress} />
    }

    // Side-effect-only interactions (no overlay needed — handled via useEffect).
    const sideEffectIds = ['jukebox', 'mail-scroll', 'connection-tome', 'code-archive']
    // For all other unmatched interactions, clear so the engine unpauses.
    if (!overlay && !sideEffectIds.includes(id)) {
      clearInteraction()
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={512}
          height={288}
          style={styles.canvas}
        />
        <canvas
          ref={photoOverlayRef}
          style={styles.photoOverlay}
        />
      </div>

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

      {/* Welcome screen (shown after loading, blocks game input) */}
      {isReady && showWelcome && (
        <WelcomeScreen
          onDismissStart={() => playSfx('welcomedismiss')}
          onDismiss={dismissWelcome}
        />
      )}

      {isReady && !showWelcome && (
        <div style={styles.audioToggleStack}>
          <button
            type="button"
            aria-label={musicMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
            style={{
              ...styles.muteButton,
              ...(musicMuted ? styles.muteButtonMuted : null),
            }}
            onContextMenu={e => e.preventDefault()}
            onClick={() => setMusicMuted(prev => !prev)}
          >
            {musicMuted ? 'MUSIC OFF' : 'MUSIC ON'}
          </button>

          <button
            type="button"
            aria-label={soundsMuted ? 'Enable sound effects' : 'Disable sound effects'}
            style={{
              ...styles.muteButton,
              ...(soundsMuted ? styles.muteButtonMuted : null),
            }}
            onContextMenu={e => e.preventDefault()}
            onClick={() => setSoundsMuted(prev => !prev)}
          >
            {soundsMuted ? 'SOUNDS OFF' : 'SOUNDS ON'}
          </button>
        </div>
      )}

      {showInteractionPrompt && !overlay && !showMap && !showWelcome && <InteractionPrompt />}
      {overlay}
      {showMap && <MapOverlay engineRef={engineRef} onClose={closeMap} />}
      <MobileControls
        inputManager={inputManager}
        mode={
          interaction?.id === 'arcade-cabinet'
            ? 'snake'
            : interaction?.id === 'tictactoe-table'
              ? 'none'
              : 'game'
        }
      />
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
  canvasContainer: {
    position: 'relative',
    width: 'min(100vw, calc(100vh * 16 / 9))',
    height: 'min(100vh, calc(100vw * 9 / 16))',
  },
  canvas: {
    width: '100%',
    height: '100%',
    imageRendering: 'pixelated',
    display: 'block',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    imageRendering: 'auto',
  },
  audioToggleStack: {
    position: 'absolute',
    left: '1rem',
    top: '1rem',
    zIndex: 40,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  muteButton: {
    position: 'relative',
    background: 'rgba(20, 12, 4, 0.62)',
    border: '3px solid rgba(200, 168, 80, 0.85)',
    color: '#f5e6c8',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.62rem',
    letterSpacing: '0.04em',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(0, 0, 0, 0.24)',
    backdropFilter: 'blur(4px)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  },
  muteButtonMuted: {
    opacity: 0.72,
    border: '3px solid rgba(138, 122, 96, 0.9)',
    color: '#d8ccb3',
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

}
