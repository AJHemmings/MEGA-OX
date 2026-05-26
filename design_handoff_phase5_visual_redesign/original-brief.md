# Phase 5 — Visual Redesign: Design Brief

**Project:** Mega OX (Ultimate Noughts & Crosses web app)
**Phase:** 5 — Visual Redesign
**Date:** 2026-05-26
**Status:** Ready for Claude Design

---

## 1. What This Brief Is For

This brief is the handoff to Claude Design. It defines the complete visual direction for Phase 5 — a full design pass over all screens now that all features are built. The output of Claude Design's work comes back to Claude Code for implementation.

**Do not redesign game logic, navigation structure, or data flows.** The screens exist and work. This is a visual layer only.

---

## 2. What Mega OX Is

A competitive, real-time web game — "Ultimate Noughts & Crosses." A 3×3 grid of micro tic-tac-toe boards. Win a micro board to claim that cell on the macro board. Win 3 macro cells in a row to win the game. Your move's position determines which micro board your opponent must play in next.

**Current tech stack:** React (CRA), TypeScript, Supabase (auth + DB), Vercel (hosting), all styling is inline CSS — no CSS framework.

**Deployment:** Web app, accessed in a browser on desktop and mobile.

---

## 3. Design Direction

### Reference
The reference image is a dark glassmorphism mobile game UI — the style used in Telegram tap-to-earn games (Hamster Kombat-style). Key characteristics from the reference:

- Deep dark navy/blue background with atmospheric colour glow (purple/teal gradients bleeding in from corners)
- Frosted glass cards — semi-transparent dark panels with a subtle `1px` white border at low opacity
- Vivid, saturated accent colours that pop against the dark background
- Gradient buttons — bold, filled, with a soft box shadow
- Rounded corners everywhere — cards ~16px, buttons ~12–14px, chips ~100px
- Bold white typography with muted grey for secondary text
- Currency/reward iconography (gems, coins) as inline visual elements
- Minimal chrome — the content is the star

### Mood
Fun, premium, competitive. The kind of game you'd want to screenshot and share. Not a serious chess app. Not a children's game. Somewhere between Duolingo and a ranked mobile card game.

### What to avoid
- Dots, grid patterns, or texture on backgrounds (no Agar.io arena texture)
- Neon glows / esports aesthetic (no cyberpunk)
- Light backgrounds
- Flat/corporate design
- Pixel or retro game aesthetics

---

## 4. Colour Palette

### Brand accent (keep current)
| Token | Hex | Usage |
|---|---|---|
| `--accent` | `#00d4aa` | Primary CTA buttons, active states, logo accent, highlights |
| `--accent-dark` | `#00b894` | Gradient endpoint for buttons |

### Backgrounds
| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#060d1f` | Page background |
| `--bg-card` | `#0d1530` | Card/panel background (before glass effect) |
| `--bg-surface` | `#1a2340` | Elevated surface (nested cards, inputs) |

### Atmospheric glow
- Top-left corner: `radial-gradient(ellipse at 0% 0%, #1a2a6c55, transparent)` — deep blue/indigo
- Bottom-right corner: `radial-gradient(ellipse at 100% 100%, #00d4aa22, transparent)` — teal matching accent
- These are subtle — background depth, not a spotlight

### Text
| Token | Usage |
|---|---|
| `#ffffff` | Primary text, headings |
| `#a0aec0` | Secondary/muted text |
| `#4a5568` | Disabled / tertiary |

### Semantic colours (game + system)
| Token | Hex | Usage |
|---|---|---|
| Win / positive | `#00d4aa` | Win result, positive stat delta |
| Loss / negative | `#ff6b6b` | Loss result, error states |
| Draw / neutral | `#a0aec0` | Draw result |
| XP / level | `#7c4dff` | XP bar, level badge |
| Credits | `#f9a825` | Credit balance, coin rewards |
| Warning | `#f7931e` | Medium difficulty, caution |

### Player colours (in-game UI chrome only — NOT the markers/board, which are skins)
| Player | Hex |
|---|---|
| Player 1 / You | `#00d4aa` (matches brand accent) |
| Player 2 / Opponent | `#ff6b6b` |

---

## 5. Typography

**Font family:** Nunito (Google Fonts) — used throughout, all weights.

**Why Nunito:** Rounded terminals, warm and approachable, reads well at small sizes on dark backgrounds, feels like a premium casual game without being childish.

**Load weights:** 400, 600, 700, 800, 900.

### Type scale
| Role | Size | Weight | Usage |
|---|---|---|---|
| Display / Logo | 24–32px | 900 | MEGA OX wordmark, win screen headline |
| Heading 1 | 20–22px | 800 | Page/section titles |
| Heading 2 | 16–18px | 700 | Card titles, modal headers |
| Body | 14–15px | 600 | Default UI text, menu items |
| Caption | 11–13px | 600 | Labels, timestamps, sub-copy |
| Micro | 10–11px | 700 | Badge text, stat chips |

