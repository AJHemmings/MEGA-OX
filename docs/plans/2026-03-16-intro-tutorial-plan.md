# Intro.js Tutorial System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the custom TutorialOverlay with two Intro.js experiences — a main menu spotlight tour and a pre-scripted "How to Play" guided game with Leader Line arrows.

**Architecture:** Intro.js (vanilla) drives all spotlight/tooltip UI. Leader Line draws animated arrows between DOM elements. `useTutorial` handles Supabase tracking. The tutorial game script lives in its own file (`tutorialScript.ts`) so the user can edit it without touching React code.

**Tech Stack:** React 18, TypeScript, intro.js, leader-line-new, Supabase JS v2

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
npm install intro.js leader-line-new
```

**Step 2: Verify install**

```bash
npm ls intro.js leader-line-new
```

Expected: both packages listed with versions.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install intro.js and leader-line-new"
```

---

## Task 2: Add TypeScript declaration for leader-line-new

leader-line-new ships no TypeScript types. We declare them manually.

**Files:**
- Create: `src/types/leader-line-new.d.ts`

**Step 1: Create the declaration file**

```typescript
declare module 'leader-line-new' {
  interface LeaderLineOptions {
    color?: string;
    size?: number;
    dash?: boolean | { animation?: boolean };
    path?: 'straight' | 'arc' | 'fluid' | 'magnet' | 'grid';
    startPlug?: string;
    endPlug?: string;
    zIndex?: number;
  }

  class LeaderLine {
    constructor(start: Element, end: Element, options?: LeaderLineOptions);
    remove(): void;
    position(): void;
  }

  export = LeaderLine;
}
```

**Step 2: Verify TypeScript accepts the import**

```bash
npx tsc --noEmit
```

Expected: no errors related to leader-line-new.

**Step 3: Commit**

```bash
git add src/types/leader-line-new.d.ts
git commit -m "chore: add TypeScript declaration for leader-line-new"
```

---

## Task 3: Refactor useTutorial.ts

The hook gains `markComplete` (replaces `completeTutorial`) and `resetTutorial` (deletes the DB row).

**Files:**
- Rewrite: `src/hooks/useTutorial.ts`

