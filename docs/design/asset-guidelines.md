# MEGA OX — Asset Design Guidelines

**For artists, designers, and AI generation prompts.**

This document covers every cosmetic asset type in the game — what it is, where it appears, the exact technical spec, and what the style should feel like.

---

## Visual Identity

MEGA OX uses a **dark glassmorphism** aesthetic. Think: deep space, frosted glass panels, soft neon glow. It is not aggressive neon/esports. It is not flat/corporate. The reference point is a Telegram tap-to-earn game — clean, premium, slightly moody.

### Colour Palette

| Role | Hex | Use |
|---|---|---|
| Base background | `#060d1f` | Deepest navy — page backgrounds |
| Card background | `#0d1530` | Frosted glass panels |
| Accent (teal) | `#00d4aa` | Primary highlight, wins, owned state |
| Purple | `#7c4dff` | Secondary accent |
| Gold | `#f9a825` | Credits, coins, streaks |
| Amber | `#f6ad55` | Warnings, medium tier |
| Loss red | `#ff6b6b` | Losses, errors |
| Primary text | `#e8eaf0` | Body copy |
| Muted text | `#8892a4` | Labels, subtitles |
| Dim text | `#4a5568` | Placeholders |

### Do / Don't

**Do:**
- Soft glows and bloom on accent colours
- Translucent layers with visible depth
- Clean geometric shapes
- Subtle gradients within the palette

**Don't:**
- Harsh black (`#000000`) backgrounds — use `#060d1f`
- Overly saturated colours outside the palette
- Drop shadows with solid black — use coloured soft shadows
- Busy or cluttered compositions

---

## Asset Types

---

### 1. Avatar

**What it is:** The player's profile picture. Displayed as a circle crop everywhere — main menu, profile page, leaderboard, customise page.

**Where it appears:**
- Profile card header (52×52 px display size)
- Main menu player card (36–56 px)
- Leaderboard rows (~28 px)
- Game opponent display

**Canvas size:** 200×200 px (square — app crops to circle)
**Format:** SVG (preferred) or WebP
**File size:** SVG under 10 KB · WebP under 30 KB
**Transparency:** Required (PNG alpha or SVG) — background must be transparent so the circular glass frame shows through
**Animation:** Not supported

**Style notes:**
- Bold, graphic, icon-like — not photographic faces
- Centred composition — the circle crop is tight
- Should read clearly at 28 px (very small)
- Works well: geometric animals, abstract symbols, glyphs, stylised characters
- Colour should feel at home against the dark `#060d1f` background

**Rarity tiers:**
- Common — single colour or simple palette
- Rare — multi-colour, more intricate, subtle glow

---

### 2. Badge

**What it is:** A small icon displayed next to the player's username. Earned through XP milestones and achievements — **not purchasable in the shop**.

**Where it appears:**
- Beside username in profile card (16×16 px display)
- Beside username in leaderboard rows (14×14 px)
- Customise page item grid (36×36 px)

**Canvas size:** 80×80 px (square)
**Format:** SVG (required — must stay sharp at 14 px)
**File size:** Under 5 KB
**Transparency:** Required
**Animation:** Not supported

**Style notes:**
- Iconic and instantly readable — think achievement medals, crests, symbols
- Common badge tiers use muted metal tones
- Higher tiers use the accent palette (teal, purple, gold)
- Avoid thin strokes — they disappear at small sizes
- Silhouette should be recognisable even without colour (greyscale test)

**Tier colour guidance:**
- Newcomer / common → grey/silver tones
- Player → green/teal tones
- Veteran → bronze/amber
- Champion → blue/cobalt
- Legend → gold/yellow
- Master → purple/violet
- Grand Master → rainbow or prismatic

---

### 3. Banner

**What it is:** A wide decorative strip used as the background of the player's profile card.

**Where it appears:**
- Profile page header (full-width strip, ~60 px tall)
- Customise page preview (300×60 px preview)

**Canvas size:** 1200×240 px (delivered at 4× — app scales down)
**Format:** SVG (gradients/geometric) · WebP (photographic/painterly) · PNG (pixel art)
**File size:** SVG under 15 KB · WebP/PNG under 100 KB
**Transparency:** Not required (fills the full strip)
**Animation:** Not supported

**Style notes:**
- Horizontal composition — very wide, short
- The left ~20% is partially covered by the avatar frame — keep important detail away from the far left
- Gradients, abstract landscapes, geometric patterns, and space/cosmos themes all work well
- Should still be readable with white text overlaid — avoid pure white backgrounds

**Examples of good directions:**
- Deep space with nebula colour washes
- Abstract geometric patterns using the accent palette
- Gradient sweeps (sunset, aurora, deep ocean)
- Minimal texture fields (dark with subtle noise)

---

### 4. Board Skin

**What it is:** A visual skin for the tic-tac-toe game board grid lines and background. Applied to both the macro board (3×3 of micro boards) and the micro boards (3×3 cells).

> **Phase 6 note:** Board skins are inventory items only right now — they are purchased and owned but do not yet change the in-game visuals. Rendering will be wired in a future phase. Design assets now so they are ready.

**Where it appears:**
- The game board grid (the lines dividing the cells)
- The background fill of each micro board panel

**Canvas size:**
- Board panel: 300×300 px square *(provisional — measure the actual rendered board in-game before commissioning final assets)*
- Grid lines are drawn on top — the skin is the panel background fill