**Letter spacing:** 1–3px on the logo/display; 0 on body copy. Avoid wide tracking on small text.

---

## 6. Component Patterns

### Glass card
```
background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))
border: 1px solid rgba(255,255,255,0.10)
border-radius: 16px
backdrop-filter: blur(12px)
```
Use for: menu sections, profile panels, match history rows, leaderboard entries, settings groups.

### Primary button
```
background: linear-gradient(135deg, #00d4aa, #00b894)
border-radius: 14px
padding: 14–16px
font: Nunito 800
color: #051018  ← dark text on light button
box-shadow: 0 8px 24px rgba(0,212,170,0.30)
```
One primary button per screen. This is the "Play Now" / "Confirm" / "Claim" action.

### Secondary button
```
background: transparent
border: 1px solid rgba(255,255,255,0.15)
border-radius: 14px
color: #a0aec0
```
For cancel, back, secondary actions.

### Pill / chip
```
border-radius: 100px
padding: 5–6px 12–14px
font: Nunito 700, 11–12px
```
Variants: teal (active/positive), purple (XP/level), gold (credits), muted (neutral label).

### Level badge
```
background: linear-gradient(135deg, #7c4dff, #4a1fa0)
border-radius: 100px
font: Nunito 700
```

### XP progress bar
```
track: rgba(255,255,255,0.08), border-radius 100px, height 6–8px
fill:  linear-gradient(90deg, #00d4aa, #7c4dff)
```

### Tab bar (mobile)
Bottom navigation on mobile. 4 items: Home, Play, Profile, Settings. Active item uses `#00d4aa`. Icon + label below.

**Scope:** The tab bar appears on all main app screens (Main Menu, Leaderboard, Profile, Customise, Achievements, Settings). It is suppressed on the game screen (both local and online) and on the auth screens (login, sign up, onboarding). The game screen has its own back/exit affordance in the header chrome. Navigation targets: Home → `/menu`, Play → `/multiplayer`, Profile → `/profile/<username>`, Settings → `/settings`.

### Input field
```
background: rgba(255,255,255,0.06)
border: 1px solid rgba(255,255,255,0.12)
border-radius: 12px
color: #fff
font: Nunito 600
```
Focus state: border changes to `#00d4aa`.

---

## 7. The Skin System — Critical Constraint

**The entire game canvas is skinnable via image assets.** This is not a future feature — it is live. Every element listed below is an `<img>` slot at runtime, not a CSS-styled element.

| Skin slot | What it is |
|---|---|
| **Background** | Full-bleed image behind the game board |
| **Board grid** | The macro board's grid lines and frame |
| **Cell marker — Player 1** | The X equivalent |
| **Cell marker — Player 2** | The O equivalent |
| **Won board overlay** | Shown over a micro board when it's been won |

**Design implication:** Do not design these elements. Do not specify what an X or O looks like. Do not design the board grid visual. Design the *container* — the game screen layout, the chrome around the board, the player indicator strip, the turn pill, the emoji bubble positions. The board area itself is a 480×480px (desktop) image canvas that skins paint over. On mobile, the board width equals the viewport width capped at 480px, maintaining a 1:1 square aspect ratio — treat it as `min(100vw, 480px) × min(100vw, 480px)` when laying out the chrome around it.

**Default skin fallback:** When no skin is equipped, default markers are plain text X and O on white cells — this is the development/unthemed state, not the designed state. Claude Design does not need to design the default skin; that's a separate art asset task.

---

## 8. Screen Inventory

All screens exist and are functional. The redesign is a visual layer. Priority order:

### Priority 1 — Must feel best (user's call)
| Screen | File | Notes |
|---|---|---|
| **Main Menu** | `MainMenu.tsx` | Hub for logged-in users. Has: header with logo + profile, play section, last 5 games, news slideshow, footer nav. **Login streak modal** overlays this screen on login — design this as a standard glass-card modal containing: day streak count (e.g. "Day 3 Streak 🔥"), reward description in a gold credits chip, and a single primary "Claim Reward" CTA button. |
| **Multiplayer Menu** | `MultiplayerMenu.tsx` | Host or join a game. Online matchmaking entry point. |
| **Matchmaking / Search** | `game/MatchmakingPage.tsx` | "Searching for opponent" waiting state. |
| **Profile Page** | `profile/ProfilePage.tsx` | Shows avatar, banner, badge, stats, achievements, win/loss record. Viewed for self and others. |

