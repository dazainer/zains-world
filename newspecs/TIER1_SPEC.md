# Tier 1 — Mini-Games, Global Leaderboard, and World Polish

## Overview
Add two new mini-games (Tic-Tac-Toe, Minesweeper) to the portfolio game, a global leaderboard, ambient creature interactions, and a day/night cycle to make the world feel alive.

---

## Game 1: Tic-Tac-Toe vs Mummy

### Concept
Player challenges the welcome mummy NPC to tic-tac-toe. The mummy plays as "ankh" symbols (☥), the player plays as "eye of horus" symbols (𓂀) — or just X and O rendered in pixel style. The mummy has 3 difficulty levels and trash-talks in the dialogue box.

### Where it lives
- New interactive station in the secret room (or triggered from the mummy NPC on the overworld)
- If secret room: place it next to the Snake game console
- If overworld mummy: add a dialogue option "Want to play a game?" in the NPC dialogue

### Game spec
- Standard 3×3 tic-tac-toe grid
- Pixel-art styled board with desert/sand colored lines
- Player goes first (always)
- Mummy AI: simple minimax algorithm (unbeatable on hard, random on easy, mix on medium)
- Before each game, mummy says a random taunt via DialogueBox: "You dare challenge me? I've had 3,000 years to practice."
- On win: mummy says something like "Impossible! No mortal has beaten me in millennia!"
- On loss: "As expected. I am eternal."
- On draw: "Hmm. You are... adequate."
- Track wins/losses/draws in the leaderboard system
- Press Escape to close

### Component
- `TicTacToe.tsx` — React overlay component (same pattern as SnakeGame.tsx)
- Renders a canvas or styled div grid
- Manages game state, turn logic, AI moves
- Emits score events to the leaderboard system

### Claude Code prompt
```
Add a Tic-Tac-Toe mini-game to the secret room. Create TicTacToe.tsx as a React overlay component following the same pattern as SnakeGame.tsx.

Game rules:
- 3x3 grid, player is X (or eye of horus symbol), mummy AI is O (or ankh symbol)
- Player goes first
- Mummy AI uses minimax algorithm (unbeatable)
- Pixel art styled: sand-colored grid lines, dark background, Press Start 2P font for text
- Show a random mummy taunt before the game starts from a list of 5-6 taunts
- Show result message: win (extremely rare/impossible vs minimax), loss, or draw with mummy commentary
- Track stats: wins, losses, draws — store in localStorage
- Display stats at the bottom of the game overlay
- Press Escape to close, R to restart
- Add an interaction station in the secret room that triggers this game (next to the Snake console)
- Play appropriate sound effects: confirm.wav on move, victory.wav on win, snake-die.wav on loss
```

---

## Game 2: Desert Minesweeper

### Concept
Classic Minesweeper but desert-themed. Instead of mines, you're avoiding scorpions hidden under sand tiles. Flag tiles with little red flags. Numbers show how many adjacent scorpions. Pixel art styled to match the game.

### Where it lives
- New interactive station in the secret room
- A "suspicious patch of sand" prop on the wall

### Game spec
- Three difficulty levels:
  - Easy: 8×8 grid, 10 scorpions
  - Medium: 12×12 grid, 25 scorpions
  - Hard: 16×16 grid, 50 scorpions
- Left click to reveal, right click to flag
- First click is always safe (generate board after first click)
- Timer starts on first click
- Numbers 1-8 in different colors (classic Minesweeper coloring)
- Revealed safe tiles show lighter sand, unrevealed are darker sand
- Scorpion revealed = game over, show all scorpion positions
- Win by revealing all non-scorpion tiles
- Track: best time per difficulty, games won/lost
- Press Escape to close

### Component
- `Minesweeper.tsx` — React overlay component
- Canvas-based rendering for the grid (div grid would work too but canvas matches the game aesthetic)
- Game state: 2D array of cells (hidden/revealed/flagged, scorpion/number/empty)
- Flood-fill reveal for empty cells (classic Minesweeper behavior)

