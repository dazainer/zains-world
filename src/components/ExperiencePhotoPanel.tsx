import { useEffect } from 'react'
import type { Experience } from '../data/experience'

interface Props {
  experience: Experience
  photo: string | null
  onClose: () => void
}

export default function ExperiencePhotoPanel({ experience, photo, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.panel} onClick={(event) => event.stopPropagation()}>
        <div style={styles.mediaFrame}>
          {photo ? (
            <img
              src={photo}
              alt={`${experience.role} at ${experience.organization}`}
              style={styles.image}
            />
          ) : (
            <div style={styles.imageFallback}>Image unavailable</div>
          )}
        </div>

        <div style={styles.caption}>
          <h2 style={styles.title}>{experience.role}</h2>
          <p style={styles.meta}>
            {experience.organization} | {experience.period} | {experience.location}
          </p>
          <ul style={styles.highlights}>
            {experience.highlights.map((highlight, index) => (
              <li key={index}>{highlight}</li>
            ))}
          </ul>
        </div>

        <p style={styles.closeHint}>[Esc / Space / Enter to close]</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    zIndex: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: 'rgba(7, 5, 2, 0.78)',
  },
  panel: {
    width: 'min(92vw, 820px)',
    maxHeight: '90vh',
    overflowY: 'auto',
    borderRadius: '18px',
    border: '3px solid #c8a850',
    background:
      'linear-gradient(180deg, rgba(22, 14, 7, 0.98) 0%, rgba(39, 23, 12, 0.98) 100%)',
    boxShadow: '0 22px 44px rgba(0, 0, 0, 0.42)',
    padding: '1rem 1rem 0.9rem',
  },
  mediaFrame: {
    borderRadius: '14px',
    overflow: 'hidden',
    border: '2px solid rgba(200, 168, 80, 0.55)',
    background: '#120a05',
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.26)',
    marginBottom: '1rem',
  },
  image: {
    display: 'block',
    width: '100%',
    maxHeight: '52vh',
    objectFit: 'contain',
    background: '#120a05',
  },
  imageFallback: {
    minHeight: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbb79a',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.72rem',
    textAlign: 'center',
    padding: '1rem',
  },
  caption: {
    padding: '0 0.2rem',
  },
  title: {
    margin: '0 0 0.35rem',
    color: '#f0d08c',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.88rem',
    lineHeight: 1.5,
  },
  meta: {
    margin: '0 0 0.75rem',
    color: '#9bc9d0',
    fontSize: '0.88rem',
    lineHeight: 1.5,
  },
  highlights: {
    margin: 0,
    paddingLeft: '1.1rem',
    color: '#f5e6c8',
    fontSize: '0.95rem',
    lineHeight: 1.65,
  },
  closeHint: {
    margin: '1rem 0 0',
    color: '#8d6d46',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.62rem',
    textAlign: 'right',
  },
}
