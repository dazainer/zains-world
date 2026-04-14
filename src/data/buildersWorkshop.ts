/**
 * buildersWorkshop.ts — Content for the "Builder's Workshop" exhibit inside the Door Pyramid.
 *
 * Five interactive stations explain how the portfolio game itself was made.
 * This file is pure data — no room wiring, no collision grids, no imports
 * from game files. It is integration-ready for pyramidLore.ts.
 *
 * Integration contract
 * ────────────────────
 * Each station's `id` becomes the `payload` field of an InteractionZoneDef.
 * GameCanvas (or whatever routes interactions) can look it up in
 * `workshopStationById[payload]` to get the `pages` array for DialogueBox.
 *
 * Placement hints are expressed as `placement` — wall-relative labels that the
 * integrating developer maps to concrete (col, row) coordinates when editing
 * pyramidLore.ts.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Where on the room's walls this station should be positioned.
 * The integrating developer translates these to (col, row) pairs
 * based on the live collision grid in pyramidLore.ts.
 */
export type WorkshopPlacement =
  | 'back-wall-left'    // north wall, left half  (col ~2-3, row 2)
  | 'back-wall-right'   // north wall, right half (col ~8-9, row 2)
  | 'left-wall'         // west wall              (col 1,    row ~5)
  | 'right-wall'        // east wall              (col 10,   row ~5)
  | 'near-door'         // south area near exit   (col ~5-6, row 8)

export interface WorkshopStation {
  /** Stable id — used as the InteractionZoneDef `payload` for routing. */
  id: string
  /** Human-readable title displayed in-world and in any overlay header. */
  title: string
  /** Very short label for a plaque or sign prop — keep under 8 chars. */
  label: string
  /** Wall-relative placement hint. Translate to (col, row) in pyramidLore.ts. */
  placement: WorkshopPlacement
  /**
   * Dialogue pages, directly consumable by DialogueBox.
   * Each string is one page. "\n" inside a string creates a line break
   * (DialogueBox uses whiteSpace: pre-line).
   */
  pages: string[]
  /**
   * Suggestion for the visual prop to place at this station.
   * Pure hint — not used at runtime, only for the integrating developer.
   */
  propHint: string
}

// ── Stations ─────────────────────────────────────────────────────────────────

const engineStation: WorkshopStation = {
  id:        'workshop-engine',
  title:     'The Engine',
  label:     'ENGINE',
  placement: 'back-wall-left',
  propHint:  'Blueprint-style dark-tile arrangement on the back wall, or a stone tablet with circuit-like etchings',
  pages: [
    'THE ENGINE\n\nNo game framework. No Phaser. No Unity. Just requestAnimationFrame and a hand-written game loop in TypeScript — built entirely from scratch.',
    'Every frame runs the same cycle: read input, move the player, check collisions, update animations, draw everything to the canvas. 60 times per second. Always in that order.',
    'Collision uses axis-aligned rects. Each building on the overworld is a rectangle the player cannot cross. Simple, predictable, and easy to tune — exactly what a hand-built engine needs.',
    'Room transitions fade to black, swap the map data, and fade back in. The camera lerps toward the player each frame. No physics library. No engine abstractions. Just math.',
  ],
}

const stackStation: WorkshopStation = {
  id:        'workshop-stack',
  title:     'The Stack',
  label:     'STACK',
  placement: 'back-wall-right',
  propHint:  'Stack of crate tiles arranged vertically on the back wall — layers represent the tech stack',
  pages: [
    'THE STACK\n\nOne HTML5 Canvas element runs the entire game world. Every dialogue box, project panel, and mini-game floating on top of it? Those are React components.',
    'React + TypeScript + Vite. The game engine has no idea React exists. React has no idea the game loop is running. They share a canvas ref and a handful of callbacks. That is it.',
    'The split is clean: the engine owns the canvas and all game state. React owns overlays and UI. When a dialogue opens, the engine pauses input. When it closes, input resumes.',
    'Deployed to Vercel via GitHub. Push to main — it is live in under a minute. zainkhalil.ca is registered on Porkbun. The whole pipeline costs about $12 a year.',
  ],
}

