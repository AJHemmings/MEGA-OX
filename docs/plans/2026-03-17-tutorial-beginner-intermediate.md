# Tutorial Beginner / Intermediate Split — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the single `/how-to-play` tutorial into Beginner (7 steps, chain rule only) and Intermediate (14 steps, full endgame), reachable via a mode-selection screen.

**Architecture:** `tutorialScript.ts` exports two named step arrays; `HowToPlayPage` reads a URL param to pick which array to use; a new `HowToPlaySelectPage` sits at `/how-to-play` and routes the user to `/how-to-play/beginner` or `/how-to-play/intermediate`.

**Tech Stack:** React, React Router v7, TypeScript, inline CSS (no framework).

---

### Task 1: Rename and split step arrays in tutorialScript.ts

**Files:**
- Modify: `src/components/game/tutorialScript.ts`

**Step 1: Rename the export**

Find the line (near the bottom of the file):
```ts
export const TUTORIAL_STEPS: TutorialStep[] = [
```
Change it to:
```ts
export const INTERMEDIATE_STEPS: TutorialStep[] = [
```

**Step 2: Add BEGINNER_STEPS after the array closing bracket**

After the closing `];` of `INTERMEDIATE_STEPS`, add:
```ts
export const BEGINNER_STEPS: TutorialStep[] = INTERMEDIATE_STEPS.slice(0, 7);
```
Beginner = steps idx 0–6 (Welcome → Key rule → First move → AI spotlight → Chain → Forced board → Bridge).

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no output (clean).

**Step 4: Commit**

```bash
git add src/components/game/tutorialScript.ts
git commit -m "refactor: rename TUTORIAL_STEPS to INTERMEDIATE_STEPS, add BEGINNER_STEPS"
```

---

### Task 2: Update HowToPlayPage to use URL param

**Files:**
- Modify: `src/components/game/HowToPlayPage.tsx`

**Step 1: Update the react-router-dom import**

Find:
```ts
import { useNavigate } from 'react-router-dom';
```
Replace with:
```ts
import { useNavigate, useParams } from 'react-router-dom';
```

**Step 2: Update the tutorialScript import**

Find:
```ts
import { TUTORIAL_STEPS } from './tutorialScript';
```
Replace with:
```ts
import { BEGINNER_STEPS, INTERMEDIATE_STEPS } from './tutorialScript';
```

**Step 3: Add the mode param and steps variable inside the component**

Find the line:
```ts
  const navigate = useNavigate();
```
After it, add:
```ts
  const { mode } = useParams<{ mode: string }>();
  const steps = mode === 'beginner' ? BEGINNER_STEPS : INTERMEDIATE_STEPS;
```

**Step 4: Replace all four TUTORIAL_STEPS references with steps**

There are exactly four references. Replace each one:

1. In `advanceStep`:
   ```ts
   // OLD
   if (nextIndex >= TUTORIAL_STEPS.length) {
   // NEW
   if (nextIndex >= steps.length) {
   ```

2. In `handlePlaceMarker`:
   ```ts
   // OLD
   const step = TUTORIAL_STEPS[idx];
   // NEW
   const step = steps[idx];
   ```

3. In the `intro.setOptions` call:
   ```ts
   // OLD
   steps: TUTORIAL_STEPS.map((step) => ({
   // NEW
   steps: steps.map((step) => ({
   ```

4. In `onafterchange`:
   ```ts
   // OLD
   const step = TUTORIAL_STEPS[idx];
   // NEW
   const step = steps[idx];
   ```

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no output.

**Step 6: Commit**

```bash
git add src/components/game/HowToPlayPage.tsx
git commit -m "feat: HowToPlayPage reads mode from URL param to select step array"
```

---

### Task 3: Create HowToPlaySelectPage

**Files:**
- Create: `src/components/game/HowToPlaySelectPage.tsx`

**Step 1: Create the file with this exact content**

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HowToPlaySelectPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a2332',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      gap: '16px',
    }}>
      <h1 style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        How to Play
      </h1>
      <p style={{ color: '#a0aec0', fontSize: '16px', marginBottom: '24px', textAlign: 'center', maxWidth: '400px' }}>
        Choose your starting point.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>

        <button
          onClick={() => navigate('/how-to-play/beginner')}
          style={{
            width: '200px',
            padding: '32px 24px',
            background: '#2d3748',
            border: '2px solid #4a5568',
            borderRadius: '16px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '36px' }}>📖</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>Beginner</span>
          <span style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center' }}>
            Learn the core rule — how every move sends your opponent somewhere.
          </span>
        </button>

        <button
          onClick={() => navigate('/how-to-play/intermediate')}
          style={{
            width: '200px',
            padding: '32px 24px',
            background: '#2d3748',
            border: '2px solid #00d4aa',
            borderRadius: '16px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '36px' }}>⚔️</span>
          <span style={{ fontSize: '20px', fontWeight: 700 }}>Intermediate</span>
          <span style={{ fontSize: '13px', color: '#a0aec0', textAlign: 'center' }}>
            Core rule + a full endgame. Win the middle column to beat X.
          </span>
        </button>

      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: '32px',
          background: 'none',
          border: '1px solid #4a5568',
          color: '#a0aec0',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>
    </div>
  );
};

export default HowToPlaySelectPage;
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no output.

**Step 3: Commit**

```bash
git add src/components/game/HowToPlaySelectPage.tsx
git commit -m "feat: add HowToPlaySelectPage — beginner/intermediate mode selection"
```

---

### Task 4: Update routing in App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add the import**

Find:
```ts
import HowToPlayPage from './components/game/HowToPlayPage';
```
Replace with:
```ts
import HowToPlayPage from './components/game/HowToPlayPage';
import HowToPlaySelectPage from './components/game/HowToPlaySelectPage';
```

**Step 2: Update the routes**

Find:
```tsx
<Route path="/how-to-play" element={<HowToPlayPage />} />
```
Replace with:
```tsx
<Route path="/how-to-play" element={<HowToPlaySelectPage />} />
<Route path="/how-to-play/:mode" element={<HowToPlayPage />} />
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no output.

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: route /how-to-play to select page, /how-to-play/:mode to tutorial"
```

---

### Task 5: Smoke test

**Manual walkthrough:**

1. `npm start` — dev server on `localhost:3000`
2. Navigate to `/how-to-play` — selection screen should appear with two cards
3. Click **Beginner** — should go to `/how-to-play/beginner`, tutorial starts with "Welcome to MEGA OX"
4. Walk all 7 steps; on the last step (bridge "Core rule — complete!"), clicking Done/Next should navigate to `/`
5. Navigate to `/how-to-play` again, click **Intermediate** — full 14-step tutorial
6. Walk to step idx 8 (Circle's move) — verify player can click Board D Cell 2 as O
7. Walk to step idx 10 (X plays Board E centre) — click it; Board H should become active next step
8. Complete through to celebration; Done → `/`
9. Navigate to `/settings` — "Replay Tutorial" button should land back on `/how-to-play` selection screen

**Step 1: Commit handover doc update**

```bash
git add docs/plans/RESTART-HANDOVER.md
git commit -m "docs: update handover — beginner/intermediate tutorial split complete"
```
