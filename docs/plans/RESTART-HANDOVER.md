# Restart Handover — Read This First

## Session start prompt

Read this file in full, then say: "I've read the handover. The guest landing + demo game feature is complete. What's next?"

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
| Guest landing + demo game feature | ✅ Done |

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

## Guest landing + demo game (complete)

### What was built

- `/` — `GuestLandingPage` for unauthenticated users; redirects authenticated users to `/menu`
- `/demo` — `DemoGamePage`: `GameWrapper gameMode="single"` + always-visible signup sidebar + post-game modal with result + sign-up CTAs + Play Again
- `/menu` — `MainMenu` (moved from `/`). All authenticated navigation now targets `/menu`, not `/`

### Key files

| File | Purpose |
| --- | --- |
| `src/components/GuestLandingPage.tsx` | Guest landing page |
| `src/components/DemoGamePage.tsx` | Demo game + sidebar + post-game modal |
| `src/components/guestUnlockFeatures.ts` | Shared `UNLOCK_FEATURES` constant |
| `src/App.tsx` | Routes updated — `RootRoute` handles `/` auth split |
| `src/components/GameWrapper.tsx` | Added `onGameOver?: (winner: string) => void` prop |

---

## Key files (full project)

| File | Purpose |
| --- | --- |
| `src/models/Game.ts` | Core game logic — OOP, no React |
| `src/hooks/useGameLogic.ts` | React wrapper. Uses `{ ...game }` spread to trigger re-renders |
| `src/App.tsx` | React Router v7. All routes defined here. `/menu` is now the authenticated home (moved from `/`) |
| `src/components/GuestLandingPage.tsx` | Guest landing page (unauthenticated `/`) |
| `src/components/DemoGamePage.tsx` | Demo game page — GameWrapper + signup sidebar + post-game modal |
| `src/components/guestUnlockFeatures.ts` | Shared unlock features constant |
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
