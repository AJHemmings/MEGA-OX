# Intro.js Tutorial System — Design Doc

**Date:** 2026-03-16
**Branch:** `feat/network-multiplayer`

---

## Overview

Replace the current custom `TutorialOverlay` with two Intro.js-powered experiences:

1. **Main menu spotlight tour** — auto-fires on first visit, replayable from Settings
2. **"How to Play" tutorial game** — pre-scripted guided game at `/how-to-play`, accessible from the Play card

---

## Dependencies

- `intro.js` — vanilla, no React wrapper
- `leader-line-new` — maintained fork of Leader Line; draws SVG arrows between DOM elements

---

## Part 1: Main Menu Tour

### Trigger logic

`useTutorial('home')` checks `tutorial_progress` in Supabase. If no row exists for the current user + page key, `shouldAutoStart` is set to `true`. A `useEffect` in `MainMenu.tsx` watches `shouldAutoStart` and fires Intro.js after a 500ms delay (ensures DOM is settled after data loads).

### Steps

Five steps, each targeting a real DOM element via `id` selector:

| Step | Element ID | Content |
|---|---|---|
| 1 | `#menu-play` | Play area — train vs AI, multiplayer, league, tournament, season |
| 2 | `#menu-recent-games` | Last 5 games panel |
| 3 | `#menu-news` | News slideshow |
| 4 | `#menu-leaderboard-btn` | Leaderboard button |
| 5 | `#menu-profile` | Profile, settings, and rank tier |

### Completion

Both `oncomplete` and `onexit` call `markComplete()`, which upserts a row into `tutorial_progress`. Skipping counts as done.

### "How to Play" button

Added to the Play card in `MainMenu.tsx`, below Training and Multiplayer. Navigates to `/how-to-play`. Does not interact with the DB — the route is always accessible.

### Replay from Settings

`SettingsPage.tsx` gains a "Replay Tutorial" button. Calls `resetTutorial('home')`, which deletes the `tutorial_progress` row for `page_key = 'home'`. Shows confirmation text: *"Tutorial will show next time you visit the home screen."*

---

## Part 2: "How to Play" Tutorial Game

### Route

`/how-to-play` — added to `App.tsx`. No auth gate (publicly accessible).

### Component

`src/components/game/HowToPlayPage.tsx`

Renders the existing `MacroBoard`, `MicroBoard`, and `Cell` components in a controlled state. Board state is managed locally (not Supabase). The component reads steps from `tutorialScript.ts` and drives Intro.js + Leader Line from them.

### Script file

`src/components/game/tutorialScript.ts`

The script is the **only file the user needs to edit** to change tutorial content. All step definitions live here with full comments. The component never needs to change when the script changes.

```typescript
export interface TutorialStep {
  boardIndex: number | null;   // micro board to focus (0–8), null = whole board
  cellIndex: number | null;    // cell the player must click (0–8), null = no move
  intro: string;               // tooltip text shown by Intro.js
  title?: string;              // optional tooltip title
  arrow: {
    from: string;              // CSS selector — arrow tail
    to: string;                // CSS selector — arrow head
  } | null;                    // null = no arrow on this step
}
```

### Scripted sequence (8 steps — editable in tutorialScript.ts)

1. Full board highlighted — introduce MEGA OX concept, no arrow
2. Highlight one micro board + arrow pointing to its matching macro cell — "Win this board, claim this cell"
3. Guided first move (player clicks) — "Click here to place your first X"
4. Arrow from cell just played → forced micro board — "Your move sends your opponent here"
5. Scripted AI move — "Opponent plays. Their move sends you here" + arrow to forced board
6. Guided move — player builds two in a row
7. Guided winning move — arrow from micro board → macro cell — "Win this board, claim this macro cell"
8. Full board — "Win three macro cells in a row to win. Good luck." + "Start Playing" button

### Arrow implementation

Leader Line instances are created/destroyed per step:

```typescript
// On step change: remove previous arrow, draw new one if step.arrow is defined
currentArrow?.remove();
if (step.arrow) {
  currentArrow = new LeaderLine(
    document.querySelector(step.arrow.from),
    document.querySelector(step.arrow.to),
    { color: '#00d4aa', dash: { animation: true }, size: 3 }
  );
}
```

Leader Line arrows are appended to `document.body` and sit above the Intro.js overlay via explicit `z-index`.

### Interaction constraints

During the tour, all cells except the scripted target have `pointer-events: none` and `opacity: 0.4`. Only the highlighted cell is clickable. Clicking it places the marker and advances to the next step.

### Exit behaviour

A skip/exit button is always visible. Exits to `/` (main menu).

---

## useTutorial hook — updated API

```typescript
const { shouldAutoStart, markComplete, resetTutorial } = useTutorial(pageKey);
```

| Export | Purpose |
|---|---|
| `shouldAutoStart` | `true` if no completion row exists in Supabase |
| `markComplete()` | Upserts completion row (called on tour complete or exit) |
| `resetTutorial()` | Deletes completion row (called from Settings replay button) |

---

## Files changed / created

| File | Change |
|---|---|
| `src/hooks/useTutorial.ts` | Refactor: new API (`shouldAutoStart`, `markComplete`, `resetTutorial`) |
| `src/components/MainMenu.tsx` | Add `id` attrs, Intro.js logic, "How to Play" button |
| `src/components/profile/SettingsPage.tsx` | Add "Replay Tutorial" section |
| `src/components/game/HowToPlayPage.tsx` | New: tutorial game component |
| `src/components/game/tutorialScript.ts` | New: editable script file |
| `src/App.tsx` | Add `/how-to-play` route |
| `package.json` | Add `intro.js`, `leader-line-new` |

`TutorialOverlay.tsx` — left in place, unused for now. Reserved for future in-game hint system.

---

## Out of scope

- Tutorial progress for `/how-to-play` (no DB tracking — always accessible, not a one-time thing)
- Mobile-specific arrow positioning (desktop-first for now)
- MMR, cash shop, deploy — separate sessions
