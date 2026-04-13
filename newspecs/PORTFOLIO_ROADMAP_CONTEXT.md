# Portfolio Site — Feature Roadmap Context Summary

Use this to catch up a new Claude chat on the portfolio site feature plans.

## What exists now (zainkhalil.ca)
- Top-down pixel art RPG portfolio site, Ancient Egypt theme
- React + TypeScript + custom HTML5 Canvas engine (no game framework)
- Pixel-based collision system, Y-sorted rendering, debug overlay
- 6 enterable buildings: Projects Lab, Experience Tower, Pyramid Lore (skills), Contact Portal (hut), Secret Room (sphinx), Door Pyramid (lore)
- Overworld with: mummy NPC, treasure chest (resume), camels, snakes, oasis, stone paths, props
- Mini-games: Snake (in secret room, has leaderboard)
- Sound system with SFX for interactions, doors, dialogue
- Background music (desert/Egyptian themed)
- Map overlay (M key), welcome animation
- Static portfolio at /portfolio as fallback
- Deployed on Vercel, domain: zainkhalil.ca (Porkbun DNS)
- All documented in CLAUDE.md, OVERWORLD_LAYOUT.md, SOLID_FOOTPRINTS.md in the project repo

## Tier 1 — Ready to build (spec in TIER1_SPEC.md)
1. **Tic-Tac-Toe vs Mummy**: minimax AI, mummy trash-talks, pixel art styled, in secret room
2. **Desert Minesweeper**: scorpions instead of mines, 3 difficulties, timer, in secret room
3. **Global Leaderboard**: stone tablet on overworld ("Hall of Records"), top 10 per game, tracks Snake + new games
4. **Ambient Creature Interactions**: clicking camels makes them spit (particle effect + sound + cooldown), snake near sphinx hisses with text bubble when player approaches ("Ssssss..." / "Thissss way..." as sphinx hint)
5. **Day/Night Cycle**: subtle color overlay that shifts over 10 minutes (dawn golden → day neutral → dusk orange → night blue), overworld only, purely visual, starts at random phase

## Tier 2 — Next priority (spec in TIER2_SPEC.md)
1. **NPC Dialogue Tree**: Branching mummy conversation with 4 main paths (about Zain, about the place, recruiter path, games path). Modifies DialogueBox.tsx to support player choices with arrow key selection.
2. **Guest Book**: Bulletin board on overworld where visitors leave persistent short messages. Cork-board styled overlay, color-coded notes, rate limited. localStorage for now, upgradable to shared storage later.
3. **"How I Built This" Room**: Exhibit inside the Door Pyramid showing the tech behind the site. 5 interactive stations: The Engine, The Stack, The Assets, The Tools, The Numbers. Each station shows dialogue with details about how the game was built. Called "The Builder's Workshop."

## Tier 3 — Future vision (not specced yet)
1. **RPG Progression / Quest System**: Track achievements like "visited all buildings", "beat mummy at tic-tac-toe", "found secret room", "scored 50+ in Snake". Display as a quest log or achievement panel. Layers ON TOP of Tier 1 + 2.
2. **Dungeon Crawler**: Procedural dungeon below the pyramid with simple combat. Enemy sprites from the dungeon pack. Essentially a second game embedded in the portfolio.
3. **Global shared leaderboard**: Move from localStorage to a real backend (Vercel KV or small API) so all visitors see each other's scores.
4. **Visitor ghosts**: See other current visitors as translucent pharaoh sprites walking around (requires WebSocket backend).

## Key technical notes
- All mini-games are React overlay components (same pattern as SnakeGame.tsx)
- Scores stored in localStorage, leaderboard reads from localStorage
- The project uses Claude Code (VS Code extension) and occasionally Codex for development
- MacBook Air 8GB RAM — resource-constrained, keep this in mind for any local tooling suggestions
- All game assets are free sprite packs (CC0 or attribution licenses), credited in footer
- Sound effects pack: "512 Sound Effects (8-bit style)" by Juhani Junkala (CC0)
- Dialogue bleeps: dmochas bleeps pack (CC-BY 4.0)
