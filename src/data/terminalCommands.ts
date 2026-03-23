export const terminalCommands: Record<string, string | (() => string)> = {
  help: "Available commands: whoami, ls, cat about.txt, cat books.txt, play snake, sudo hire zain, clear",
  whoami: 'A recruiter with great taste.',
  ls: 'python.legendary  c.legendary  typescript.rare  react.rare  node.rare  postgres.rare  fastapi.rare  sql.rare  git.rare  javascript.rare  html-css.common  express.common  rest-apis.common  racket.common',
  'cat about.txt': () => [
    'Organized a fully Arabic MUN conference for 150 delegates',
    'Completed the IB Diploma Programme in Cairo, Egypt',
    'Speaks English, Arabic, and French',
    'Survived Math AA HL and Physics HL simultaneously',
  ].join('\n'),
  'cat books.txt':
    'Books that shaped my thinking:\n  Going Solo — Roald Dahl\n  Fahrenheit 451 — Ray Bradbury\n  Purple Hibiscus — Chimamanda Ngozi Adichie\n  The Da Vinci Code — Dan Brown',
  // Special commands handled in DebugTerminal.tsx:
  // 'sudo hire zain' → confetti + mailto
  // 'play snake'     → launches SnakeGame overlay
  // 'clear'          → clears terminal history
}
// Unknown command response template (used in DebugTerminal.tsx):
// `zsh: command not found: ${input}. Try 'help'`
