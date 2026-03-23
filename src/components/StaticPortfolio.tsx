/**
 * StaticPortfolio — traditional portfolio at /portfolio.
 * SEO-friendly, accessible, fully responsive fallback.
 */
import { personalInfo } from '../data/personalInfo'
import { projects } from '../data/projects'
import { skills } from '../data/skills'
import { experiences } from '../data/experience'

export default function StaticPortfolio() {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.name}>{personalInfo.name}</h1>
          <p style={styles.bio}>{personalInfo.bio[0]}</p>
          <p style={styles.subBio}>{personalInfo.bio[1]}</p>
          <nav style={styles.contactLinks}>
            <a href={`mailto:${personalInfo.contact.email}`} style={styles.contactLink}>
              ✉ Email
            </a>
            <a href={personalInfo.contact.linkedin} target="_blank" rel="noopener noreferrer" style={styles.contactLink}>
              in LinkedIn
            </a>
            <a href={personalInfo.contact.github} target="_blank" rel="noopener noreferrer" style={styles.contactLink}>
              ⌥ GitHub
            </a>
            <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" style={styles.contactLink}>
              ↓ Resume
            </a>
          </nav>
          <a href="/" style={styles.gameLink}>← Play the game</a>
        </div>
      </header>

      <main style={styles.main}>
        {/* Projects */}
        <section style={styles.section} aria-labelledby="projects-heading">
          <h2 id="projects-heading" style={styles.sectionTitle}>Projects</h2>
          <div style={styles.projectGrid}>
            {projects.map((p) => (
              <article key={p.id} style={styles.projectCard}>
                {p.underConstruction && <span style={styles.wip}>Under Construction</span>}
                <h3 style={styles.projectName}>{p.name}</h3>
                <p style={styles.projectTagline}>{p.tagline}</p>
                <p style={styles.projectDesc}>{p.description}</p>
                <div style={styles.techRow}>
                  {p.tech.map((t) => <span key={t} style={styles.techBadge}>{t}</span>)}
                </div>
                <div style={styles.projectLinks}>
                  {p.github && <a href={p.github} target="_blank" rel="noopener noreferrer" style={styles.projLink}>View Code →</a>}
                  {p.demo && <a href={p.demo} target="_blank" rel="noopener noreferrer" style={styles.projLink}>Live Demo →</a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section style={styles.section} aria-labelledby="skills-heading">
          <h2 id="skills-heading" style={styles.sectionTitle}>Skills</h2>
          {(['legendary', 'rare', 'common'] as const).map((tier) => (
            <div key={tier} style={styles.tierGroup}>
              <h3 style={styles.tierLabel}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</h3>
              <div style={styles.skillRow}>
                {skills.filter((s) => s.tier === tier).map((s) => (
                  <span key={s.name} style={{ ...styles.skillBadge, ...(tier === 'legendary' ? styles.legendary : tier === 'rare' ? styles.rare : {}) }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Experience */}
        <section style={styles.section} aria-labelledby="experience-heading">
          <h2 id="experience-heading" style={styles.sectionTitle}>Experience</h2>
          {experiences.map((exp) => (
            <article key={exp.id} style={styles.expCard}>
              <h3 style={styles.expRole}>{exp.role}</h3>
              <p style={styles.expOrg}>{exp.organization} · {exp.location}</p>
              <p style={styles.expPeriod}>{exp.period}</p>
              <ul style={styles.expHighlights}>
                {exp.highlights.map((h, i) => <li key={i} style={styles.expHighlight}>{h}</li>)}
              </ul>
            </article>
          ))}
        </section>
      </main>

      <footer style={styles.footer}>
        <p style={styles.footerText}>Asset credits:</p>
        <ul style={styles.creditList}>
          <li><a href="https://jik-a-4.itch.io/free-pixel-art-ancient-egypt-tileset" target="_blank" rel="noopener noreferrer" style={styles.creditLink}>Ancient Egypt Tileset by JIK-A-4 (CC0)</a></li>
          <li><a href="https://xsnake133x.itch.io/pixel-desert-32x32" target="_blank" rel="noopener noreferrer" style={styles.creditLink}>Desert Tileset 32×32 by Acxa Rmz</a></li>
          <li><a href="https://kloworks.itch.io/desert-dungeon-pack" target="_blank" rel="noopener noreferrer" style={styles.creditLink}>Desert Dungeon Pack by Wahid Dawod / KloWorks</a></li>
        </ul>
        <p style={styles.footerText}>© {new Date().getFullYear()} Zain Khalil</p>
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { fontFamily: 'system-ui, sans-serif', color: '#1a1008', background: '#fdf6e3', minHeight: '100vh', overflowY: 'auto' },
  header: { background: '#c8a850', padding: '3rem 1.5rem' },
  headerInner: { maxWidth: '720px', margin: '0 auto' },
  name: { fontSize: '2.5rem', fontWeight: 900, color: '#1a1008', marginBottom: '0.5rem' },
  bio: { fontSize: '1.1rem', color: '#3a2510', marginBottom: '0.25rem' },
  subBio: { fontSize: '1rem', color: '#3a2510', marginBottom: '1rem' },
  contactLinks: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
  contactLink: { color: '#1a1008', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' },
  gameLink: { color: '#1a1008', fontSize: '0.85rem', textDecoration: 'underline' },
  main: { maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' },
  section: { marginBottom: '3rem' },
  sectionTitle: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1008', borderBottom: '3px solid #c8a850', paddingBottom: '0.4rem', marginBottom: '1.5rem' },
  projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' },
  projectCard: { background: '#fff', border: '1px solid #e8d9b8', borderRadius: '6px', padding: '1.25rem', position: 'relative' },
  wip: { background: '#8B4513', color: '#fff', fontSize: '0.65rem', padding: '0.15rem 0.4rem', borderRadius: '3px', position: 'absolute', top: '0.75rem', right: '0.75rem' },
  projectName: { fontSize: '1rem', fontWeight: 700, color: '#1a1008', marginBottom: '0.25rem' },
  projectTagline: { fontSize: '0.82rem', color: '#7a6050', fontStyle: 'italic', marginBottom: '0.5rem' },
  projectDesc: { fontSize: '0.88rem', color: '#3a2510', lineHeight: 1.6, marginBottom: '0.75rem' },
  techRow: { display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' },
  techBadge: { background: '#f5e6c8', color: '#5a3a10', border: '1px solid #c8a850', padding: '0.15rem 0.4rem', fontSize: '0.7rem', borderRadius: '3px' },
  projectLinks: { display: 'flex', gap: '1rem' },
  projLink: { color: '#c87820', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' },
  tierGroup: { marginBottom: '1rem' },
  tierLabel: { fontSize: '0.8rem', color: '#7a6050', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' },
  skillRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  skillBadge: { background: '#e8d9b8', color: '#3a2510', padding: '0.25rem 0.6rem', fontSize: '0.82rem', borderRadius: '4px', fontWeight: 500 },
  legendary: { background: '#c8a850', color: '#1a1008', fontWeight: 700 },
  rare: { background: '#a0c8e0', color: '#1a3050' },
  expCard: { borderLeft: '4px solid #c8a850', paddingLeft: '1.25rem', marginBottom: '1.75rem' },
  expRole: { fontSize: '1rem', fontWeight: 700, color: '#1a1008', marginBottom: '0.15rem' },
  expOrg: { fontSize: '0.9rem', color: '#5a3a10', marginBottom: '0.1rem' },
  expPeriod: { fontSize: '0.8rem', color: '#8a6a50', marginBottom: '0.5rem' },
  expHighlights: { paddingLeft: '1.25rem', margin: 0 },
  expHighlight: { fontSize: '0.88rem', color: '#3a2510', lineHeight: 1.6, marginBottom: '0.2rem' },
  footer: { background: '#3a2510', color: '#c8b898', padding: '2rem 1.5rem', textAlign: 'center' },
  footerText: { fontSize: '0.82rem', marginBottom: '0.5rem' },
  creditList: { listStyle: 'none', padding: 0, marginBottom: '1rem' },
  creditLink: { color: '#c8a850', fontSize: '0.8rem' },
}
