# Zain's World — Portfolio Game Website

## Project Overview
A personal portfolio website built as a top-down 2D pixel art exploration game set in an Ancient Egypt / desert theme. Visitors control a pharaoh character that walks around a small world, entering buildings and interacting with objects to discover portfolio content (projects, skills, experience, contact info). A "Skip to Portfolio →" link is always visible in the top-right corner for users who prefer a traditional view.

**Live URL**: https://zainkhalil.ca (deployed on Vercel, domain registered on Porkbun)
**Owner**: Zain Khalil — CS/BBA student at University of Waterloo
**GitHub**: https://github.com/dazainer
**LinkedIn**: https://www.linkedin.com/in/zainskhalil
**Contact**: z7khalil@uwaterloo.ca

## Tech Stack
- **Framework**: Vite + React + TypeScript
- **Game rendering**: HTML5 Canvas (no game engine — custom game loop)
- **UI overlays**: React components (dialogue boxes, project panels, menus)
- **Styling**: CSS modules or Tailwind for UI overlays; canvas for game world
- **Deployment**: Vercel (connected to GitHub repo: github.com/dazainer/zains-world)
- **Base tile size**: 32x32 pixels for terrain/environment; 16x16 character sprites rendered at 2x scale to match the grid
- **Assets**: Three pre-made pixel art sprite packs stored in `/public/assets/`:
  - **JIK-A-4's Ancient Egypt Tileset** (CC0 license): pyramids, sphinx, vases, Egyptian tiles
    Source: https://jik-a-4.itch.io/free-pixel-art-ancient-egypt-tileset
  - **Acxa Rmz's Desert Tileset 32x32** (free for commercial use): terrain, cacti, palm trees, dunes, animated snake + camel sprites
    Source: https://xsnake133x.itch.io/pixel-desert-32x32
  - **KloWorks' Desert Dungeon Pack 16x16** (free for commercial use, no AI): pharaoh player character (idle + walk), enemy character, animated treasure box, doors, torches, dungeon tiles
    Source: https://kloworks.itch.io/desert-dungeon-pack

### Detailed Asset Reference

For exact sheet dimensions, row orders, mixed-atlas notes, and sprite slicing guidance, see `ASSET_GUIDE.md`.

### Sprite scaling note
The Desert Dungeon Pack (player character, treasure box, torches, doors) is 16x16. The Desert Tileset (terrain, environment) is 32x32. Render the 16x16 sprites at 2x scale (drawImage with 32x32 destination size) so everything aligns to the same grid. Use `imageSmoothingEnabled = false` to keep pixels crisp when scaling.

## Architecture

