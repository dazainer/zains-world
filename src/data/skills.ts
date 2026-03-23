export type Tier = 'legendary' | 'rare' | 'common'
export type Category = 'language' | 'frontend' | 'backend' | 'tool'

export interface Skill {
  name: string
  tier: Tier
  category: Category
}

export const skills: Skill[] = [
  { name: 'Python',     tier: 'legendary', category: 'language'  },
  { name: 'C',          tier: 'legendary', category: 'language'  },
  { name: 'TypeScript', tier: 'rare',      category: 'language'  },
  { name: 'JavaScript', tier: 'rare',      category: 'language'  },
  { name: 'SQL',        tier: 'rare',      category: 'language'  },
  { name: 'React',      tier: 'rare',      category: 'frontend'  },
  { name: 'Node.js',    tier: 'rare',      category: 'backend'   },
  { name: 'PostgreSQL', tier: 'rare',      category: 'backend'   },
  { name: 'FastAPI',    tier: 'rare',      category: 'backend'   },
  { name: 'Git',        tier: 'rare',      category: 'tool'      },
  { name: 'HTML/CSS',   tier: 'common',    category: 'frontend'  },
  { name: 'Express',    tier: 'common',    category: 'backend'   },
  { name: 'REST APIs',  tier: 'common',    category: 'backend'   },
  { name: 'Racket',     tier: 'common',    category: 'language'  },
]
