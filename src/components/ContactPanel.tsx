/**
 * ContactPanel — game-menu-style overlay for the Contact Portal.
 * Arrow keys or mouse to select a link; each opens in a new tab.
 */
import { useState, useEffect, useCallback } from 'react'
import { personalInfo } from '../data/personalInfo'

interface Props {
  onClose: () => void
}

const links = [
  { label: 'Email', href: `mailto:${personalInfo.contact.email}`, display: personalInfo.contact.email },
  { label: 'LinkedIn', href: personalInfo.contact.linkedin, display: 'linkedin.com/in/zainskhalil' },
  { label: 'GitHub', href: personalInfo.contact.github, display: 'github.com/dazainer' },
]

export default function ContactPanel({ onClose }: Props) {
  const [selected, setSelected] = useState(0)

  const activate = useCallback((index: number) => {
    window.open(links[index].href, '_blank', 'noopener')
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') {
        e.preventDefault()
        setSelected(i => (i - 1 + links.length) % links.length)
      } else if (e.code === 'ArrowDown') {
        e.preventDefault()
        setSelected(i => (i + 1) % links.length)
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        activate(selected)
      } else if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, activate, onClose])

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.panel} onClick={e => e.stopPropagation()}>
        <h2 style={styles.title}>Contact Portal</h2>
        <p style={styles.subtitle}>Choose a channel to reach Zain</p>
        <div style={styles.menu}>
          {links.map((link, i) => (
            <button
              key={link.label}
              style={{
                ...styles.menuItem,
                ...(i === selected ? styles.menuItemSelected : {}),
              }}
              onMouseEnter={() => setSelected(i)}
              onClick={() => activate(i)}
            >
              <span style={styles.arrow}>{i === selected ? '>' : '\u00A0'}</span>
              <span style={styles.linkLabel}>{link.label}:</span>
              <span style={styles.linkValue}>{link.display}</span>
            </button>
          ))}
        </div>
        <p style={styles.closeHint}>[Esc to close | Space to open]</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  panel: {
    background: '#1a1008',
    border: '3px solid #4ac8d8',
    padding: '1.5rem 2rem',
    minWidth: '320px',
    maxWidth: '480px',
    animation: 'slideUp 0.25s ease-out',
  },
  title: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.85rem',
    color: '#4ac8d8',
    marginBottom: '0.5rem',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a89070',
    fontSize: '0.75rem',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'transparent',
    border: '1px solid transparent',
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#f5e6c8',
    transition: 'border-color 0.1s',
  },
  menuItemSelected: {
    borderColor: '#4ac8d8',
    background: 'rgba(74, 200, 216, 0.08)',
  },
  arrow: {
    color: '#4ac8d8',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.6rem',
    width: '12px',
  },
  linkLabel: {
    color: '#c8a850',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.55rem',
    minWidth: '70px',
  },
  linkValue: {
    color: '#4ac8d8',
    fontSize: '0.75rem',
  },
  closeHint: {
    color: '#5a4030',
    fontSize: '0.55rem',
    fontFamily: "'Press Start 2P', monospace",
    textAlign: 'center',
  },
}
