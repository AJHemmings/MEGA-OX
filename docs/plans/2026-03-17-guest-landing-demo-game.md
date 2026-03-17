# Guest Landing Page + Demo Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let unauthenticated users land on a guest page at `/`, see what they unlock with an account, and play a demo game at `/demo` with an always-visible signup sidebar.

**Architecture:** Move `/` outside `ProtectedRoute` and render a `GuestLandingPage` (unauthenticated) or redirect to `/menu` (authenticated). Add a public `/demo` route that wraps `GameWrapper` with a signup sidebar and a post-game modal that extends the game-over state. `GameWrapper` gets an optional `onGameOver` prop so `DemoGamePage` can intercept the result and show its own modal.

**Tech Stack:** React, React Router v7, TypeScript, inline CSS (no CSS framework), existing `Modal` component, existing `GameWrapper`, `AuthContext`.

---

### Task 1: Create the feature branch

**Step 1: Create and switch to the feature branch**

```bash
git checkout -b feat/guest-landing-demo
```

**Step 2: Verify**

```bash
git branch
```
Expected: `* feat/guest-landing-demo` is highlighted.

---

### Task 2: Add `onGameOver` prop to `GameWrapper`

This lets `DemoGamePage` intercept the game-over event and show its own modal, instead of the inline winner div.

**Files:**
- Modify: `src/components/GameWrapper.tsx`

**Step 1: Update the props interface**

In `GameWrapper.tsx`, find the `GameWrapperProps` interface (line 8–11) and add the optional prop:

```typescript
interface GameWrapperProps {
  gameMode: "single" | "local";
  onBackToMenu: () => void;
  onGameOver?: (winner: string) => void;
}
```

**Step 2: Destructure the new prop**

Find line 13–16 and update the destructure:

```typescript
const GameWrapper: React.FC<GameWrapperProps> = ({
  gameMode,
  onBackToMenu,
  onGameOver,
}) => {
```

**Step 3: Fire `onGameOver` when the game ends**

Add a `useEffect` immediately after the existing AI `useEffect` (after line 49):

```typescript
useEffect(() => {
  if (gameOver && onGameOver) {
    onGameOver(winner === Marker.None ? 'draw' : winner);
  }
}, [gameOver]);
```

**Step 4: Suppress the inline game-over div when `onGameOver` is provided**

Find the `{gameOver && (` block (around line 322) and wrap it:

```typescript
{gameOver && !onGameOver && (
  <div
    // ... existing styles unchanged
  >
    {getWinnerText()}
  </div>
)}
```

**Step 5: Manual check**

Start the dev server (`npm start`). Navigate to `/training`. Play a game to completion. The winner div should still appear (no `onGameOver` passed). If it does, proceed.

**Step 6: Commit**

```bash
git add src/components/GameWrapper.tsx
git commit -m "feat: add optional onGameOver prop to GameWrapper"
```

---

### Task 3: Create `GuestLandingPage`

**Files:**
- Create: `src/components/GuestLandingPage.tsx`

**Step 1: Create the file**

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const UNLOCK_FEATURES = [
  'Online multiplayer — play against others in real time',
  'Leaderboard — track your ranking and win rate',
  'Game history — review every game you've played',
  'Profile customisation — username and avatar',
];

const GuestLandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1a2332',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        padding: '40px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        {/* Game name */}
        <h1
          style={{
            fontSize: '3.5em',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#00d4aa',
            letterSpacing: '4px',
          }}
        >
          MEGA OX
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: '1.1em',
            color: '#a0aec0',
            margin: '0 0 40px 0',
          }}
        >
          Ultimate Noughts &amp; Crosses. Every move matters.
        </p>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/demo')}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '18px',
            fontWeight: 'bold',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: '#00d4aa',
            color: '#1a2332',
            cursor: 'pointer',
            marginBottom: '32px',
            boxShadow: '0 8px 25px #00d4aa40',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 35px #00d4aa60';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px #00d4aa40';
          }}
        >
          Play Demo
        </button>

        {/* Unlock list */}
        <div
          style={{
            backgroundColor: '#2a3441',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '28px',
            textAlign: 'left',
          }}
        >
          <p
            style={{
              margin: '0 0 16px 0',
              fontWeight: 'bold',
              color: '#ffffff',
              fontSize: '15px',
            }}
          >
            Create an account to unlock:
          </p>
          <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#a0aec0', lineHeight: '2' }}>
            {UNLOCK_FEATURES.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        {/* Auth links */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: '2px solid #00d4aa',
              backgroundColor: 'transparent',
              color: '#00d4aa',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00d4aa';
              e.currentTarget.style.color = '#1a2332';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#00d4aa';
            }}
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '12px',
              border: '2px solid #4299e1',
              backgroundColor: 'transparent',
              color: '#4299e1',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4299e1';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#4299e1';
            }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestLandingPage;
