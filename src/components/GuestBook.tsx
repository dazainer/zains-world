/**
 * GuestBook — Visitor message board overlay for the portfolio world.
 *
 * Visitors can read messages left by previous visitors and pin their own.
 * All data is persisted in localStorage via guestbook.ts.
 * Rate-limited to one post per hour per browser.
 *
 * Keyboard:
 *   Escape (when not typing) — close
 *   Tab / Shift+Tab          — navigate form fields
 */
import { useEffect, useRef, useState } from 'react'

import { formatDate } from '../lib/leaderboard'
import {
  DEFAULT_COLOR,
  NOTE_COLORS,
  addMessage,
  getLastPostName,
  getMessages,
  msUntilNextPost,
  validateMessage,
  validateName,
  type GuestMessage,
} from '../lib/guestbook'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Deterministic rotation in degrees derived from the message id. Range: ~-2.4..2.4. */
function noteRotation(id: string): number {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ((sum % 7) - 3) * 0.75
}

/** Hex color → rgba string with given alpha (0–1). */
function hexAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Format milliseconds as "Xm Ys" or "Ys". */
function formatMs(ms: number): string {
  const sec = Math.ceil(ms / 1000)
  if (sec <= 0) return '0s'
  const min = Math.floor(sec / 60)
  const s   = sec % 60
  return min > 0 ? `${min}m ${s}s` : `${s}s`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GuestBook({ onClose }: Props) {
  const [messages, setMessages] = useState<GuestMessage[]>(() => getMessages())
  const [name,     setName]     = useState(() => getLastPostName() ?? '')
  const [message,  setMessage]  = useState('')
  const [color,    setColor]    = useState(DEFAULT_COLOR)

  const [nameError,   setNameError]   = useState<string | null>(null)
  const [msgError,    setMsgError]    = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [justPosted,  setJustPosted]  = useState(false)

  const [msLeft, setMsLeft] = useState(() => msUntilNextPost())

  const boardRef = useRef<HTMLDivElement>(null)

  // ── Rate-limit countdown ──────────────────────────────────────────────────

  useEffect(() => {
    const id = window.setInterval(() => {
      setMsLeft(msUntilNextPost())
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  // ── Keyboard: Escape closes (skip when typing) ────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.code === 'Escape') { e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const nv = validateName(name)
    const mv = validateMessage(message)
    setNameError(nv.ok ? null : nv.error)
    setMsgError (mv.ok ? null : mv.error)
    if (!nv.ok || !mv.ok) return

    const result = addMessage(nv.name, mv.msg, color)
    if (!result.ok) {
      setSubmitError(result.error)
      return
    }

    setMessages(getMessages())
    setMessage('')
    setMsLeft(msUntilNextPost())
    setJustPosted(true)
    setTimeout(() => setJustPosted(false), 2800)

    // Scroll board to top to show the new note
    if (boardRef.current) boardRef.current.scrollTop = 0
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const rateLimited = msLeft > 0

  return (
    <div
      style={s.backdrop}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={s.panel}>

        {/* ── Title bar ──────────────────────────────────────────────────── */}
        <div style={s.titleBar}>
          <div style={s.titleLeft}>
            <span style={s.titleIcon}>📜</span>
            <span style={s.title}>GUEST BOOK</span>
          </div>
          <div style={s.titleRight}>
            <span style={s.msgCount}>
              {messages.length} / {50} note{messages.length !== 1 ? 's' : ''}
            </span>
            <button type="button" style={s.closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* ── Message board ──────────────────────────────────────────────── */}
        <div style={s.board} ref={boardRef}>
          {messages.length === 0 ? (
            <div style={s.emptyState}>
              <span style={s.emptyIcon}>📌</span>
              <p style={s.emptyLine1}>No messages yet.</p>
              <p style={s.emptyLine2}>Be the first to leave a note!</p>
            </div>
          ) : (
            <div style={s.noteGrid}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    ...s.note,
                    borderTop:  `4px solid ${msg.color}`,
                    background: hexAlpha(msg.color, 0.09),
                    transform:  `rotate(${noteRotation(msg.id)}deg)`,
                    boxShadow:  `2px 4px 10px rgba(0,0,0,0.45), 0 0 0 1px ${hexAlpha(msg.color, 0.2)}`,
                  }}
                >
                  <p
                    style={{
                      ...s.noteAuthor,
                      color: msg.color,
                    }}
                  >
                    {msg.name}
                  </p>
                  <p style={s.noteText}>{msg.message}</p>
                  <p style={s.noteTime}>{formatDate(msg.timestamp)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Compose section ────────────────────────────────────────────── */}
        <div style={s.composeSection}>

          {rateLimited ? (
            /* Rate-limit notice */
            <div style={s.rateLimitBox}>
              <span style={s.rateLimitIcon}>⏳</span>
              <div>
                <p style={s.rateLimitTitle}>Already pinned a note!</p>
                <p style={s.rateLimitSub}>Next post in <span style={{ color: ACCENT }}>{formatMs(msLeft)}</span></p>
              </div>
            </div>
          ) : (
            /* Post form */
            <form onSubmit={handleSubmit} style={s.form} noValidate>

              {/* Name row */}
              <div style={s.fieldRow}>
                <label style={s.fieldLabel}>NAME</label>
                <div style={s.fieldBody}>
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setNameError(null) }}
                    placeholder="Your name (2–20 chars)"
                    maxLength={20}
                    style={{
                      ...s.input,
                      ...(nameError ? s.inputErr : {}),
                    }}
                    autoComplete="off"
                  />
                  {nameError && <span style={s.fieldError}>{nameError}</span>}
                </div>
              </div>

              {/* Message row */}
              <div style={s.fieldRow}>
                <label style={s.fieldLabel}>MSG</label>
                <div style={s.fieldBody}>
                  <textarea
                    value={message}
                    onChange={e => { setMessage(e.target.value.slice(0, 100)); setMsgError(null) }}
                    placeholder="Leave a message for future visitors…"
                    rows={2}
                    style={{
                      ...s.textarea,
                      ...(msgError ? s.inputErr : {}),
                    }}
                  />
                  <div style={s.textareaFooter}>
                    {msgError
                      ? <span style={s.fieldError}>{msgError}</span>
                      : <span />
                    }
                    <span
                      style={{
                        ...s.charCounter,
                        color: message.length >= 90 ? '#f0997b' : MUTED,
                      }}
                    >
                      {message.length}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Color + submit row */}
              <div style={s.bottomRow}>
                <div style={s.swatchRow} role="group" aria-label="Note color">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      style={{
                        ...s.swatch,
                        background: c,
                        ...(color === c ? {
                          outline: `3px solid ${c}`,
                          outlineOffset: '2px',
                          transform: 'scale(1.18)',
                        } : {}),
                      }}
                      onClick={() => setColor(c)}
                      aria-label={`Note color ${c}`}
                      aria-pressed={color === c}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  style={{
                    ...s.submitBtn,
                    opacity: justPosted ? 0.6 : 1,
                  }}
                  disabled={justPosted}
                >
                  PIN IT!
                </button>
              </div>

              {/* Feedback messages */}
              {submitError && (
                <p style={s.submitError}>{submitError}</p>
              )}
              {justPosted && (
                <p style={s.successMsg}>📌 Note pinned!</p>
              )}

            </form>
          )}
        </div>

        {/* ── Footer hint ────────────────────────────────────────────────── */}
        <div style={s.footer}>
          <span style={s.footerHint}>ESC to close</span>
          {!rateLimited && <span style={s.footerHint}>1 post per hour · max 50 notes</span>}
        </div>

      </div>
    </div>
  )
}

// ── Palette ───────────────────────────────────────────────────────────────────

const BG     = '#0d1117'
const ACCENT = '#c8a850'
const BORDER = 'rgba(200,168,80,0.35)'
const MUTED  = 'rgba(200,168,80,0.4)'
const FONT   = "'Press Start 2P', monospace"
const BOARD_BG = '#121008'  // very dark warm — suggests cork/papyrus

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {

  // ── Backdrop / panel ─────────────────────────────────────────────────────

  backdrop: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.82)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  panel: {
    background: BG,
    border: `2px solid ${ACCENT}`,
    display: 'flex',
    flexDirection: 'column',
    width: 'min(560px, 96vw)',
    maxHeight: '88vh',
    boxShadow: `0 0 48px rgba(200,168,80,0.12), 0 20px 60px rgba(0,0,0,0.7)`,
    overflow: 'hidden',
  },

  // ── Title bar ────────────────────────────────────────────────────────────

  titleBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.7rem 0.9rem',
    borderBottom: `1px solid ${BORDER}`,
    flexShrink: 0,
    background: 'rgba(200,168,80,0.04)',
    gap: '0.6rem',
  },
  titleLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  titleRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
  },
  titleIcon: {
    fontSize: '1.1rem',
    lineHeight: 1,
  },
  title: {
    color: ACCENT,
    fontFamily: FONT,
    fontSize: '0.7rem',
    letterSpacing: '0.08em',
    textShadow: `0 0 12px rgba(200,168,80,0.3)`,
  },
  msgCount: {
    color: MUTED,
    fontFamily: FONT,
    fontSize: '0.36rem',
    letterSpacing: '0.04em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: ACCENT,
    cursor: 'pointer',
    fontFamily: FONT,
    fontSize: '0.7rem',
    padding: '0 0.15rem',
    lineHeight: 1,
    opacity: 0.8,
  },

  // ── Message board ─────────────────────────────────────────────────────────

  board: {
    flex: 1,
    overflowY: 'auto',
    background: BOARD_BG,
    padding: '0.9rem',
    minHeight: '180px',
  },

  // ── Note grid ─────────────────────────────────────────────────────────────

  noteGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.8rem',
    alignContent: 'flex-start',
  },
  note: {
    width: 'calc(50% - 0.4rem)',
    minWidth: '140px',
    minHeight: '90px',
    padding: '0.6rem 0.65rem',
    borderRadius: '2px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    transition: 'transform 0.15s',
  },
  noteAuthor: {
    margin: 0,
    fontFamily: FONT,
    fontSize: '0.38rem',
    letterSpacing: '0.04em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  noteText: {
    margin: 0,
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.82rem',
    lineHeight: 1.5,
    color: '#f0e8d5',
    flex: 1,
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  noteTime: {
    margin: 0,
    fontFamily: FONT,
    fontSize: '0.3rem',
    color: 'rgba(200,168,80,0.4)',
    textAlign: 'right',
    marginTop: 'auto',
  },

  // ── Empty state ───────────────────────────────────────────────────────────

  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    padding: '2rem 1rem',
    textAlign: 'center',
    minHeight: '160px',
  },
  emptyIcon: {
    fontSize: '2rem',
    opacity: 0.4,
  },
  emptyLine1: {
    margin: 0,
    color: 'rgba(200,168,80,0.45)',
    fontFamily: FONT,
    fontSize: '0.5rem',
  },
  emptyLine2: {
    margin: 0,
    color: 'rgba(200,168,80,0.3)',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.82rem',
    lineHeight: 1.5,
  },

  // ── Compose section ───────────────────────────────────────────────────────

  composeSection: {
    flexShrink: 0,
    borderTop: `1px solid ${BORDER}`,
    background: BG,
    padding: '0.75rem 0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
  },

  // ── Form fields ───────────────────────────────────────────────────────────

  fieldRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.55rem',
  },
  fieldLabel: {
    fontFamily: FONT,
    fontSize: '0.38rem',
    color: MUTED,
    letterSpacing: '0.06em',
    paddingTop: '0.45rem',
    flexShrink: 0,
    width: '2.5rem',
    textAlign: 'right',
  },
  fieldBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    minWidth: 0,
  },
  input: {
    background: '#161b22',
    border: `1px solid ${BORDER}`,
    color: '#f5e6c8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.9rem',
    padding: '0.38rem 0.55rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    background: '#161b22',
    border: `1px solid ${BORDER}`,
    color: '#f5e6c8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '0.9rem',
    padding: '0.38rem 0.55rem',
    outline: 'none',
    resize: 'none',
    width: '100%',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  },
  inputErr: {
    border: '1px solid #f0997b',
  },
  fieldError: {
    fontFamily: FONT,
    fontSize: '0.34rem',
    color: '#f0997b',
    lineHeight: 1.4,
  },
  textareaFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '1rem',
  },
  charCounter: {
    fontFamily: FONT,
    fontSize: '0.32rem',
    marginLeft: 'auto',
    transition: 'color 0.15s',
  },

  // ── Bottom row (color swatches + submit) ──────────────────────────────────

  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.6rem',
    paddingLeft: '3.05rem',  // align with inputs (label width + gap)
    marginTop: '0.1rem',
  },
  swatchRow: {
    display: 'flex',
    gap: '0.45rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  swatch: {
    width: '22px',
    height: '22px',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.1s, outline 0.1s',
    flexShrink: 0,
  },
  submitBtn: {
    background: ACCENT,
    color: BG,
    border: 'none',
    fontFamily: FONT,
    fontSize: '0.48rem',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },

  // ── Submit feedback ───────────────────────────────────────────────────────

  submitError: {
    margin: '0.1rem 0 0',
    paddingLeft: '3.05rem',
    fontFamily: FONT,
    fontSize: '0.36rem',
    color: '#f0997b',
    lineHeight: 1.5,
  },
  successMsg: {
    margin: '0.1rem 0 0',
    paddingLeft: '3.05rem',
    fontFamily: FONT,
    fontSize: '0.4rem',
    color: '#5DCAA5',
  },

  // ── Rate limit notice ─────────────────────────────────────────────────────

  rateLimitBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    padding: '0.55rem 0.5rem',
    background: 'rgba(200,168,80,0.05)',
    border: `1px solid rgba(200,168,80,0.18)`,
  },
  rateLimitIcon: {
    fontSize: '1.3rem',
    lineHeight: 1,
    flexShrink: 0,
  },
  rateLimitTitle: {
    margin: '0 0 0.2rem',
    fontFamily: FONT,
    fontSize: '0.42rem',
    color: ACCENT,
  },
  rateLimitSub: {
    margin: 0,
    fontFamily: FONT,
    fontSize: '0.38rem',
    color: MUTED,
  },

  // ── Footer hint ───────────────────────────────────────────────────────────

  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.45rem 0.9rem',
    borderTop: `1px solid rgba(200,168,80,0.12)`,
    flexShrink: 0,
    gap: '1rem',
  },
  footerHint: {
    fontFamily: FONT,
    fontSize: '0.32rem',
    color: 'rgba(200,168,80,0.28)',
  },
}