**Format:** SVG (preferred) · WebP · PNG
**File size:** SVG under 20 KB · WebP/PNG under 80 KB
**Transparency:** Optional — if transparent, the default board background shows through
**Animation:** Lottie JSON (for animated board skins — see Animated Assets section)

**Style notes:**
- Should not compete with the X and O markers for visual attention — the gameplay must remain readable
- Avoid strong horizontal or vertical lines that could be confused with the grid
- Works well as a subtle texture, gradient, or atmospheric fill
- Test at small sizes — each micro board is ~100 px on a phone screen

---

### 5. Marker Skin (X and O Set)

**What it is:** A replacement for the default X and O symbols drawn on cells. Each skin is a matched set — both the X version and the O version of the same visual style.

> **Phase 6 note:** Inventory only — rendering wired in a future phase.

**Where it appears:**
- Individual cells on the game board (~24–40 px display size)
- Won-board overlays (the large X or O that covers a completed micro board, ~80–100 px)

**Deliverables per skin set:** 5 files
1. `x-cell.svg` — X symbol at cell size
2. `o-cell.svg` — O symbol at cell size
3. `x-won.svg` — X overlay for a completed micro board
4. `o-won.svg` — O overlay for a completed micro board
5. `preview.svg` — Combined shop thumbnail showing X and O side by side (used as `asset_url` in the shop catalogue)

**Canvas size:**
- Cell markers: 80×80 px
- Won-board overlays: 200×200 px
- Shop preview (`preview.svg`): 160×80 px — X on the left half, O on the right half

**Format:** SVG (required — must scale cleanly)
**File size:** Under 5 KB per file
**Transparency:** Required
**Animation:** Lottie JSON supported for the won-board overlay only (victory flash)

**Style notes:**
- The X and O must be clearly distinguishable from each other at a glance
- Each set has a player — the X player and the O player. The two colours in the set should contrast (e.g., teal X + purple O, red X + blue O)
- Cell markers are tiny — keep shapes bold and simple
- Won-board overlays have more room for detail and visual impact

---

### 6. Theme (Game Background)

**What it is:** A background image or animation applied behind the game board. Changes the atmosphere of playing the game without affecting the game UI or grid.

> **Phase 6 note:** Inventory only — rendering wired in a future phase.

**Where it appears:**
- Full screen behind the game board during active play
- Potentially also on the game result screen

**Canvas size:** 1080×1920 px (portrait mobile, 9:16)
**Format:**
- Static: WebP (preferred) · SVG (geometric/gradient) · PNG
- Animated: **Lottie JSON** (see Animated Assets section)
**File size:** WebP/PNG under 300 KB · SVG under 30 KB · Lottie under 100 KB
**Transparency:** Not required
**Animation:** Yes — Lottie is the preferred format for animated themes

**Style notes:**
- The game board sits in the centre — the background should frame it, not fight it
- Avoid busy patterns in the centre of the canvas where the board lives
- Works well: slow particle drift, subtle aurora, deep space parallax (in Lottie), or strong atmospheric stills (WebP)
- The board has a frosted glass treatment — the background should have enough contrast/colour for the glass effect to be visible

---

## Animated Assets

Animated cosmetics use **Lottie** format (`.json` files exported from After Effects or created in tools like LottieFiles, Rive, or Jitter).

**Lottie requirements:**
- Loop behaviour: set to loop for backgrounds, play-once for win effects
- Keep asset references internal (no external image URLs in the JSON — embed everything)
- Target file size: under 100 KB
- Frame rate: 30 fps
- Avoid expressions where possible — they slow rendering on mobile

**Which assets can be animated:**
| Asset | Animated? | Notes |
|---|---|---|
| Avatar | No | |
| Badge | No | |
| Banner | No | |
| Board skin | Yes | Subtle ambient animation only |
| Marker skin (won overlay) | Yes | Victory flash on micro-board win |
| Theme | Yes | The primary use case for animation |

---

## File Naming Convention

```
{type}-{name}-{variant}.{ext}

avatar-neon-teal.svg
banner-void.webp
board-minimal.svg
marker-neon-x-cell.svg
marker-neon-o-won.json
theme-dark-neon.json
theme-ember.webp
```

All lowercase, hyphens only, no spaces.

---

## Supabase Storage Folder Structure

```
cosmetics/
  avatars/
  badges/
  banners/
  skins/
    board/
    markers/
  themes/
    static/
    animated/
```

---

## Rarity Quick Reference

| Rarity | Price range | Visual expectation |
|---|---|---|
| Common | 150–300 cr | Clean, well-executed, single concept |
| Rare | 350–500 cr | More intricate, multi-element, distinct personality |
| Epic | TBD | Highly detailed, unique visual language |
| Legendary | TBD | Animated, or exceptional static design |

---

## AI Generation Prompt Starters

These can be used as a base and adapted per asset:

**Avatar:**
> "A circular icon, dark background `#060d1f`, [subject], bold geometric style, glowing teal `#00d4aa` accent, clean silhouette, no text, game cosmetic icon"

**Banner:**
> "A wide horizontal banner 4:1 ratio, dark space atmosphere, `#060d1f` base, [colour wash / subject], subtle gradient, no text, game profile background"

**Theme (static):**
> "A full-screen mobile game background 9:16, [atmosphere/setting], dark and moody, `#060d1f` dominant, translucent frosted glass panel could overlay the centre, cinematic quality"

**Board skin:**
> "A square game board texture, subtle, dark background, [style], should not compete with X and O symbols drawn on top, game UI panel"
