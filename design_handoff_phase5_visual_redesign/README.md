# Handoff: Mega OX — Phase 5 Visual Redesign

> Implementation handoff for the Phase 5 visual layer over the existing Mega OX codebase.
> Target environment: **React (CRA) + TypeScript + inline CSS** (no CSS framework — codebase convention).

---

## 0. About these files

The files in `design/` are **design references created in HTML/React** — interactive mockups showing the intended look and behaviour of every priority screen.

**Do not copy the HTML/JSX into the app verbatim.** The mockups exist outside the app and use shorthand component names (`Glass`, `PrimaryButton`, `PageBg`, …). Your job is to **recreate these designs inside the existing Mega OX React codebase**, using its established convention of inline CSS objects on each component (see §2 below for examples of the current pattern).

When in doubt about a measurement, colour, or spacing, **open `design/Mega OX — Phase 5 Visuals.html` in a browser** and inspect the rendered output. All values shown in this README come from `design/tokens.jsx`.

---

## 1. Fidelity

**High-fidelity.** Pixel-perfect mockups — final colours, typography, spacing, shadows, hover state direction. Implement to match.

Where the brief or this README leaves a value unspecified (e.g. a specific keyframe duration), make a sensible call consistent with the established system rather than introducing a new token.

---

## 2. Codebase context (read before implementing)

* All styling is **inline `style={{}}`** on JSX elements. There are no CSS files except `src/components/animations.css` which holds keyframes only.
* **Hover and focus states use `onMouseEnter`/`onMouseLeave` handlers** that mutate `e.currentTarget.style.*` directly — see `MultiplayerMenu.tsx` for the existing pattern. **Do not** introduce CSS pseudo-classes or `:hover`.
* The **game canvas is skinnable** — board background, grid, P1 marker, P2 marker, and won-board overlay are `<img>` slots fed at runtime. **Do not design or restyle the board, the markers, or the grid.** See `src/skins/` and `src/components/skins/`.
* The app has **no responsive logic today**. Introduce it as part of this redesign. Breakpoint: **640px** (below = mobile, at/above = desktop).
* Routes already exist for every screen. Do **not** change game logic, routing, data flows, or the Supabase schema.
* Add `Nunito` from Google Fonts in `public/index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  ```
  Then set `fontFamily: 'Nunito, system-ui, sans-serif'` at the root of every page.

### Suggested shared style helper

Even though the project is inline-CSS-only, **create one `src/styles/tokens.ts` file** that exports plain `const` token values (colours, radii, shadows). Components then reference `tokens.accent`, `tokens.glassBorder`, etc. This is consistent with inline CSS (no CSS file, no framework) and saves repeating literals. See §4 for the full token set to put in this file.

---

## 3. Design system overview

**Aesthetic: Dark glassmorphism.** Deep navy base with indigo + teal atmospheric corner glows. Frosted glass cards layered on top. Vivid teal as the single brand accent.

**Mood:** Premium, competitive, fun. Between Duolingo and a ranked mobile card game. **Not** cyberpunk, **not** corporate, **not** retro/pixel.

**Reach for the mocks for the canonical look.** This README captures every value.

---

## 4. Design tokens

Put these in `src/styles/tokens.ts`:

```ts
export const tokens = {
  // Brand
  accent: '#00d4aa',
  accentDark: '#00b894',

  // Backgrounds
  bgBase: '#060d1f',      // page
  bgCard: '#0d1530',      // card before glass effect
  bgSurface: '#1a2340',   // elevated / nested

  // Text
  text: '#ffffff',
  textMuted: '#a0aec0',
  textDim: '#4a5568',

  // Semantic
  win: '#00d4aa',
  loss: '#ff6b6b',
  draw: '#a0aec0',
  xp: '#7c4dff',
  xpDark: '#4a1fa0',
  credits: '#f9a825',
  warn: '#f7931e',

  // Player chrome
  p1: '#00d4aa',
  p2: '#ff6b6b',

  // Glass card
  glassBg: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
  glassBorder: '1px solid rgba(255,255,255,0.10)',
  glassRadius: 16,
  glassBlur: 'blur(12px)',

  // Inner surfaces (inside a glass card)
  innerBg: 'rgba(255,255,255,0.04)',
  innerBorder: '1px solid rgba(255,255,255,0.06)',

  // Radii
  rBtn: 14,
  rInput: 12,
  rPill: 100,

  // Shadows
  ctaShadow:        '0 8px 24px rgba(0,212,170,0.30)',
  ctaShadowHover:   '0 12px 32px rgba(0,212,170,0.45)',
  cardShadow:       '0 8px 25px rgba(0, 0, 0, 0.30)',
};
```

### Atmospheric page background

Every full-page screen (not game screen, see §7) uses this background stack — base colour + two radial glows. Implement as a single component, e.g. `<PageBackground>`:

```ts
// Layer 1 — base
background: '#060d1f',

// Layer 2 — indigo glow top-left (absolute-positioned ::pseudo or sibling div)
background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(26,42,108,0.55), transparent 60%)',

// Layer 3 — teal glow bottom-right
background: 'radial-gradient(ellipse 70% 50% at 100% 100%, rgba(0,212,170,0.18), transparent 65%)',

// (Optional) Layer 4 — soft purple glow right-center for depth
background: 'radial-gradient(ellipse 40% 40% at 110% 40%, rgba(124,77,255,0.10), transparent 60%)',
```

Inline-CSS approach: render three absolutely-positioned `<div>`s inside a `position: relative` parent, each with `pointerEvents: 'none'` and one of the gradients as `background`.

---

## 5. Typography — Nunito

Font family everywhere: `Nunito, system-ui, sans-serif`. Weights loaded: **400, 600, 700, 800, 900**.

| Role        | Size      | Weight | Letter-spacing | Usage                              |
|-------------|-----------|--------|----------------|------------------------------------|
| Display     | 24–32 px  | 900    | 1.5–3 px       | `MEGA OX` wordmark, win headline   |
| Heading 1   | 20–22 px  | 800    | 0              | Page titles                        |
| Heading 2   | 16–18 px  | 700    | 0              | Card titles, modal headers         |
| Body        | 14–15 px  | 600    | 0              | Default UI text, menu items        |
| Caption     | 11–13 px  | 600    | 0              | Labels, timestamps                 |
| Micro       | 10–11 px  | 700    | 0.4 px         | Pill text, stat chips              |

**Letter-spacing rules:** apply 1.5–3 px tracking only to display copy (logo, level-up headline, "SEASON 04" eyebrows). Body text gets 0. Micro caps text (uppercase labels) gets 0.4–1.5 px depending on size.

**Never** use a different font family (no Inter/Roboto fallback styling). Always set `fontFamily: 'inherit'` on `<button>` elements so they pick up Nunito.

---

## 6. Component patterns

Each component below has exact spec. Reference `design/screens-p1.jsx` (or `screens-p2.jsx`) for working examples.

### 6.1 Glass card

```ts
const glassCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 16,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  padding: 20,   // override per usage: 14–28
};
```

Use for: menu sections, profile panels, match history rows, leaderboard entries, settings groups, post-game modal.

### 6.2 Primary button (single per screen)

```ts
const primaryBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #00d4aa, #00b894)',
  border: 'none',
  borderRadius: 14,
  padding: '14px 20px',           // 'lg' = 16×22, 'sm' = 10×16
  fontFamily: 'inherit',
  fontWeight: 800,
  fontSize: 15,                   // lg=17, sm=13
  color: '#051018',               // dark text on light button
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(0,212,170,0.30)',
  letterSpacing: 0.2,
};

// Hover (via onMouseEnter)
{
  transform: 'translateY(-1px)',
  boxShadow: '0 12px 32px rgba(0,212,170,0.45)',
}
```

**One primary per screen** — `Play Now`, `Confirm`, `Claim`, `Join Game`, `Continue`.

### 6.3 Secondary button

```ts
{
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 14,
  padding: '12px 18px',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: 14,
  color: '#a0aec0',
  cursor: 'pointer',
}

// Hover
{ borderColor: 'rgba(255,255,255,0.30)', color: '#ffffff' }
```

For Cancel, Back, Rules — anywhere a CTA but not THE CTA.

### 6.4 Pill / chip

```ts
// shared
{ borderRadius: 100, padding: '5px 12px', fontWeight: 700, fontSize: 11, letterSpacing: 0.3 }

// variants
teal:   { background: 'rgba(0,212,170,0.15)',   border: '1px solid rgba(0,212,170,0.35)',   color: '#00d4aa' }
purple: { background: 'rgba(124,77,255,0.18)',  border: '1px solid rgba(124,77,255,0.40)',  color: '#b39dff' }
gold:   { background: 'rgba(249,168,37,0.15)',  border: '1px solid rgba(249,168,37,0.40)',  color: '#f9a825' }
red:    { background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.35)', color: '#ff6b6b' }
muted:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#a0aec0' }
```

### 6.5 Level badge (purple gradient circle with level number)

Replaces the existing `LevelBadge` component (`src/components/progression/LevelBadge.tsx`). Three sizes: `sm` (26 px), `md` (34 px), `lg` (44 px).

```ts
{
  width: size, height: size, borderRadius: '50%',
  background: 'linear-gradient(135deg, #7c4dff, #4a1fa0)',
  color: '#fff',
  fontWeight: 900,
  fontSize: size === 'lg' ? 16 : size === 'sm' ? 11 : 13,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: '1.5px solid rgba(255,255,255,0.15)',
  boxShadow: '0 4px 14px rgba(124,77,255,0.4)',
}
```