```
src/
├── game/                    # Game engine (pure TypeScript, no React)
│   ├── GameEngine.ts        # Main game loop (update → render @ 60fps)
│   ├── Player.ts            # Player character (pharaoh): position, velocity, sprite animation
│   ├── Camera.ts            # Camera following player, room transitions
│   ├── InputManager.ts      # Keyboard + mobile touch d-pad input
│   ├── CollisionMap.ts      # 2D tile array: 0=wall, 1=walkable, 2=interaction, 3=door
│   ├── InteractionManager.ts # Handles Space/Enter on interaction tiles
│   ├── SpriteSheet.ts       # Sprite sheet loader, frame extraction, animation (handles 2x scaling for 16x16 assets)
│   ├── TileRenderer.ts      # Renders tile-based maps from 2D arrays
│   ├── AmbientSprite.ts     # Animated ambient NPCs (camel, snake, torches) with idle loops
│   └── maps/                # Map data for each room
│       ├── overworld.ts     # Main outdoor desert/Egypt map
│       ├── projectsLab.ts   # Projects Lab interior (tech workshop)
│       ├── skillsForge.ts   # Skills Forge interior (armory/workshop)
│       ├── experienceTower.ts # Experience Tower interior (multi-floor)
│       ├── contactPortal.ts # Contact Portal interior
│       └── secretRoom.ts    # Hidden secret room
├── components/              # React UI overlays
│   ├── GameCanvas.tsx       # Canvas wrapper, mounts game engine
│   ├── DialogueBox.tsx      # RPG-style text box with typewriter effect
│   ├── ProjectPanel.tsx     # Slide-up panel for project details
│   ├── SkipToPortfolio.tsx  # "Skip to Portfolio →" persistent link
│   ├── MobileControls.tsx   # Virtual d-pad for touch devices
│   ├── InteractionPrompt.tsx # "Press Space to interact" indicator
│   ├── DebugTerminal.tsx    # Easter egg functional terminal in secret room
│   ├── BookshelfPanel.tsx   # Bookshelf interaction panel in secret room
│   ├── SnakeGame.tsx        # Mini Snake game easter egg in secret room
│   └── StaticPortfolio.tsx  # Full traditional portfolio (fallback page at /portfolio)
├── data/                    # Content data (add new content by editing these files)
│   ├── projects.ts          # Project entries
│   ├── skills.ts            # Skills with proficiency tiers
│   ├── experience.ts        # Experience entries with optional photo URLs
│   ├── personalInfo.ts      # Bio, contact links, fun facts
│   ├── books.ts             # Bookshelf entries for secret room
│   └── terminalCommands.ts  # Debug terminal command responses
├── hooks/
│   └── useGameEngine.ts     # React hook connecting canvas to game engine
├── App.tsx                  # Root: routes between game view ("/") and static portfolio ("/portfolio")
└── main.tsx
public/
├── assets/
│   ├── sprites/             # Character sprite sheets from Desert Dungeon Pack (pharaoh player, enemy)
│   ├── tiles/               # Tileset images
│   │   ├── egypt/           # JIK-A-4's Ancient Egypt tiles
│   │   ├── desert/          # Acxa Rmz's Desert terrain tiles
│   │   └── dungeon/         # KloWorks' Desert Dungeon tiles (interiors, doors, torches, treasure box)
│   ├── ambient/             # Animated ambient sprites (camel + snake from desert pack, torches from dungeon pack)
│   ├── ui/                  # UI elements (dialogue box borders, icons)
│   └── photos/              # Real photos for Experience Tower paintings
├── resume.pdf               # Downloadable resume
└── favicon.ico
```

## Visual Theme: Ancient Egypt / Desert

The entire world is themed around Ancient Egypt and the desert, reflecting Zain's Egyptian heritage. The player character is a pharaoh. This is NOT a generic grass-and-stone RPG — it's a sandy, warm, culturally personal world.

### Overworld aesthetic
- Sandy terrain as the base ground tile (from desert pack)
- Pyramids and sphinx (from Egypt pack) as large decorative landmarks
- Palm trees, cacti, dunes as environmental props
- Stone paths connecting buildings
- Warm color palette: golds, sandy beiges, terracotta, with teal/blue accents for water or portals
- Vases and Egyptian decorations scattered as props
- **Animated ambient NPCs**: a camel idling near a building (from desert pack), a snake near the secret room entrance area (thematic hint — from desert pack)
- **Animated torches** (from dungeon pack) flanking building entrances for atmosphere

### Building exteriors
- Egyptian temple/building style using the Egypt tileset
- Each building should feel visually distinct but within the same theme
- Projects Lab: largest building, prominent, maybe with a tech-ish twist (a glowing screen visible through a window)
- Contact Portal: a glowing mystical portal (blue/teal glow effect) between two pillars
- Animated door sprites (from dungeon pack) on building entrances

### Interiors
- Use the dungeon tiles from the Desert Dungeon Pack for interior floors/walls
- Animated torches (from dungeon pack) on interior walls for atmosphere
- This creates a nice visual contrast: bright sandy outdoor → warm dungeon-lit interiors

## Game World Design

### Overworld (outdoor desert map)
- Central spawn point with welcome text: "Welcome to Zain's World. Use arrow keys to explore, Space to interact."
- 5 zones arranged around spawn:
  - **Projects Lab** (north) — largest, most prominent building
  - **Skills Forge** (west) — workshop/armory building
  - **Experience Tower** (east) — tall tower or temple building
  - **Contact Portal** (south) — glowing portal between pillars
- **About Me NPC**: Egyptian-styled character (enemy sprite from dungeon pack repurposed as friendly NPC) standing near spawn
- **Resume Chest**: animated treasure box sprite (from dungeon pack) near spawn area, triggers PDF download
- **Hidden path to Secret Room**: a fake wall tile in the northeast corner (walk through it)
- Ambient animated camel idling near a building
- Animated snake near the NE area (subtle hint toward secret room)

