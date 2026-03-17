# Guest Landing Page + Demo Game — Design Doc

**Date:** 2026-03-17
**Status:** Approved, ready for implementation

---

## Overview

Unauthenticated users currently hit `/` and are redirected to `/login`. This feature replaces that with a guest-friendly experience: a landing page at `/` and a playable demo game at `/demo`. The goal is to let guests experience the game before committing to an account, while surfacing what they unlock by signing up.

---

## Routes & Auth

| Route | Who sees it | Notes |
|---|---|---|
| `/` | Everyone | Guest landing page. Logged-in users redirected to `/menu`. |
| `/demo` | Everyone | Demo game vs AI + signup sidebar. |
| `/login` | Unauthenticated | Unchanged. |
| `/training` | Authenticated | Unchanged — solo practice for logged-in users. |
| `/menu` and all other routes | Authenticated only | ProtectedRoute unchanged for these. |

**`App.tsx` change:** `/` moves outside `ProtectedRoute`. A logged-in user hitting `/` gets `<Navigate to="/menu" />`. All other protected routes stay inside `ProtectedRoute` as-is.

---

## Guest Landing Page (`/`)

**Layout:** Centered single column. No navbar, no footer.

**Content (top to bottom):**
1. Game name — "MEGA OX" as a large heading
2. Tagline — "Ultimate Noughts & Crosses. Every move matters."
3. Account unlock bullet list:
   - Online multiplayer
   - Leaderboard & stats
   - Game history
   - Profile customisation
4. CTAs:
   - "Play Demo" — primary button, navigates to `/demo`
   - "Sign Up" — secondary link, navigates to `/login` (or `/signup` if that route exists)
   - "Log In" — tertiary link, navigates to `/login`

**Styling:** Inline CSS. Dark theme consistent with the rest of the app.

---

## Demo Game Page (`/demo`)

**Layout:** Game board centred as normal. Sidebar panel to the right of the board.

### Sidebar (always visible during play)

- Heading: "Want more?"
- Same bullet list as landing page (multiplayer, leaderboard, history, profile)
- "Sign Up" primary button → `/login`
- "Log In" link → `/login`

### Post-game prompt (extends the existing result modal)

When the game ends, the result modal shows:
1. Result message — "You won!", "You lost.", "It's a draw!"
2. Sign-up pitch — "Sign up to save your stats, play online, and customise your profile."
3. "Sign Up" button (primary) → `/login`
4. "Log In" link → `/login`
5. "Play Again" button — dismisses modal and resets the game

The post-game modal replaces the existing result modal entirely. No second popup layered on top.

### Game behaviour

- Powered by `GameWrapper` with `gameMode="single"` (AI opponent, same as `/training`)
- Guests can dismiss the post-game modal and play as many demo games as they like
- No auth dependency — `GameWrapper` has none

---

## What is NOT changing

- `/training` route — untouched
- `ProtectedRoute` logic for all routes other than `/`
- Tutorial routes (`/how-to-play`, `/how-to-play/:mode`) — already public, untouched
- All game logic, `Game.ts`, `useGameLogic.ts` — untouched

---

## New files

| File | Purpose |
|---|---|
| `src/components/GuestLandingPage.tsx` | `/` route component |
| `src/components/DemoGamePage.tsx` | `/demo` route component — wraps `GameWrapper` + sidebar |

## Modified files

| File | Change |
|---|---|
| `src/App.tsx` | Move `/` outside `ProtectedRoute`; add `/demo` as public route; add redirect for authed users hitting `/` |
