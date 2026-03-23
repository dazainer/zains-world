/**
 * SkipToPortfolio — persistent "Skip to Portfolio →" link in top-right corner.
 * Always visible over the game canvas for users who prefer a traditional view.
 */
export default function SkipToPortfolio() {
  return (
    <a href="/portfolio" style={styles.link}>
      Skip to Portfolio →
    </a>
  )
}

const styles: Record<string, React.CSSProperties> = {
  link: {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    background: 'rgba(20, 12, 4, 0.85)',
    border: '2px solid #c8a850',
    color: '#c8a850',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    padding: '0.5rem 0.75rem',
    textDecoration: 'none',
    zIndex: 50,
    lineHeight: 1.4,
  },
}