### Claude Code prompt
```
Add a Minesweeper mini-game to the secret room. Create Minesweeper.tsx as a React overlay component following the same pattern as SnakeGame.tsx.

Desert theme:
- Instead of mines, the player avoids scorpions hidden under sand tiles
- Unrevealed tiles = dark sand color, revealed safe tiles = lighter sand
- Flagged tiles show a small red flag icon
- Scorpions shown as a small scorpion emoji or pixel sprite on game over
- Numbers 1-8 in classic Minesweeper colors (1=blue, 2=green, 3=red, etc.)
- Press Start 2P font for the UI text

Three difficulties selectable at start:
- Easy: 8×8, 10 scorpions
- Medium: 12×12, 25 scorpions  
- Hard: 16×16, 50 scorpions

Game logic:
- Left click to reveal a tile
- Right click to flag/unflag a tile
- First click is always safe — generate scorpion positions after first click, excluding the clicked cell and its neighbors
- Empty cells (0 adjacent scorpions) flood-fill reveal neighbors automatically
- Timer starts on first click, displayed at the top
- Win condition: all non-scorpion tiles revealed
- Loss condition: click a scorpion tile — reveal all scorpions, show "Game Over"
- Track best time per difficulty and win/loss count in localStorage
- Display stats below the grid
- Press Escape to close, R to restart with same difficulty
- Add an interaction station in the secret room (a "suspicious sand patch" prop) that triggers this game
- Sound effects: confirm.wav on reveal, item-pickup.wav on flag, snake-die.wav on scorpion hit, victory.wav on win
```

---

## Global Leaderboard Page

### Concept
A leaderboard accessible from the overworld (maybe a stone tablet prop near spawn, or part of the map overlay) that shows top scores across all mini-games. Uses the persistent storage API for shared data so all visitors can see each other's scores.

### Data structure
Each entry:
```json
{
  "playerName": "Zain",
  "game": "snake" | "minesweeper" | "tictactoe",
  "score": 2450,
  "metadata": "Easy - 00:45" | "3 wins, 0 losses" | null,
  "timestamp": "2026-03-28T18:00:00Z"
}
```

For Snake: score = points
For Minesweeper: score = time in seconds (lower is better), per difficulty
For Tic-Tac-Toe: score = win streak count

### Where it lives
- A stone tablet or monument prop on the overworld near spawn
- Interaction (type 2) opens a React overlay
- Also accessible from inside each mini-game after a game ends ("View Leaderboard" button)

### Component
- `Leaderboard.tsx` — React overlay component
- Tabs or sections for each game
- Shows top 10 per game
- Highlights the current player's entry if present
- "Enter your name" prompt on first visit (store in localStorage)

### Claude Code prompt
```
Add a global leaderboard system for all mini-games (Snake, Tic-Tac-Toe, Minesweeper).

1. Create a LeaderboardManager class (src/game/LeaderboardManager.ts) that:
   - Uses localStorage for the player's own scores
   - Stores entries with: playerName, game, score, metadata, timestamp
   - On first play of any game, prompts for a player name (stored in localStorage, reused)
   - Keeps top 10 scores per game locally

2. Create Leaderboard.tsx as a React overlay component:
   - 3 tabs: Snake, Minesweeper, Tic-Tac-Toe
   - Each tab shows a top-10 table with rank, player name, score, date
   - Snake: ranked by highest score
   - Minesweeper: ranked by fastest time per difficulty (show difficulty as a badge)
   - Tic-Tac-Toe: ranked by longest win streak
   - Highlight the current player's entries in gold/amber
   - Press Start 2P font, dark background, pixel-art table styling
   - Press Escape to close

3. Update SnakeGame.tsx, TicTacToe.tsx, and Minesweeper.tsx:
   - On game end, submit score to LeaderboardManager
   - Show a "View Leaderboard" button after game over
   - If the score is a new personal best, show a "New Record!" message

4. Add a leaderboard interaction point on the overworld:
   - Place a stone tablet prop near the spawn point
   - Type 2 interaction that opens the Leaderboard overlay
   - Label it "Hall of Records" or similar

5. Sound effects: fanfare sound on new high score
```

---

## Ambient Creature Interactions

### Concept
Make the overworld creatures interactive. Clicking/interacting with the camels and snake triggers fun micro-reactions that make the world feel alive.

### Camel spit
- When the player presses Space near a camel (or clicks on it), the camel "spits"
- Visual: 3-5 small tan/brown circle particles shoot out from the camel's head in an arc, gravity-affected, land and disappear after ~0.5s
- Sound: a short "ptooey" sound effect (use one of the shorter impact sounds from the SFX pack, or a neutral blip)
- The camel's sprite could briefly flash or bob to show the reaction
- Cooldown: 3 seconds between spits so players can't spam it
- Each camel is independently interactive