### 6.6 XP progress bar

Replaces `src/components/progression/XPProgressBar.tsx`.

```ts
// track
{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 100, overflow: 'hidden' }

// fill (width = pct * 100%)
{
  height: '100%',
  background: 'linear-gradient(90deg, #00d4aa, #7c4dff)',
  borderRadius: 100,
  boxShadow: '0 0 8px rgba(0,212,170,0.45)',
}
```

Animate width change with `transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)'`.

### 6.7 Input field

```ts
// default
{
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  padding: '12px 14px',
  color: '#fff',
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: 14,
}

// focus (onFocus / onBlur)
{
  background: 'rgba(0,212,170,0.06)',
  border: '1px solid #00d4aa',
  boxShadow: '0 0 0 3px rgba(0,212,170,0.15)',
}

// error
{ border: '1px solid #ff6b6b', boxShadow: '0 0 0 3px rgba(255,107,107,0.15)' }
```

### 6.8 Tab bar (mobile only)

Bottom-fixed, four tabs. **Hidden on game screens and auth screens.** Implement as a layout component wrapping the routes.

```ts
{
  position: 'fixed',
  left: 0, right: 0, bottom: 0,
  height: 78,                              // 68 content + 10 safe-area top, plus iOS bottom inset
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  background: 'rgba(13,21,48,0.85)',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(16px)',
  paddingTop: 10,
  paddingBottom: 'env(safe-area-inset-bottom, 16px)',
}

// each tab
{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }
// icon: 22px
// label: fontSize 10, fontWeight 700, letterSpacing 0.3
// active color: #00d4aa
// inactive color: #a0aec0
```

Tabs: **Home** → `/menu` · **Play** → `/multiplayer` · **Profile** → `/profile/<username>` · **Settings** → `/settings`.

### 6.9 Avatar + level cluster

```ts
// avatar (size = 32 | 40 | 48 | 56 | 68 | 80 | 110)
{
  width: size, height: size, borderRadius: '50%',
  background: `linear-gradient(135deg, ${color}, #7c4dff)`,   // color = accent for self, p2 for opponent
  border: '2px solid rgba(255,255,255,0.15)',                 // active state: `2.5px solid ${color}` (i.e. teal ring)
  boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
}
```

When showing alongside a level badge, position the badge `absolute` at `bottom: -4, right: -4` of the avatar's parent (give parent `position: relative`).

### 6.10 Coin / Flame / Gem icons (allowed simple SVG)

All three are simple shapes — see `tokens.jsx` for inline SVG source. Copy these verbatim into a `src/components/icons/` folder.

Avatar/badge/banner images come from the existing `cosmetic_items` table — do **not** invent new ones.

---

## 7. Screen-by-screen spec

For each screen below: **route**, **purpose**, **structure**, **components**, **states**, and **mocks**. All mocks live in `design/Mega OX — Phase 5 Visuals.html`.

### 7.1 Main Menu — `/menu` · `src/components/MainMenu.tsx`

Hub for logged-in users. Has both mobile and desktop layouts.

**Mobile layout (≤640 px)** — vertical stack:
1. **Top bar** — `MEGA OX` wordmark left (gradient text fill `#fff → #00d4aa`, `fontSize 22, fontWeight 900, letterSpacing 2`), credits chip right.
2. **Player card** (glass) — avatar 56px + level badge (sm) overlapping bottom-right, username `fontSize 17, fontWeight 800`, tier eyebrow `fontSize 11, color #00d4aa, fontWeight 700, letterSpacing 0.4`, XP bar with `LVL 24 · 620 / 1000 XP` caption underneath.
3. **Hero CTA card** (glass with teal/purple gradient overlay) — `QUICK PLAY` eyebrow, `Ranked Multiplayer` title (`fontSize 19, fontWeight 900`), full-width primary `▶  Play Now` button. Add a corner radial-glow div (140 px circle, top-right, 25% opacity) for atmosphere.
4. **Mode tile 2-column grid** — Training (orange tint), Local 2-player (blue tint), How to Play (muted), Season (purple tint). Each tile = `padding 14, borderRadius 14`, tinted background `rgba(<color>,0.18)`, 1 px tinted border, emoji + 2-line label.
5. **Recent games** glass card — 5 rows. Each row: `W/L/D` square chip (28×28 px, tinted bg matching result colour), `vs <opponent>` (fontWeight 700, fontSize 13), mode caption (fontSize 10, uppercase, muted), `+24 XP` delta on the right (`color: result === 'W' ? #00d4aa : #ff6b6b`).
6. **News slideshow** — glass card with 110 px header image area + dot indicators below.
7. **Tab bar** — bottom-fixed (§6.8).

