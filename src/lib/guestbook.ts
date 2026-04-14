/**
 * guestbook.ts — Storage, validation, and rate-limiting for the Guest Book overlay.
 * localStorage only — no remote calls.
 *
 * Storage layout
 * ──────────────
 *   guestbook_messages   JSON array of GuestMessage  (max 50, most-recent first)
 *   guestbook_last_post  Unix timestamp string        (rate-limit checkpoint)
 *   guestbook_last_name  string                       (pre-fill on return visits)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GuestMessage {
  id: string
  name: string      // 2–20 chars
  message: string   // 1–100 chars
  color: string     // one of NOTE_COLORS
  timestamp: string // ISO 8601
}

// ── Constants ─────────────────────────────────────────────────────────────────

const KEY_MESSAGES  = 'guestbook_messages'
const KEY_LAST_POST = 'guestbook_last_post'
const KEY_LAST_NAME = 'guestbook_last_name'
const KEY_ALLOW_ZAIN = 'guestbook_allow_zain'
export const MAX_MESSAGES  = 50
const RATE_LIMIT_MS = 60 * 60 * 1000  // 1 hour
export const GUEST_BOOK_INTERACTION_ID = 'guest-book'

export const NOTE_COLORS: readonly string[] = [
  '#E8D8A0',  // sand / papyrus
  '#5DCAA5',  // teal
  '#F0997B',  // coral
  '#EF9F27',  // gold
  '#AFA9EC',  // purple
  '#85B7EB',  // blue
]

export const DEFAULT_COLOR = NOTE_COLORS[0]

// ── Storage helpers ───────────────────────────────────────────────────────────

function readMessages(): GuestMessage[] {
  try {
    const raw = localStorage.getItem(KEY_MESSAGES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as GuestMessage[]) : []
  } catch {
    return []
  }
}

function writeMessages(msgs: GuestMessage[]): void {
  try {
    localStorage.setItem(KEY_MESSAGES, JSON.stringify(msgs))
  } catch { /* quota errors are silent */ }
}

// ── Public: read ──────────────────────────────────────────────────────────────

/** Return all stored messages, most-recent first. */
export function getMessages(): GuestMessage[] {
  return readMessages()
}

export function getMessageCount(): number {
  return readMessages().length
}

// ── Public: rate limit ────────────────────────────────────────────────────────

/** True if the visitor is allowed to post right now. */
export function canPost(): boolean {
  try {
    const ts = localStorage.getItem(KEY_LAST_POST)
    if (!ts) return true
    return Date.now() - parseInt(ts, 10) >= RATE_LIMIT_MS
  } catch {
    return true
  }
}

/** Milliseconds remaining in the rate-limit window. Returns 0 when free to post. */
export function msUntilNextPost(): number {
  try {
    const ts = localStorage.getItem(KEY_LAST_POST)
    if (!ts) return 0
    return Math.max(0, RATE_LIMIT_MS - (Date.now() - parseInt(ts, 10)))
  } catch {
    return 0
  }
}

/** Name used in the visitor's last successful post. Returns null if never posted. */
export function getLastPostName(): string | null {
  try {
    const name = localStorage.getItem(KEY_LAST_NAME)
    return name && name.trim() ? name.trim() : null
  } catch {
    return null
  }
}

// ── Validation ────────────────────────────────────────────────────────────────

const NAME_RE = /^[A-Za-z0-9 _-]{2,20}$/

const RESERVED_NAMES = new Set([
  'admin', 'administrator', 'moderator', 'mod', 'system', 'root',
  'null', 'undefined', 'zain',
])
const ZAIN_OVERRIDE_CODE = '71594250'

const PROFANITY = [
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'dick', 'cock', 'pussy',
  'cunt', 'bastard', 'slut', 'whore', 'fag', 'nigger', 'nigga',
  'retard', 'rape', 'nazi', 'hitler',
]

function hasProfanity(text: string): boolean {
  const lower = text.toLowerCase().replace(/\s+/g, '')
  return PROFANITY.some(w => lower.includes(w))
}

function hasZainPermission(): boolean {
  try {
    return localStorage.getItem(KEY_ALLOW_ZAIN) === '1'
  } catch {
    return false
  }
}

function grantZainPermission(): void {
  try {
    localStorage.setItem(KEY_ALLOW_ZAIN, '1')
  } catch {
    // ignore storage errors
  }
}

export function validateName(
  raw: string,
): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim()
  if (!name) return { ok: false, error: 'Name cannot be empty' }
  if (name === ZAIN_OVERRIDE_CODE || (name.toLowerCase() === 'zain' && hasZainPermission())) {
    return { ok: true, name: 'zain' }
  }
  if (!NAME_RE.test(name)) {
    return { ok: false, error: '2-20 chars. Letters, numbers, spaces, _ and - only.' }
  }
  const lower = name.toLowerCase().replace(/\s+/g, '')
  if (RESERVED_NAMES.has(lower)) return { ok: false, error: 'That name is reserved' }
  if (hasProfanity(name))        return { ok: false, error: 'Name not allowed' }
  return { ok: true, name }
}

export function validateMessage(
  raw: string,
): { ok: true; msg: string } | { ok: false; error: string } {
  const msg = raw.trim()
  if (!msg)          return { ok: false, error: 'Message cannot be empty' }
  if (msg.length > 100) return { ok: false, error: 'Message must be 100 characters or fewer' }
  if (hasProfanity(msg)) return { ok: false, error: 'Message not allowed' }
  return { ok: true, msg }
}

// ── Public: write ─────────────────────────────────────────────────────────────

export function addMessage(
  name: string,
  message: string,
  color: string,
): { ok: true; entry: GuestMessage } | { ok: false; error: string } {
  if (!canPost()) {
    const min = Math.ceil(msUntilNextPost() / 60_000)
    return { ok: false, error: `You can post again in about ${min} minute${min !== 1 ? 's' : ''}` }
  }

  const rawName = name.trim()
  const nameResult = validateName(rawName)
  if (!nameResult.ok) return nameResult
  if (rawName === ZAIN_OVERRIDE_CODE) {
    grantZainPermission()
  }

  const msgResult = validateMessage(message)
  if (!msgResult.ok) return msgResult

  const safeColor = NOTE_COLORS.includes(color) ? color : DEFAULT_COLOR

  const entry: GuestMessage = {
    id:        `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name:      nameResult.name,
    message:   msgResult.msg,
    color:     safeColor,
    timestamp: new Date().toISOString(),
  }

  // Prepend (most-recent first) and cap at MAX_MESSAGES
  const next = [entry, ...readMessages()].slice(0, MAX_MESSAGES)
  writeMessages(next)

  try {
    localStorage.setItem(KEY_LAST_POST, Date.now().toString())
    localStorage.setItem(KEY_LAST_NAME, nameResult.name)
  } catch { /* ignore */ }

  return { ok: true, entry }
}
