/**
 * InteractionPrompt — "Press Space to interact" indicator shown when
 * the player stands on an interaction tile (tile type 2).
 */
export default function InteractionPrompt() {
  return (
    <div style={styles.prompt}>
      Press <kbd style={styles.key}>Space</kbd> to interact
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  prompt: {
    position: 'absolute',
    bottom: '6rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(20, 12, 4, 0.85)',
    border: '2px solid #c8a850',
    color: '#f5e6c8',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    padding: '0.4rem 0.75rem',
    zIndex: 20,
    whiteSpace: 'nowrap',
    animation: 'fadeIn 0.2s ease-out',
  },
  key: {
    background: '#c8a850',
    color: '#1a1008',
    padding: '0.1rem 0.3rem',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.5rem',
    border: 'none',
  },
}