**Desktop layout (>640 px)** — `maxWidth 1100, margin '0 auto', padding '24px 60px'`. Two-column grid (`1.4fr / 1fr`), no tab bar — top header instead:
- **Header:** wordmark left, horizontal nav center (`Home · Play · Leaderboard · Achievements · Season`, fontSize 14 fontWeight 700, active = white, rest = muted), credit chip + player cluster right.
- **Left column:** Hero CTA card (200 px tall, two avatars `K vs ?` on the right showing matchmaking flavor) + 3-column mode-tile row + News slideshow (160 px image).
- **Right column:** Player card (XP + win/loss/draw stat trio) + Last 5 games glass card.

**Login streak modal** — overlays the Main Menu on login (`useLoginStreak` returns reward). Backdrop: `rgba(6,13,31,0.75)` + `backdropFilter: blur(4px)`. Modal is a glass card (28 px padding, full width minus 24 px gutter on mobile). Contents:
- Top radial gold glow (180 px, behind content)
- Flame icon (64 px)
- `DAILY LOGIN` eyebrow (gold, 11px/700/letterSpacing 1.5)
- `Day 3 Streak` headline (26px/900)
- 7-day strip: 7 cells in a grid, completed days `rgba(249,168,37,0.18)` with checkmark, today is the gold gradient card with white text and reward amount, future days are muted.
- Reward chip — `<CoinChip>` with reward amount (big variant: 14px font, 8×14 padding)
- Primary button `Claim Reward` (full width)

### 7.2 Multiplayer Menu — `/multiplayer` · `src/components/MultiplayerMenu.tsx`

**Mobile, ≤640 px:**
- Back button (chevron only) + `Multiplayer` H1.
- **Quick match hero card** — glass with teal/purple gradient overlay, `QUICK MATCH` eyebrow, `Find an opponent` title, `~20s` teal pill, primary `▶  Find Match` button.
- **Friendly games section** — 3 cards stacked: `🌐 Host a game · Get a 6-letter code to share` (blue tint), `🔍 Join with code · Enter your friend's code` (purple tint), `👥 Local 2-player · Pass and play on this device` (orange tint). Each = padding 16, 14 px radius, emoji avatar 44×44 left, title+sub center, `›` chevron right.
- **Online now** — small glass strip with pulsing teal dot + player count.
- Tab bar active = `Play`.

**Desktop:** scale the same layout to `maxWidth 600, margin '40px auto'`. Tab bar replaced by top nav.

Each card is a `<button>` (or `<div role="button">`) — apply hover state: `transform: translateY(-2px), border colour bumps by 0.15 alpha`.

### 7.3 Matchmaking — `/matchmaking?mode=...` · `src/components/game/MatchmakingPage.tsx`

Three views from the existing component: `searching`, `create` (host code), `join`. Each gets its own visual.

**Searching view:**
- Header (chevron + `Searching…` H1).
- 220 px concentric pulse rings (3 nested circles, decreasing scale + opacity 0.18 → 0.42, animated via keyframes — pulse outward over 2.4s, infinite, staggered 0.4s).
- Inner 88 px solid teal circle with the search-glass icon, `boxShadow: 0 0 60px #00d4aa`.
- `Finding opponent` (22px/900) + sub-copy.
- VS card (glass): your avatar+name+tier left, `VS` center, dashed-border placeholder circle + "Searching · · ·" right.
- `ELAPSED · 00:18` micro caption.
- Secondary `Cancel` button (full width).

**Create (host code) view:**
- Header (chevron + `Friendly game`).
- Big glass card with `SHARE THIS CODE` eyebrow, then the 6 letters of the game code rendered as **individual cells**: each 38×50 px, radius 10, `background: rgba(0,212,170,0.10)`, border `1px solid rgba(0,212,170,0.30)`, font 26px/900 teal monospace.
- Secondary `📋 Copy code` button below.
- Status row: pulsing teal dot + `Waiting for opponent` + `Game starts automatically when they join` sub.
- Share-via glass row: 4 small option chips (`Link · iMessage · WhatsApp · More`).
- Full-width secondary `Cancel` button.

**Join view:**
- Header (chevron + `Join a game`).
- `ENTER CODE` eyebrow, `Got a code from a friend?` title.
- 6 input cells (42×56 px each, radius 12), filled cells show the entered letter, the next empty cell is the active one (teal border + 3 px ring glow + blinking cursor).
- Primary `Join Game` button (full width).
- Secondary `Paste from clipboard` button.

**Behavior to preserve from current code:**
- Realtime channel subscription on game `id` — when status flips to `rps` or `active`, navigate.
- Error toast at top (red text, 16 px below header).
- `joinCode` is uppercased on submit.

### 7.4 Profile — `/profile/:username` · `src/components/profile/ProfilePage.tsx`

