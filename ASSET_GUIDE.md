# Sprite And Asset Guide

This is a companion to `CLAUDE.md` for navigating `/public/assets/` without trial-and-error.

For exact opaque-bounds measurements, also read `SOLID_FOOTPRINTS.md`.
For the current live overworld layout that consumes those measurements, read `OVERWORLD_LAYOUT.md`.

The project has three different asset styles mixed together:

- Uniform atlases that can use `SpriteSheet.buildRow(...)`
- Uniform atlases with unusual frame sizes
- Loose transparent canvases that need manual `Frame[]` rectangles

Use this guide when Claude needs exact sheet dimensions, row order, or a warning that a file is not a real tilemap.

## Current Snapshot

As of 2026-03-24, the repo already has some sprite work in progress:

- `src/game/Player.ts` now uses the correct `Player.png` row order.
- `src/game/GameEngine.ts` is already using:
  - desert terrain/buildings from the desert sheet
  - idle camel + idle snake ambient sprites
  - Egypt landmarks as full-image sprites (`Pyramid.png`, `Pyramid with Door.png`, `Back.png`)
  - `Mummy.png` for the About Me NPC
  - `Treasure_Box.png` upper gold row for the live resume chest, with open/close behavior handled in `GameEngine.ts`
  - `Props+Items.png` and `Vase.png` for interior room set dressing via `src/game/InteriorDeco.ts`
- `src/components/StaticPortfolio.tsx` currently uses `/assets/photos/omam4.JPG` as the sticky portfolio hero photo.
  - The live route now points to the higher-quality hero copy at `/assets/photos/web/omam4-hero.jpg`.
  - The visible crop is tuned in code via `PROFILE_PHOTO_POSITION`, `PROFILE_PHOTO_SHIFT_X`, and `PROFILE_PHOTO_SCALE`.
- `src/components/GameCanvas.tsx` now also uses:
  - `/assets/soundtracks/main.ogg` as the overworld loop
  - `/assets/soundtracks/indoor.ogg` as the interior loop
  - a top-left mute toggle to silence both tracks
  - `public/assets/sfx/` for gameplay/UI SFX, with a separate `SOUNDS ON/OFF` toggle under the music button
- `src/game/GameEngine.ts` now draws interior wayfinding overlays:
  - a fixed floor badge in the Experience Tower
  - `EXIT` signs over interior door/stair tiles used to leave a room or descend toward the overworld
- Mobile loading note:
  - `src/components/GameCanvas.tsx` now overlays the mobile warning on top of the mounted canvas instead of returning early
  - this prevents `useGameEngine` from missing its one-time canvas mount and getting stuck at `0%` load on mobile
- `src/game/maps/overworld.ts` already contains the best existing decode of the desert sheet indices.

The missing piece was a durable asset reference for the mixed-format sheets.

## Global Rules

- Desert pack assets are native `32x32`.
- Dungeon pack assets are mostly `16px` based, but not every file uses `16x16` frames:
  - `Door.png` uses `32x32` frames
  - `Fire.png` uses `16x32` frames
  - `Treasure_Box.png` uses `16x16` frames
  - `Tileset_Dungeon.png` is a loose atlas, not a strict frame sheet
- Egypt pack assets are mostly standalone transparent canvases, not regular tile grids.
- Prefer the smallest dedicated sheet when it exists:
  - use `Door.png` instead of slicing doors out of `Props+Items_All.png`
  - use `Fire.png` instead of slicing torches out of `Props+Items_All.png`
  - use `Treasure_Box.png` instead of slicing chests out of `Props+Items_All.png`
  - use `Pyramid.png` / `Pyramid with Door.png` / `Back.png` before reaching for `Environment.png`
- If a sheet is padded, sparse, or visually loose, define `Frame[]` manually instead of forcing `buildRow(...)`.

## Quick Frame Recipes

```ts
// Player / Mummy
SpriteSheet.buildRow(0, row * 16, 16, 16, 6)

// Idle camel / idle snake
SpriteSheet.buildRow(0, row * 32, 32, 32, 4)

// Camel eating
Array.from({ length: 11 }, (_, i) => ({ sx: i * 32, sy: row * 32, sw: 32, sh: 32 }))

// Door
SpriteSheet.buildRow(0, row * 32, 32, 32, 6)

// Fire
SpriteSheet.buildRow(0, 0, 16, 32, 6)

// Treasure chest
SpriteSheet.buildRow(0, row * 16, 16, 16, 5)
```

## `public/assets/sprites`

### `Player.png`

- Size: `96x128`
- Base frame: `16x16`
- Layout: `6 columns x 8 rows`
- Row order:
  - row 0 = idle down
  - row 1 = idle right
  - row 2 = idle up
  - row 3 = idle left
  - row 4 = walk down
  - row 5 = walk right
  - row 6 = walk up
  - row 7 = walk left
- Current code renders the player at `24x24`, not `32x32`.

