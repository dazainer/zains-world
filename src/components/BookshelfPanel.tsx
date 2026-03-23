/**
 * BookshelfPanel — displays the 4 books in the Secret Room bookshelf.
 */
import { useEffect } from 'react'
import { books } from '../data/books'

interface Props {
  onClose: () => void
}

export default function BookshelfPanel({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'Space') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Bookshelf</h2>
        <div style={styles.bookList}>
          {books.map((book) => (
            <div key={book.id} style={styles.bookCard}>
              <div style={{ ...styles.spine, background: book.color }} />
              <div style={styles.bookInfo}>
                <p style={styles.bookTitle}>{book.title}</p>
                <p style={styles.bookAuthor}>— {book.author}</p>
                <p style={styles.bookNote}>{book.note}</p>
              </div>
            </div>
          ))}
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
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  panel: {
    background: '#1a1008',
    border: '3px solid #c8a850',
    padding: '1.5rem 2rem',
    maxWidth: '480px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  title: {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '0.85rem',
    color: '#c8a850',
    marginBottom: '1rem',
  },
  bookList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  bookCard: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  spine: {
    width: '8px',
    minHeight: '60px',
    flexShrink: 0,
    borderRadius: '2px',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    color: '#f5e6c8',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    marginBottom: '0.1rem',
  },
  bookAuthor: {
    color: '#a89070',
    fontSize: '0.8rem',
    marginBottom: '0.3rem',
    fontStyle: 'italic',
  },
  bookNote: {
    color: '#c8b898',
    fontSize: '0.82rem',
    lineHeight: 1.5,
  },
  closeHint: {
    color: '#5a4030',
    fontSize: '0.55rem',
    fontFamily: "'Press Start 2P', monospace",
  },
}