**Mobile (own profile):**
- Header: chevron + `Profile` + `Customise` secondary button (only when `isOwnProfile`).
- **Banner card** (glass, padding 0, overflow hidden):
  - 110 px banner image area (`<img>` slot, `objectFit: cover`). Default gradient when no banner: `linear-gradient(135deg, rgba(124,77,255,0.45), rgba(0,212,170,0.25))`.
  - Avatar cluster overlapping bottom-left of banner by 36 px (negative `marginTop`): 80 px avatar inside a 4 px `#060d1f` "punched-out" ring + LVL badge (md) at bottom-right.
  - Right of avatar: `username` (19px/900), optional verified pill, tier+rank eyebrow (`color #00d4aa, 11px/700/letterSpacing 0.4`).
- **XP card** (own profile only): "Level progress" label, XP bar, `LVL 24 · 620 / 1000 XP` caption.
- **3-stat grid:** Wins (teal), Losses (red), Draws (muted). Each = glass card, 26 px/900 number, 10 px uppercase label.
- **2-card row:** Win rate (% in teal) + Best streak (flame icon + count in gold).
- **Achievements summary glass card:** header `Achievements · 12 / 48 ›`, horizontal scroll row of 5 badge tiles (48×48 px). Locked tiles show `🔒` at 40% opacity.
- **Recent games** glass card — same row pattern as Main Menu, 3–5 rows.
- Tab bar active = `Profile`.

**Desktop:**
- Header with `Share` secondary + `Customise` primary.
- Full-width banner card (160 px banner area, avatar 110 px inset by 52 px).
- Tier/joined/games-played pills in a row to the right of name.
- Two-column body (1fr / 1.4fr):
  - **Left:** XP card (10 px tall bar), 3-stat grid, Performance card (`Win rate`, `Best streak`, `Avg. match`, `Favourite mode` rows).
  - **Right:** Achievements 8-column grid (24 cells visible, 12 unlocked) + Recent games card.

**Behavior to preserve:**
- Visiting someone else's profile hides `Customise` button, XP card, and achievement-link rows; everything else (banner, avatar, tier, win/loss/draw, recent games) still renders.
- `leaderboardPos` shown as `Rank #142` under the tier when present.

### 7.5 Game screen chrome — `src/components/GameWrapper.tsx` & `src/components/game/OnlineGameView.tsx`

**Critical — do not redesign the board itself.** The 3×3 macro board is a skin-driven `<img>` canvas at `min(100vw, 480px)` square. Chrome only.

**Mobile chrome stack (top to bottom):**
1. **Header strip** (14 px top padding, 16 px sides): chevron exit button, then `RANKED`/`FRIENDLY`/`TRAINING` pill (red/teal/orange), spacer, `⋯` overflow secondary button.
2. **VS player strip** (12 px below header): two flex children, each padded 8×10, radius 14:
   - **Active player** (whoever has turn): teal-glow card — `background: linear-gradient(135deg, rgba(0,212,170,0.20), rgba(0,212,170,0.05))`, `border: 1px solid #00d4aa`, `boxShadow: 0 0 20px rgba(0,212,170,0.3)`. Avatar 36 px, name 13px/800, status `🟩 YOUR TURN` (10px/700/teal/letterSpacing 0.3) — the square is a 8×8 px teal block.
   - **Inactive player**: `background: rgba(255,255,255,0.03)`, `border: 1px solid rgba(255,255,255,0.08)`. Avatar 36 px, name, level+tier caption.
   - Between them: micro **score chip** — `padding 4×8, radius 10, background: rgba(255,255,255,0.06), font 13/900 monospace`, score formatted as `<teal>2</teal> : <red>1</red>`.
3. **Turn pill** (centered): `padding 6×14, radius 100, background: rgba(0,212,170,0.15), border 1px solid rgba(0,212,170,0.35), color #00d4aa, fontSize 11/800/letterSpacing 0.4`. Dynamic content example: `▪ PLAY IN CENTER BOARD · 00:18`. When it's the opponent's turn: red variant, copy `Opponent thinking · 00:08`.
4. **Board canvas** — full-width minus 14 px padding each side. Skin renders here. Do not style.
5. **Emoji panel** (online only) — 6 cells, each 38×38 px, radius 12, `background: rgba(255,255,255,0.06), border: 1px solid rgba(255,255,255,0.08)`. Sends emoji bubbles.

**Emoji bubbles** appear absolute-positioned above each player's avatar (the panel send goes outbound from your avatar; incoming bubbles appear next to opponent's avatar). Tail points back at sender — `borderBottomRightRadius 4` if right side, `borderBottomLeftRadius 4` if left. Background tinted in sender's player colour (`rgba(0,212,170,0.18)` for P1, `rgba(255,107,107,0.18)` for P2). Auto-fade after 3s (`opacity 0` over 0.4s).