const assetsStation: WorkshopStation = {
  id:        'workshop-assets',
  title:     'The Assets',
  label:     'ASSETS',
  placement: 'left-wall',
  propHint:  'Painting-frame tile or scroll-like arrangement on the west wall — suggests an art gallery or archive',
  pages: [
    'THE ASSETS\n\nThree pixel-art sprite packs gave this world its visual identity. All free. All properly credited. All excellent work by their creators.',
    'Ancient Egypt Tileset by JIK-A-4\nLicense: CC0 — free for everything, forever.\nCovers: pyramids, sphinx, vases, desert architecture, and the sandy ground you are currently standing on.',
    'Desert Tileset 32x32 by Acxa Rmz\nFree for commercial use.\nCovers: terrain, cacti, palm trees, and dunes — plus the camel and snake ambient sprites roaming the overworld.',
    'Desert Dungeon Pack by KloWorks\nFree for commercial use. No AI art.\nCovers: the pharaoh you are playing as, the torches, the treasure chest, the doors, and every interior wall and floor.',
    'Sound effects by Juhani Junkala (CC0) and dmochas (CC-BY 4.0). The dialogue bleep, the footsteps, the fanfares — all open-licensed. Every sound has a credit.',
  ],
}

const toolsStation: WorkshopStation = {
  id:        'workshop-tools',
  title:     'The Tools',
  label:     'TOOLS',
  placement: 'right-wall',
  propHint:  'Workbench tile arrangement on the east wall, or tool-shaped props from the dungeon pack',
  pages: [
    'THE TOOLS\n\nEvery project leaves fingerprints of how it was built. These are the tools that built this world.',
    'Claude Code — AI pair programming in the terminal. Most of the code you are standing inside was written collaboratively with an AI assistant. The ideas were human. The execution was fast.',
    'VS Code for editing. Git and GitHub for version control and deployment. Vercel for hosting. Porkbun for the zainkhalil.ca domain. Standard setup, actually used.',
    'Total build time: roughly two weeks of evenings and weekends. The Egypt theme is not decorative — Zain grew up in Cairo. Every design decision in this world has a reason.',
  ],
}

const numbersStation: WorkshopStation = {
  id:        'workshop-numbers',
  title:     'The Numbers',
  label:     'STATS',
  placement: 'near-door',
  propHint:  'Stone tablet or engraved sign tile near the exit door — like a dedication plaque',
  pages: [
    'THE NUMBERS\n\nEvery build has its stats. Here are the ones worth putting on a wall.',
    '~35 TypeScript files\n~5,000+ lines of code\n6 rooms (overworld + 5 interiors)\n3 mini-games (Snake, Tic-Tac-Toe, Minesweeper)\n3 leaderboards\n1 guest book',
    '32x24 overworld tile grid — 768 tiles total\n7 collision rects protecting every structure\n16 sound effects\n3 animated ambient sprites\n12+ interactive objects across all rooms',
    'Hours of sleep lost: significant.\nLines debugged past midnight: many.\nFrames rendered at 60fps: billions by now.\nBuilt without a game engine because it seemed like a good idea at the time.\n\nIt was.',
  ],
}

// ── Exports ───────────────────────────────────────────────────────────────────

/**
 * Ordered array of all five workshop stations.
 * Order matches the intended wall layout: back-left, back-right, left, right, door.
 */
export const workshopStations: WorkshopStation[] = [
  engineStation,
  stackStation,
  assetsStation,
  toolsStation,
  numbersStation,
]

/**
 * Lookup map from station id → station.
 * Use this in GameCanvas (or wherever interactions are routed) to find
 * the dialogue pages for a given interaction payload:
 *
 *   const station = workshopStationById[payload]
 *   if (station) openDialogue({ pages: station.pages, ... })
 */
export const workshopStationById: Readonly<Record<string, WorkshopStation>> =
  Object.fromEntries(workshopStations.map(s => [s.id, s]))

/**
 * Convenience: the set of valid workshop payload ids.
 * Use to distinguish workshop interactions from skill interactions in the router:
 *
 *   if (WORKSHOP_IDS.has(payload)) { ... }
 */
export const WORKSHOP_IDS: ReadonlySet<string> = new Set(
  workshopStations.map(s => s.id),
)