### `Mummy.png`

- Size: `96x128`
- Base frame: `16x16`
- Layout: identical to `Player.png`
- Safe assumption: same row order, same frame count, same facing order
- Live overworld welcome NPC uses a cropped idle row:
  - `sx = 1 + i * 16`
  - `sy = 0`
  - `sw = 14`
  - `sh = 16`
  - rendered at `21x24`

## `public/assets/ambient`

### `Idle Camel (2 Directions).png`

- Size: `128x64`
- Base frame: `32x32`
- Layout: `4 columns x 2 rows`
- Direction rows:
  - row 0 = left-facing idle
  - row 1 = right-facing idle

### `Camel Eating (2 Directions).png`

- Size: `360x64`
- Effective frame size: `36x32`
- Practical layout: `10 frames x 2 rows`
- Direction rows:
  - row 0 = left-facing eating loop
  - row 1 = right-facing eating loop
- Frames are ordered chronologically left-to-right within each row.
- Recommendation: use a manual frame array with `10` frames of `36x32`; do not slice it as `32x32`.

### `Idle Snake (2 Directions).png`

- Size: `128x64`
- Base frame: `32x32`
- Layout: `4 columns x 2 rows`
- Direction rows:
  - row 0 = left-facing idle
  - row 1 = right-facing idle

## `public/assets/tiles/desert`

### `DESERT TILESET 32x32.png`

- Size: `624x448`
- Grid: `19 columns x 14 rows`
- Tile size: `32x32`
- This is a real tile atlas and works well with index-based rendering.
- `src/game/maps/overworld.ts` is currently the best decode of this sheet and should be treated as the authoritative mapping for indices already in use.

Useful groups already decoded in `overworld.ts`:

- rows 1-3, cols 1-3: terrain/autotile families
- rows 1-9, cols 4-6: inverse/inner-corner terrain variants
- `idx 24` = flat sand fill tile currently used as the overworld base ground
- row 10, cols 1-2: tiny packed icons; skip for normal `32x32` world rendering
- rows 10-12, cols 3-5: scatter props
- rows 10-11, cols 6-7: tent
- rows 10-12, cols 8-9: palm variant A
- rows 10-12, cols 10-11: palm variant B
- rows 10-12, cols 12-14: temple building
- rows 10-12, cols 15-17: castle/tower building
- rows 10-12, cols 18-19: hut usable area

Observed loose-prop area in the lower part of the atlas:

- multiple dry grass / brush clumps
- barrel
- broken wheel / well element
- several cactus variants
- animal skull / horned skull props
- wooden sign
- tent
- two palm variants
- Egyptian-looking temple facade
- round stone tower / tower-with-columns
- straw hut

### `reference/reference-map.png`

- Not a spritesheet
- Use it as a composition reference for:
  - oasis shape
  - path width
  - cactus spacing
  - prop scale relative to buildings
  - how the desert pack pieces look when assembled in an actual scene

## `public/assets/tiles/dungeon`

### `Door.png`

- Size: `192x64`
- Frame size: `32x32`
- Layout: `6 columns x 2 rows`
- Rows:
  - row 0 = steel / gray door sequence
  - row 1 = gold door sequence
- Left-to-right progression looks like a door open/close sequence

### `Fire.png`

- Size: `96x32`
- Frame size: `16x32`
- Layout: `6 columns x 1 row`
- This is a full candle/torch sprite per frame, not a `16x16` flame-only strip
- Important gotcha: if torch logic assumes `16x16`, it will crop the flame incorrectly

### `Treasure_Box.png`

- Size: `80x32`
- Frame size: `16x16`
- Layout: `5 columns x 2 rows`
- Rows:
  - row 0 = orange/gold chest sequence
  - row 1 = blue chest sequence
- First frame in each row is the fully closed chest

### `Wood_fall.png`

- Size: `80x16`
- Frame size: `16x16`
- Layout: `5 columns x 1 row`
- Appears to be wood plank / wood floor / crate-like variants
- Good candidate for interior clutter or furniture accents

### `Props+Items.png`

- Size: `64x80`
- Grid: `4 columns x 5 rows`
- Cell size: `16x16`
- This is sparse but regular.

Observed contents by row:

- row 0: wooden board/crate tile, barrel, silver key, gold key
- row 1: gold coin/orb, green orb, pink orb, blue orb
- row 2: bronze token, green gem, pink gem, blue gem
- row 3: brown pot variants, with at least one empty/sparse cell
- row 4: two small gray bottle/urn-like props, remaining cells sparse/empty

### `Props+Items_All.png`

- Size: `208x240`
- Grid basis: `16x16`
- This is a mixed master atlas, not a clean gameplay-facing sheet.
- It appears to contain:
  - the same door strip as `Door.png`
  - the same fire strip as `Fire.png`
  - the same chest sequences as `Treasure_Box.png`
  - the same item set as `Props+Items.png`