### Priority 2 — Important
| Screen | File | Notes |
|---|---|---|
| Guest Landing | `GuestLandingPage.tsx` | First screen unauthenticated users see. CTA to play demo or sign up. |
| **Demo Game** | `DemoGamePage.tsx` | The first interactive experience for unauthenticated users — a fully playable game accessible without an account. Linked directly from the Guest Landing "Play Demo" CTA. Same game-canvas chrome design as `GameWrapper.tsx` applies here. This is a Priority 1 screen for first impressions. |
| Post-game Modal | `progression/PostGameModal.tsx` | Shown after every game — XP gain, credits, level-up, achievements unlocked. |
| Customise Page | `profile/CustomisePage.tsx` | Equip avatar / badge / banner from inventory. |
| Leaderboard | `leaderboard/LeaderboardPage.tsx` | Ranked player list. |
| Achievements | `achievements/AchievementsPage.tsx` | Achievement grid with locked/unlocked states. |

### Priority 3 — Polish pass
| Screen | File | Notes |
|---|---|---|
| Login | `auth/LoginPage.tsx` | Email + password form with "Forgot password" and link to sign up. |
| Sign Up | `auth/SignUpPage.tsx` | Email + password + username registration form. |
| Onboarding | `auth/OnboardingPage.tsx` | Post-signup flow — username confirmation, initial avatar/identity selection. Reuses patterns from `CustomisePage`. Distinct from the login form; needs its own mockup. |
| How to Play (select + detail) | `game/HowToPlaySelectPage.tsx`, `game/HowToPlayPage.tsx` | Tutorial screens. |
| RPS screens | `game/LocalRPSScreen.tsx`, `game/RPSScreen.tsx`, `game/RPSResultScreen.tsx` | Rock-paper-scissors to decide who goes first in online games. |
| Settings | `profile/SettingsPage.tsx` | User settings. |
| Season Page | `season/SeasonPage.tsx` | Seasonal competition info. |
| Rematch overlay | `game/RematchOutcomeOverlay.tsx` | Overlay shown when rematch is accepted/declined. |

### Game screen (special case)
| Screen | File | Notes |
|---|---|---|
| Game (local/AI) | `GameWrapper.tsx` | Contains MacroBoard + PlayerIndicator + Modal. The board area is a skin canvas — design the chrome around it only. |
| Game (online) | `game/OnlineGameView.tsx` | Online version — also includes EmojiPanel and EmojiBubble positioning. |

---

## 9. Responsive Approach

**Both desktop and mobile must work well.**

- **Mobile**: Stack vertically. Tab bar navigation at the bottom. Game board fills the viewport width. Cards go full width.
- **Desktop**: Max content width ~900px centered. Two-column grid where it makes sense (e.g. main menu: play options left, recent games right). No tab bar — nav in the header.
- **Breakpoint**: 640px (below = mobile layout, above = desktop layout).

The app currently has no responsive logic — all styles are desktop-sized inline CSS. The redesign is the right time to introduce the mobile layout alongside desktop.

---

## 10. Inline CSS Constraint

The current codebase uses **100% inline CSS** — no CSS files, no CSS modules, no Tailwind, no styled-components (except `animations.css` for keyframes).

This is the implementation pattern Claude Code will follow when building the design. Claude Design does not need to write code, but should know: every design decision needs to be expressible as inline style objects.

**Hover and focus states:** Spec these as explicit named variants, not CSS pseudo-selector notation. For example: "Button — hover state: background `#00b894`, box-shadow `0 12px 32px rgba(0,212,170,0.45)`." Do not write `:hover { ... }`. Claude Code wires these via `onMouseEnter`/`onMouseLeave` React handlers, so the spec needs exact values for each state.

---

## 11. What Claude Design Should Deliver

For each screen (starting with Priority 1):

1. **Full-fidelity mockup** — desktop and mobile
2. **Annotated component specs** — colour tokens, font sizes/weights, spacing values, border radii
3. **Component library** — reusable patterns (glass card, primary button, pill chip, level badge, XP bar, player chip, tab bar) specified as a reference sheet
4. **Game screen chrome spec** — layout of the game screen excluding the board canvas itself. Show where the turn indicator lives, player chips, emoji bubble zones, back button, etc.

---

## 12. Summary of Design Decisions Made in Brainstorm

| Decision | Choice |
|---|---|
| Design direction | Dark glassmorphism mobile-game style |
| Reference | Tap-to-earn game UI (navy bg, glass cards, vivid accents, gradient buttons) |
| Background | Deep navy with atmospheric teal/indigo glow |
| Brand accent | Keep `#00d4aa` (current teal) |
| Typography | Nunito throughout, all weights |
| Game canvas | Fully skinnable — image slots only, no CSS styling of markers/board |
| Responsive | Both desktop and mobile |
| Priority screens | Main menu, multiplayer menu, matchmaking, profile |
