/**
 * MobileControls — virtual d-pad for touch devices.
 * Renders on touch-capable devices only (bottom-left d-pad, bottom-right action button).
 */
const isTouchDevice = 'ontouchstart' in window

export default function MobileControls() {
  if (!isTouchDevice) return null

  // TODO: wire touch events to InputManager.setVirtual()
  return (
    <div style={styles.wrapper}>
      {/* D-pad */}
      <div style={styles.dpad}>
        <button style={{ ...styles.dpadBtn, gridArea: 'up' }}    aria-label="Up">▲</button>
        <button style={{ ...styles.dpadBtn, gridArea: 'left' }}  aria-label="Left">◀</button>
        <button style={{ ...styles.dpadBtn, gridArea: 'center' }} aria-label="Center" disabled />
        <button style={{ ...styles.dpadBtn, gridArea: 'right' }} aria-label="Right">▶</button>
        <button style={{ ...styles.dpadBtn, gridArea: 'down' }}  aria-label="Down">▼</button>
      </div>
      {/* Action button */}
      <button style={styles.actionBtn} aria-label="Interact">A</button>
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
    gridTemplateColumns: '40px 40px 40px',
    gridTemplateRows: '40px 40px 40px',
    gap: '2px',
    pointerEvents: 'auto',
    opacity: 0.7,
  },
  dpadBtn: {
    background: 'rgba(200, 168, 80, 0.3)',
    border: '2px solid #c8a850',
    color: '#c8a850',
    fontSize: '1rem',
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(200, 168, 80, 0.3)',
    border: '2px solid #c8a850',
    color: '#c8a850',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '1rem',
    cursor: 'pointer',
    pointerEvents: 'auto',
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
}
