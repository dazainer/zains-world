/**
 * useGameEngine — mounts the GameEngine, wires UI callbacks, and exposes state to React.
 */
import { useEffect, useRef, useState, useCallback, type RefObject } from 'react'
import { GameEngine, type GameUICallbacks } from '../game/GameEngine'
import type { InputManager } from '../game/InputManager'

export interface GameUIState {
  showInteractionPrompt: boolean
  /** When set, the player interacted with a zone — id + optional payload */
  interaction: { id: string; payload?: string } | null
  clearInteraction: () => void
  engineRef: React.RefObject<GameEngine | null>
  /** Asset loading progress (0–1) */
  loadProgress: number
  /** True when all assets have loaded */
  isReady: boolean
  /** InputManager reference for MobileControls to inject virtual input */
  inputManager: InputManager | null
}

export function useGameEngine(canvasRef: RefObject<HTMLCanvasElement | null>): GameUIState {
  const [showInteractionPrompt, setShowInteractionPrompt] = useState(false)
  const [interaction, setInteraction] = useState<{ id: string; payload?: string } | null>(null)
  const [loadProgress, setLoadProgress] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [inputManager, setInputManager] = useState<InputManager | null>(null)
  const engineRef = useRef<GameEngine | null>(null)

  const clearInteraction = useCallback(() => {
    setInteraction(null)
    engineRef.current?.setUIPaused(false)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const callbacks: GameUICallbacks = {
      onShowInteractionPrompt: setShowInteractionPrompt,
      onInteraction: (id, payload) => {
        setInteraction({ id, payload })
        // Pause game input while any interaction overlay is open
        engineRef.current?.setUIPaused(true)
      },
      onLoadProgress: (loaded, total) => {
        setLoadProgress(total > 0 ? loaded / total : 0)
      },
      onReady: () => setIsReady(true),
    }

    const engine = new GameEngine(canvas, callbacks)
    engineRef.current = engine
    setInputManager(engine.getInputManager())
    engine.start()

    return () => {
      engine.stop()
      engineRef.current = null
      setInputManager(null)
    }
  }, []) // stable ref — intentionally omitted from deps

  return {
    showInteractionPrompt, interaction, clearInteraction,
    engineRef, loadProgress, isReady, inputManager,
  }
}
