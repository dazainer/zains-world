/**
 * useGameEngine — React hook that mounts and tears down the GameEngine
 * when the canvas element is available, and bridges game events to
 * React state (dialogue box, interaction prompt, open panels).
 */
import { useEffect, useState, type RefObject } from 'react'
import { GameEngine } from '../game/GameEngine'
import type { DialogueState } from '../components/DialogueBox'

export interface GameUIState {
  showInteractionPrompt: boolean
  dialogueState: DialogueState | null
}

export function useGameEngine(canvasRef: RefObject<HTMLCanvasElement | null>): GameUIState {
  const [showInteractionPrompt, setShowInteractionPrompt] = useState(false)
  const [dialogueState, setDialogueState] = useState<DialogueState | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const engine = new GameEngine(canvas)

    // TODO: wire engine events to state setters
    // engine.on('interactionPrompt', setShowInteractionPrompt)
    // engine.on('dialogue', setDialogueState)

    engine.start()

    return () => {
      engine.stop()
    }
  }, [canvasRef])

  return { showInteractionPrompt, dialogueState }
}
