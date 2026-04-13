# Tier 2 — NPC Dialogue Tree, Guest Book, and "How I Built This" Room

## Overview
Make the portfolio world feel alive, social, and informative. The mummy NPC gets a real personality with branching conversations, visitors can leave messages on a guest book, and a new "How I Built This" exhibit shows the tech behind the site.

---

## Feature 1: NPC Dialogue Tree

### Concept
The welcome mummy NPC near spawn currently gives a flat bio dump. Replace this with a branching dialogue system where the mummy asks questions, remembers your answers within the session, and directs you to different parts of the world based on your interests. The mummy becomes a guide, not just a sign.

### Dialogue flow

```
Mummy: "Ah, a visitor! Welcome to Zain's World. I've been guarding this place for... well, a very long time."

→ Choice 1: "Who are you?"
   Mummy: "I am the Keeper of these grounds. Zain built this world and left me here to guide travelers. I know every corner of this place."
   → "Tell me about Zain"
      Mummy: [bio from personalInfo.ts]
   → "What should I explore first?"
      → [goes to exploration branch]

→ Choice 2: "What is this place?"
   Mummy: "This is Zain's portfolio — but not the boring kind. Each building holds a piece of his work. The temple to the north has his projects. The tower to the east, his experience."
   → "Where are the projects?"
      Mummy: "Head north to the temple — the Projects Lab. He's built some interesting things in there. My favorite is SpecGuard."
   → "Is there anything hidden here?"
      Mummy: "Hidden? Me? Know about hidden things? ...I have no idea what you're talking about. *nervous shuffling*"
      [Subtle hint toward the sphinx]

→ Choice 3: "I'm a recruiter looking at his work"
   Mummy: "Excellent taste! Let me give you the quick tour:"
   → "Show me his best project"
      Mummy: "Head to the temple up north. SpecGuard is his flagship — AI-powered test generation. Very impressive, if I do say so myself."
   → "What's his tech stack?"
      Mummy: "Python and TypeScript are his strongest. The pyramid to the northwest has a full skill breakdown — go poke around the shelves."
   → "How do I contact him?"
      Mummy: "The hut to the south has a portal — step inside and you'll find all his contact links. Or just email z7khalil@uwaterloo.ca. He responds fast."

→ Choice 4: "Let's play a game!"
   Mummy: "Oh, you're one of THOSE visitors. I like you. Head to the sphinx in the southwest — if you can find the entrance, there's a whole arcade in there. I hear there's even a tic-tac-toe table... *cracks knuckles*"
```

### Technical design
- New data file: `src/data/dialogueTree.ts`
- Structure:
```typescript
interface DialogueNode {
  id: string;
  speaker: 'mummy' | 'player';
  text: string;
  choices?: { label: string; nextId: string }[];
  // if no choices, auto-advance to nextId or end
  nextId?: string;
}
```
- Modify DialogueBox.tsx to support choice selection:
  - When a node has choices, show them as a vertical list below the text
  - Arrow keys to highlight, Space/Enter to select
  - Choices use the same pixel-art styling as the rest of the dialogue

### Claude Code prompt
```
Replace the mummy NPC's flat dialogue with a branching dialogue tree system.

1. Create src/data/dialogueTree.ts with a DialogueNode interface:
   - id: string
   - speaker: 'mummy' | 'player'  
   - text: string (the dialogue line)
   - choices?: { label: string, nextId: string }[] (player choices)
   - nextId?: string (auto-advance if no choices)

2. Write the full mummy dialogue tree with these branches:
   - "Who are you?" → about the mummy → about Zain (bio from personalInfo.ts) → exploration tips
   - "What is this place?" → building descriptions → subtle secret room hint
   - "I'm a recruiter" → best project recommendation → tech stack → contact info
   - "Let's play a game!" → points toward secret room/sphinx
   Each branch should be 3-4 nodes deep with natural, funny mummy personality. The mummy is ancient, slightly dramatic, and protective of Zain's work.

3. Modify DialogueBox.tsx to support choices:
   - When the current node has choices, render them as a vertical list below the dialogue text
   - Arrow keys (up/down) to highlight a choice, Space/Enter to select
   - Selected choice advances to the corresponding nextId
   - Style choices in Press Start 2P font with a ">" cursor indicator on the highlighted option
   - If no choices and no nextId, dialogue ends (close box)

4. Update the mummy NPC interaction to use the dialogue tree instead of the current flat bio text.
   - Start at node id "root"
   - Dialogue box stays open until the tree reaches a terminal node

5. Sound effects: text-tick.wav for typewriter, confirm.wav on choice selection, dialogue-open.wav when conversation starts
```