**Desktop layout (>640 px):** Three columns (`1fr / 580 / 1fr`). Each side column is a **PlayerPanel** glass card with the active player getting a glowing border. Includes:
- Avatar 68 px with level badge bottom-right
- Name + `(You)` suffix if self
- Tier + level caption
- Big micro-board score: `MICRO BOARDS WON` micro caption, then a 36px/900 number in the player's colour
- For the self panel only: 3×2 emoji quick-chat grid

Center column: turn pill + 520 px board canvas + a micro caption underneath noting the canvas-slot contract.

**Win modal** (existing in code as the "winner banner") → replace with a **WinModal** styled like the Post-Game modal (see §7.6) but with a "REMATCH" CTA prepended to "Back to menu".

### 7.6 Post-game modal — `src/components/progression/PostGameModal.tsx`

Full-screen overlay. Backdrop: `rgba(6,13,31,0.85) + blur(6px)`.

Glass card, padding 0, overflow hidden, max-width 440 (desktop) / `calc(100% - 40px)` (mobile).

**Sections inside the card (top to bottom):**
1. **Banner header** — `padding '28px 22px'`, `background: linear-gradient(135deg, rgba(0,212,170,0.25), rgba(124,77,255,0.20))`. Add a radial glow div (200 px, centered top, teal). Content:
   - `VICTORY` / `DEFEAT` / `DRAW` eyebrow in result colour (11px/700/letterSpacing 1.5).
   - Headline (30px/900): `You Win!` / `AI Wins! 🤖` / `Draw`.
   - Sub: `vs <opponent> · <match_type>`.
2. **Card body** — `padding 20`:
   - **Level-up callout** (only if `leveledUp`): purple-tinted strip, lg level badge left, `LEVEL UP` eyebrow + `LVL 24 → 25` headline, sparkle icon right.
   - **XP bar** — full width, 10 px tall + caption `LVL 25 · 180 / 1100 XP`. Animate fill from old → new value over 0.8 s.
   - **Reward chips** — 2-column grid:
     - XP chip: purple tint, `+184 XP` purple gradient text.
     - Credits chip: gold tint, coin icon + `+60` credits.
   - **Achievements unlocked** — only if `newAchievements.length > 0`. Each row: 44×44 trophy tile, name (13/800), description (11 muted), reward (`+50 XP` teal). 12 px gap between rows.
   - **Buttons row:** Secondary `Rematch` (only if online) + Primary `Continue`, 50/50 split.

**When `alreadyProcessed`:** show a smaller "Game Complete" header without rewards (the existing graceful fallback).

### 7.7 Leaderboard — `/leaderboard` · `src/components/leaderboard/LeaderboardPage.tsx`

**Mobile:**
- Header: chevron + `Leaderboard` + `SEASON 04` purple pill.
- **Segmented switcher** (Global / Friends / Season) — 1 row, 3 equal cells, padding 4 inside `rgba(255,255,255,0.04)` container. Active cell: `rgba(0,212,170,0.18) + color #00d4aa, fontWeight 800`.
- **Podium row** — top 3 players, ranks 2/1/3 with rank 1 in the center and slightly taller. Avatar (44/56/44 px), rank badge overlay (22 px circle, gold/silver/bronze), name, score, then a 48–80 px tall "stand" rectangle below each (gradient from `colorAA` to `color11`, rounded top corners, no bottom).
- **Rank list** glass card — rows 4 through N. Each row: `#142` rank cell (30 px wide, mono font), 32 px avatar, name + tier eyebrow, score right. **The current user's row** is highlighted: `background: rgba(0,212,170,0.10), border: 1px solid rgba(0,212,170,0.25)`, and shows `(YOU)` after the name in 10px/800 teal.
- Tab bar active = `Home`.

**Tier colour mapping** (use these consistently with the existing `tierColour` object — `src/components/profile/ProfilePage.tsx`):
- Grand Master = `#f9a825`
- Master = `#c0c0c0`
- Expert = `#cd7f32`
- Strategist = `#00d4aa`
- Tactician = `#4299e1`
- Challenger = `#a0aec0`
- Novice = `#4a5568`

### 7.8 Achievements — `/achievements` · `src/components/achievements/AchievementsPage.tsx`

**Mobile:**
- Header: chevron + `Achievements` + `12 / 48` teal pill.
- Total progress glass card with XP bar (25% filled) + `Total progress` label + percentage on right.
- Horizontal pill scroll for categories: `All / Wins / Streaks / Skill / Social`. Active is teal pill, others muted.
- **Achievement rows** — one glass card per achievement, padding 14:
  - 48×48 icon tile left — unlocked: `linear-gradient(135deg, #00d4aa33, #7c4dff22)` + teal border. Locked: `rgba(255,255,255,0.04)` + lock emoji at 40% opacity.
  - Name (13/800) + sub (11 muted).
  - For in-progress: small progress bar + `42 / 50` + reward (`+100 XP` gold).
  - For unlocked: `UNLOCKED` teal pill (9px, 3×8 padding) on the right + `Reward claimed: +50 XP` teal caption.
  - For locked: `Reward: LEGENDARY SKIN` muted caption.