- Recommendation: avoid building new gameplay logic around this file when the dedicated sub-sheets already exist

### `Tileset_Dungeon.png`

- Size: `416x176`
- Base unit: visually `16px`, but the layout is loose
- Not safe to treat as a simple `cols x rows` animation sheet
- Major groups visible in the atlas:
  - short brick wall section
  - square pillar/pedestal element
  - round column element
  - plain floor tile
  - cracked floor strip
  - pebble/debris details
  - large wall block
  - narrow vertical wall/trim section
  - large square floor/platform block
  - staircase cluster
  - stair tread block
  - dark pit / shadow square
  - small dark inset square
- Recommendation: if Claude uses this file, define named manual rectangles for each structure instead of trying to auto-index everything

### `Desert_Dungeon_Preview.png`

- Not a source sheet
- Use it as a visual reference for:
  - how the dungeon tiles combine
  - pillar spacing
  - stair proportions
  - how torches, keys, coins, jars, and doors look in-scene

## `public/assets/tiles/egypt`

### `Back.png`

- Size: `128x128`
- Single full-canvas sprite
- Visual: sphinx/statue
- Best usage: render the entire image as one sprite, then scale to the desired world size

### `Pillar.png`

- Size: `128x128`
- Single full-canvas sprite
- Visual: obelisk / tall Egyptian pillar
- Best usage: render the entire image as one sprite

### `Pyramid.png`

- Size: `256x256`
- Single full-canvas sprite with transparent padding
- Best usage: render the whole image as a landmark and scale it in world space

### `Pyramid with Door.png`

- Size: `256x256`
- Same structure as `Pyramid.png`, but with an entrance opening
- Best usage: render the whole image as a landmark and treat the visible door separately in collision logic if needed

### `Vase.png`

- Size: `128x128`
- Loose canvas, not a regular tile sheet
- Contains four separate props placed around the canvas:
  - top-left: shallow gold/blue bowl
  - top-right: tall blue/red hanging-style vase
  - bottom-left: decorated handled urn
  - bottom-right: green jar
- Recommendation: crop each vase manually into its own frame if these are needed in-game

### `Environment.png`

- Size: `1280x1280`
- Large loose-layout environment canvas, not a grid atlas
- Major visible components:
  - top-left: broken stone / rubble pieces
  - upper-left-mid: brown carved or statue-like silhouette
  - upper middle: wide horizontal ladder / plank / trim element
  - left-middle: large palm tree
  - lower middle: smaller vertical ladder / trim element
  - right side: very large sand-and-stone platform / cliff / wall block
- Recommendation:
  - do not try to index this like a normal tileset
  - either ignore it for now or hand-crop only the specific pieces Claude actually needs

## `public/assets/photos`

- `public/assets/photos/web/` now contains the optimized deploy-facing JPEG copies used by:
  - `src/components/StaticPortfolio.tsx`
  - `src/game/maps/experienceTower.ts`
  - `src/data/experience.ts`
- When adding new user-facing photos, prefer creating a resized web copy there instead of referencing the original camera export directly.

- These are normal photos for experience content, not spritesheets
- Current groups:
  - `omam1.JPG`, `omam2.HEIC`, `omam3.jpeg`, `omam4.JPG`
  - `speech1.jpeg`, `speech2.jpeg`, `speech3.jpeg`
  - `debate1.jpeg`, `debate2.jpeg`, `debate3.JPG`
- Current repo usage: `src/data/experience.ts` only references `omam1.JPG`
- Important web note: `omam2.HEIC` is not a safe browser asset format; convert it to `jpg`/`jpeg` before using it on the site

## Known Gotchas

- The current repo-level spec says many `16x16` assets should render at `2x`, but the live code already mixes scales:
  - player = `24x24`
  - mummy NPC = `24x24`
  - chest = `32x32`
  - desert props/buildings = native `32x32` or custom scaled blocks
- `Fire.png` is `16x32`, not `16x16`
- `Camel Eating (2 Directions).png` has an extra `8px` gutter and should not be treated as perfectly uniform by total-width division
- `Props+Items_All.png` duplicates cleaner dedicated files
- `Vase.png` and `Environment.png` are loose canvases, not atlas grids

## Recommended Usage Order

When Claude needs an asset, reach for them in this order:

1. Use clean dedicated files first:
   - `Player.png`
   - `Mummy.png`
   - `Idle Camel (2 Directions).png`
   - `Idle Snake (2 Directions).png`
   - `Door.png`
   - `Fire.png`
   - `Treasure_Box.png`
2. Use the desert atlas for world-building and index it through the mapping already started in `src/game/maps/overworld.ts`
3. Use the Egypt standalone landmark files as full-image sprites
4. Only use `Tileset_Dungeon.png`, `Vase.png`, or `Environment.png` when a dedicated asset is not available

That keeps the implementation simple and avoids most of the sprite-sheet pain in this repo.