### Snake hiss
- When the player walks within ~2 tiles of the snake near the sphinx, a text bubble appears above the snake: "Ssssss..."
- The bubble fades after 2 seconds
- Only triggers once every 10 seconds (so it's not annoying)
- If the player is very close (adjacent tile), show a slightly different message: "Sssstay back..." or "Thissss way..." (hint toward sphinx entrance)
- No sound needed — the text bubble is enough, though a subtle hiss SFX would be nice if you have one

### Claude Code prompt
```
Add ambient creature interactions to the overworld:

1. CAMEL SPIT:
   - When the player presses Space within 2 tiles of any camel, trigger a spit animation
   - Create a simple particle effect: 4-5 small circles (color #B8956A) that shoot from the camel's head position in a forward arc
   - Particles should have slight random spread, arc upward then fall with gravity, fade out over ~0.5 seconds
   - Play a short sound effect on spit (use sfx_sound_neutral5.wav or similar short blip, rename to camel-spit.wav)
   - Add a 3-second cooldown per camel so it can't be spammed
   - Each of the 3 camels on the map should be independently interactive
   - The camel sprite should do a small "bob" (quick y-offset pulse) when it spits

2. SNAKE HISS:
   - When the player walks within 2 tiles of the snake near the sphinx, show a pixel-art text bubble above the snake
   - Bubble contains "Ssssss..." in small Press Start 2P font
   - Bubble fades in over 0.3s, stays for 2s, fades out over 0.5s
   - Only triggers once every 10 seconds
   - If the player is within 1 tile (adjacent), show "Thissss way..." instead as a hint toward the sphinx entrance
   - Implement as a canvas-drawn speech bubble (small rounded rect with a triangle pointer) rendered in the game loop, not a React overlay
```

---

## Day/Night Cycle

### Concept
The overworld slowly shifts color temperature over real time, creating a sense of time passing. This is purely visual — no gameplay changes. It makes the world feel dynamic even when the player is standing still.

### Design
- Use a semi-transparent overlay on top of the entire game canvas that shifts color
- Cycle through 4 phases over ~10 minutes (configurable):
  - **Dawn** (warm golden): overlay rgba(255, 200, 100, 0.05)
  - **Day** (neutral/bright): no overlay (or very slight warm tint)
  - **Dusk** (warm orange/pink): overlay rgba(255, 120, 50, 0.1)
  - **Night** (cool blue): overlay rgba(30, 30, 80, 0.15)
- Smooth lerp between phases — no sudden jumps
- The cycle is continuous and based on real elapsed time (not game time)
- Interior rooms are not affected — they keep their dungeon lighting
- The overlay renders AFTER everything else (player, buildings, props) but BEFORE UI elements

### Claude Code prompt
```
Add a day/night cycle to the overworld. This is purely visual — a color overlay that shifts over time.

1. Create a DayNightCycle class (src/game/DayNightCycle.ts):
   - Tracks elapsed time since page load
   - Full cycle duration: 10 minutes (600 seconds), configurable
   - 4 phases that smoothly blend:
     - Dawn (0-25%): warm golden tint — rgba(255, 200, 100, 0.05)
     - Day (25-50%): neutral/clear — rgba(0, 0, 0, 0)
     - Dusk (50-75%): warm orange tint — rgba(255, 120, 50, 0.1)
     - Night (75-100%): cool blue tint — rgba(30, 30, 80, 0.15)
   - Smoothly interpolate RGBA values between adjacent phases using sine easing
   - Expose a method getOverlayColor(): string that returns the current rgba value

2. In GameEngine.ts, after rendering everything else in the overworld:
   - Draw a full-canvas rectangle with the current overlay color
   - Only apply in the overworld — skip for interior rooms
   - The overlay should render AFTER the player and buildings but BEFORE any UI overlays (dialogue boxes, panels)

3. The cycle should:
   - Start at a random phase on page load (so not every visit starts at dawn)
   - Continue running even when the player is in an interior (so exiting a building shows time has passed)
   - Be subtle — the tints should be barely noticeable, creating a mood shift rather than obscuring gameplay
```

---

## Build Order

1. Tic-Tac-Toe (smallest, gets the pattern established)
2. Minesweeper (medium, more complex game logic)
3. Global Leaderboard (ties everything together, update Snake too)
4. Ambient Creature Interactions (quick, fun polish)
5. Day/Night Cycle (visual polish, independent of everything else)

/clear between each item to keep context clean. Test each thoroughly before moving on.
