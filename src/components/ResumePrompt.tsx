import { useState, useEffect, useCallback } from 'react'

interface Props {
  onClose: () => void
}

const resumeHref = '/resume.pdf'
const resumeFilename = 'Zain_Khalil_Resume.pdf'

export default function ResumePrompt({ onClose }: Props) {
  const [selected, setSelected] = useState<0 | 1>(0)

  const downloadResume = useCallback(() => {
    const link = document.createElement('a')
    link.href = resumeHref
    link.download = resumeFilename
    link.click()
    onClose()
  }, [onClose])

  const activate = useCallback(() => {
    if (selected === 0) {
      downloadResume()
    } else {
      onClose()
    }
  }, [downloadResume, onClose, selected])

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.repeat) return

      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault()
        setSelected(0)
      } else if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
        e.preventDefault()
        setSelected(1)
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault()
        activate()
      } else if (e.code === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [activate, onClose])

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Resume Chest</h2>
        <p style={styles.text}>You found Zain&apos;s resume.</p>
        <p style={styles.text}>Do you want to download it?</p>

        <div style={styles.actions}>
          <button
            type="button"
            style={{
              ...styles.action,
              ...(selected === 0 ? styles.actionSelected : null),
            }}
            onMouseEnter={() => setSelected(0)}
            onClick={downloadResume}
          >
            Download Resume
          </button>
          <button
            type="button"
            style={{
              ...styles.action,
              ...(selected === 1 ? styles.actionSelected : null),
            }}
            onMouseEnter={() => setSelected(1)}
            onClick={onClose}
          >
            Not Now
          </button>
        </div>

        <p style={styles.hint}>[Arrow keys to choose | Enter/Space to confirm | Esc to close]</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.58)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  panel: {
    background: 'rgba(20, 12, 4, 0.96)',
    border: '3px solid #c8a850',
    boxShadow: '0 14px 30px rgba(0, 0, 0, 0.34)',
    borderRadius: '10px',
    width: 'min(92vw, 460px)',
    padding: '1.45rem 1.35rem 1.2rem',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 1rem',
    color: '#f0c96e',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.78rem',
    lineHeight: 1.6,
  },
  text: {
    margin: '0 0 0.55rem',
    color: '#f5e6c8',
    fontSize: '0.98rem',
    lineHeight: 1.55,
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.8rem',
    margin: '1.3rem 0 1rem',
    flexWrap: 'wrap',
  },
  action: {
    minWidth: '154px',
    border: '2px solid rgba(200, 168, 80, 0.55)',
    background: 'rgba(73, 47, 17, 0.72)',
    color: '#f5e6c8',
    padding: '0.8rem 0.95rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.58rem',
    lineHeight: 1.5,
  },
  actionSelected: {
    borderColor: '#f0c96e',
    background: 'rgba(200, 168, 80, 0.16)',
    boxShadow: '0 0 0 2px rgba(240, 201, 110, 0.18)',
    transform: 'translateY(-1px)',
  },
  hint: {
    margin: 0,
    color: '#ab8e57',
    fontSize: '0.52rem',
    fontFamily: "'Press Start 2P', monospace",
    lineHeight: 1.7,
  },
}