**Step 1: Rewrite the hook**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useTutorial = (pageKey: string) => {
  const { user } = useAuth();
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('tutorial_progress')
      .select('page_key')
      .eq('player_id', user.id)
      .eq('page_key', pageKey)
      .single()
      .then(({ data }) => {
        if (!data) setShouldAutoStart(true);
      });
  }, [user, pageKey]);

  // Call when the user finishes or skips the tutorial.
  // Upserts so duplicate calls are safe.
  const markComplete = async () => {
    if (!user) return;
    await supabase
      .from('tutorial_progress')
      .upsert({ player_id: user.id, page_key: pageKey });
    setShouldAutoStart(false);
  };

  // Call from Settings "Replay Tutorial" button.
  // Deletes the completion row so the tour auto-fires on next visit.
  const resetTutorial = async () => {
    if (!user) return;
    await supabase
      .from('tutorial_progress')
      .delete()
      .eq('player_id', user.id)
      .eq('page_key', pageKey);
  };

  return { shouldAutoStart, markComplete, resetTutorial };
};
```

**Step 2: Run tests**

```bash
npm test -- --watchAll=false
```

Expected: all existing tests still pass.

**Step 3: Commit**

```bash
git add src/hooks/useTutorial.ts
git commit -m "feat: refactor useTutorial — add markComplete and resetTutorial"
```

---

## Task 4: Update MainMenu — add element IDs and Intro.js tour

**Files:**
- Modify: `src/components/MainMenu.tsx`

**Step 1: Add intro.js import and CSS at the top of MainMenu.tsx**

Add these two lines after the existing imports:

```typescript
import introJs from 'intro.js';
import 'intro.js/introjs.css';
```

**Step 2: Replace the useTutorial call**

Find:
```typescript
const { showTutorial, completeTutorial } = useTutorial('home');
```

Replace with:
```typescript
const { shouldAutoStart, markComplete } = useTutorial('home');
```

**Step 3: Add `startIntro` function inside the component, after the existing state declarations**

```typescript
const startIntro = () => {
  introJs()
    .setOptions({
      steps: [
        {
          // Highlights the Play card — Training, Multiplayer, How to Play
          element: document.querySelector('#menu-play') as Element,
          intro: 'This is the <b>Play area</b>. Train against the AI, challenge a friend locally or online, join a league, play in a tournament, or compete in a season.',
          title: 'Play',
        },
        {
          // Highlights the Last 5 Games panel
          element: document.querySelector('#menu-recent-games') as Element,
          intro: 'Your <b>last 5 games</b> are shown here. Win/Loss/Draw and who you played.',
          title: 'Recent Games',
        },
        {
          // Highlights the News slideshow
          element: document.querySelector('#menu-news') as Element,
          intro: 'Stay up to date with <b>news</b> — updates, events, and announcements.',
          title: 'News',
        },
        {
          // Highlights the Leaderboard button in the footer
          element: document.querySelector('#menu-leaderboard-btn') as Element,
          intro: 'Check the <b>Leaderboard</b> to see the top-ranked players.',
          title: 'Leaderboard',
        },
        {
          // Highlights the profile/rank area in the header
          element: document.querySelector('#menu-profile') as Element,
          intro: 'Your <b>profile</b>, <b>rank tier</b>, and <b>settings</b> live up here. Click your name to view your full profile.',
          title: 'Your Profile',
        },
      ],
      nextLabel: 'Next →',
      prevLabel: '← Back',
      doneLabel: 'Got it!',
      showBullets: false,
      exitOnOverlayClick: false,
    })
    .oncomplete(markComplete)
    .onexit(markComplete)
    .start();
};
```

**Step 4: Add useEffect to auto-start the tour**

Add this after the existing `useEffect` hooks:

```typescript
useEffect(() => {
  if (!shouldAutoStart) return;
  // Delay slightly so DOM elements are fully rendered before Intro.js queries them
  const timer = setTimeout(startIntro, 500);
  return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [shouldAutoStart]);
```

**Step 5: Add `id` attributes to the four targeted sections**

Find the Play card opening div and add `id="menu-play"`:
```tsx
<div id="menu-play" style={card}>
```

Find the Last 5 Games card and add `id="menu-recent-games"`:
```tsx
<div id="menu-recent-games" style={card}>
```

Find the News card and add `id="menu-news"`:
```tsx
<div id="menu-news" style={{ ...card, gridColumn: '1 / -1' }}>
```

Find the Leaderboard button in the footer and add `id="menu-leaderboard-btn"`:
```tsx
<button id="menu-leaderboard-btn" onClick={() => navigate('/leaderboard')} ...>
```

Find the profile area in the header and add `id="menu-profile"`:
```tsx
<div id="menu-profile" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
```
(Wrap the profile block in this div if it isn't already a single element.)

**Step 6: Replace the TutorialOverlay block**

Remove the `showTutorial &&` block and the TutorialOverlay import entirely. Also remove the `useLoginStreak` reward modal's reference to `showTutorial` if present.

**Step 7: Add "How to Play" button to the Play card**

Inside the Play card, after the Multiplayer button:

```tsx
<button style={modeBtn(false)} onClick={() => navigate('/how-to-play')}>How to Play</button>
```

**Step 8: Verify the app starts without errors**

```bash
npm start
```

Open `localhost:3000`. Login and check the main menu renders. No console errors.

**Step 9: Commit**

```bash
git add src/components/MainMenu.tsx
git commit -m "feat: add Intro.js spotlight tour to main menu"
```

---

## Task 5: Update SettingsPage — add Replay Tutorial section

**Files:**
- Modify: `src/components/profile/SettingsPage.tsx`

**Step 1: Import useTutorial**

Add to existing imports:
```typescript
import { useTutorial } from '../../hooks/useTutorial';
```

**Step 2: Add hook call inside the component**

After the existing state declarations:
```typescript
const { resetTutorial } = useTutorial('home');
const [resetMsg, setResetMsg] = useState('');
```

**Step 3: Add the Replay Tutorial section**

Add this block after the Account section (sign out button), before the closing `</div>`:

```tsx
{/* Tutorial */}
<div style={{ background: '#2a3441', borderRadius: '12px', padding: '24px', marginTop: '16px' }}>
  <div style={{ fontWeight: 'bold', marginBottom: '16px', color: '#a0aec0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tutorial</div>
  <button
    onClick={async () => {
      await resetTutorial();
      setResetMsg('Tutorial will show next time you visit the home screen.');
      setTimeout(() => setResetMsg(''), 3000);
    }}
    style={{ background: 'none', border: '1px solid #4a5568', color: '#a0aec0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
  >
    Replay Home Tutorial
  </button>
  {resetMsg && <div style={{ fontSize: '12px', color: '#00d4aa', marginTop: '8px' }}>{resetMsg}</div>}
</div>
```

**Step 4: Run tests**

```bash
npm test -- --watchAll=false
```

Expected: all pass.

**Step 5: Commit**

```bash
git add src/components/profile/SettingsPage.tsx
git commit -m "feat: add replay tutorial button to settings page"
```

---

## Task 6: Create tutorialScript.ts

This is the **only file that needs editing to change tutorial content**. All step definitions live here.

**Files:**
- Create: `src/components/game/tutorialScript.ts`

**Step 1: Create the file**

```typescript
// ─────────────────────────────────────────────────────────────────────────────
// TUTORIAL SCRIPT
//
// Edit this file to change what the tutorial says and does.
// You do NOT need to touch HowToPlayPage.tsx.
//
// HOW THE BOARD IS INDEXED
// Boards and cells are flat 9-element arrays, indexed like this:
//
//   0 | 1 | 2
//   ---------
//   3 | 4 | 5
//   ---------
//   6 | 7 | 8
//
// Each of the 9 micro boards has the same layout for its cells.
// ─────────────────────────────────────────────────────────────────────────────

export interface TutorialStep {
  // The intro.js tooltip title (shown in bold above the description).
  // Optional — leave out for steps with no title.
  title?: string;

  // The intro.js tooltip text. HTML is supported (e.g. <b>bold</b>).
  intro: string;

  // CSS selector of the DOM element intro.js should spotlight.
  // Use '#tutorial-micro-N' to target micro board N (0–8).
  // Use '#tutorial-macro-board' to target the whole macro board.
  // Use '#tutorial-cell-B-C' to target cell C in micro board B.
  targetSelector: string;

  // Set to true if this step waits for the player to click a cell
  // instead of using intro.js's built-in Next button.
  // When true, the Next button is hidden automatically.
  requiresClick: boolean;

  // Which micro board the player must click into on this step.
  // Only used when requiresClick is true. null = no click required.
  boardIndex: number | null;

  // Which cell within that micro board the player must click.
  // Only used when requiresClick is true. null = no click required.
  cellIndex: number | null;

  // Whether the AI should make a scripted move AFTER this step completes.
  // The AI move is defined by aiBoardIndex + aiCellIndex below.
  aiMoveAfter: boolean;

  // Which micro board the AI plays into after this step.
  // Only used when aiMoveAfter is true.
  aiBoardIndex: number | null;

  // Which cell the AI plays into after this step.
  // Only used when aiMoveAfter is true.
  aiCellIndex: number | null;

  // Draw an arrow between two elements on this step.
  // Set to null for no arrow.
  //
  // Example:
  //   arrow: {
  //     from: '#tutorial-micro-4',   // arrow tail — the micro board
  //     to:   '#tutorial-micro-4',   // arrow head — same element, different context
  //   }
  //
  // Typical use: from: the cell just played, to: the micro board the opponent is forced into.
  // Or: from: a micro board, to: the macro board (showing the claim).
  arrow: {
    // CSS selector of the element where the arrow starts
    from: string;
    // CSS selector of the element where the arrow points
    to: string;
  } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// THE SCRIPT
//
// Add, remove, or reorder steps freely.
// Keep boardIndex/cellIndex consistent with valid game moves —
// the game engine enforces the real rules even in tutorial mode.
// ─────────────────────────────────────────────────────────────────────────────

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ── Step 1: Introduce the whole board ────────────────────────────────────
  {
    title: 'Welcome to MEGA OX',
    intro:
      'This is an <b>Ultimate Tic-Tac-Toe</b> board — 9 small boards arranged in a 3×3 grid. ' +
      'Win a small board to claim that position on the big grid. ' +
      'Win three positions in a row on the big grid to win the game.',
    targetSelector: '#tutorial-macro-board',
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 2: Explain the constraint rule ──────────────────────────────────
  {
    title: 'Your move matters twice',
    intro:
      'The cell you play in determines <b>which board your opponent must play in next</b>. ' +
      'Play in the centre cell → your opponent is sent to the centre board. ' +
      'Plan ahead — every move is a move for you and a constraint for them.',
    targetSelector: '#tutorial-micro-4', // centre micro board
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    // Arrow: from the centre micro board → to itself, illustrating the "sent here" concept.
    // Change the selectors to point to different elements if you have a better visual.
    arrow: {
      from: '#tutorial-micro-4',
      to: '#tutorial-macro-board',
    },
  },

  // ── Step 3: Player makes their first move ────────────────────────────────
  {
    title: 'Your turn',
    intro: 'Click the <b>highlighted cell</b> to place your first X. You can play anywhere on this first move.',
    targetSelector: '#tutorial-cell-4-4', // centre cell of centre board
    requiresClick: true,
    boardIndex: 4,   // centre micro board
    cellIndex: 4,    // centre cell
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 4: Show where the opponent is forced ────────────────────────────
  {
    title: 'You sent your opponent here',
    intro:
      'You played in position 4 (centre). ' +
      'That sends your opponent to <b>board 4</b> — the centre board. ' +
      'The arrow shows where they must play.',
    targetSelector: '#tutorial-micro-4',
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: true,
    aiBoardIndex: 4,  // AI plays in centre board
    aiCellIndex: 0,   // AI plays top-left cell of centre board
    // Arrow: from the cell just played → to the forced micro board
    arrow: {
      from: '#tutorial-cell-4-4',
      to: '#tutorial-micro-4',
    },
  },

  // ── Step 5: Opponent played — show where you are now sent ─────────────────
  {
    title: "Opponent's move",
    intro:
      'The opponent played in position 0 of the centre board. ' +
      'That sends <b>you</b> to board 0 — the top-left board. ' +
      'The highlighted board is where you must play next.',
    targetSelector: '#tutorial-micro-0',
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: {
      from: '#tutorial-cell-4-0',
      to: '#tutorial-micro-0',
    },
  },

  // ── Step 6: Player builds toward winning a micro board ───────────────────
  {
    title: 'Build a line',
    intro: 'Click here to start building a line in the top-left board.',
    targetSelector: '#tutorial-cell-0-4', // centre cell of top-left board
    requiresClick: true,
    boardIndex: 0,
    cellIndex: 4,
    aiMoveAfter: true,
    aiBoardIndex: 4,   // AI plays in centre board (sent there by player's move)
    aiCellIndex: 8,    // AI plays bottom-right of centre board
    arrow: null,
  },

  // ── Step 7: Player wins the micro board ──────────────────────────────────
  {
    title: 'Win this board',
    intro:
      'Click here to win the top-left board. ' +
      'Winning it <b>claims that position</b> on the macro grid — ' +
      'watch the arrow show which macro cell you\'re claiming.',
    targetSelector: '#tutorial-cell-0-8', // bottom-right of top-left board — completes a diagonal
    requiresClick: true,
    boardIndex: 0,
    cellIndex: 8,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    // Arrow: from the micro board just won → to the macro board (showing the claim)
    arrow: {
      from: '#tutorial-micro-0',
      to: '#tutorial-macro-board',
    },
  },

  // ── Step 8: Closing step ─────────────────────────────────────────────────
  {
    title: "You're ready",
    intro:
      'Win three macro cells in a row — horizontally, vertically, or diagonally — to win the game. ' +
      'Good luck!',
    targetSelector: '#tutorial-macro-board',
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },
];
```

**Step 2: Commit**

```bash
git add src/components/game/tutorialScript.ts
git commit -m "feat: add editable tutorial script for How to Play game"
```

---

## Task 7: Create HowToPlayPage.tsx

**Files:**
- Create: `src/components/game/HowToPlayPage.tsx`

**Step 1: Read GameWrapper.tsx first**

Before writing HowToPlayPage, read `src/components/GameWrapper.tsx` to understand how `Game` is used with React state (the spread trick). Then write the component below.

**Step 2: Create the component**

```typescript
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import LeaderLine from 'leader-line-new';
import MacroBoard from '../MacroBoard';
import { Game, Marker } from '../../models/Game';
import { TUTORIAL_STEPS } from './tutorialScript';

const HowToPlayPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Game state ─────────────────────────────────────────────────────────────
  // We keep one Game instance and use the spread trick to trigger re-renders.
  const gameRef = useRef(new Game());
  const [game, setGame] = useState(gameRef.current);

  // Force a re-render after mutating the Game instance
  const refreshGame = useCallback(() => {
    setGame({ ...gameRef.current } as Game);
  }, []);

  // ── Tutorial state ─────────────────────────────────────────────────────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const introRef = useRef<ReturnType<typeof introJs> | null>(null);
  const arrowRef = useRef<InstanceType<typeof LeaderLine> | null>(null);

  // ── Add stable IDs to rendered board elements ─────────────────────────────
  // Intro.js and Leader Line target elements by CSS selector.
  // We add IDs here because MacroBoard/MicroBoard don't accept id props.
  const addBoardIds = useCallback(() => {
    // ID the whole macro board wrapper
    const macroEl = document.querySelector('[aria-label="Macro board"]');
    if (macroEl) macroEl.id = 'tutorial-macro-board';

    // ID each micro board: #tutorial-micro-0 through #tutorial-micro-8
    const microEls = document.querySelectorAll('[aria-label^="MicroBoard"], [aria-label="MicroBoard"]');
    microEls.forEach((el, i) => {
      el.id = `tutorial-micro-${i}`;

      // ID each cell within: #tutorial-cell-{boardIndex}-{cellIndex}
      const cells = el.querySelectorAll('button, [role="button"], div[onClick]');
      cells.forEach((cell, j) => {
        (cell as HTMLElement).id = `tutorial-cell-${i}-${j}`;
      });
    });
  }, []);

  // Re-add IDs after every game state change (React re-renders replace DOM nodes)
  useEffect(() => {
    // Small delay so React has committed the new DOM
    const t = setTimeout(addBoardIds, 50);
    return () => clearTimeout(t);
  }, [game, addBoardIds]);

  // ── Draw / remove Leader Line arrow ───────────────────────────────────────
  const drawArrow = useCallback((step: typeof TUTORIAL_STEPS[0]) => {
    // Remove any existing arrow first
    arrowRef.current?.remove();
    arrowRef.current = null;

    if (!step.arrow) return;

    const fromEl = document.querySelector(step.arrow.from);
    const toEl = document.querySelector(step.arrow.to);
    if (!fromEl || !toEl || fromEl === toEl) return;

    arrowRef.current = new LeaderLine(fromEl as Element, toEl as Element, {
      color: '#00d4aa',
      size: 3,
      dash: { animation: true },
      path: 'fluid',
    });
  }, []);

  // ── Advance to the next step ───────────────────────────────────────────────
  const advanceStep = useCallback((nextIndex: number) => {
    if (nextIndex >= TUTORIAL_STEPS.length) {
      // Tour complete — clean up and go home
      arrowRef.current?.remove();
      introRef.current?.exit(true);
      navigate('/');
      return;
    }
    setCurrentStepIndex(nextIndex);
    introRef.current?.goToStepNumber(nextIndex + 1); // intro.js steps are 1-indexed
  }, [navigate]);

  // ── Handle player clicking a tutorial cell ────────────────────────────────
  const handlePlaceMarker = useCallback((microBoardIndex: number, cellIndex: number) => {
    const step = TUTORIAL_STEPS[currentStepIndex];

    // Only allow the scripted cell during a requiresClick step
    if (!step.requiresClick) return;
    if (microBoardIndex !== step.boardIndex || cellIndex !== step.cellIndex) return;

    // Place the player's move
    gameRef.current.placeMarker(microBoardIndex, cellIndex);

    // If the AI should move after this step, place the scripted AI move
    if (step.aiMoveAfter && step.aiBoardIndex !== null && step.aiCellIndex !== null) {
      // Small delay so the player can see their move before AI responds
      setTimeout(() => {
        gameRef.current.placeMarker(step.aiBoardIndex!, step.aiCellIndex!);
        refreshGame();
      }, 600);
    }

    refreshGame();
    advanceStep(currentStepIndex + 1);
  }, [currentStepIndex, refreshGame, advanceStep]);

  // ── Initialise Intro.js ───────────────────────────────────────────────────
  useEffect(() => {
    // Wait for IDs to be added before starting intro.js
    const t = setTimeout(() => {
      const intro = introJs();

      intro.setOptions({
        steps: TUTORIAL_STEPS.map((step) => ({
          element: document.querySelector(step.targetSelector) as Element,
          intro: step.intro,
          title: step.title,
        })),
        nextLabel: 'Next →',
        prevLabel: '← Back',
        doneLabel: 'Done',
        showBullets: true,
        exitOnOverlayClick: false,
        // Prevent intro.js from disabling pointer events on the whole page —
        // we need the game board cells to remain clickable during requiresClick steps
        disableInteraction: false,
      });

      // After each step renders: draw arrow, toggle Next button visibility
      intro.onafterchange(() => {
        const idx = (intro as any)._currentStep as number;
        const step = TUTORIAL_STEPS[idx];
        if (!step) return;

        // Draw arrow for this step (removes previous one automatically)
        // Small delay so the spotlight has settled before we measure element positions
        setTimeout(() => drawArrow(step), 100);

        // Hide Next button on steps that require a cell click
        const nextBtn = document.querySelector('.introjs-nextbutton') as HTMLElement | null;
        if (nextBtn) {
          nextBtn.style.display = step.requiresClick ? 'none' : '';
        }
      });

      intro.oncomplete(() => {
        arrowRef.current?.remove();
        navigate('/');
      });

      intro.onexit(() => {
        arrowRef.current?.remove();
        navigate('/');
      });

      intro.start();
      introRef.current = intro;
    }, 200);

    return () => {
      clearTimeout(t);
      arrowRef.current?.remove();
      introRef.current?.exit(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derive MacroBoard props from current Game state ───────────────────────
  const microBoards = game.macroBoard?.microBoards.map((mb: any) => ({
    cells: mb.cells.map((c: any) => c.marker),
    winner: mb.winner ?? '',
  })) ?? Array(9).fill({ cells: Array(9).fill(''), winner: '' });

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Cells outside the scripted target are visually dimmed but clicks are blocked
  // in handlePlaceMarker rather than via the disabled prop, so intro.js can still
  // highlight them. MicroBoards that aren't the target board are fully disabled.
  const getDisabled = (boardIndex: number) => {
    if (!currentStep?.requiresClick) return true;
    return boardIndex !== currentStep.boardIndex;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* Exit button */}
      <button
        onClick={() => navigate('/')}
        style={{ position: 'fixed', top: '16px', left: '16px', background: 'none', border: '1px solid #4a5568', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', zIndex: 99999999 }}
      >
        ← Exit Tutorial
      </button>

      {/* The game board — same components as the real game */}
      <MacroBoard
        microBoards={microBoards}
        onPlaceMarker={handlePlaceMarker}
        nextMicroBoardIndex={game.nextMicroBoardIndex ?? null}
        macroWinner={game.macroBoard?.winner ?? ''}
        lastMove={null}
      />
    </div>
  );
};

export default HowToPlayPage;
```

**Step 3: Commit**

```bash
git add src/components/game/HowToPlayPage.tsx
git commit -m "feat: add HowToPlayPage with Intro.js spotlight and Leader Line arrows"
```

---

## Task 8: Add /how-to-play route to App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add the import**

After the existing game imports:
```typescript
import HowToPlayPage from './components/game/HowToPlayPage';
```

**Step 2: Add the route**

Add this line in the public routes section (alongside `/leaderboard` and `/season`):

```tsx
<Route path="/how-to-play" element={<HowToPlayPage />} />
```

**Step 3: Run tests and build**

```bash
npm test -- --watchAll=false
npm run build
```

Expected: all tests pass, build succeeds.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add /how-to-play route"
```

---

## Task 9: Manual smoke test

**Steps:**

1. Start app: `npm start`
2. Login → verify the main menu spotlight tour auto-starts
3. Walk through all 5 steps — verify each spotlight targets the correct element
4. Refresh and login again — verify the tour does NOT re-fire (marked complete)
5. Go to Settings → click "Replay Home Tutorial" → go back to main menu → verify tour fires again
6. From main menu Play card, click "How to Play" → verify it navigates to `/how-to-play`
7. Walk through the tutorial game:
   - Verify intro.js spotlight highlights the correct elements per step
   - On requiresClick steps: verify clicking the wrong cell does nothing
   - On requiresClick steps: verify clicking the correct cell places the marker and advances
   - Verify arrows appear on the steps that have them
   - Verify arrows are removed when advancing to a step without one
8. Click "Exit Tutorial" → verify it returns to main menu

**Step 2: Final commit**

```bash
git add .
git commit -m "feat: complete Intro.js tutorial system — main menu tour and How to Play game"
```

---

## Notes for the tutorial author (editing tutorialScript.ts)

When writing your own steps:

- **Board index 4** is always the centre — the most important to teach
- **The constraint rule** (cell position = forced board) is the thing new players miss — make sure at least 2 steps demonstrate it
- Keep steps short — one idea per step
- `requiresClick: true` means the player must click to advance — don't use this for explanation steps
- If your scripted moves are invalid (e.g. playing in a won board, wrong turn), the Game engine will silently reject them — test your script in-game
- The AI moves (`aiMoveAfter`) are scripted — they bypass AI logic entirely