---

## Feature 2: Guest Book / Bulletin Board

### Concept
A bulletin board on the overworld where visitors can leave short pixel-styled messages. Messages persist across sessions using localStorage. Other visitors can see messages left by previous visitors if shared storage is added later.

### Where it lives
- A bulletin board prop on the overworld, near the spawn crossroads
- Type 2 interaction opens the guest book overlay
- Could also be accessible from the existing bulletin board in the secret room (repurpose it from random notices to actual guest messages)

### Message format
```typescript
interface GuestMessage {
  id: string;
  name: string;           // visitor's chosen name
  message: string;        // max 100 characters
  color: string;          // chosen from preset palette
  timestamp: string;      // ISO date
}
```

### Design
- Overlay shows a cork-board / papyrus styled background
- Messages appear as small "notes" pinned to the board at slightly randomized positions/rotations
- Each note shows the name, message, and a relative timestamp ("2 hours ago", "yesterday")
- Maximum 50 messages displayed (most recent)
- "Leave a message" button at the bottom:
  - Name input (pre-filled if they've left one before, stored in localStorage)
  - Message textarea (100 char limit with counter)
  - Color picker (6-8 preset colors: sand, teal, coral, gold, etc.)
  - "Pin it!" submit button
- Simple content filter: block messages with common slurs/profanity (client-side word list)
- Rate limit: one message per visitor per hour (tracked in localStorage)

### Claude Code prompt
```
Add a guest book feature to the overworld where visitors can leave short messages.

1. Create GuestBook.tsx as a React overlay component:
   - Cork-board / papyrus styled background (warm tan/brown colors)
   - Messages displayed as small "note" cards pinned at slightly random positions and rotations (CSS transform: rotate(-2deg) to rotate(3deg) randomly)
   - Each note shows: visitor name (bold), message text, relative timestamp
   - Maximum 50 notes displayed, most recent first
   - "Leave a message" section at the bottom:
     - Name input (max 20 chars, saved in localStorage for return visits)
     - Message textarea (max 100 chars, show character counter)
     - 6 color swatches to pick note color: #E8D8A0 (sand), #5DCAA5 (teal), #F0997B (coral), #EF9F27 (gold), #AFA9EC (purple), #85B7EB (blue)
     - "Pin it!" button to submit
   - Rate limit: 1 message per hour per visitor (check localStorage timestamp)
   - Basic profanity filter: check message against a blocklist of common slurs before saving
   - Press Start 2P font for names, system font for message body (readability)
   - Escape to close

2. Storage: Use localStorage to store messages as JSON array under key 'guestbook_messages'. Each message: {id, name, message, color, timestamp}.

3. Add a bulletin board prop on the overworld near the spawn crossroads:
   - Type 2 interaction tile
   - Label it "Guest Book" or "Message Board"
   - Triggers the GuestBook overlay on Space

4. Sound effects: panel-open.wav when opening, confirm.wav when pinning a message
```

---

## Feature 3: "How I Built This" Room

### Concept
A dedicated exhibit inside one of the existing buildings that visually shows the technology and tools behind the portfolio site itself. Recruiters and developers love seeing the "making of" — it shows self-awareness and technical depth. This is meta: the game explains how the game was built.

### Where it lives
Best options for which building to use:
- **Door Pyramid** (currently holds lore/about-me content) — repurpose part of it, or add a second floor/section. The pyramid being "ancient" while explaining modern tech is a fun contrast.
- **Dedicated wall/section in the Projects Lab** — a "meta" workstation alongside the three project stations. This keeps it near the other tech content.
- **A new exhibit in the Pyramid Lore room** — since that room has skills, adding a "how this was built" section ties in naturally.

Recommendation: Add it as a new section in the **Door Pyramid** since that room currently just has lore text and is underutilized. Call it the "Architect's Chamber" or "Builder's Workshop".

### Content to display
Organized as interactive stations/plaques on the walls:

**Station 1: "The Engine"**
- Custom HTML5 Canvas game engine — no framework
- 60fps game loop with requestAnimationFrame
- Pixel-based collision system with Y-sorted rendering
- Room transition system with fade effects
- "Every pixel of movement, every collision check, every sprite draw — built from scratch."

**Station 2: "The Stack"**
- React + TypeScript + Vite
- HTML5 Canvas for game rendering
- React overlays for UI (dialogue, panels, games)
- CSS for styling overlays
- Deployed on Vercel
- Visual: show these as a vertical "layer cake" diagram somehow — or just list them as a tech stack with pixel-art icons

**Station 3: "The Assets"**
- Three sprite packs (with credits and links):
  - Ancient Egypt Tileset by JIK-A-4 (CC0)
  - Desert Tileset 32x32 by Acxa Rmz
  - Desert Dungeon Pack by KloWorks
- Sound effects by Juhani Junkala (CC0)
- Dialogue bleeps by dmochas (CC-BY 4.0)
- "Built with free assets and a lot of love."

**Station 4: "The Tools"**
- Claude Code (AI pair programming)
- VS Code
- Git + GitHub
- Vercel for deployment
- Porkbun for domain
- "This entire world was built in ~2 weeks using AI-assisted development."

**Station 5: "The Numbers"** (fun stats)
- Lines of code: [auto-count from codebase]
- Number of tiles on the overworld map
- Number of collision rects
- Number of sound effects
- Number of interactive objects
- Hours spent: "Too many to count, but worth every one."

### Claude Code prompt
```
Add a "How I Built This" exhibit to the Door Pyramid interior. This room should show how the portfolio game was built.

1. Add 5 interactive stations along the walls of the pyramidLore room, each with a visible prop and type 2 interaction zone:

   Station 1 — "The Engine" (back wall, left):
   - Prop: use a darker tile arrangement to suggest a blueprint/schematic
   - Interaction shows DialogueBox with: "Custom HTML5 Canvas engine. No game framework — just requestAnimationFrame and math. 60fps game loop, pixel-based collision, Y-sorted sprite rendering, and room transitions. Every pixel built from scratch."

   Station 2 — "The Stack" (back wall, right):
   - Prop: a stack of crate tiles to visually represent "layers"
   - Interaction shows DialogueBox with: "React + TypeScript + Vite for the app. HTML5 Canvas for game rendering. React overlays for UI — dialogue boxes, project panels, mini-games. Deployed on Vercel."

   Station 3 — "The Assets" (left wall):
   - Prop: a painting frame or scroll-like tile arrangement
   - Interaction shows DialogueBox with multiple pages:
     Page 1: "Three free sprite packs brought this world to life:"
     Page 2: "Ancient Egypt Tileset by JIK-A-4 (CC0) — pyramids, sphinx, vases"
     Page 3: "Desert Tileset 32×32 by Acxa Rmz — terrain, props, animals"
     Page 4: "Desert Dungeon Pack by KloWorks — characters, interiors, torches"
     Page 5: "Sound effects by Juhani Junkala (CC0). Dialogue bleeps by dmochas."

   Station 4 — "The Tools" (right wall):
   - Prop: a workbench or tool-like tile arrangement
   - Interaction shows DialogueBox with: "Built with Claude Code (AI pair programming), VS Code, Git + GitHub, Vercel, and Porkbun. This entire world was built in ~2 weeks using AI-assisted development."

   Station 5 — "The Numbers" (near the door, bottom area):
   - Prop: a stone tablet or sign tile
   - Interaction shows DialogueBox with fun stats: "Lines of TypeScript: ~5000+. Overworld tiles: 768. Collision rects: 7. Sound effects: 16. Mini-games: 3. Rooms: 6. Hours of sleep lost: many."

2. Add a room label that appears when entering: "The Builder's Workshop"
3. Keep the existing lore content if any — the new stations should ADD to the room, not replace everything
4. Use torches for atmosphere, consistent with other interior rooms
```

---

## Build Order

1. NPC Dialogue Tree (changes existing system, do it first to avoid conflicts)
2. Guest Book (standalone feature, clean addition after dialogue is stable)
3. "How I Built This" room (interior decoration, independent of the above)

/clear between each feature.

---

## Optional Enhancement: Connect Dialogue to Games

After all features are built, you can wire the mummy dialogue tree to the mini-games and the "How I Built This" room:

- "Let's play a game!" → choice: "Tic-tac-toe right here?" → launches TicTacToe.tsx directly from the dialogue
- "How was this place built?" → mummy directs to the Door Pyramid: "The pyramid holds the Builder's Workshop. Zain left his blueprints in there."
- Mummy reacts to your leaderboard scores: "I see you scored {score} in Snake. Not bad... for a mortal."
- This requires reading localStorage scores in the dialogue tree — add a dynamic text resolver that replaces `{snake_highscore}` with the actual value at runtime.

This is a small enhancement that makes the world feel connected rather than just a collection of separate features.
