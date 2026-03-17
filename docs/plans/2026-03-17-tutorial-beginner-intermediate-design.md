# Tutorial Beginner / Intermediate Split — Design

**Date:** 2026-03-17
**Branch:** `feat/network-multiplayer`

---

## What we're building

Split the single `/how-to-play` tutorial into two levels — Beginner and Intermediate — reachable via a mode-selection screen at `/how-to-play`.

---

## Content split

| Level | Steps | Coverage |
|-------|-------|----------|
| Beginner | idx 0–6 (7 steps) | Welcome → Key rule → First move → AI spotlight → Chain explanation → Forced board click → Bridge |
| Intermediate | idx 0–13 (14 steps) | Everything in Beginner + full endgame (Circle's move, free choice, Board E win, Board H win, celebration) |

`BEGINNER_STEPS = INTERMEDIATE_STEPS.slice(0, 7)` — no duplication.

---

## Files changed

### `tutorialScript.ts`
- Rename `TUTORIAL_STEPS` → `INTERMEDIATE_STEPS`
- Add `export const BEGINNER_STEPS = INTERMEDIATE_STEPS.slice(0, 7)`

### `HowToPlayPage.tsx`
- Replace `useNavigate` (for mode) with `useParams<{ mode: string }>`
- Pick steps: `mode === 'beginner' ? BEGINNER_STEPS : INTERMEDIATE_STEPS`
- No other logic changes

### `HowToPlaySelectPage.tsx` (new)
- Selection screen at `/how-to-play`
- Two cards: "Beginner" and "Intermediate"
- `navigate('/how-to-play/beginner')` / `navigate('/how-to-play/intermediate')`
- Inline CSS, `#1a2332` background — matches rest of app

### `App.tsx`
- `/how-to-play` → `HowToPlaySelectPage`
- `/how-to-play/:mode` → `HowToPlayPage`

---

## Side effects

- `SettingsPage` "Replay Tutorial" links to `/how-to-play` → lands on selection screen automatically. No change needed.
