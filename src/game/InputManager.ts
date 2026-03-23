/**
 * InputManager — tracks keyboard and virtual d-pad state each frame (polling model).
 * Desktop: arrow keys / WASD for movement, Space/Enter to interact, Escape to close.
 * Mobile: state updated externally by MobileControls component via setButton().
 */
export interface InputState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  interact: boolean
  escape: boolean
}

export class InputManager {
  private keys: Record<string, boolean> = {}
  private virtual: Partial<InputState> = {}

  // Consumed-once flags (set true on keydown, cleared after one read)
  private interactConsumed = false
  private escapeConsumed = false

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true
    if (e.code === 'Space' || e.code === 'Enter') this.interactConsumed = false
    if (e.code === 'Escape') this.escapeConsumed = false
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
    if ((this.keys['Space'] || this.keys['Enter']) && !this.interactConsumed) {
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
}
