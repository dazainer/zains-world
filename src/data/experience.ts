/** 'professional' entries lead the timeline; 'leadership' entries follow. */
export type ExperienceKind = 'professional' | 'leadership'

export interface Experience {
  id: string
  role: string
  organization: string
  period: string
  location: string
  kind: ExperienceKind
  highlights: string[]
  photo: string | null
  /** Experience Tower floor. Entries without a floor are portfolio-only. */
  floor: number | null
}

export const experiences: Experience[] = [
  {
    id: 'idealratings',
    role: 'DevOps Intern',
    organization: 'IdealRatings',
    period: 'May 2026 – Aug 2026',
    location: 'Cairo, Egypt',
    kind: 'professional',
    highlights: [
      'Designed and built a Python report-automation tool now used by tens of employees: it reads Excel workbooks of source URLs, retrieves or renders each document to PDF, uploads to Amazon S3, and returns an output workbook of S3 links and statuses — roughly 95% automated success across ~100-company production-style files',
      'Built a modular Python/MySQL market-data pipeline that dynamically loads ~5,000 active NYSE/Nasdaq listings and normalizes prices, fundamentals, corporate actions, and identifiers across SEC EDGAR, Saudi Exchange, FMP, and Finnhub, with upserts, per-ticker failure isolation, and 85 automated tests',
      'Built and deployed a FastAPI email service on Amazon SES with X-API-Key authentication, SHA-256 hashed keys, and MySQL-backed key management and delivery auditing — accepted and used internally',
      'Deployed FastAPI and static applications to Ubuntu on AWS EC2 using Nginx, systemd, Docker Compose, and a GitHub Actions pipeline for validation and SSH-based deployment, plus Bash deploy scripts, cron backup cleanup, and health checks',
    ],
    photo: '/assets/photos/web/idealratings.png',
    floor: 4,
  },
  {
    id: 'omam-mun',
    role: 'Executive Director',
    organization: 'OMAM Model United Nations',
    period: 'Aug 2024 – Mar 2025',
    location: 'Cairo, Egypt',
    kind: 'leadership',
    highlights: [
      'Led end-to-end planning of a student-run conference with ~150 delegates',
      'Directed budgeting for a ~20,000 CAD operation',
      'Coordinated 40+ team heads and 100+ members',
    ],
    photo: '/assets/photos/web/omam1.jpg',
    floor: 3,
  },
  {
    id: 'school-president',
    role: 'School President',
    organization: 'Student Council, ISEE',
    period: 'Sep 2024 – Aug 2025',
    location: 'Cairo, Egypt',
    kind: 'leadership',
    highlights: [
      'Represented 1,500+ students as elected School President',
      'Led student-organized ceremonies including keynote speeches',
      'Translated stakeholder needs into school-wide initiatives',
    ],
    photo: '/assets/photos/web/speech1.jpg',
    floor: 2,
  },
  {
    id: 'debate-club',
    role: 'Founder & Coach',
    organization: 'Debate and World Scholar\'s Cup Club',
    period: 'Apr 2024 – Apr 2025',
    location: 'Cairo, Egypt',
    kind: 'leadership',
    highlights: [
      'Founded and scaled club to ~15 active members',
      'Designed structured curriculum and weekly materials',
      'Students won multiple medals at regional competitions',
    ],
    photo: null,
    floor: 1,
  },
]

/** Newest professional experience first — used for the portfolio timeline. */
export const professionalExperiences = experiences.filter(e => e.kind === 'professional')
export const leadershipExperiences = experiences.filter(e => e.kind === 'leadership')