### Projects Lab (interior — MOST IMPORTANT ZONE)
- Interior walls/floors from dungeon pack tiles, torches on walls
- 3 project stations, each with a workbench and animated monitor:

**Station 1: SpecGuard** (monitor animation: documents flowing through a pipeline)
- AI-powered QA tool, Python/FastAPI backend, React frontend
- Tech: Python, FastAPI, React, TypeScript, OpenAI API, Pydantic

**Station 2: Expense Tracker V2** (monitor animation: mini line chart)
- Full-stack expense analytics web app
- Tech: React, TypeScript, Node.js, PostgreSQL, Recharts

**Station 3: AI Meeting Copilot** (when built; otherwise "under construction" with caution tape)
- RAG-based meeting intelligence tool
- Tech: Python, pgvector, Ollama, PostgreSQL, FastAPI

- Walk up to station + Space → ProjectPanel slides up with: name, tagline, description, tech badges, GitHub link
- Decorative details: coffee cup, rubber duck, cables, a whiteboard Easter egg ("TODO: get co-op")
- **Data-driven**: adding a project = adding an entry to `data/projects.ts`

### Skills Forge (interior)
- Dungeon-pack interior tiles, torches on walls
- Skills displayed as items with tier-based visual treatment:
  - **Legendary** (golden glow/pulse): Python, C
  - **Rare** (subtle glow): TypeScript, JavaScript, React, Node.js, PostgreSQL, FastAPI, SQL, Git
  - **Common** (no glow): HTML/CSS, Express, REST APIs, Racket
- Walk up to an item → tooltip/dialogue with skill name and tier

### Experience Tower (interior — multi-floor)
- Multi-floor layout: walk up stairs or simple room transitions between floors
- Floor 3 (top): OMAM MUN — Executive Director
- Floor 2: Student Council — School President
- Floor 1: Debate & WSC Club — Founder & Coach
- **Interactive paintings**: real photos framed on walls (for entries with photos like OMAM MUN)
  - Walk up to painting + Space → photo displays in a styled frame overlay
- **Plaques**: for entries without photos — engraved-style text panels on the wall
  - Walk up to plaque + Space → DialogueBox with role title, period, and key achievements
- Content displayed in RPG dialogue box style with typewriter effect

### Contact Portal (interior)
- Glowing portal aesthetic with blue/teal energy effect
- Walking into the portal opens an overlay styled as a game menu:
  - "> Email: z7khalil@uwaterloo.ca"
  - "> LinkedIn: linkedin.com/in/zainskhalil"
  - "> GitHub: github.com/dazainer"
- Each link opens in a new tab on selection
- Arrow keys or mouse to navigate between options

### Secret Room (hidden — walk through fake wall in NE overworld)
The secret room contains several interactive objects:

**1. Debug Terminal** (centerpiece)
A functional terminal the visitor can type into. Styled as a retro green-on-black terminal.
Commands and responses:
- `help` → "Available commands: whoami, ls, cat about.txt, cat books.txt, play snake, sudo hire zain, clear"
- `whoami` → "A recruiter with great taste."
- `ls` → Lists skills as if they were files: "python.legendary  c.legendary  typescript.rare  react.rare  node.rare  postgres.rare ..."
- `cat about.txt` → Prints fun facts one by one
- `cat books.txt` → "Books that shaped my thinking: Going Solo, Fahrenheit 451, Purple Hibiscus, The Da Vinci Code"
- `sudo hire zain` → Confetti animation fills the screen + "Access granted. Redirecting to z7khalil@uwaterloo.ca..." + mailto link
- `play snake` → Opens the mini Snake game overlay
- `clear` → Clears the terminal
- Unknown commands → "zsh: command not found: [input]. Try 'help'"

**2. Bookshelf**
Pixel-art bookshelf with 4 visible books. Walk up + Space opens BookshelfPanel showing:
- *Going Solo* by Roald Dahl → "Read this at 11. Taught me that the best stories come from real life, told sideways."
- *Fahrenheit 451* by Ray Bradbury → "Made me realize that curiosity is an act of rebellion."
- *Purple Hibiscus* by Chimamanda Ngozi Adichie → "Changed how I think about quiet strength."
- *The Da Vinci Code* by Dan Brown → "The reason I got hooked on puzzles and hidden patterns."

