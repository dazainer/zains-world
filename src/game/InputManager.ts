/**
 * InputManager — tracks keyboard and virtual d-pad state each frame (polling model).
 * Desktop: arrow keys / WASD for movement, Space/Enter to interact, Escape to close.
 * Mobile: state updated externally by MobileControls component via setVirtual().
 */
export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  interact: boolean
  escape: boolean
}

// Deploy-safe default: keep the debug systems in code, but disable keyboard access.
const DEBUG_KEY_TOGGLES_ENABLED = false

export class InputManager {
  private keys: Record<string, boolean> = {}
  private virtual: Partial<InputState> = {}

  // Consumed-once flags (set true on keydown, cleared after one read)
  private interactConsumed = false
  private escapeConsumed = false
  private debugOverlayQueued = false
  private overworldLayerCycleQueued = false
  private mapToggleQueued = false

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private isSectionKey(e: KeyboardEvent): boolean {
    return e.key === '§' || e.key === '±' || e.code === 'IntlBackslash'
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Don't intercept keys when user is typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    if (DEBUG_KEY_TOGGLES_ENABLED && (e.code === 'Backquote' || this.isSectionKey(e)) && e.repeat) {
      e.preventDefault()
      return
    }

    this.keys[e.code] = true
    if (e.code === 'Space' || e.code === 'Enter') this.interactConsumed = false
    if (e.code === 'Escape') this.escapeConsumed = false

    if (DEBUG_KEY_TOGGLES_ENABLED && e.code === 'Backquote') {
      this.debugOverlayQueued = true
      e.preventDefault()
    }

    if (DEBUG_KEY_TOGGLES_ENABLED && this.isSectionKey(e)) {
      this.overworldLayerCycleQueued = true
      e.preventDefault()
    }

    if (e.code === 'KeyM' && !e.repeat) {
      this.mapToggleQueued = true
    }

    // Prevent page scroll from arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false
  }

  /** Called by MobileControls to inject virtual button state */
  setVirtual(state: Partial<InputState>) {
    // Detect rising edge of virtual interact → reset consumed flag
    if (state.interact && !this.virtual.interact) {
      this.interactConsumed = false
    }
    this.virtual = state
  }

  getState(): InputState {
    return {
      up: !!(this.keys['ArrowUp'] || this.keys['KeyW'] || this.virtual.up),
      down: !!(this.keys['ArrowDown'] || this.keys['KeyS'] || this.virtual.down),
      left: !!(this.keys['ArrowLeft'] || this.keys['KeyA'] || this.virtual.left),
      right: !!(this.keys['ArrowRight'] || this.keys['KeyD'] || this.virtual.right),
      interact: !!(this.keys['Space'] || this.keys['Enter'] || this.virtual.interact),
      escape: !!(this.keys['Escape'] || this.virtual.escape),
    }
  }

  /** Returns true once per keydown press for interact */
  consumeInteract(): boolean {
    if ((this.keys['Space'] || this.keys['Enter'] || this.virtual.interact) && !this.interactConsumed) {
      this.interactConsumed = true
      return true
    }
    return false
  }

  /** Returns true once per keydown press for escape */
  consumeEscape(): boolean {
    if (this.keys['Escape'] && !this.escapeConsumed) {
      this.escapeConsumed = true
      return true
    }
    return false
  }

  /** Returns true once per keydown press for the debug overlay toggle. */
  consumeDebugOverlayToggle(): boolean {
    if (this.debugOverlayQueued) {
      this.debugOverlayQueued = false
      return true
    }
    return false
  }

  /** Returns true once per section-sign key press for overworld layer cycling. */
  consumeOverworldLayerCycle(): boolean {
    if (this.overworldLayerCycleQueued) {
      this.overworldLayerCycleQueued = false
      return true
    }
    return false
  }

  /** Returns true once per M key press for map overlay toggle. */
  consumeMapToggle(): boolean {
    if (this.mapToggleQueued) {
      this.mapToggleQueued = false
      return true
    }
    return false
  }

  /**
   * When an overlay closes via the same key that opened/advanced it,
   * suppress that still-held action key so the game doesn't immediately
   * retrigger the interaction on the next frame.
   */
  suppressCurrentActionKeys() {
    if (this.keys['Space'] || this.keys['Enter'] || this.virtual.interact) {
      this.interactConsumed = true
    }
    if (this.keys['Escape'] || this.virtual.escape) {
      this.escapeConsumed = true
    }
  }
}