### 7.9 Guest landing — `/` · `src/components/GuestLandingPage.tsx`

**Mobile:**
- Stacked vertically with extra top padding.
- Hero logo: two-line `MEGA` / `OX`, 44px/900/letterSpacing 4, gradient text fill `#fff 30% → #00d4aa 70%`.
- Tagline (textMuted, 14/600, two lines): `Ultimate Noughts & Crosses. / Every move matters.`
- **Board preview placeholder** — 240×240 box with the teal/purple gradient frame + the skinnable-canvas hatch pattern (this represents the board the user will see in the demo). Inner shadow `inset 0 0 40px rgba(0,212,170,0.25)`.
- Full-width primary `▶  Play Demo` → routes to `/demo`.
- **Unlock list** (glass card) — `CREATE AN ACCOUNT TO UNLOCK` eyebrow + 3 rows with tinted icon squares: ranked + leaderboards / XP + achievements / skins + avatars. Use `UNLOCK_FEATURES` constant for the labels.
- **Auth row** — two equal buttons:
  - Left: secondary `Log In`.
  - Right: tertiary "outline" variant of primary — `border: 1.5px solid #00d4aa, color: #00d4aa, background: transparent`, hover fills.

### 7.10 Demo game — `/demo` · `src/components/DemoGamePage.tsx`

Visually identical to §7.5 game chrome, with three differences:
- Header has `← Exit demo` + `DEMO MODE` purple pill.
- Above the board, a small wordmark + tagline subtitle (`Get a feel for the game — no account needed`).
- After ~30 seconds of play or on game over, show a **sign-up nudge card** below the board: glass card with teal/purple gradient overlay, sparkle icon, `Enjoying the game?` + `Sign up to save progress and rank up`, and a primary `Sign Up` button.

### 7.11 Customise — `/customise` · `src/components/profile/CustomisePage.tsx`

**Mobile:**
- Header: chevron + `Customise` + credit chip right.
- **Preview card** at top — mini banner + avatar cluster reflecting current loadout (live-updating as user equips items).
- **Segmented category switcher** — 4 cells: `Avatar / Banner / Badge / Skin`. Style identical to leaderboard switcher.
- **Item grid** — 3 columns. Each tile: `padding 10, radius 14`:
  - Equipped: `rgba(0,212,170,0.12) + 1.5px solid #00d4aa`. `EQUIPPED` pill in top-right (9px/800 teal).
  - Owned, not equipped: `rgba(255,255,255,0.04) + 1px solid rgba(255,255,255,0.06)`.
  - Locked: 40% opacity on the avatar, coin icon + price (`200`) shown below.
- Tab bar active = `Profile`.

