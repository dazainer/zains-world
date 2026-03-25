/**
 * MobileControls — virtual d-pad (bottom-left) + A button (bottom-right).
 * Renders on touch-capable devices only. Wires touch events to InputManager.
 */
import { useCallback, useRef } from 'react'
import type { InputManager, InputState } from '../game/InputManager'

interface Props {
  inputManager: InputManager | null
}

const isTouchDevice = 'ontouchstart' in window

export default function MobileControls({ inputManager }: Props) {
  if (!isTouchDevice) return null

  // Track which buttons are currently pressed
  const pressed = useRef<Partial<InputState>>({})

  const update = useCallback((key: keyof InputState, value: boolean) => {
    if (!inputManager) return
    pressed.current = { ...pressed.current, [key]: value }
    inputManager.setVirtual(pressed.current)
  }, [inputManager])

  const dpadBtn = (dir: 'up' | 'down' | 'left' | 'right', label: string) => (
    <button
      style={{ ...styles.dpadBtn, gridArea: dir }}
      aria-label={label}
      onTouchStart={e => { e.preventDefault(); update(dir, true) }}
      onTouchEnd={e => { e.preventDefault(); update(dir, false) }}
      onTouchCancel={() => update(dir, false)}
    >
      {label}
    </button>
  )

  return (
    <div style={styles.wrapper}>
      {/* D-pad */}
      <div style={styles.dpad}>
        {dpadBtn('up', '\u25B2')}
        {dpadBtn('left', '\u25C0')}
        <div style={{ ...styles.dpadCenter, gridArea: 'center' }} />
        {dpadBtn('right', '\u25B6')}
        {dpadBtn('down', '\u25BC')}
      </div>
      {/* Action button */}
      <button
        style={styles.actionBtn}
        aria-label="Interact"
        onTouchStart={e => { e.preventDefault(); update('interact', true) }}
        onTouchEnd={e => { e.preventDefault(); update('interact', false) }}
        onTouchCancel={() => update('interact', false)}
      >
        A
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'absolute',
    bottom: '1.5rem',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
    pointerEvents: 'none',
    zIndex: 40,
  },
  dpad: {
    display: 'grid',
    gridTemplateAreas: `
      ". up ."
      "left center right"
      ". down ."
    `,
    gridTemplateColumns: '44px 44px 44px',
    gridTemplateRows: '44px 44px 44px',
    gap: '2px',
    pointerEvents: 'auto',
    opacity: 0.75,
    touchAction: 'none',
  },
  dpadBtn: {
    background: 'rgba(200, 168, 80, 0.35)',
    border: '2px solid rgba(200, 168, 80, 0.6)',
    borderRadius: '6px',
    color: '#c8a850',
    fontSize: '1rem',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
  dpadCenter: {
    background: 'rgba(200, 168, 80, 0.12)',
    borderRadius: '4px',
  },
  actionBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'rgba(200, 168, 80, 0.35)',
    border: '2px solid rgba(200, 168, 80, 0.6)',
    color: '#c8a850',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
    opacity: 0.75,
    alignSelf: 'flex-end',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
  },
}
