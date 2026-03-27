# Overworld Layout Notes

This file documents the current live overworld layout after the reference-map rebuild.

Primary visual target: `public/assets/reference/reference-map.png`

Primary implementation file: `src/game/maps/overworld.ts`

## Current Map Shape

- Map size: `32x24` tiles (`1024x768`)
- Tile size: `32x32`
- Player spawn: `x=656`, `y=592`
- The playable map no longer renders the near-spawn calibration yard.
- `src/game/maps/overworldCalibration.ts` still exists as the measurement source for cropped frames and asset analysis, but the live map now uses curated placements directly from `src/game/maps/overworld.ts`.

## Live Structure Layout

- Overworld draw rule: for structures/props with a defined collision base, once the player's collision top is below that red-zone start line, the sprite is forced behind the player even if the art still overlaps lower on the screen.

| Structure | World position | Render size | Collision setup | Door opening | Target room |
| --- | --- | --- | --- | --- | --- |
| West Pyramid | `160,124` | `96x68` | inset `90x29` band from cols `5-7`, covering nearly all of row `5` with slight side trims | none | decorative only |
| Door Pyramid | `288,91` | `128x101` | inset `122x46` band from cols `9-12`, reaching up to the full side height before the triangular peak starts | centered `32x32` door opening | `pyramidLore` + skills interactions |
| Decorative Pyramid | `448,124` | `96x68` | inset `90x29` band covering nearly all of row `5` with slight side trims | none | decorative only |
| Projects Temple | `660,120` | `99x72` | `99x34` base rect extended `14px` upward, with the door opening staying at the lower `28x20` portion | centered `28x20` | `projectsLab` |
| Experience Tower | `107,223` | `74x97` | inset `68x30` base rect, lowered `6px` to sit on the visible base | centered `28x30` | `experienceTower_1` |
| Contact Hut | `98,511` | `89x53` | `89x24` base rect | centered `28x24` | `contactPortal` |
| Secret Sphinx | `276,438` | `78x136` | `70x120` full-body rect with only the mouth entrance open | centered `28x30` | `secretRoom` |

Contact Hut note: the hut door now enters the `contactPortal` room at that room's real interior default spawn (`x=160`, `y=272`), not the old `skillsForge` coordinates.

## Terrain Composition

- Map bounds:
  - outer ring now renders as real desert terrain instead of dark void
  - most edges stay sand
  - the northwest corner now has a tiny oasis pocket: a thin L-shaped water strait around a `2x2` grass patch
  - the east edge continues the grass strip to the boundary
  - the south edge includes a small water continuation below the oasis
  - the outermost tile ring is still collision-blocked
  - the old southeast tile-door contact link has been removed
  - the southeast edge is hand-tuned further with explicit desert tile overrides around cols `22-30`, rows `17-22`
  - tiles `(22,20)`, `(23,20)`, and `(24,20)` are manually reopened as walkable
  - lower-right edge tiles `(28,21)`, `(28,22)`, and `(28,23)` are manually reopened as walkable
- Right-side grass strip:
  - main strip: cols `28-29`, rows `11-22`
  - lower bush-out: cols `26-27`, rows `21-22`
- Oasis pond:
  - main body: cols `18-23`, rows `10-16`
  - east bulge: cols `23-24`, rows `13-18`
  - south leg: cols `22-24`, rows `17-20`
- Main pathing:
  - tower front: cols `1-6`, rows `10-11`
  - left vertical connector: cols `1-2`, rows `11-18`
  - lower road: cols `1-20`, rows `18-20`
  - tent spur: cols `19-21`, rows `16-18`
  - temple road: cols `13-27`, rows `6-7`
  - top vertical connector: cols `17-18`, rows `1-6`
  - right vertical road: cols `26-27`, rows `7-18`
  - lower-right road: cols `25-29`, rows `18-20`

## Props And Atmosphere

- Props are now part of the live overworld, not a demo yard.
- Major live props include:
  - a small northwest oasis accent with a palm on the grass patch and a nearby cactus
  - tent near the pond
  - cropped animated welcome mummy beside the tent, using a centered `40x40` pixel interaction zone
  - a small camp dressing pass near the tent with a hay patch and barrel
  - broken wheel by the hut
  - extra fern/shrub clusters on the oasis grass, the small `(12,12)` grass patch, and the lower-right grass patch
  - smaller palms on the grass strip, with the lower palm anchored to the bottom edge of tile `(28,21)`
  - a small cactus cluster on the sand west of the oasis
  - a few extra desert-side accents in open sand pockets near the tower road, the hut shoulder, and the far east ridge
  - the small lower-right flower cactus shifted farther east on the grass edge
  - a sign near the temple road
  - barrel / skull / cactus dressing around the roads and pond
- The pyramid interior now contains the skill interactions that used to live in the hut.
- `src/game/maps/skillsForge.ts` still exists in the repo as legacy room data, but the live overworld no longer links to it.
- Two standalone pillar props now flank the door pyramid area at tile positions `(8,4)` and `(13,4)`.
- Their collision bases are inset and lowered so the red zones sit on the bottom of row `5` instead of floating above it.
- The portal-side pillars were removed from the live map for now.
- Ambient sprites are active again in the overworld:
  - 9 camels
  - 2 snakes

## Debug Helpers

- `` ` `` toggles the debug overlay.
- `§` cycles overworld visibility:
  - normal
  - hide props
  - hide props and structures

## Return Spawns

Interior exits now read from `OVERWORLD_RETURN_SPAWNS` in `src/game/maps/overworld.ts`.

Files that import those return spawns:

- `src/game/maps/projectsLab.ts`
- `src/game/maps/skillsForge.ts`
- `src/game/maps/experienceTower.ts`
- `src/game/maps/contactPortal.ts`
- `src/game/maps/secretRoom.ts`
- `src/game/maps/pyramidLore.ts`

## Claude Resume Points

If Claude needs to continue overworld work, read these in order:

1. `OVERWORLD_LAYOUT.md`
2. `SOLID_FOOTPRINTS.md`
3. `src/game/maps/overworld.ts`
4. `src/game/GameEngine.ts`

Use `SOLID_FOOTPRINTS.md` for raw opaque-bounds measurements.
Use `OVERWORLD_LAYOUT.md` for the actual live map composition and door sizing.