Tap an owned item → optimistic equip + `equip_cosmetic_item` RPC. Locked item → confirm-purchase modal (you can defer this — Phase 5 isn't gameplay).

### 7.12 Login / Sign Up — `/login`, `/signup`

**Mobile:**
- Centered single-column layout, max width `calc(100% - 48px)` with `padding: '24px 24px 0'`.
- Back chevron in top-left.
- Title block: gradient wordmark + welcome sub.
- **Glass form card** — labels (11px/700/uppercase/muted), `<Field>` inputs (§6.7), `Forgot password?` aligned-right link (12/700/teal) on login only.
- Primary `Log In` / `Sign Up` full-width button at bottom of card.
- Below card, centered: switch link (`New here? Sign up` / `Already have an account? Log in`).

Sign Up has three fields (Email, Password, Username) plus username availability check styling (teal check on right when valid, red X with `Username taken` caption when not).

---

## 8. Responsive behavior

Add a `useIsMobile()` hook:

```ts
import { useState, useEffect } from 'react';
export const useIsMobile = (breakpoint = 640) => {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setM(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return m;
};
```

Then each Page component branches `if (isMobile) return <MobileLayout />; else return <DesktopLayout />;` — keep both layouts in the same file for now.

Desktop content max-width: **1100 px**, centered. No tab bar on desktop — use the top header for navigation.

---

## 9. Animations & motion

Add to `src/components/animations.css`:

```css
@keyframes mxPulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.4); opacity: 0.3 } }
@keyframes mxRingPulse { 0% { transform: scale(0.6); opacity: 0.6 } 100% { transform: scale(1.6); opacity: 0 } }
@keyframes mxBlink { 50% { opacity: 0 } }
@keyframes mxSlideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes mxFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
```

Apply:
- Status dot on "Waiting for opponent" → `mxPulse 1.5s infinite`.
- Matchmaking concentric rings → 3 absolute divs with `mxRingPulse 2.4s infinite` staggered by 0.8 s.
- Cursor in code input → `mxBlink 1s infinite` on the trailing `|`.
- Modal entry → wrap modal contents in `mxSlideUp 0.4s cubic-bezier(0.16,1,0.3,1)`.

Hover/tap microinteractions (inline-CSS handlers):
- Primary button: `transform: translateY(-1px)`, deeper shadow.
- Secondary button: brighter border + white text.
- Tap on tile / nav item: `transform: scale(0.97)` over 80 ms via `onMouseDown`/`onMouseUp`.

XP bar fill: `transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'`.

---

## 10. State management

No new global state. All data already comes from existing hooks:
- `useAuth`, `usePlayerProfile`, `useRecentGames`, `useLoginStreak`, `useTutorial`, `useProgression`, `useInventory`, `useLoadout`, `useAchievements`, `useOnlineGame`.

**New local UI state to introduce per component:**
- Matchmaking timer (`elapsedSec`) ticked by `setInterval`.
- Achievement filter (active category).
- Customise active category.
- Hover state per button via React state, **only** if you need the hover snapshot to drive child styles. For self-contained hover (e.g. just a button), prefer `onMouseEnter` mutating `e.currentTarget.style.*` to match the existing codebase convention.

---

## 11. Implementation order

Suggested order — each step is independently shippable:

1. **Foundations** — add Nunito to `public/index.html`, create `src/styles/tokens.ts`, create `src/components/common/PageBackground.tsx`, `Glass.tsx`, `PrimaryButton.tsx`, `SecondaryButton.tsx`, `Pill.tsx`, `TabBar.tsx`, icons.
2. **Update `LevelBadge` + `XPProgressBar`** to the new spec.
3. **Main Menu** (mobile then desktop) — biggest single visual win.
4. **Profile** — most-visited screen after Main Menu.
5. **Multiplayer + Matchmaking** — three matchmaking views.
6. **Game chrome + emoji bubbles** — game screen content only (header, VS strip, turn pill, emoji panel) — leave the board alone.
7. **Post-game modal** — replaces the existing `PostGameModal.tsx`.
8. **Leaderboard, Achievements, Customise** — same component library, lower priority.
9. **Guest landing, Demo, Login, Sign Up** — auth flows.
10. **Settings, How-to-Play, RPS, Season, Onboarding, Rematch overlay** — polish pass (these aren't mocked here; apply the system).

---

## 12. Files in this bundle

* `original-brief.md` — the canonical phase-5 brief (read first).
* `design/Mega OX — Phase 5 Visuals.html` — open in a browser to see every screen interactively. **This is the source of truth for visuals.**
* `design/tokens.jsx` — token + primitive definitions used by the mocks. Mirror to `src/styles/tokens.ts`.
* `design/foundations.jsx` — visual system reference card.
* `design/screens-p1.jsx` — Main Menu, Streak modal, Multiplayer, Matchmaking, Profile.
* `design/screens-p2.jsx` — Game chrome, Post-game, Leaderboard, Achievements, Customise, Guest, Demo, Login.
* `design/design-canvas.jsx` — runtime that lays out the mocks (not for app use).

---

## 13. Out of scope for Phase 5

- **Game logic / data model** — locked. No schema or hook changes beyond cosmetic ones.
- **Skin assets** — board grid, marker art, won-board overlay. Separate art-asset task.
- **New features** — Phase 5 is a visual layer. If a screen genuinely needs new state or routes to look right (e.g. matchmaking timer), flag it; otherwise stick to what exists.

---

## 14. Acceptance checklist

When implementing each screen, verify:

- [ ] Nunito loaded, weights 400/600/700/800/900 visible.
- [ ] Atmospheric background (base + glows) renders behind every full-page screen except the game.
- [ ] All cards are glass (8% / 3% gradient, 1 px white-10 border, 16 px radius, blur 12).
- [ ] Single primary teal-gradient button per screen with the gold-standard glow shadow.
- [ ] Pills use the variant colour tokens — no one-off colours.
- [ ] Level badge is the purple gradient circle (not a square or solid colour).
- [ ] XP bar is teal→purple gradient with the teal glow shadow.
- [ ] Hover/focus implemented via `onMouseEnter`/`onMouseLeave` / `onFocus`/`onBlur` (codebase convention) — not CSS pseudo-classes.
- [ ] Mobile breakpoint at 640 px, tab bar visible on mobile main-app routes, hidden on game + auth routes.
- [ ] Game screen leaves the board canvas untouched and styles only the chrome.

---

**Questions, ambiguities, or "the brief contradicts the mock":** the **mock is canonical**. The brief came first; the mocks were tuned during the design pass.
