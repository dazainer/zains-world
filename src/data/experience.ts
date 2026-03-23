export interface Experience {
  id: string
  role: string
  organization: string
  period: string
  location: string
  highlights: string[]
  photo: string | null
  floor: number
}

export const experiences: Experience[] = [
  {
    id: 'omam-mun',
    role: 'Executive Director',
    organization: 'OMAM Model United Nations',
    period: 'Aug 2024 – Mar 2025',
    location: 'Cairo, Egypt',
    highlights: [
      'Led end-to-end planning of a student-run conference with ~150 delegates',
      'Directed budgeting for a ~20,000 CAD operation',
      'Coordinated 40+ team heads and 100+ members',
    ],
    photo: '/assets/photos/omam1.JPG',
    floor: 3,
  },
  {
    id: 'student-council',
    role: 'School President',
    organization: 'Student Council, ISEE',
    period: 'Sep 2024 – Aug 2025',
    location: 'Cairo, Egypt',
    highlights: [
      'Represented 1,500+ students',
      'Translated stakeholder needs into proposals and improvements',
      'Managed large-scale events and school-wide initiatives',
    ],
    photo: null,
    floor: 2,
  },
  {
    id: 'debate-club',
    role: 'Founder & Coach',
    organization: 'Debate and World Scholar\'s Cup Club',
    period: 'Apr 2024 – Apr 2025',
    location: 'Cairo, Egypt',
    highlights: [
      'Founded and scaled club to ~15 active members',
      'Designed structured curriculum and weekly materials',
      'Students won multiple medals at regional competitions',
    ],
    photo: null,
    floor: 1,
  },
]
