export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  tech: string[]
  github: string | null
  demo: string | null
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
    monitorAnimation: 'chart',
  },
  {
    id: 'meeting-copilot',
    name: 'AI Meeting Copilot',
    tagline: 'RAG-powered meeting intelligence',
    description:
      'Building a meeting intelligence tool using RAG with pgvector, Ollama for local LLM inference, automated action item extraction, evaluation harness, and a metrics dashboard.',
    tech: ['Python', 'pgvector', 'Ollama', 'PostgreSQL', 'FastAPI'],
    github: null,
    demo: null,
    monitorAnimation: 'waveform',
    underConstruction: true,
  },
]
