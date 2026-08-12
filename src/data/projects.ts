export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  tech: string[]
  github: string | null
  demo: string | null
  image?: string | null
  monitorAnimation: string
  underConstruction?: boolean
  /** Featured projects lead the portfolio grid; the rest appear in "Also built". */
  featured: boolean
}

export const projects: Project[] = [
  {
    id: 'abdo',
    name: 'Abdo',
    tagline: 'Egyptian-Arabic household assistant, deployed and in daily use',
    description:
      'A household assistant running entirely through Telegram that handles text, voice notes, live location, calendar management, shopping lists, order tracking, and web search in Egyptian Arabic. Built on a tool-driven architecture — every capability is exposed as an LLM tool, so new features slot in without touching the core request loop. Uses RAG over pgvector for household knowledge, deterministic date handling instead of trusting model arithmetic, and background voice processing so Telegram never retries a slow webhook. Deployed on Railway with 300+ logged interactions.',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'pgvector', 'Anthropic Claude', 'Cohere', 'ElevenLabs', 'Railway'],
    github: 'https://github.com/dazainer/abdo',
    demo: null,
    image: null,
    monitorAnimation: 'waveform',
    featured: true,
  },
  {
    id: 'specguard',
    name: 'SpecGuard',
    tagline: 'AI test intelligence platform',
    description:
      'A full-stack QA platform that ingests product specifications and runs them through a parse → extract → generate → validate → score pipeline to produce structured functional, edge-case, and negative tests. Every AI output is schema-validated with Pydantic and retried automatically on failure, and coverage is graded by a heuristic scorer across four metrics. Backed by 23 passing pytest validation tests.',
    tech: ['Python', 'FastAPI', 'React', 'TypeScript', 'OpenAI API', 'Pydantic', 'pytest'],
    github: 'https://github.com/dazainer/specguard',
    demo: null,
    image: null,
    monitorAnimation: 'pipeline',
    featured: true,
  },
  {
    id: 'meeting-copilot',
    name: 'Meeting Copilot',
    tagline: 'Local-first AI meeting intelligence',
    description:
      'Ingests meeting transcripts, stores pgvector embeddings for semantic search, extracts structured action items with a local LLM, and exposes the workflow through a FastAPI backend and React dashboard.',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'pgvector', 'React', 'Ollama'],
    github: 'https://github.com/dazainer/meeting-copilot',
    demo: null,
    image: null,
    monitorAnimation: 'pipeline',
    featured: true,
  },
  {
    id: 'expense-tracker',
    name: 'Personal Expense Tracker V2',
    tagline: 'Full-stack expense analytics',
    description:
      'Rebuilt a CLI expense tracker into a full-stack web app with a React/TypeScript frontend, Node.js/Express backend, PostgreSQL database, and interactive Recharts dashboards for spending analysis.',
    tech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Recharts'],
    github: 'https://github.com/dazainer/personal-expense-tracker',
    demo: null,
    image: null,
    monitorAnimation: 'chart',
    featured: false,
  },
]

export const featuredProjects = projects.filter(p => p.featured)
export const secondaryProjects = projects.filter(p => !p.featured)
