/**
 * ProjectPanel — slides up from bottom when player interacts with a project station.
 * Shows project name, tagline, description, tech badges, and action links.
 */
import { useEffect } from 'react'

export interface ProjectData {
  id: string
  name: string
  tagline: string
  description: string
  tech: string[]
  github: string | null
  demo: string | null
  image?: string | null
  underConstruction?: boolean
}

interface Props {
  project: ProjectData
  onClose: () => void
}

export default function ProjectPanel({ project, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        {project.underConstruction && (
          <div style={styles.constructionBanner}>⚠ Under Construction</div>
        )}
        <h2 style={styles.title}>{project.name}</h2>
        <p style={styles.tagline}>{project.tagline}</p>
        {project.image && (
          <div style={styles.mediaFrame}>
            <img
              src={project.image}
              alt={`${project.name} screenshot`}
              style={styles.mediaImage}
            />
          </div>
        )}
        <p style={styles.description}>{project.description}</p>
        <div style={styles.techRow}>
          {project.tech.map((t) => (
            <span key={t} style={styles.techBadge}>{t}</span>
          ))}
        </div>
        <div style={styles.links}>
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" style={styles.link}>
              &gt; View Code
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" style={styles.link}>
              &gt; Live Demo
            </a>
          )}
        </div>
        <p style={styles.closeHint}>[Esc / Space to close]</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 30,
  },
  panel: {
    width: '100%',
    maxHeight: '60vh',
    background: '#1a1008',
    border: '3px solid #c8a850',
    borderBottom: 'none',
    padding: '1.5rem 2rem',
    overflowY: 'auto',
    animation: 'slideUp 0.25s ease-out',
  },
  constructionBanner: {
    background: '#8B4513',
    color: '#f5e6c8',
    padding: '0.25rem 0.75rem',
    marginBottom: '0.75rem',
    fontSize: '0.75rem',
    fontFamily: "'Press Start 2P', monospace",
    display: 'inline-block',
  },
  title: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '1rem',
    color: '#c8a850',
    marginBottom: '0.4rem',
  },
  tagline: {
    color: '#a89070',
    fontSize: '0.85rem',
    marginBottom: '0.75rem',
    fontStyle: 'italic',
  },
  description: {
    color: '#f5e6c8',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    marginBottom: '1rem',
  },
  mediaFrame: {
    marginBottom: '1rem',
    border: '2px solid rgba(200, 168, 80, 0.55)',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#120a05',
    boxShadow: '0 10px 22px rgba(0, 0, 0, 0.22)',
  },
  mediaImage: {
    display: 'block',
    width: '100%',
    maxHeight: '280px',
    objectFit: 'cover',
  },
  techRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginBottom: '1rem',
  },
  techBadge: {
    background: '#3a2510',
    color: '#c8a850',
    border: '1px solid #c8a850',
    padding: '0.2rem 0.5rem',
    fontSize: '0.7rem',
    fontFamily: 'monospace',
  },
  links: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '0.75rem',
  },
  link: {
    color: '#4ac8d8',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.65rem',
    textDecoration: 'none',
  },
  closeHint: {
    color: '#5a4030',
    fontSize: '0.65rem',
    fontFamily: "'Press Start 2P', monospace",
  },
}
