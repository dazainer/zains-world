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
}

export const projects: Project[] = [
  {
    id: 'specguard',
    name: 'SpecGuard',
    tagline: 'AI test intelligence platform',
    description:
      'Built an AI-powered QA tool that ingests product specs and generates schema-validated test suites with functional tests, edge cases, and negative tests using a Python/FastAPI backend and React frontend.',
    tech: ['Python', 'FastAPI', 'React', 'TypeScript', 'OpenAI API', 'Pydantic'],
    github: 'https://github.com/dazainer/specguard',
    demo: null,
    image: null,
    monitorAnimation: 'pipeline',
  },
  {
    id: 'expense-tracker',
    name: 'Personal Expense Tracker V2',
    tagline: 'Full-stack expense analytics',
    description:
      'Rebuilt a CLI expense tracker into a full-stack web app with React/TypeScript frontend, Node.js/Express backend, PostgreSQL database, and interactive Recharts dashboards for spending analysis.',
    tech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Recharts'],
    github: 'https://github.com/dazainer/personal-expense-tracker',
    demo: null,
    image: null,
    monitorAnimation: 'chart',
  },
  {
    id: 'meeting-copilot',
    name: 'Meeting Copilot',
    tagline: 'Local-first AI meeting intelligence',
    description:
      'Built an AI meeting copilot that ingests transcripts, stores pgvector embeddings for semantic search, extracts structured action items with a local LLM, and exposes the workflow through a FastAPI backend and React dashboard.',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'pgvector', 'React', 'Ollama'],
    github: 'https://github.com/dazainer/meeting-copilot',
    demo: null,
    image: null,
    monitorAnimation: 'pipeline',
  },
]
