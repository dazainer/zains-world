# Overworld Solid Footprints

This file records the measured opaque bounds for the current overworld structures and the loose desert props/cacti.

All measurements below come from the PNG alpha channel, not from the full transparent canvas. The code copy of this data lives in `src/game/maps/overworldCalibration.ts`.

The playable map no longer renders the near-spawn calibration yard. For the actual live overworld placements, render sizes, and door widths, read `OVERWORLD_LAYOUT.md` alongside this file.

Use this when Claude needs the actual solid size of an asset instead of the padded source canvas size.

## Structures

| Asset | Source | Measured opaque bbox | Calibration crop | Live overworld render | Live collision / door |
| --- | --- | --- | --- | --- | --- |
| West Pyramid copy | `Pyramid.png` | `138x130` at `+60,+30` inside `256x256` | `69x49` equivalent body crop | `96x68` | inset `90x29` rect, no door |
| Door Pyramid | `Pyramid with Door.png` | `138x130` at `+60,+30` inside `256x256` | `104x82` | `128x101` | inset `122x46` rect, centered `32x32` door |
| Decorative Pyramid | `Pyramid.png` | `138x130` at `+60,+30` inside `256x256` | `69x49` | `96x68` | inset `90x29` rect, no door |
| Temple | desert sheet block `r9-11 c11-13` (`R10-12 C12-14`) | `74x54` at `+11,+7` inside `96x96` block | `99x72` | `99x72` | `99x34`, centered lower `28x20` door |
| Tower | desert sheet block `r9-11 c14-16` (`R10-12 C15-17`) | `74x73` at `+8,+11` inside `96x96` block | `74x97` | `74x97` | inset `68x30`, lowered `6px`, centered `28x30` door |
| Hut | desert sheet block `r9-11 c17-18` (`R10-12 C18-19`) | `59x53` at `+3,+6` inside `64x96` block | `89x53` | `89x53` | `89x24`, centered `28x24` door |
| Sphinx | `Back.png` | `62x108` at `+33,+19` inside `128x128` | `62x108` | `78x136` | `70x120` full-body rect, centered `28x30` door |

Notes:

- Door Pyramid and Decorative Pyramid share the same measured body footprint. The only gameplay difference is the door opening.
- The desert-sheet buildings are much narrower than their full tile blocks imply:
  - Temple: `99px` solid body instead of a `128px` full block
  - Tower: `74px` solid body instead of `96px`
  - Hut: `89px` solid body instead of `96px`
- The live overworld doors were widened slightly from the earlier calibration pass so they remain comfortable for the current player hitbox (`18px` wide, with `6px` trimmed from the top) while staying under one tile wide:
  - Door Pyramid: `32x32`
  - Temple: `28x20`
  - Hut: `28x24`
  - Sphinx: `28x30`
  - Tower: `28x30`
- Live overworld render-order rule: if a structure/prop defines an occlusion base, once the player's collision top is below that base's start line, the player renders in front even if the sprite art still overlaps lower on screen.
- `src/game/maps/overworldCalibration.ts` remains the measurement source, but the actual live placements are now documented in `OVERWORLD_LAYOUT.md`.

## Character Sprites

| Asset | Source | Measured / used crop | Live use |
| --- | --- | --- | --- |
| Welcome Mummy | `Mummy.png` | consistent `14x16` crop at `+1,+0` inside each `16x16` frame | overworld tent-side welcome NPC, row `0` idle loop, rendered at `21x24`, with a centered `40x40` interaction zone |

## Loose Desert Props And Cacti

Rows/cols here are `0-based`, with the older `1-based` atlas coordinates in parentheses.

| Label | Source tile | Measured opaque bbox in `32x32` tile | Cropped render size |
| --- | --- | --- | --- |
| Fern sprig TL | `r9 c0` (`R10 C1`) | `11x6` at `+2,+8` | `11x6` |
| Fern sprig TR | `r9 c0` (`R10 C1`) | `13x12` at `+17,+2` | `13x12` |
| Fern sprig BL | `r9 c0` (`R10 C1`) | `15x15` at `+1,+16` | `15x15` |
| Fern sprig BR | `r9 c0` (`R10 C1`) | `14x14` at `+17,+16` | `14x14` |
| Bone piece top | `r9 c1` (`R10 C2`) | `19x13` at `+8,+1` | `19x13` |
| Bone piece bottom | `r9 c1` (`R10 C2`) | `26x14` at `+1,+17` | `26x14` |
| Hay patch | `r9 c2` (`R10 C3`) | `32x22` at `+0,+4` | `32x22` |
| Broken wheel | `r9 c3` (`R10 C4`) | `24x26` at `+5,+2` | `24x26` |
| Barrel | `r9 c4` (`R10 C5`) | `20x17` at `+6,+7` | `20x17` |
| Tent | source region `r9-10 c5-6` (`R10-11 C6-7`) | `46x37` at `+10,+8` inside `64x64` region | `46x37` |
| Tall cactus A | `r10 c0` (`R11 C1`) | `20x28` at `+6,+2` | `20x28` |
| Prickly pear A | `r10 c1` (`R11 C2`) | `22x26` at `+6,+4` | `22x26` |
| Column cactus | `r10 c2` (`R11 C3`) | `13x29` at `+9,+1` | `13x29` |
| Skull | `r10 c3` (`R11 C4`) | `28x21` at `+1,+5` | `28x21` |
| Wooden sign | `r10 c4` (`R11 C5`) | `22x26` at `+5,+4` | `22x26` |
| Flower cactus | `r11 c0` (`R12 C1`) | `23x23` at `+4,+5` | `23x23` |
| Prickly pear B | `r11 c1` (`R12 C2`) | `26x24` at `+2,+6` | `26x24` |
| Tall cactus B | `r11 c2` (`R12 C3`) | `21x29` at `+6,+1` | `21x29` |
| Horned skull | `r11 c3` (`R12 C4`) | `25x32` at `+3,+0` | `25x32` |

## Where To Look In Code

- `src/game/maps/overworldCalibration.ts`
  - measured crop rectangles
  - prop splits and source-frame analysis
- `src/game/maps/overworld.ts`
  - live reference-map layout
  - current structure sizes, collisions, door zones, and return spawns
- `OVERWORLD_LAYOUT.md`
  - live map composition and door sizing summary
- `src/game/GameEngine.ts`
  - renders the live structures, props, and ambients
  - shows structure labels while the backtick debug overlay is enabled

## Recommended Claude Workflow

If Claude needs to resize or re-crop overworld assets again:

1. Read `SOLID_FOOTPRINTS.md` for the measured opaque bounds.
2. Read `OVERWORLD_LAYOUT.md` for the current live overworld composition and door widths.
3. Read `src/game/maps/overworldCalibration.ts` for the source-frame crops and prop splits.
4. Use the backtick overlay in-game to compare:
   - cyan = rendered structure bounds
   - red = collision rects
   - green = door zones
   - white labels = live structure ids
