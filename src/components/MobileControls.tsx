/**
 * MobileControls — virtual d-pad (bottom-left) + A button (bottom-right).
 * Renders on touch-capable devices only. Wires touch events to InputManager.
 */
import { useCallback, useRef } from 'react'
import type { InputManager, InputState } from '../game/InputManager'

interface Props {
  inputManager: InputManager | null
  mode?: 'game' | 'snake'
}

const isTouchDevice = 'ontouchstart' in window

export default function MobileControls({ inputManager, mode = 'game' }: Props) {
  if (!isTouchDevice) return null

  // Track which buttons are currently pressed
  const pressed = useRef<Partial<InputState>>({})

  const update = useCallback((key: keyof InputState, value: boolean) => {
    if (!inputManager) return
    pressed.current = { ...pressed.current, [key]: value }
    inputManager.setVirtual(pressed.current)
  }, [inputManager])

  const sendSnakeDirection = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    window.dispatchEvent(new CustomEvent('snake-mobile-direction', { detail: dir }))
  }, [])

  const pressDirection = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (mode === 'snake') {
      sendSnakeDirection(dir)
      return
    }
    update(dir, true)
  }, [mode, sendSnakeDirection, update])

  const releaseDirection = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (mode === 'snake') return
    update(dir, false)
  }, [mode, update])

  const dpadBtn = (dir: 'up' | 'down' | 'left' | 'right', label: string) => (
    <button
      style={{ ...styles.dpadBtn, gridArea: dir }}
      aria-label={label}
      onContextMenu={e => e.preventDefault()}
      onTouchStart={e => { e.preventDefault(); pressDirection(dir) }}
      onTouchMove={e => e.preventDefault()}
      onTouchEnd={e => { e.preventDefault(); releaseDirection(dir) }}
      onTouchCancel={() => releaseDirection(dir)}
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
      {mode === 'game' && (
        <button
          style={styles.actionBtn}
          aria-label="Interact"
          onContextMenu={e => e.preventDefault()}
          onTouchStart={e => { e.preventDefault(); update('interact', true) }}
          onTouchMove={e => e.preventDefault()}
          onTouchEnd={e => { e.preventDefault(); update('interact', false) }}
          onTouchCancel={() => update('interact', false)}
        >
          A
        </button>
      )}
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
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
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
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
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
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
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
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
  },
}
