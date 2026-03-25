/**
 * StaticPortfolio — clean, responsive portfolio at /portfolio.
 * SEO-friendly, accessible, mobile-first. Same data sources as the game.
 */
import { useEffect } from 'react'
import { personalInfo } from '../data/personalInfo'
import { projects } from '../data/projects'
import { skills } from '../data/skills'
import { experiences } from '../data/experience'

export default function StaticPortfolio() {
  // Override document title for the portfolio route
  useEffect(() => {
    document.title = 'Zain Khalil — Portfolio'
    return () => { document.title = "Zain's World — Zain Khalil" }
  }, [])

  return (
    <>
      <style>{responsiveCSS}</style>
      <div className="sp-page">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <header className="sp-hero">
          <div className="sp-container">
            <h1 className="sp-name">{personalInfo.name}</h1>
            <p className="sp-title">CS/BBA @ University of Waterloo</p>
            <p className="sp-subtitle">{personalInfo.bio[1]}</p>
            <p className="sp-origin">{personalInfo.bio[2]}</p>
            <nav className="sp-hero-links">
              <a href={`mailto:${personalInfo.contact.email}`} className="sp-btn sp-btn-primary">
                Email Me
              </a>
              <a href="/resume.pdf" className="sp-btn sp-btn-secondary">
                Resume
              </a>
              <a href="/" className="sp-btn sp-btn-ghost">
                Play the Game
              </a>
            </nav>
          </div>
        </header>

        <main className="sp-main">
          {/* ── Projects ──────────────────────────────────────────── */}
          <section className="sp-section" id="projects" aria-labelledby="projects-heading">
            <h2 id="projects-heading" className="sp-section-title">Projects</h2>
            <div className="sp-project-grid">
              {projects.map(p => (
                <article key={p.id} className="sp-card">
                  {p.underConstruction && (
                    <span className="sp-wip">Under Construction</span>
                  )}
                  <h3 className="sp-card-title">{p.name}</h3>
                  <p className="sp-card-tagline">{p.tagline}</p>
                  <p className="sp-card-desc">{p.description}</p>
                  <div className="sp-tech-row">
                    {p.tech.map(t => (
                      <span key={t} className="sp-tech-badge">{t}</span>
                    ))}
                  </div>
                  <div className="sp-card-links">
                    {p.github && (
                      <a href={p.github} target="_blank" rel="noopener noreferrer" className="sp-card-link">
                        View Code
                      </a>
                    )}
                    {p.demo && (
                      <a href={p.demo} target="_blank" rel="noopener noreferrer" className="sp-card-link">
                        Live Demo
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ── Skills ────────────────────────────────────────────── */}
          <section className="sp-section" id="skills" aria-labelledby="skills-heading">
            <h2 id="skills-heading" className="sp-section-title">Skills</h2>
            <div className="sp-skills-grid">
              {(['legendary', 'rare', 'common'] as const).map(tier => {
                const tierSkills = skills.filter(s => s.tier === tier)
                return (
                  <div key={tier} className="sp-tier-group">
                    <h3 className={`sp-tier-label sp-tier-${tier}`}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </h3>
                    <div className="sp-skill-row">
                      {tierSkills.map(s => (
                        <span key={s.name} className={`sp-skill-badge sp-skill-${tier}`}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── Experience ────────────────────────────────────────── */}
          <section className="sp-section" id="experience" aria-labelledby="experience-heading">
            <h2 id="experience-heading" className="sp-section-title">Experience</h2>
            <div className="sp-timeline">
              {experiences.map(exp => (
                <article key={exp.id} className="sp-exp-card">
                  <div className="sp-exp-header">
                    <h3 className="sp-exp-role">{exp.role}</h3>
                    <span className="sp-exp-period">{exp.period}</span>
                  </div>
                  <p className="sp-exp-org">{exp.organization} &middot; {exp.location}</p>
                  <ul className="sp-exp-highlights">
                    {exp.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* ── Contact ───────────────────────────────────────────── */}
          <section className="sp-section sp-contact" id="contact" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="sp-section-title">Get in Touch</h2>
            <p className="sp-contact-text">
              I'm looking for co-op opportunities and always happy to connect.
            </p>
            <div className="sp-contact-grid">
              <a href={`mailto:${personalInfo.contact.email}`} className="sp-contact-card">
                <span className="sp-contact-label">Email</span>
                <span className="sp-contact-value">{personalInfo.contact.email}</span>
              </a>
              <a href={personalInfo.contact.linkedin} target="_blank" rel="noopener noreferrer" className="sp-contact-card">
                <span className="sp-contact-label">LinkedIn</span>
                <span className="sp-contact-value">linkedin.com/in/zainskhalil</span>
              </a>
              <a href={personalInfo.contact.github} target="_blank" rel="noopener noreferrer" className="sp-contact-card">
                <span className="sp-contact-label">GitHub</span>
                <span className="sp-contact-value">github.com/dazainer</span>
              </a>
            </div>
          </section>
        </main>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="sp-footer">
          <p className="sp-footer-credit">Game asset credits:</p>
          <ul className="sp-credit-list">
            <li>
              <a href="https://jik-a-4.itch.io/free-pixel-art-ancient-egypt-tileset" target="_blank" rel="noopener noreferrer">
                Ancient Egypt Tileset by JIK-A-4 (CC0)
              </a>
            </li>
            <li>
              <a href="https://xsnake133x.itch.io/pixel-desert-32x32" target="_blank" rel="noopener noreferrer">
                Desert Tileset 32x32 by Acxa Rmz
              </a>
            </li>
            <li>
              <a href="https://kloworks.itch.io/desert-dungeon-pack" target="_blank" rel="noopener noreferrer">
                Desert Dungeon Pack by Wahid Dawod / KloWorks
              </a>
            </li>
          </ul>
          <p className="sp-copyright">&copy; {new Date().getFullYear()} Zain Khalil</p>
        </footer>
      </div>
    </>
  )
}

/** Responsive CSS — embedded so the portfolio is fully self-contained. */
const responsiveCSS = `
  .sp-page {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: #1a1008;
    background: #fdf6e3;
    min-height: 100vh;
    overflow-y: auto;
    line-height: 1.6;
  }

  /* ── Hero ─────────────────────────────────────────────────── */
  .sp-hero {
    background: linear-gradient(135deg, #c8a850 0%, #dab860 100%);
    padding: 3rem 1.5rem;
  }
  .sp-container { max-width: 760px; margin: 0 auto; }
  .sp-name {
    font-size: 2.2rem;
    font-weight: 900;
    color: #1a1008;
    margin-bottom: 0.3rem;
    letter-spacing: -0.01em;
  }
  .sp-title {
    font-size: 1.05rem;
    color: #3a2510;
    font-weight: 600;
    margin-bottom: 0.6rem;
  }
  .sp-subtitle { font-size: 1rem; color: #4a3520; margin-bottom: 0.2rem; }
  .sp-origin { font-size: 0.92rem; color: #5a4530; margin-bottom: 1.25rem; }
  .sp-hero-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  /* Buttons */
  .sp-btn {
    display: inline-block;
    padding: 0.6rem 1.2rem;
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    border-radius: 6px;
    transition: opacity 0.15s;
  }
  .sp-btn:hover { opacity: 0.85; }
  .sp-btn-primary {
    background: #1a1008;
    color: #f5e6c8;
  }
  .sp-btn-secondary {
    background: rgba(26, 16, 8, 0.12);
    color: #1a1008;
    border: 1.5px solid #1a1008;
  }
  .sp-btn-ghost {
    background: transparent;
    color: #3a2510;
    text-decoration: underline;
    padding: 0.6rem 0.5rem;
  }

  /* ── Main ──────────────────────────────────────────────────── */
  .sp-main {
    max-width: 760px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
  }
  .sp-section { margin-bottom: 3rem; }
  .sp-section-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: #1a1008;
    border-bottom: 3px solid #c8a850;
    padding-bottom: 0.4rem;
    margin-bottom: 1.5rem;
  }

  /* ── Projects ──────────────────────────────────────────────── */
  .sp-project-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
  .sp-card {
    background: #fff;
    border: 1px solid #e8d9b8;
    border-radius: 8px;
    padding: 1.25rem 1.5rem;
    position: relative;
  }
  .sp-wip {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: #8B4513;
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
  }
  .sp-card-title {
    font-size: 1.05rem;
    font-weight: 700;
    color: #1a1008;
    margin-bottom: 0.2rem;
  }
  .sp-card-tagline {
    font-size: 0.85rem;
    color: #7a6050;
    font-style: italic;
    margin-bottom: 0.6rem;
  }
  .sp-card-desc {
    font-size: 0.9rem;
    color: #3a2510;
    line-height: 1.65;
    margin-bottom: 0.75rem;
  }
  .sp-tech-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }
  .sp-tech-badge {
    background: #f5e6c8;
    color: #5a3a10;
    border: 1px solid #d8c8a0;
    padding: 0.15rem 0.5rem;
    font-size: 0.72rem;
    border-radius: 4px;
    font-weight: 500;
  }
  .sp-card-links { display: flex; gap: 1rem; }
  .sp-card-link {
    color: #b87020;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
  }
  .sp-card-link:hover { text-decoration: underline; }

  /* ── Skills ────────────────────────────────────────────────── */
  .sp-skills-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .sp-tier-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  .sp-tier-legendary { color: #b89020; }
  .sp-tier-rare { color: #4a80a0; }
  .sp-tier-common { color: #7a6a5a; }
  .sp-skill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .sp-skill-badge {
    padding: 0.3rem 0.7rem;
    font-size: 0.85rem;
    border-radius: 5px;
    font-weight: 500;
  }
  .sp-skill-legendary {
    background: #c8a850;
    color: #1a1008;
    font-weight: 700;
  }
  .sp-skill-rare {
    background: #d0e4f0;
    color: #1a3050;
  }
  .sp-skill-common {
    background: #e8ddd0;
    color: #3a2a1a;
  }

  /* ── Experience ────────────────────────────────────────────── */
  .sp-timeline {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .sp-exp-card {
    border-left: 4px solid #c8a850;
    padding-left: 1.25rem;
  }
  .sp-exp-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }
  .sp-exp-role {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1008;
  }
  .sp-exp-period {
    font-size: 0.8rem;
    color: #8a6a50;
    white-space: nowrap;
  }
  .sp-exp-org {
    font-size: 0.9rem;
    color: #5a3a10;
    margin-bottom: 0.5rem;
  }
  .sp-exp-highlights {
    padding-left: 1.25rem;
    margin: 0;
  }
  .sp-exp-highlights li {
    font-size: 0.88rem;
    color: #3a2510;
    line-height: 1.6;
    margin-bottom: 0.15rem;
  }

  /* ── Contact ───────────────────────────────────────────────── */
  .sp-contact { text-align: center; }
  .sp-contact-text {
    font-size: 1rem;
    color: #4a3520;
    margin-bottom: 1.5rem;
  }
  .sp-contact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
    max-width: 400px;
    margin: 0 auto;
  }
  .sp-contact-card {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    background: #fff;
    border: 1px solid #e8d9b8;
    border-radius: 8px;
    padding: 1rem 1.25rem;
    text-decoration: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .sp-contact-card:hover {
    border-color: #c8a850;
    box-shadow: 0 2px 8px rgba(200, 168, 80, 0.15);
  }
  .sp-contact-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #8a7a60;
  }
  .sp-contact-value {
    font-size: 0.92rem;
    color: #1a1008;
    font-weight: 500;
  }

  /* ── Footer ────────────────────────────────────────────────── */
  .sp-footer {
    background: #2a1a08;
    color: #b8a888;
    padding: 2rem 1.5rem;
    text-align: center;
    font-size: 0.82rem;
  }
  .sp-footer-credit { margin-bottom: 0.4rem; color: #8a7a60; }
  .sp-credit-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .sp-credit-list a {
    color: #c8a850;
    text-decoration: none;
    font-size: 0.78rem;
  }
  .sp-credit-list a:hover { text-decoration: underline; }
  .sp-copyright { color: #6a5a40; font-size: 0.75rem; }

  /* ── Responsive ────────────────────────────────────────────── */
  @media (min-width: 640px) {
    .sp-hero { padding: 4rem 2rem; }
    .sp-name { font-size: 2.8rem; }
    .sp-project-grid { grid-template-columns: repeat(2, 1fr); }
    .sp-contact-grid { grid-template-columns: repeat(3, 1fr); max-width: 100%; }
  }

  @media (min-width: 900px) {
    .sp-main { padding: 3rem 2rem; }
  }
`
