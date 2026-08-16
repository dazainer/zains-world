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
    role: 'Software Engineering Intern',
    organization: 'IdealRatings',
    period: 'May 2026 – Aug 2026',
    location: 'Cairo, Egypt',
    kind: 'professional',
    highlights: [
      'Built and deployed a Python report-automation tool used by ~30 employees to retrieve and process company reports, upload results to AWS S3, and generate output Excel files; automated ~95% of sources across ~100-company files, reducing workflows from several days to a few hours',
      'Engineered a modular Python/MySQL market-data pipeline targeting ~5,000 NYSE/Nasdaq securities, integrating exchange and SEC data for prices, shares outstanding, fundamentals, news, and corporate actions with upserts, retries, failure isolation, and 85 automated tests',
      'Developed and deployed a FastAPI email service using Amazon SES, implementing SHA-256 API-key authentication, MySQL audit logging, HTML/plain-text delivery, attachments, and AWS IAM/Boto3 integration',
      'Automated application deployment and operations using Linux, Bash, Nginx, systemd, Docker Compose, and GitHub Actions, adding backups, health checks, CI validation, SSH-based deployment, logging, and service verification',
    ],
    photo: '/assets/photos/web/idealratings.png',
    floor: 4,
  },
  {
    id: 'omam-mun',
    role: 'Executive Director',
    organization: 'OMAM Model United Nations, The International School of Elite Education',
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
