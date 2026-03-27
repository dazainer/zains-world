/**
 * StaticPortfolio — polished, sticky-scrolling portfolio at /portfolio.
 * Uses the same data sources as the game, but with a richer editorial layout.
 */
import { useEffect, useRef, useState, useCallback, type MouseEventHandler } from 'react'
import { personalInfoPortfolio } from '../data/personalInfoPortfolio'
import { projects } from '../data/projects'
import { skills } from '../data/skills'
import { experiences } from '../data/experience'

const PROFILE_PHOTO = '/assets/photos/web/omam4-hero.jpg'
const PROFILE_PHOTO_POSITION = '68% 24%'
const PROFILE_PHOTO_SHIFT_X = -150
const PROFILE_PHOTO_SCALE = 2.7

const sectionLinks = [
  { id: 'about', label: 'About' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

function renderPortfolioBioLine(line: string, onPlayLinkClick: MouseEventHandler<HTMLAnchorElement>) {
  const match = /play the game/i.exec(line)

  if (!match || match.index === undefined) return line

  const start = match.index
  const end = start + match[0].length

  return (
    <>
      {line.slice(0, start)}
      <a href="#play-game-cta" className="sp-inline-scroll-link" onClick={onPlayLinkClick}>
        {line.slice(start, end)}
      </a>
      {line.slice(end)}
    </>
  )
}

export default function StaticPortfolio() {
  const pageRef = useRef<HTMLDivElement | null>(null)
  const playCtaRef = useRef<HTMLAnchorElement | null>(null)
  const playCtaBulgeStartTimerRef = useRef<number | null>(null)
  const playCtaBulgeTimerRef = useRef<number | null>(null)
  const [playCtaBulging, setPlayCtaBulging] = useState(false)

  const triggerPlayCtaBulge = useCallback<MouseEventHandler<HTMLAnchorElement>>((event) => {
    event.preventDefault()

    const target = playCtaRef.current
    const page = pageRef.current
    if (!target || !page) return

    let top = 0
    let node: HTMLElement | null = target
    while (node && node !== page) {
      top += node.offsetTop
      node = node.offsetParent as HTMLElement | null
    }

    page.scrollTo({
      top: Math.max(top - 28, 0),
      behavior: 'smooth',
    })
    target.focus({ preventScroll: true })
    window.history.replaceState(null, '', '#play-game-cta')

    setPlayCtaBulging(false)

    if (playCtaBulgeStartTimerRef.current !== null) {
      window.clearTimeout(playCtaBulgeStartTimerRef.current)
      playCtaBulgeStartTimerRef.current = null
    }

    if (playCtaBulgeTimerRef.current !== null) {
      window.clearTimeout(playCtaBulgeTimerRef.current)
      playCtaBulgeTimerRef.current = null
    }

    playCtaBulgeStartTimerRef.current = window.setTimeout(() => {
      setPlayCtaBulging(true)
      playCtaBulgeStartTimerRef.current = null

      playCtaBulgeTimerRef.current = window.setTimeout(() => {
        setPlayCtaBulging(false)
        playCtaBulgeTimerRef.current = null
      }, 900)
    }, 500)
  }, [])

  useEffect(() => {
    document.title = 'Zain Khalil — Portfolio'
    return () => {
      if (playCtaBulgeStartTimerRef.current !== null) {
        window.clearTimeout(playCtaBulgeStartTimerRef.current)
        playCtaBulgeStartTimerRef.current = null
      }
      if (playCtaBulgeTimerRef.current !== null) {
        window.clearTimeout(playCtaBulgeTimerRef.current)
        playCtaBulgeTimerRef.current = null
      }
      document.title = "Zain's World — Zain Khalil"
    }
  }, [])

  return (
    <>
      <style>{responsiveCSS}</style>
      <div className="sp-page" ref={pageRef}>
        <div className="sp-shell">
          <aside className="sp-rail">
            <div className="sp-rail-card">
              <div className="sp-photo-frame">
                <img
                  className="sp-photo"
                  src={PROFILE_PHOTO}
                  alt="Portrait of Zain Khalil"
                  style={{
                    objectPosition: PROFILE_PHOTO_POSITION,
                    transform: `translateX(${PROFILE_PHOTO_SHIFT_X}px) scale(${PROFILE_PHOTO_SCALE})`,
                  }}
                />
                <div className="sp-photo-badge">Open to co-op</div>
              </div>

              <p className="sp-kicker">Interactive portfolio, remixed for the web</p>
              <h1 className="sp-name">{personalInfoPortfolio.name}</h1>
              <p className="sp-title">CS/BBA @ University of Waterloo</p>
              <p className="sp-summary">{personalInfoPortfolio.bio[0]}</p>
              <p className="sp-summary-secondary">{personalInfoPortfolio.bio[1]}</p>

              <nav className="sp-anchor-nav" aria-label="Portfolio sections">
                {sectionLinks.map(link => (
                  <a key={link.id} href={`#${link.id}`} className="sp-anchor-link">
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="sp-hero-links">
                <a href={`mailto:${personalInfoPortfolio.contact.email}`} className="sp-btn sp-btn-primary">
                  Email Me
                </a>
                <a href="/resume.pdf" className="sp-btn sp-btn-secondary">
                  Resume
                </a>
                <a
                  href="/"
                  id="play-game-cta"
                  ref={playCtaRef}
                  className={`sp-btn sp-btn-portal${playCtaBulging ? ' is-bulging' : ''}`}
                >
                  Play the Game
                </a>
              </div>

              <div className="sp-quick-grid">
                <article className="sp-quick-card">
                  <span className="sp-quick-label">Roots</span>
                  <strong className="sp-quick-value">Cairo, Egypt</strong>
                </article>
                <article className="sp-quick-card">
                  <span className="sp-quick-label">Focus</span>
                  <strong className="sp-quick-value">Backend + AI</strong>
                </article>
                <article className="sp-quick-card sp-quick-card-wide">
                  <span className="sp-quick-label">Now</span>
                  <strong className="sp-quick-value">Building systems that feel thoughtful, useful, and a little playful.</strong>
                </article>
              </div>
            </div>
          </aside>

          <main className="sp-content">
            <section className="sp-panel sp-panel-about" id="about" aria-labelledby="about-heading">
              <div className="sp-panel-head">
                <p className="sp-eyebrow">About</p>
                <h2 id="about-heading" className="sp-section-title">A portfolio that still feels like Zain&apos;s World</h2>
                <p className="sp-section-copy">
                  I wanted to make a personal website with personality, so I made it a game: warm, a little unexpected,
                  and grounded in Cairo-inspired visual language.
                </p>
              </div>

              <div className="sp-about-grid">
                <div className="sp-about-copy">
                  {personalInfoPortfolio.bio.map((line, index) => (
                    <p key={index}>{renderPortfolioBioLine(line, triggerPlayCtaBulge)}</p>
                  ))}
                </div>
              </div>
            </section>

            <section className="sp-panel" id="projects" aria-labelledby="projects-heading">
              <div className="sp-panel-head">
                <p className="sp-eyebrow">Selected work</p>
                <h2 id="projects-heading" className="sp-section-title">Projects</h2>
                <p className="sp-section-copy">
                  Products, experiments, and systems work that emphasize clarity, reliability, and practical value.
                </p>
              </div>

              <div className="sp-project-grid">
                {projects.map(project => (
                  <article key={project.id} className="sp-card">
                    {project.underConstruction && (
                      <span className="sp-wip">Under Construction</span>
                    )}
                    {project.image && (
                      <div className="sp-card-media">
                        <img
                          src={project.image}
                          alt={`${project.name} screenshot`}
                          className="sp-card-image"
                        />
                      </div>
                    )}
                    <h3 className="sp-card-title">{project.name}</h3>
                    <p className="sp-card-tagline">{project.tagline}</p>
                    <p className="sp-card-desc">{project.description}</p>
                    <div className="sp-tech-row">
                      {project.tech.map(tech => (
                        <span key={tech} className="sp-tech-badge">{tech}</span>
                      ))}
                    </div>
                    <div className="sp-card-links">
                      {project.github && (
                        <a href={project.github} target="_blank" rel="noopener noreferrer" className="sp-card-link">
                          View Code
                        </a>
                      )}
                      {project.demo && (
                        <a href={project.demo} target="_blank" rel="noopener noreferrer" className="sp-card-link">
                          Live Demo
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="sp-panel" id="skills" aria-labelledby="skills-heading">
              <div className="sp-panel-head">
                <p className="sp-eyebrow">Toolbox</p>
                <h2 id="skills-heading" className="sp-section-title">Skills</h2>
                <p className="sp-section-copy">
                  Grouped by confidence level so the strongest tools stay visually obvious.
                </p>
              </div>

              <div className="sp-skills-grid">
                {(['legendary', 'rare', 'common'] as const).map(tier => {
                  const tierSkills = skills.filter(skill => skill.tier === tier)
                  return (
                    <section key={tier} className="sp-tier-group">
                      <h3 className={`sp-tier-label sp-tier-${tier}`}>
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </h3>
                      <div className="sp-skill-row">
                        {tierSkills.map(skill => (
                          <span key={skill.name} className={`sp-skill-badge sp-skill-${tier}`}>
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            </section>

            <section className="sp-panel" id="experience" aria-labelledby="experience-heading">
              <div className="sp-panel-head">
                <p className="sp-eyebrow">Timeline</p>
                <h2 id="experience-heading" className="sp-section-title">Experience</h2>
                <p className="sp-section-copy">
                  Leadership, operations, and technical experience that shaped how I build and collaborate.
                </p>
              </div>

              <div className="sp-timeline">
                {experiences.map(experience => (
                  <article key={experience.id} className="sp-exp-card">
                    <div className="sp-exp-header">
                      <h3 className="sp-exp-role">{experience.role}</h3>
                      <span className="sp-exp-period">{experience.period}</span>
                    </div>
                    <p className="sp-exp-org">{experience.organization} &middot; {experience.location}</p>
                    <ul className="sp-exp-highlights">
                      {experience.highlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="sp-panel sp-contact" id="contact" aria-labelledby="contact-heading">
              <div className="sp-panel-head">
                <p className="sp-eyebrow">Contact</p>
                <h2 id="contact-heading" className="sp-section-title">Let&apos;s build something meaningful</h2>
                <p className="sp-section-copy">
                  I&apos;m looking for co-op opportunities and I&apos;m always happy to talk about engineering, product ideas, or ambitious student projects.
                </p>
              </div>

              <div className="sp-contact-grid">
                <a href={`mailto:${personalInfoPortfolio.contact.email}`} className="sp-contact-card">
                  <span className="sp-contact-label">Email</span>
                  <span className="sp-contact-value">{personalInfoPortfolio.contact.email}</span>
                </a>
                <a href={personalInfoPortfolio.contact.linkedin} target="_blank" rel="noopener noreferrer" className="sp-contact-card">
                  <span className="sp-contact-label">LinkedIn</span>
                  <span className="sp-contact-value">linkedin.com/in/zainskhalil</span>
                </a>
                <a href={personalInfoPortfolio.contact.github} target="_blank" rel="noopener noreferrer" className="sp-contact-card">
                  <span className="sp-contact-label">GitHub</span>
                  <span className="sp-contact-value">github.com/dazainer</span>
                </a>
              </div>
            </section>
          </main>
        </div>

        <footer className="sp-footer">
          <div className="sp-footer-inner">
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
          </div>
        </footer>
      </div>
    </>
  )
}

const responsiveCSS = `
  .sp-page {
    --sp-sand-0: #f8efd8;
    --sp-sand-1: #efddba;
    --sp-sand-2: #d9b87c;
    --sp-ink: #22150d;
    --sp-ink-soft: #684f36;
    --sp-ink-muted: #8b7358;
    --sp-oasis: #2f756d;
    --sp-oasis-soft: #d7ebe4;
    --sp-clay: #b86d3e;
    --sp-leaf: #6c8a3e;
    font-family: "Avenir Next", "Trebuchet MS", "Segoe UI", sans-serif;
    color: var(--sp-ink);
    background:
      radial-gradient(circle at 10% 0%, rgba(217, 184, 124, 0.42), transparent 32%),
      radial-gradient(circle at 84% 8%, rgba(184, 109, 62, 0.14), transparent 24%),
      radial-gradient(circle at 90% 12%, rgba(47, 117, 109, 0.12), transparent 26%),
      linear-gradient(180deg, #fbf3e2 0%, #f3e1bb 46%, #e7c88f 100%);
    height: 100vh;
    line-height: 1.65;
    overflow-x: hidden;
    overflow-y: auto;
    scroll-behavior: smooth;
    scroll-snap-type: y proximity;
    scroll-padding-top: 1rem;
  }

  .sp-page * {
    box-sizing: border-box;
  }

  .sp-shell {
    width: min(1240px, calc(100% - 2rem));
    margin: 0 auto;
    padding: 1rem 0 2.75rem;
    display: grid;
    gap: 1.4rem;
  }

  .sp-rail-card,
  .sp-panel {
    background:
      linear-gradient(180deg, rgba(255, 250, 242, 0.92) 0%, rgba(255, 247, 232, 0.86) 100%),
      radial-gradient(circle at top right, rgba(217, 184, 124, 0.18), transparent 44%);
    border: 1px solid rgba(123, 82, 41, 0.16);
    box-shadow:
      0 24px 60px rgba(65, 39, 19, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(12px);
  }

  .sp-rail-card {
    border-radius: 28px;
    padding: 1rem;
    overflow: hidden;
  }

  .sp-photo-frame {
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: 22px;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #d9b87c 0%, #9c6b3b 100%);
  }

  .sp-photo-frame::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 38%;
    background: linear-gradient(180deg, rgba(18, 12, 8, 0) 0%, rgba(18, 12, 8, 0.35) 100%);
    pointer-events: none;
  }

  .sp-photo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    display: block;
    transform: scale(1.08);
    transform-origin: center center;
  }

  .sp-photo-badge {
    position: absolute;
    left: 0.9rem;
    bottom: 0.9rem;
    z-index: 1;
    padding: 0.45rem 0.7rem;
    border-radius: 999px;
    background: rgba(26, 18, 12, 0.82);
    color: #f6ead1;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .sp-kicker,
  .sp-eyebrow {
    margin: 0 0 0.45rem;
    color: var(--sp-oasis);
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .sp-name,
  .sp-section-title,
  .sp-quick-value,
  .sp-card-title,
  .sp-exp-role {
    font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
  }

  .sp-name {
    margin: 0;
    font-size: clamp(2.5rem, 7vw, 4.2rem);
    line-height: 0.95;
    letter-spacing: -0.04em;
  }

  .sp-title {
    margin: 0.55rem 0 0.45rem;
    color: var(--sp-clay);
    font-weight: 700;
    font-size: 1rem;
  }

  .sp-summary,
  .sp-summary-secondary {
    margin: 0 0 0.75rem;
    color: var(--sp-ink-soft);
    font-size: 0.96rem;
  }

  .sp-summary-secondary {
    margin-bottom: 1rem;
    color: var(--sp-ink-muted);
  }

  .sp-inline-scroll-link {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    margin: 0 0.12rem;
    color: var(--sp-clay);
    font-size: 0.96em;
    font-weight: 800;
    text-decoration: none;
    white-space: nowrap;
    border-bottom: 2px solid rgba(184, 109, 62, 0.35);
    transition: color 120ms ease, border-color 120ms ease, transform 120ms ease;
  }

  .sp-inline-scroll-link::after {
    content: "↓";
    color: var(--sp-oasis);
    font-size: 0.9em;
  }

  .sp-inline-scroll-link:hover {
    color: var(--sp-oasis);
    border-color: rgba(47, 117, 109, 0.5);
    transform: translateY(-1px);
  }

  .sp-anchor-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin: 1rem 0 1.1rem;
  }

  .sp-anchor-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.1rem;
    padding: 0.45rem 0.8rem;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(217, 184, 124, 0.16) 0%, rgba(255, 255, 255, 0.5) 100%);
    border: 1px solid rgba(184, 109, 62, 0.18);
    color: #7a4d20;
    text-decoration: none;
    font-size: 0.84rem;
    font-weight: 700;
  }

  .sp-anchor-link:hover,
  .sp-card-link:hover,
  .sp-credit-list a:hover {
    text-decoration: underline;
  }

  .sp-anchor-link:hover {
    background: rgba(217, 184, 124, 0.24);
  }

  .sp-hero-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-bottom: 1.15rem;
  }

  .sp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.6rem;
    padding: 0.72rem 1.1rem;
    border-radius: 999px;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
    transition: transform 120ms ease, opacity 120ms ease, box-shadow 120ms ease;
  }

  .sp-btn:hover {
    opacity: 0.95;
    transform: translateY(-1px);
  }

  .sp-btn-primary {
    background: linear-gradient(135deg, #1f1711 0%, #513320 100%);
    color: #f7ebd6;
    box-shadow: 0 10px 24px rgba(31, 23, 17, 0.18);
  }

  .sp-btn-secondary {
    background: linear-gradient(180deg, rgba(217, 184, 124, 0.18) 0%, rgba(184, 109, 62, 0.1) 100%);
    color: var(--sp-clay);
    border: 1px solid rgba(184, 109, 62, 0.3);
  }

  .sp-btn-ghost {
    background: transparent;
    color: var(--sp-ink-soft);
    border: 1px dashed rgba(104, 79, 54, 0.28);
  }

  .sp-btn-portal {
    background: linear-gradient(135deg, rgba(47, 117, 109, 0.96) 0%, rgba(23, 61, 59, 0.98) 100%);
    color: #f8eddc;
    border: 1px solid rgba(217, 184, 124, 0.42);
    box-shadow:
      0 14px 30px rgba(47, 117, 109, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .sp-btn-portal:hover {
    box-shadow:
      0 16px 34px rgba(47, 117, 109, 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .sp-btn-portal.is-bulging {
    animation: spPortalBulge 820ms cubic-bezier(0.2, 0.9, 0.3, 1);
  }

  @keyframes spPortalBulge {
    0% {
      transform: scale(1);
      box-shadow:
        0 14px 30px rgba(47, 117, 109, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }
    35% {
      transform: scale(1.12);
      box-shadow:
        0 0 0 8px rgba(47, 117, 109, 0.12),
        0 22px 40px rgba(47, 117, 109, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.22);
    }
    65% {
      transform: scale(0.98);
      box-shadow:
        0 0 0 12px rgba(47, 117, 109, 0.04),
        0 18px 36px rgba(47, 117, 109, 0.22),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }
    100% {
      transform: scale(1);
      box-shadow:
        0 14px 30px rgba(47, 117, 109, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }
  }

  .sp-quick-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
  }

  .sp-quick-card {
    padding: 0.9rem;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(255, 248, 235, 0.9) 0%, rgba(255, 255, 255, 0.48) 100%);
    border: 1px solid rgba(165, 116, 55, 0.14);
  }

  .sp-quick-card-wide {
    grid-column: 1 / -1;
  }

  .sp-quick-label {
    display: block;
    margin-bottom: 0.35rem;
    color: var(--sp-ink-muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .sp-quick-value {
    display: block;
    color: var(--sp-ink);
    font-size: 1rem;
    line-height: 1.25;
  }

  .sp-content {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
  }

  .sp-panel {
    border-radius: 28px;
    padding: 1.35rem;
    scroll-snap-align: start;
  }

  .sp-panel-head {
    margin-bottom: 1.2rem;
    padding-bottom: 0.95rem;
    border-bottom: 1px solid rgba(184, 109, 62, 0.14);
  }

  .sp-section-title {
    margin: 0 0 0.35rem;
    font-size: clamp(1.75rem, 4vw, 2.45rem);
    line-height: 1.02;
  }

  .sp-section-copy {
    margin: 0;
    max-width: 58ch;
    color: var(--sp-ink-soft);
    font-size: 0.97rem;
  }

  .sp-about-grid {
    display: grid;
    gap: 1rem;
  }

  .sp-about-copy {
    display: grid;
    gap: 0.9rem;
    color: var(--sp-ink-soft);
    font-size: 1rem;
  }

  .sp-about-copy p,
  .sp-fact-card p {
    margin: 0;
  }

  .sp-project-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .sp-card {
    position: relative;
    border-radius: 22px;
    padding: 1.2rem 1.25rem;
    background:
      linear-gradient(180deg, rgba(255, 250, 243, 0.95) 0%, rgba(255, 255, 255, 0.56) 100%),
      radial-gradient(circle at top right, rgba(217, 184, 124, 0.16), transparent 38%);
    border: 1px solid rgba(123, 82, 41, 0.12);
    box-shadow: 0 10px 28px rgba(50, 31, 16, 0.06);
  }

  .sp-card-media {
    margin: -0.2rem -0.25rem 0.9rem;
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid rgba(123, 82, 41, 0.16);
    box-shadow: 0 8px 24px rgba(50, 31, 16, 0.12);
    background: linear-gradient(180deg, rgba(31, 23, 17, 0.92) 0%, rgba(67, 40, 23, 0.96) 100%);
  }

  .sp-card-image {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }

  .sp-wip {
    position: absolute;
    top: 0.85rem;
    right: 0.85rem;
    padding: 0.24rem 0.55rem;
    border-radius: 999px;
    background: rgba(184, 109, 62, 0.18);
    color: var(--sp-clay);
    font-size: 0.68rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .sp-card-title {
    margin: 0 0 0.15rem;
    font-size: 1.2rem;
  }

  .sp-card-tagline {
    margin: 0 0 0.7rem;
    color: var(--sp-oasis);
    font-style: italic;
    font-size: 0.9rem;
  }

  .sp-card-desc {
    margin: 0 0 0.85rem;
    color: var(--sp-ink-soft);
    font-size: 0.93rem;
  }

  .sp-tech-row,
  .sp-skill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .sp-tech-row {
    margin-bottom: 0.85rem;
  }

  .sp-tech-badge,
  .sp-skill-badge {
    border-radius: 999px;
    padding: 0.28rem 0.68rem;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .sp-tech-badge {
    background: rgba(217, 184, 124, 0.28);
    color: #6d4d22;
    border: 1px solid rgba(184, 109, 62, 0.18);
  }

  .sp-card-links {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .sp-card-link {
    color: var(--sp-clay);
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 800;
  }

  .sp-skills-grid {
    display: grid;
    gap: 1rem;
  }

  .sp-tier-group {
    border-radius: 20px;
    padding: 1rem;
    background: linear-gradient(180deg, rgba(255, 249, 239, 0.82) 0%, rgba(255, 255, 255, 0.4) 100%);
    border: 1px solid rgba(123, 82, 41, 0.1);
  }

  .sp-tier-label {
    margin: 0 0 0.7rem;
    font-size: 0.76rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    font-weight: 800;
  }

  .sp-tier-legendary { color: #a27110; }
  .sp-tier-rare { color: #2f756d; }
  .sp-tier-common { color: #7d6246; }

  .sp-skill-legendary {
    background: rgba(217, 184, 124, 0.28);
    color: #6b4b16;
    border: 1px solid rgba(162, 113, 16, 0.22);
  }

  .sp-skill-rare {
    background: rgba(47, 117, 109, 0.12);
    color: #1f5c56;
    border: 1px solid rgba(47, 117, 109, 0.18);
  }

  .sp-skill-common {
    background: rgba(104, 79, 54, 0.09);
    color: #634a33;
    border: 1px solid rgba(104, 79, 54, 0.12);
  }

  .sp-timeline {
    display: grid;
    gap: 1rem;
  }

  .sp-exp-card {
    padding: 1rem 1.1rem 1rem 1.25rem;
    border-left: 4px solid var(--sp-clay);
    border-radius: 0 18px 18px 0;
    background:
      linear-gradient(180deg, rgba(255, 250, 242, 0.86) 0%, rgba(255, 255, 255, 0.44) 100%);
  }

  .sp-exp-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .sp-exp-role {
    margin: 0;
    font-size: 1.12rem;
  }

  .sp-exp-period {
    color: var(--sp-ink-muted);
    font-size: 0.82rem;
    font-weight: 700;
  }

  .sp-exp-org {
    margin: 0.2rem 0 0.7rem;
    color: var(--sp-clay);
    font-size: 0.92rem;
    font-weight: 700;
  }

  .sp-exp-highlights {
    margin: 0;
    padding-left: 1.15rem;
    color: var(--sp-ink-soft);
    font-size: 0.91rem;
  }

  .sp-exp-highlights li + li {
    margin-top: 0.2rem;
  }

  .sp-contact-grid {
    display: grid;
    gap: 0.85rem;
  }

  .sp-contact-card {
    display: flex;
    flex-direction: column;
    gap: 0.22rem;
    padding: 1rem 1.1rem;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(255, 249, 239, 0.92) 0%, rgba(255, 255, 255, 0.5) 100%);
    border: 1px solid rgba(123, 82, 41, 0.12);
    color: inherit;
    text-decoration: none;
  }

  .sp-contact-card:hover {
    border-color: rgba(47, 117, 109, 0.28);
    box-shadow: 0 10px 24px rgba(47, 117, 109, 0.08);
  }

  .sp-contact-label {
    color: var(--sp-ink-muted);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .sp-contact-value {
    color: var(--sp-ink);
    font-size: 0.96rem;
    font-weight: 700;
  }

  .sp-footer {
    margin-top: 0.5rem;
    padding: 0 0 2rem;
  }

  .sp-footer-inner {
    width: min(1240px, calc(100% - 2rem));
    margin: 0 auto;
    padding: 1.25rem 1.4rem;
    border-radius: 24px;
    background: rgba(33, 21, 13, 0.92);
    color: #d8c7a6;
    text-align: center;
  }

  .sp-footer-credit {
    margin: 0 0 0.45rem;
    color: #baa37d;
    font-size: 0.84rem;
  }

  .sp-credit-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: grid;
    gap: 0.24rem;
  }

  .sp-credit-list a {
    color: #f0d08c;
    text-decoration: none;
    font-size: 0.8rem;
  }

  .sp-copyright {
    margin: 0;
    color: #998361;
    font-size: 0.76rem;
  }

  .sp-anchor-link:focus-visible,
  .sp-btn:focus-visible,
  .sp-card-link:focus-visible,
  .sp-contact-card:focus-visible,
  .sp-credit-list a:focus-visible {
    outline: 2px solid var(--sp-oasis);
    outline-offset: 3px;
  }

  @media (min-width: 700px) {
    .sp-panel {
      padding: 1.6rem;
    }

    .sp-project-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .sp-contact-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 960px) {
    .sp-shell {
      grid-template-columns: minmax(320px, 390px) minmax(0, 1fr);
      align-items: start;
      gap: 1.6rem;
      padding-top: 1.2rem;
    }

    .sp-rail-card {
      position: sticky;
      top: 1rem;
      padding: 1.1rem;
    }
  }
`
