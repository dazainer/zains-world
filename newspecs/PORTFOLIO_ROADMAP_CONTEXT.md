# Portfolio Site — Feature Roadmap Context Summary

Use this to catch up a new Claude chat on the portfolio site feature plans.

## What exists now (zainkhalil.ca)
- Top-down pixel art RPG portfolio site, Ancient Egypt theme
- React + TypeScript + custom HTML5 Canvas engine (no game framework)
- Pixel-based collision system, Y-sorted rendering, debug overlay
- 6 enterable buildings: Projects Lab, Experience Tower, Pyramid Lore (skills), Contact Portal (hut), Secret Room (sphinx), Door Pyramid (lore)
- Overworld with: mummy NPC, treasure chest (resume), camels, snakes, oasis, stone paths, props
- Mini-games: Snake, Tic-Tac-Toe, Minesweeper
- Hall of Records leaderboard is live from the overworld and mini-game result screens
- Leaderboards are backed by Vercel API routes / Postgres, not localStorage-only anymore
- Tic-Tac-Toe and Minesweeper leaderboard rows are per username **per difficulty**
- Snake leaderboard uses a stricter verified-run flow with signed run tokens + replay validation
- Sound system with SFX for interactions, doors, dialogue
- Background music (desert/Egyptian themed)
- Map overlay (M key), welcome animation
- Static portfolio at /portfolio as fallback
- Deployed on Vercel, domain: zainkhalil.ca (Porkbun DNS)
- All documented in CLAUDE.md, OVERWORLD_LAYOUT.md, SOLID_FOOTPRINTS.md in the project repo

## Tier 1 — Status Snapshot (spec in TIER1_SPEC.md)
1. **Tic-Tac-Toe vs Mummy**: implemented
2. **Desert Minesweeper**: implemented
3. **Global Leaderboard / Hall of Records**: implemented
4. **Ambient Creature Interactions**: still planned
5. **Day/Night Cycle**: still planned

## Tier 2 — Next priority (spec in TIER2_SPEC.md)
1. **NPC Dialogue Tree**: Branching mummy conversation with 4 main paths (about Zain, about the place, recruiter path, games path). Modifies DialogueBox.tsx to support player choices with arrow key selection.
2. **Guest Book**: Bulletin board on overworld where visitors leave persistent short messages. Cork-board styled overlay, color-coded notes, rate limited. localStorage for now, upgradable to shared storage later.
3. **"How I Built This" Room**: Exhibit inside the Door Pyramid showing the tech behind the site. 5 interactive stations: The Engine, The Stack, The Assets, The Tools, The Numbers. Each station shows dialogue with details about how the game was built. Called "The Builder's Workshop."

## Tier 3 — Future vision (not specced yet)
1. **RPG Progression / Quest System**: Track achievements like "visited all buildings", "beat mummy at tic-tac-toe", "found secret room", "scored 50+ in Snake". Display as a quest log or achievement panel. Layers ON TOP of Tier 1 + 2.
2. **Dungeon Crawler**: Procedural dungeon below the pyramid with simple combat. Enemy sprites from the dungeon pack. Essentially a second game embedded in the portfolio.
3. **Leaderboard expansion**: richer cross-game views, admin tooling polish, and broader stats beyond the current top-10 boards.
4. **Visitor ghosts**: See other current visitors as translucent pharaoh sprites walking around (requires WebSocket backend).

## Key technical notes
- All mini-games are React overlay components (same pattern as SnakeGame.tsx)
- Local personal stats still live in localStorage, but the shared leaderboard is remote-backed
- `src/lib/leaderboard.ts` owns shared fetch / submit / session identity helpers
- Reserved usernames `zain` and `joyce` are protected; numeric override codes canonicalize to those identities
- The project uses Claude Code (VS Code extension) and occasionally Codex for development
- MacBook Air 8GB RAM — resource-constrained, keep this in mind for any local tooling suggestions
- All game assets are free sprite packs (CC0 or attribution licenses), credited in footer
- Sound effects pack: "512 Sound Effects (8-bit style)" by Juhani Junkala (CC0)
- Dialogue bleeps: dmochas bleeps pack (CC-BY 4.0)