```

**Step 2: Manual check (deferred — test after App.tsx is wired up in Task 5)**

**Step 3: Commit**

```bash
git add src/components/GuestLandingPage.tsx
git commit -m "feat: add GuestLandingPage component"
```

---

### Task 4: Create `DemoGamePage`

**Files:**
- Create: `src/components/DemoGamePage.tsx`

**Step 1: Create the file**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameWrapper from './GameWrapper';
import { Modal } from './modal';

const UNLOCK_FEATURES = [
  'Online multiplayer',
  'Leaderboard & stats',
  'Game history',
  'Profile customisation',
];

const DemoGamePage: React.FC = () => {
  const navigate = useNavigate();
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const handleGameOver = (result: string) => {
    setGameOverResult(result);
  };

  const handlePlayAgain = () => {
    setGameOverResult(null);
    setGameKey((k) => k + 1); // forces GameWrapper remount = fresh game
  };

  const getResultText = () => {
    if (gameOverResult === 'X') return "You won! 🎉";
    if (gameOverResult === 'O') return "AI wins! 🤖";
    return "It's a draw!";
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1a2332',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        gap: '24px',
        padding: '20px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        flexWrap: 'wrap',
      }}
    >
      {/* Game area */}
      <div style={{ flex: '0 0 auto' }}>
        <GameWrapper
          key={gameKey}
          gameMode="single"
          onBackToMenu={() => navigate('/')}
          onGameOver={handleGameOver}
        />
      </div>

      {/* Signup sidebar */}
      <div
        style={{
          flex: '0 0 240px',
          backgroundColor: '#2a3441',
          borderRadius: '16px',
          padding: '24px',
          color: '#ffffff',
          alignSelf: 'flex-start',
          marginTop: '20px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2em', color: '#00d4aa' }}>
          Want more?
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#a0aec0', fontSize: '14px' }}>
          Create a free account to unlock:
        </p>
        <ul
          style={{
            margin: '0 0 24px 0',
            padding: '0 0 0 18px',
            color: '#a0aec0',
            fontSize: '14px',
            lineHeight: '2',
          }}
        >
          {UNLOCK_FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>

        <button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            padding: '12px',
            fontWeight: 'bold',
            fontSize: '15px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#00d4aa',
            color: '#1a2332',
            cursor: 'pointer',
            marginBottom: '10px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px #00d4aa40',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 25px #00d4aa60';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px #00d4aa40';
          }}
        >
          Sign Up
        </button>

        <button
          onClick={() => navigate('/login')}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            borderRadius: '12px',
            border: '2px solid #4299e1',
            backgroundColor: 'transparent',
            color: '#4299e1',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4299e1';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#4299e1';
          }}
        >
          Log In
        </button>
      </div>

      {/* Post-game modal */}
      <Modal
        isOpen={gameOverResult !== null}
        onClose={handlePlayAgain}
        title={getResultText()}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#a0aec0', marginBottom: '24px' }}>
            Sign up to save your stats, play online, and customise your profile.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '13px',
                fontWeight: 'bold',
                fontSize: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#00d4aa',
                color: '#1a2332',
                cursor: 'pointer',
                boxShadow: '0 4px 15px #00d4aa40',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '11px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '2px solid #4299e1',
                backgroundColor: 'transparent',
                color: '#4299e1',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#4299e1';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4299e1';
              }}
            >
              Log In
            </button>
            <button
              onClick={handlePlayAgain}
              style={{
                padding: '11px',
                fontSize: '15px',
                borderRadius: '12px',
                border: '2px solid #718096',
                backgroundColor: 'transparent',
                color: '#718096',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#a0aec0';
                e.currentTarget.style.color = '#a0aec0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#718096';
                e.currentTarget.style.color = '#718096';
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DemoGamePage;
```

