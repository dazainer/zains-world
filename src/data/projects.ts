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
    id: 'fantasy-founders',
    name: 'Fantasy Founders',
    tagline: 'Fantasy sports meets startup investing',
    description:
      'A fantasy-sports-style game where players draft and trade real startups, earning points based on live funding rounds, acquisitions, and milestones. Built with React, Node.js, and real-time data feeds.',
    tech: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'WebSockets'],
    github: 'https://github.com/PLIAN78/GOONHack',
    demo: null,
    image: null,
    monitorAnimation: 'chart',
  },
]