**3. Snake Game**
A playable mini Snake game (classic rules: eat food, grow, don't hit walls/yourself).
Accessible via the debug terminal (`play snake`) or by interacting with a small arcade cabinet sprite.
Simple canvas-based implementation, keeps a high score during the session.

**4. Bulletin Board**
A board on the wall with rotating notices (changes each visit or on interaction):
- "NOTICE: The developer of this world once organized a fully Arabic MUN conference for 150 delegates"
- "NOTICE: This developer speaks English, Arabic, and French"
- "NOTICE: This developer completed the IB Diploma Programme in Cairo, Egypt"
- "NOTICE: This developer survived Math AA HL and Physics HL simultaneously"
- "NOTICE: This world was built in a weekend using Claude Code"

**5. Jukebox**
A jukebox sprite that, when interacted with, opens a link to Zain's Spotify profile/playlist in a new tab.

### About Me NPC
- Uses the enemy character sprite from the dungeon pack, repurposed as a friendly NPC (or find a suitable character)
- Standing near spawn
- Interaction triggers DialogueBox with typewriter text (multiple pages):
  - Page 1: "Hi! I'm Zain — a CS/BBA student at the University of Waterloo."
  - Page 2: "I build backend systems and applied AI tools."
  - Page 3: "I grew up in Cairo, Egypt — that's why this world looks the way it does."
  - Page 4: "Walk around and explore! Each building has something to show you."
- Press Space to advance pages, last page auto-closes

### Resume Chest
- Uses the animated treasure box sprite from the Desert Dungeon Pack
- Opening animation (the pack includes this animation)
- Triggers browser download of `/resume.pdf`
- Small text appears: "You found Zain's resume!"

## Game Engine Specifications

### Rendering
- HTML5 Canvas at 60fps using requestAnimationFrame
- **Base grid: 32x32 pixels** — terrain tiles render at native 32x32, character/prop sprites from the 16x16 dungeon pack render at 2x (drawImage scaled to 32x32 destination)
- Render at native pixel resolution (e.g., 512x288 for 16:9) then scale up to fill viewport
- `image-rendering: pixelated` (CSS) and `imageSmoothingEnabled = false` (Canvas) for crisp pixels at all scales
- Camera follows player with smooth lerp, snaps to room boundaries
- Room transitions: fade to black (300ms) → load new room → fade in (300ms)

### Player Movement
- Player is the pharaoh character from the Desert Dungeon Pack
- 4-directional movement (up/down/left/right), no diagonal
- Smooth pixel movement (NOT tile-snapping) — fluid, not grid-locked
- Walking speed: ~3 tiles/second (96 pixels/second at 32px grid)
- Walking animation: uses walk frames from the dungeon pack sprite sheet, ~8fps animation speed
- **Escapists-style bobbing**: subtle Y-offset oscillation while walking (sine wave, ±1.5px amplitude, ~4Hz frequency)
- Idle animation: uses idle frames from the dungeon pack, plus slower breathing/bob when standing still (±0.5px, ~1Hz)

### Collision Detection
- Each room has a 2D collision map (same grid dimensions as tile map)
- Check player's target position against collision map before moving
- Tile types:
  - 0 = wall/solid (can't walk through)
  - 1 = walkable
  - 2 = interaction zone (triggers InteractionPrompt when player stands on it)
  - 3 = door/room transition (triggers room change, use door animation from dungeon pack)
  - 4 = fake wall (looks like 0 but acts like 1 — for secret room entrance)
- Interaction zones trigger the InteractionPrompt UI ("Press Space") when player is on them

### Ambient Sprites
- AmbientSprite.ts handles non-player animated entities
- **Camel**: idle + eating animations from desert pack, switches randomly, placed near a building
- **Snake**: idle animation from desert pack, positioned near NE corner as secret room hint
- **Torches**: animated torch sprites from dungeon pack, placed flanking building entrances and on interior walls

### Input
- **Desktop**: Arrow keys or WASD for movement, Space/Enter for interaction, Escape to close panels
- **Mobile**: Virtual d-pad overlay (bottom-left), action button (bottom-right)
- Input state tracked frame-by-frame via polling (not event-driven movement — prevents stuttering)
- When a UI overlay is open (DialogueBox, ProjectPanel, terminal), game input is paused

## UI/UX Requirements

### Dialogue Box (RPG-style)
- Anchored to bottom of screen, spans ~80% width, centered
- Bordered with pixel-art style frame (9-slice scaling from a UI sprite, or CSS border-image)
- Text appears with typewriter effect (~30 characters/second)
- "▼" indicator blinks when text is complete, indicating "press Space to continue"
- Multiple pages supported — Space advances, last page closes the box
- Semi-transparent dark backdrop behind the box

### Project Panel
- Slides up from bottom, covers lower ~60% of screen
- Semi-transparent dark backdrop over the game canvas
- Content layout:
  - Project name (pixel font or bold sans-serif, large)
  - Tagline (smaller, muted)
  - Description paragraph (clean sans-serif, readable)
  - Tech stack as small colored badges in a row
  - Action links styled as game menu items: "> View Code" / "> Live Demo"
- Close with Escape or pressing Space again

### Skip to Portfolio
- Fixed position, top-right corner: "Skip to Portfolio →"
- Always visible over the game canvas, semi-transparent background
- Routes to `/portfolio` — the clean static portfolio page
- Styled to not distract but always accessible

### Mobile
- Virtual d-pad renders on touch devices (detect via `'ontouchstart' in window`)
- D-pad: bottom-left, transparent, 4 directional buttons
- Action button: bottom-right, "A" styled button for Space/Enter
- Touch on interaction zones also triggers interaction
- If screen width < 480px, show a prompt: "This experience is best on desktop. [Try anyway] [View portfolio]"

## Content Data Structures

```typescript
// data/projects.ts
export const projects = [
  {
    id: "specguard",
    name: "SpecGuard",
    tagline: "AI test intelligence platform",
    description: "Built an AI-powered QA tool that ingests product specs and generates schema-validated test suites with functional tests, edge cases, and negative tests using a Python/FastAPI backend and React frontend.",
    tech: ["Python", "FastAPI", "React", "TypeScript", "OpenAI API", "Pydantic"],
    github: "https://github.com/dazainer/specguard",
    demo: null,
    monitorAnimation: "pipeline",
  },
  {
    id: "expense-tracker",
    name: "Personal Expense Tracker V2",
    tagline: "Full-stack expense analytics",
    description: "Rebuilt a CLI expense tracker into a full-stack web app with React/TypeScript frontend, Node.js/Express backend, PostgreSQL database, and interactive Recharts dashboards for spending analysis.",
    tech: ["React", "TypeScript", "Node.js", "PostgreSQL", "Recharts"],
    github: "https://github.com/dazainer/expense-tracker-v2",
    demo: null,
    monitorAnimation: "chart",
  },
  {
    id: "meeting-copilot",
    name: "AI Meeting Copilot",
    tagline: "RAG-powered meeting intelligence",
    description: "Building a meeting intelligence tool using RAG with pgvector, Ollama for local LLM inference, automated action item extraction, evaluation harness, and a metrics dashboard.",
    tech: ["Python", "pgvector", "Ollama", "PostgreSQL", "FastAPI"],
    github: null,
    demo: null,
    monitorAnimation: "waveform",
    underConstruction: true,
  },
];

// data/experience.ts
export const experiences = [
  {
    id: "omam-mun",
    role: "Executive Director",
    organization: "OMAM Model United Nations",
    period: "Aug 2024 – Mar 2025",
    location: "Cairo, Egypt",
    highlights: [
      "Led end-to-end planning of a student-run conference with ~150 delegates",
      "Directed budgeting for a ~20,000 CAD operation",
      "Coordinated 40+ team heads and 100+ members",
    ],
    photo: "/assets/photos/omam-mun.jpg",
    floor: 3,
  },
  {
    id: "student-council",
    role: "School President",
    organization: "Student Council, ISEE",
    period: "Sep 2024 – Aug 2025",
    location: "Cairo, Egypt",
    highlights: [
      "Represented 1,500+ students",
      "Translated stakeholder needs into proposals and improvements",
      "Managed large-scale events and school-wide initiatives",
    ],
    photo: null,
    floor: 2,
  },
  {
    id: "debate-club",
    role: "Founder & Coach",
    organization: "Debate and World Scholar's Cup Club",
    period: "Apr 2024 – Apr 2025",
    location: "Cairo, Egypt",
    highlights: [
      "Founded and scaled club to ~15 active members",
      "Designed structured curriculum and weekly materials",
      "Students won multiple medals at regional competitions",
    ],
    photo: null,
    floor: 1,
  },
];

// data/skills.ts
export const skills = [
  { name: "Python", tier: "legendary", category: "language" },
  { name: "C", tier: "legendary", category: "language" },
  { name: "TypeScript", tier: "rare", category: "language" },
  { name: "JavaScript", tier: "rare", category: "language" },
  { name: "SQL", tier: "rare", category: "language" },
  { name: "React", tier: "rare", category: "frontend" },
  { name: "Node.js", tier: "rare", category: "backend" },
  { name: "PostgreSQL", tier: "rare", category: "backend" },
  { name: "FastAPI", tier: "rare", category: "backend" },
  { name: "Git", tier: "rare", category: "tool" },
  { name: "HTML/CSS", tier: "common", category: "frontend" },
  { name: "Express", tier: "common", category: "backend" },
  { name: "REST APIs", tier: "common", category: "backend" },
  { name: "Racket", tier: "common", category: "language" },
];

// data/personalInfo.ts
export const personalInfo = {
  name: "Zain Khalil",
  bio: [
    "Hi! I'm Zain — a CS/BBA student at the University of Waterloo.",
    "I build backend systems and applied AI tools.",
    "I grew up in Cairo, Egypt — that's why this world looks the way it does.",
    "Walk around and explore! Each building has something to show you.",
  ],
  contact: {
    email: "z7khalil@uwaterloo.ca",
    linkedin: "https://www.linkedin.com/in/zainskhalil",
    github: "https://github.com/dazainer",
  },
  funFacts: [
    "Organized a fully Arabic MUN conference for 150 delegates",
    "Completed the IB Diploma Programme in Cairo",
    "Speaks English, Arabic, and French",
    "Survived Math AA HL and Physics HL simultaneously",
  ],
};

// data/books.ts
export const books = [
  {
    id: "going-solo",
    title: "Going Solo",
    author: "Roald Dahl",
    note: "Read this at 11. Taught me that the best stories come from real life, told sideways.",
    color: "#8B4513",
  },
  {
    id: "fahrenheit-451",
    title: "Fahrenheit 451",
    author: "Ray Bradbury",
    note: "Made me realize that curiosity is an act of rebellion.",
    color: "#CC3300",
  },
  {
    id: "purple-hibiscus",
    title: "Purple Hibiscus",
    author: "Chimamanda Ngozi Adichie",
    note: "Changed how I think about quiet strength.",
    color: "#6B3FA0",
  },
  {
    id: "da-vinci-code",
    title: "The Da Vinci Code",
    author: "Dan Brown",
    note: "The reason I got hooked on puzzles and hidden patterns.",
    color: "#1a3c5e",
  },
];

// data/terminalCommands.ts
export const terminalCommands: Record<string, string | (() => string)> = {
  help: "Available commands: whoami, ls, cat about.txt, cat books.txt, play snake, sudo hire zain, clear",
  whoami: "A recruiter with great taste.",
  ls: "python.legendary  c.legendary  typescript.rare  react.rare  node.rare  postgres.rare  fastapi.rare  sql.rare  git.rare  javascript.rare  html-css.common  express.common  rest-apis.common  racket.common",
  "cat about.txt": () => {
    const facts = [
      "Organized a fully Arabic MUN conference for 150 delegates",
      "Completed the IB Diploma Programme in Cairo, Egypt",
      "Speaks English, Arabic, and French",
      "Survived Math AA HL and Physics HL simultaneously",
    ];
    return facts.join("\n");
  },
  "cat books.txt": "Books that shaped my thinking:\n  Going Solo — Roald Dahl\n  Fahrenheit 451 — Ray Bradbury\n  Purple Hibiscus — Chimamanda Ngozi Adichie\n  The Da Vinci Code — Dan Brown",
  "sudo hire zain": "CONFETTI_TRIGGER Access granted. Redirecting to z7khalil@uwaterloo.ca...",
  clear: "CLEAR_TERMINAL",
  "play snake": "LAUNCH_SNAKE_GAME",
};
// For unknown commands: "zsh: command not found: [input]. Try 'help'"

// data/bulletinNotices.ts
export const bulletinNotices = [
  "NOTICE: The developer of this world once organized a fully Arabic MUN conference for 150 delegates",
  "NOTICE: This developer speaks English, Arabic, and French",
  "NOTICE: This developer completed the IB Diploma Programme in Cairo, Egypt",
  "NOTICE: This developer survived Math AA HL and Physics HL simultaneously",
  "NOTICE: This world was built in a weekend using Claude Code",
];
```

## Visual Style Guide
- **Theme**: Ancient Egypt / desert — warm, sandy, golden
- **Grid size**: 32x32 pixels; 16x16 sprites (characters, props from dungeon pack) rendered at 2x
- **Color palette**: Warm golds, sandy beiges, terracotta reds, with teal/blue accents for portals and interactive elements. Derived from the tileset colors for consistency.
- **UI text**: "Press Start 2P" from Google Fonts for game headers/dialogue speaker names. System sans-serif for body content in panels (readability over style for descriptions).
- **Animations**: Smooth 60fps movement. Pharaoh character bobbing (sine wave). Ambient sprite idle loops (camel, snake, torches). Monitor flicker (CSS). Typewriter text. Treasure box open animation. Door open animation. Fade room transitions.
- **Canvas scaling**: Render at native pixel resolution (e.g., 512x288 for 16:9) then scale up to fill viewport with `image-rendering: pixelated`. This keeps pixels crisp at any screen size.
- **Responsive**: Game canvas fills viewport on desktop. On mobile (< 480px), prompt to view portfolio or try game.

## Asset Credits (include in static portfolio footer)
- Ancient Egypt Tileset by JIK-A-4 (CC0) — https://jik-a-4.itch.io/free-pixel-art-ancient-egypt-tileset
- Desert Tileset 32x32 by Acxa Rmz — https://xsnake133x.itch.io/pixel-desert-32x32
- Desert Dungeon Pack by Wahid Dawod / KloWorks — https://kloworks.itch.io/desert-dungeon-pack

## Build Commands
```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build (output in dist/)
npm run preview  # Preview production build locally
vercel           # Deploy to Vercel
```

## Development Phases
1. **Scaffold**: Vite + React + TS project, directory structure, deploy blank to Vercel
2. **Game engine**: Canvas rendering, game loop at 60fps, player movement + collision
3. **Overworld**: Tile map with Egypt/desert theme, buildings, decorations, camera follow
4. **Sprites**: Pharaoh player animation (walk + idle bob), ambient sprites (camel, snake, torches)
5. **Interiors**: Room transitions (fade + door animation), Projects Lab, Skills Forge, Experience Tower, Contact Portal
6. **Interactions**: Dialogue system, project panels, skill tooltips, painting/plaque overlays
7. **Content**: Fill in all data files, add sprite assets and photos
8. **Secret room**: Hidden entrance, debug terminal, bookshelf, Snake game, bulletin board, jukebox
9. **Static portfolio**: Build the `/portfolio` fallback page (responsive, SEO-friendly)
10. **Polish**: Mobile d-pad, loading screen, meta tags + OG image, performance optimization
11. **Domain**: Connect zainkhalil.ca to Vercel deployment

## Important Notes
- The game is the LANDING EXPERIENCE but the static portfolio is equally important for SEO, accessibility, and mobile users
- Every piece of content is data-driven — edit files in `data/` to update content without touching game code
- Performance target: 60fps on mid-range laptops, initial page load < 3 seconds
- Mobile must work: game with touch controls on tablets, prompt to view static portfolio on phones
- The Egypt/desert theme is personal and meaningful — it's not arbitrary theming, it reflects Zain's heritage
- The player is a pharaoh — this is a deliberate, fun identity choice
- Secret room should be genuinely hidden but discoverable (the animated snake near the NE area is a subtle hint)
- Credit all three sprite sheet artists in the static portfolio footer
- All GitHub links point to https://github.com/dazainer
- LinkedIn: https://www.linkedin.com/in/zainskhalil
