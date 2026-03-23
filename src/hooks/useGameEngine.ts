/**
 * useGameEngine — mounts and tears down the GameEngine when the canvas is ready.
 * Returns UI state the engine needs to push up to React (dialogue, prompts, panels).
 *
 * The canvas ref is stable (React guarantees this), so the effect uses [] deps
 * and runs exactly once on mount / once on unmount.
 */
import { useEffect, useState, type RefObject } from 'react'
import { GameEngine } from '../game/GameEngine'
import type { DialogueState } from '../components/DialogueBox'

export interface GameUIState {
  showInteractionPrompt: boolean
  dialogueState: DialogueState | null
}

export function useGameEngine(canvasRef: RefObject<HTMLCanvasElement | null>): GameUIState {
  // These will be driven by engine callbacks once interactions are implemented
  const [showInteractionPrompt] = useState(false)
  const [dialogueState] = useState<DialogueState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine(canvas)
    engine.start()

    return () => {
      engine.stop()
    }
  }, []) // stable ref — intentionally omitted from deps

  return { showInteractionPrompt, dialogueState }
}