**Step 2: Manual check (deferred — test after App.tsx is wired up in Task 5)**

**Step 3: Commit**

```bash
git add src/components/DemoGamePage.tsx
git commit -m "feat: add DemoGamePage with sidebar and post-game signup prompt"
```

---

### Task 5: Wire up routes in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add imports at the top of `App.tsx`**

After the existing imports, add:

```typescript
import GuestLandingPage from './components/GuestLandingPage';
import DemoGamePage from './components/DemoGamePage';
```

**Step 2: Add a `RootRoute` wrapper component**

Add this after the existing route wrapper components (e.g. after `OnlineGameRoute`, before `const App`):

```typescript
// Redirects logged-in users away from the guest landing page
const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a2332' }}>
      <div style={{ color: '#00d4aa', fontSize: '18px' }}>Loading...</div>
    </div>
  );
  if (user) return <Navigate to="/menu" replace />;
  return <GuestLandingPage />;
};
```

Also add the `useAuth` import at the top:
```typescript
import { useAuth } from './contexts/AuthContext';
```

**Step 3: Update the routes**

In the `<Routes>` block, make these two changes:

1. Add `/` and `/demo` as public routes (in the public routes section):
```tsx
<Route path="/" element={<RootRoute />} />
<Route path="/demo" element={<DemoGamePage />} />
```

2. Remove `<Route path="/" element={<MainMenu />} />` from inside `<Route element={<ProtectedRoute />}>`.

3. Replace it with `/menu` as the authenticated home:
```tsx
<Route path="/menu" element={<MainMenu />} />
```

The protected block should now look like:
```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/menu" element={<MainMenu />} />
  <Route path="/onboarding" element={<OnboardingPage />} />
  <Route path="/profile/:username" element={<ProfilePage />} />
  <Route path="/settings" element={<SettingsPage />} />
  <Route path="/game/:id" element={<OnlineGameRoute />} />
  <Route path="/matchmaking" element={<MatchmakingPage />} />
</Route>
```

**Step 4: Update back-navigation in `TrainingRoute`**

`TrainingRoute` currently navigates to `/` on back. Update it to `/menu`:

```typescript
const TrainingRoute: React.FC = () => {
  const navigate = useNavigate();
  return <GameWrapper gameMode="single" onBackToMenu={() => navigate('/menu')} />;
};
```

**Step 5: Update any other hardcoded `navigate('/')` calls that should now go to `/menu`**

Search for `navigate('/')` in the codebase and review each one. Only update calls that authenticated users would hit after completing an action (e.g. finishing a game, signing out). Leave links that are intentionally pointing to the landing page.

```bash
grep -r "navigate('/')" src/
```

**Step 6: Manual verification checklist**

Start the dev server (`npm start`) and test each scenario:

- [ ] Visit `http://localhost:3000` while **logged out** → see `GuestLandingPage`
- [ ] Click "Play Demo" → navigates to `/demo`, game board + sidebar visible
- [ ] Play a demo game to completion → post-game modal appears with result + Sign Up + Log In + Play Again
- [ ] Click "Play Again" → modal closes, fresh game starts
- [ ] Click "Sign Up" in the sidebar → navigates to `/signup`
- [ ] Click "Log In" in the sidebar → navigates to `/login`
- [ ] Visit `http://localhost:3000` while **logged in** → redirected to `/menu`
- [ ] `/training` still works for logged-in users

**Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up guest landing and demo routes in App.tsx"
```

---

### Task 6: Update the handover doc

**Files:**
- Modify: `docs/plans/RESTART-HANDOVER.md`

**Step 1: Mark the feature complete in the handover table**

Change the guest landing row from `🔲 Brainstorm started, not yet designed` to `✅ Done`.

**Step 2: Add a note about `/menu` being the authenticated home route**

Under "Key files", note that `MainMenu` is now at `/menu`, not `/`.

**Step 3: Commit**

```bash
git add docs/plans/RESTART-HANDOVER.md
git commit -m "docs: update handover — guest landing + demo game complete"
```
