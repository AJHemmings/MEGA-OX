# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say:

> "I've read the handover. We're mid-brainstorm on the guest landing + demo game feature.
> Before I ask anything else — what should the guest landing page show when someone
> arrives without an account?
>
> **A) Minimal** — just the game name, a 'Play Demo' button, and Sign Up / Log In links.
> Clean, get them into the game fast.
>
> **B) Brief pitch** — game name, one-line tagline, a short bullet list of what you unlock
> with an account (leaderboard, online play, etc.), then the CTAs.
>
> **C) The login page grows** — the existing `/login` page gets a 'Try a demo game' button
> added to it. No separate guest landing at all."

Do not write any code or plans until the user answers. Then continue the brainstorming
skill to get the full design approved, write the design doc, and invoke writing-plans.

---

## Current branch

`main` — `feat/network-multiplayer` was merged and deleted this session.
New feature work goes on a new `feat/` branch (create it before touching code).

---

## What was completed this session

| Work | Status |
| --- | --- |
| Tutorial bug: abrupt section transition | ✅ Fixed — bridge step inserted at idx 6 |
| Tutorial bug: centre cell click silently rejected | ✅ Fixed — `nextMicroBoardIndex: null` in ENDGAME_PRELOAD |
| Tutorial endgame redesign — O's turn first, O makes visible move | ✅ Done |
| Tutorial endgame — Circle's free pick step spotlights correct cell | ✅ Fixed |
| Tutorial split into Beginner (7 steps) and Intermediate (14 steps) | ✅ Done |
| Guest landing + demo game feature | 🔲 Brainstorm started, not yet designed |

---

## Tutorial state (complete — do not touch unless asked)

**Routes:**
- `/how-to-play` → `HowToPlaySelectPage` (mode picker: Beginner / Intermediate)
- `/how-to-play/beginner` → 7 steps (chain rule only, idx 0–6)
- `/how-to-play/intermediate` → 14 steps (full tutorial including endgame, idx 0–13)

**Key files:**
- `src/components/game/tutorialScript.ts` — all step content. `INTERMEDIATE_STEPS` is the full array. `BEGINNER_STEPS = INTERMEDIATE_STEPS.slice(0, 7)`.
- `src/components/game/HowToPlayPage.tsx` — reads `:mode` URL param, picks step array.
- `src/components/game/HowToPlaySelectPage.tsx` — mode selection screen.

---

## Next feature: guest landing page + demo game

### What the user wants

- Unauthenticated users currently hit `/` and are bounced to `/login` (via `ProtectedRoute`).
- They should instead land on a guest-friendly page where they can play a demo game.
- The demo game is `GameWrapper` with `gameMode="single"` (AI already exists, route `/training` is already public).
- During the demo game, a sidebar panel says "Register an account" or "Log into an existing account" to access more features.

### Brainstorm status

We were mid-brainstorm. The following question was asked but NOT yet answered:

> When a guest lands on the site for the first time, what should they see before clicking
> Play Demo?
>
> **A) Minimal** — just the game name, a 'Play Demo' button, and Sign Up / Log In links.
>
> **B) Brief pitch** — game name, tagline, short feature-unlock bullet list, then CTAs.
>
> **C) The login page grows** — existing `/login` gets a 'Try a demo game' button. No
> separate guest landing.

**The new session must get this answer before designing anything.**

### Relevant existing code

| File | What to know |
| --- | --- |
| `src/App.tsx` | `/` is inside `<ProtectedRoute>` → redirects unauthed to `/login`. `/training` is public and already renders `GameWrapper gameMode="single"`. |
| `src/components/layout/ProtectedRoute.tsx` | `user ? <Outlet /> : <Navigate to="/login" />` |
| `src/components/GameWrapper.tsx` | Accepts `gameMode: "single" \| "local"` and `onBackToMenu` callback. No auth dependency. |
| `src/components/MainMenu.tsx` | Full lobby menu — requires auth (uses `useAuth`, fetches profile/games from Supabase). Do NOT reuse for guest view. |
| `src/contexts/AuthContext.tsx` | Exposes `{ user, loading, signOut }`. `user` is null when unauthenticated. |

### Architectural constraint (do not re-litigate)

- All styling is inline CSS — no CSS framework.
- Supabase is the entire backend.
- Main stays portfolio-clean; new work on a `feat/` branch.

---

## Key files (full project)

| File | Purpose |
| --- | --- |
| `src/models/Game.ts` | Core game logic — OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper. Uses `{ ...game }` spread to trigger re-renders |
| `src/App.tsx` | React Router v7. All routes defined here |
| `src/components/GameWrapper.tsx` | Game board + AI logic |
| `src/components/MainMenu.tsx` | Lobby-style main menu (authenticated users only) |
| `src/contexts/AuthContext.tsx` | Auth state — `user`, `loading`, `signOut` |
| `src/components/layout/ProtectedRoute.tsx` | Redirects unauthed users to `/login` |
| `src/components/game/tutorialScript.ts` | Tutorial step content |
| `src/components/game/HowToPlayPage.tsx` | `/how-to-play/:mode` interactive tutorial |

---

## Credentials

`.env.local` and `.env.test.local` are gitignored. They contain:

- `REACT_APP_SUPABASE_URL=https://qioxtkcjtvvkzcoupdfk.supabase.co`
- `REACT_APP_SUPABASE_ANON_KEY=...` (full key in file)

Supabase project ref: **`qioxtkcjtvvkzcoupdfk`**

---

## MCP plugins active

- Supabase MCP (needs user's access token to connect)
- Vercel
- GitHub
