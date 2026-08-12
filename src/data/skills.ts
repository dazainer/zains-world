export type Tier = 'legendary' | 'rare' | 'common'
export type Category = 'language' | 'backend' | 'cloud' | 'testing' | 'ai'

export interface Skill {
  name: string
  tier: Tier
  category: Category
}

/** Display order + headings for the portfolio skills section. */
export const CATEGORY_ORDER: Category[] = ['language', 'backend', 'cloud', 'testing', 'ai']

export const CATEGORY_LABELS: Record<Category, string> = {
  language: 'Languages',
  backend: 'Backend, Web & Data',
  cloud: 'Cloud, Infrastructure & DevOps',
  testing: 'Testing & Engineering',
  ai: 'AI & Integrations',
}

export const skills: Skill[] = [
  // ── Languages ──────────────────────────────────────────────────────────
  { name: 'Python',       tier: 'legendary', category: 'language' },
  { name: 'TypeScript',   tier: 'rare',      category: 'language' },
  { name: 'JavaScript',   tier: 'rare',      category: 'language' },
  { name: 'SQL',          tier: 'rare',      category: 'language' },
  { name: 'C',            tier: 'legendary', category: 'language' },
  { name: 'Racket',       tier: 'common',    category: 'language' },
  { name: 'HTML/CSS',     tier: 'common',    category: 'language' },

  // ── Backend, Web & Data ────────────────────────────────────────────────
  { name: 'FastAPI',      tier: 'legendary', category: 'backend' },
  { name: 'REST APIs',    tier: 'rare',      category: 'backend' },
  { name: 'React',        tier: 'rare',      category: 'backend' },
  { name: 'Node.js',      tier: 'rare',      category: 'backend' },
  { name: 'Express',      tier: 'common',    category: 'backend' },
  { name: 'PostgreSQL',   tier: 'legendary', category: 'backend' },
  { name: 'MySQL',        tier: 'rare',      category: 'backend' },
  { name: 'pgvector',     tier: 'rare',      category: 'backend' },
  { name: 'Pydantic',     tier: 'rare',      category: 'backend' },
  { name: 'OpenPyXL',     tier: 'common',    category: 'backend' },

  // ── Cloud, Infrastructure & DevOps ─────────────────────────────────────
  { name: 'AWS EC2',        tier: 'rare',   category: 'cloud' },
  { name: 'AWS S3',         tier: 'rare',   category: 'cloud' },
  { name: 'AWS SES',        tier: 'common', category: 'cloud' },
  { name: 'Docker',         tier: 'rare',   category: 'cloud' },
  { name: 'Docker Compose', tier: 'rare',   category: 'cloud' },
  { name: 'Linux / Ubuntu', tier: 'rare',   category: 'cloud' },
  { name: 'Bash',           tier: 'rare',   category: 'cloud' },
  { name: 'Nginx',          tier: 'rare',   category: 'cloud' },
  { name: 'systemd',        tier: 'common', category: 'cloud' },
  { name: 'cron',           tier: 'common', category: 'cloud' },
  { name: 'GitHub Actions', tier: 'rare',   category: 'cloud' },
  { name: 'CI/CD',          tier: 'rare',   category: 'cloud' },
  { name: 'Git',            tier: 'rare',   category: 'cloud' },
  { name: 'GitHub',         tier: 'common', category: 'cloud' },

  // ── Testing & Engineering ──────────────────────────────────────────────
  { name: 'pytest',                 tier: 'rare',   category: 'testing' },
  { name: 'API authentication',     tier: 'rare',   category: 'testing' },
  { name: 'SHA-256 hashing',        tier: 'common', category: 'testing' },
  { name: 'Logging',                tier: 'common', category: 'testing' },
  { name: 'Deployment automation',  tier: 'rare',   category: 'testing' },
  { name: 'Data-processing automation', tier: 'rare', category: 'testing' },

  // ── AI & Integrations ──────────────────────────────────────────────────
  { name: 'Anthropic API', tier: 'rare',   category: 'ai' },
  { name: 'OpenAI API',    tier: 'rare',   category: 'ai' },
  { name: 'RAG',           tier: 'rare',   category: 'ai' },
  { name: 'Tool calling',  tier: 'rare',   category: 'ai' },
  { name: 'Cohere',        tier: 'common', category: 'ai' },
  { name: 'ElevenLabs',    tier: 'common', category: 'ai' },
]
