# Phase 2 — Skin System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the skin system architecture (SkinContext, skin components, Lottie integration) and the RPS mini-game for turn order determination, with all visual rendering currently using placeholder skins.

**Architecture:** A `SkinContext` at `GameWrapper`/`OnlineGameView` level resolves five skin slots per game from a local skin registry. Three new components (`BoardSkin`, `MarkerSkin`, `WonBoardSkin`) wrap Lottie players that respond to game events. RPS runs as a pre-game screen in the online game flow (new `'rps'` game status) and as a one-button random assignment in local play.

**Tech Stack:** React, TypeScript, lottie-react, Supabase Realtime, existing CRA test setup (react-scripts test / Jest)

---

## Codebase orientation

Before starting, read these files to understand what you're modifying:

- `src/components/Cell.tsx` — renders `{value}` (plain string), no skin concept
- `src/components/MicroBoard.tsx` — won board = background colour change + "Winner: X" text
- `src/components/MacroBoard.tsx` — 3×3 grid of MicroBoards, draws its own divider lines
- `src/components/GameWrapper.tsx` — local + single-player game, accepts `gameMode` and `difficulty` props
- `src/components/game/OnlineGameView.tsx` — online game UI, reads from `useOnlineGame`
- `src/hooks/useOnlineGame.ts` — Supabase Realtime hook, reads `player_x_id` to assign `myMarker`
- `src/components/game/MatchmakingPage.tsx` — creates/joins online games, navigates to `/game/:id`
- `src/App.tsx` — all routes; `LocalGameRoute` renders `<GameWrapper gameMode="local" />`
- `src/contexts/AuthContext.tsx` — `useAuth()` gives `user.id`

Key convention: `player_x_id` in the `games` table = the player who moves first (X). `player_o_id` = second player (O).

---

## Task 1: Install lottie-react

**Files:**
- Modify: `package.json` (via npm)

**Step 1: Install the package**

```bash
npm install lottie-react
```

**Step 2: Verify install**

```bash
npm list lottie-react
```

Expected: `lottie-react@x.x.x` printed.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install lottie-react"
```

---

## Task 2: Skin types

**Files:**
- Create: `src/skins/types.ts`

**Step 1: Write the file**

```typescript
// src/skins/types.ts

export type SkinType =
  | 'board'
  | 'marker_x'
  | 'marker_o'
  | 'won_board_x'
  | 'won_board_o';

export type SkinEvent =
  | 'ambient'
  | 'marker_placed'
  | 'board_won'
  | 'board_targeted'
  | 'game_won'
  | 'game_drawn'
  | null;

export interface Skin {
  id: string;
  name: string;
  type: SkinType;
  /** 'placeholder' uses the built-in CSS fallback. A URL loads a Lottie JSON file. */
  assetUrl: 'placeholder' | string;
}

export interface GameSkins {
  boardSkin: Skin;
  p1MarkerSkin: Skin;       // Player 1 is always X
  p2MarkerSkin: Skin;       // Player 2 is always O
  p1WonBoardSkin: Skin;
  p2WonBoardSkin: Skin;
}

export interface EquippedSkins {
  board_skin_id: string | null;
  marker_x_skin_id: string | null;
  marker_o_skin_id: string | null;
  won_board_x_skin_id: string | null;
  won_board_o_skin_id: string | null;
}
```

**Step 2: Commit**

```bash
git add src/skins/types.ts
git commit -m "feat: add skin type definitions"
```

---

## Task 3: Default skins and registry

**Files:**
- Create: `src/skins/defaults.ts`
- Create: `src/skins/registry.ts`

**Step 1: Write defaults.ts**

```typescript
// src/skins/defaults.ts
import { Skin } from './types';

export const DEFAULT_BOARD_SKIN: Skin = {
  id: 'default-board',
  name: 'Default Board',
  type: 'board',
  assetUrl: 'placeholder',
};

export const DEFAULT_MARKER_X_SKIN: Skin = {
  id: 'default-marker-x',
  name: 'Default X',
  type: 'marker_x',
  assetUrl: 'placeholder',
};

export const DEFAULT_MARKER_O_SKIN: Skin = {
  id: 'default-marker-o',
  name: 'Default O',
  type: 'marker_o',
  assetUrl: 'placeholder',
};

export const DEFAULT_WON_BOARD_X_SKIN: Skin = {
  id: 'default-won-board-x',
  name: 'Default Won Board X',
  type: 'won_board_x',
  assetUrl: 'placeholder',
};

export const DEFAULT_WON_BOARD_O_SKIN: Skin = {
  id: 'default-won-board-o',
  name: 'Default Won Board O',
  type: 'won_board_o',
  assetUrl: 'placeholder',
};

export const ALL_DEFAULT_SKINS: Skin[] = [
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
];
```

**Step 2: Write registry.ts**

```typescript
// src/skins/registry.ts
import { Skin } from './types';
import { ALL_DEFAULT_SKINS } from './defaults';

const skinRegistry = new Map<string, Skin>();

// Seed with defaults
ALL_DEFAULT_SKINS.forEach(skin => skinRegistry.set(skin.id, skin));

export const getSkin = (id: string | null | undefined, fallback: Skin): Skin => {
  if (!id) return fallback;
  return skinRegistry.get(id) ?? fallback;
};

/** In Phase 6: replace this with a Supabase Storage fetch. */
export const registerSkin = (skin: Skin): void => {
  skinRegistry.set(skin.id, skin);
};
```

**Step 3: Commit**

```bash
git add src/skins/defaults.ts src/skins/registry.ts
git commit -m "feat: add skin registry and default skins"
```

---

## Task 4: Skin resolver (with unit tests)

**Files:**
- Create: `src/skins/resolver.ts`
- Create: `src/__tests__/skinResolver.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/skinResolver.test.ts
import { resolveGameSkins } from '../skins/resolver';
import { EquippedSkins, GameSkins } from '../skins/types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../skins/defaults';

const emptyEquipped: EquippedSkins = {
  board_skin_id: null,
  marker_x_skin_id: null,
  marker_o_skin_id: null,
  won_board_x_skin_id: null,
  won_board_o_skin_id: null,
};

describe('resolveGameSkins', () => {
  it('returns all defaults when both players have no skins equipped', () => {
    const result: GameSkins = resolveGameSkins(emptyEquipped, emptyEquipped);
    expect(result.boardSkin).toEqual(DEFAULT_BOARD_SKIN);
    expect(result.p1MarkerSkin).toEqual(DEFAULT_MARKER_X_SKIN);
    expect(result.p2MarkerSkin).toEqual(DEFAULT_MARKER_O_SKIN);
    expect(result.p1WonBoardSkin).toEqual(DEFAULT_WON_BOARD_X_SKIN);
    expect(result.p2WonBoardSkin).toEqual(DEFAULT_WON_BOARD_O_SKIN);
  });

  it('uses p2 board skin for the board', () => {
    const result = resolveGameSkins(emptyEquipped, {
      ...emptyEquipped,
      board_skin_id: 'default-board', // same ID as default for simplicity
    });
    expect(result.boardSkin.id).toBe('default-board');
  });

  it('uses p1 marker_x skin for p1 marker', () => {
    const result = resolveGameSkins(
      { ...emptyEquipped, marker_x_skin_id: 'default-marker-x' },
      emptyEquipped
    );
    expect(result.p1MarkerSkin.id).toBe('default-marker-x');
  });
});
```

**Step 2: Run test — expect it to fail**

```bash
npm test -- --testPathPattern=skinResolver --watchAll=false
```

Expected: FAIL — `resolveGameSkins` not found.

**Step 3: Write resolver.ts**

```typescript
// src/skins/resolver.ts
import { EquippedSkins, GameSkins } from './types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from './defaults';
import { getSkin } from './registry';

/**
 * Resolves which skins appear in a game given both players' equipped skins.
 * p1Skins = Player 1 (X, goes first, won RPS)
 * p2Skins = Player 2 (O, goes second, owns the board background)
 */
export const resolveGameSkins = (
  p1Skins: EquippedSkins,
  p2Skins: EquippedSkins
): GameSkins => ({
  boardSkin:      getSkin(p2Skins.board_skin_id,       DEFAULT_BOARD_SKIN),
  p1MarkerSkin:   getSkin(p1Skins.marker_x_skin_id,    DEFAULT_MARKER_X_SKIN),
  p2MarkerSkin:   getSkin(p2Skins.marker_o_skin_id,    DEFAULT_MARKER_O_SKIN),
  p1WonBoardSkin: getSkin(p1Skins.won_board_x_skin_id, DEFAULT_WON_BOARD_X_SKIN),
  p2WonBoardSkin: getSkin(p2Skins.won_board_o_skin_id, DEFAULT_WON_BOARD_O_SKIN),
});
```

**Step 4: Run test — expect pass**

```bash
npm test -- --testPathPattern=skinResolver --watchAll=false
```

Expected: PASS, 3 tests.

**Step 5: Commit**

```bash
git add src/skins/resolver.ts src/__tests__/skinResolver.test.ts
git commit -m "feat: add skin resolver with tests"
```

---

## Task 5: SkinContext

**Files:**
- Create: `src/contexts/SkinContext.tsx`

**Step 1: Write the file**

```typescript
// src/contexts/SkinContext.tsx
import React, { createContext, useContext } from 'react';
import { GameSkins } from '../skins/types';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../skins/defaults';

const defaultGameSkins: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

const SkinContext = createContext<GameSkins>(defaultGameSkins);

export const SkinProvider: React.FC<{
  skins: GameSkins;
  children: React.ReactNode;
}> = ({ skins, children }) => (
  <SkinContext.Provider value={skins}>{children}</SkinContext.Provider>
);

export const useSkins = () => useContext(SkinContext);
```

**Step 2: Commit**

```bash
git add src/contexts/SkinContext.tsx
git commit -m "feat: add SkinContext and SkinProvider"
```

---

## Task 6: MarkerSkin component

**Files:**
- Create: `src/components/skins/MarkerSkin.tsx`

The component renders the player's marker. In Phase 2 all skins have `assetUrl: 'placeholder'`, so the Lottie branch is never reached — it renders the current styled X or O text. When real Lottie skins are added in Phase 5, the placeholder branch is bypassed automatically.

**Step 1: Write the component**

```typescript
// src/components/skins/MarkerSkin.tsx
import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useSkins } from '../../contexts/SkinContext';
import { SkinEvent } from '../../skins/types';

interface MarkerSkinProps {
  player: 1 | 2;
  value: string;             // '' | 'X' | 'O' — from cell data
  currentEvent?: SkinEvent;
}

const PLACEHOLDER_STYLE: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  lineHeight: 1,
  userSelect: 'none',
};

const MarkerSkin: React.FC<MarkerSkinProps> = ({ player, value, currentEvent }) => {
  const skins = useSkins();
  const skin = player === 1 ? skins.p1MarkerSkin : skins.p2MarkerSkin;
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Trigger animation segment when event changes
  useEffect(() => {
    if (!lottieRef.current || skin.assetUrl === 'placeholder') return;
    // Phase 5: map SkinEvent → Lottie segment frames here
  }, [currentEvent, skin]);

  if (!value) return null;

  if (skin.assetUrl === 'placeholder') {
    return (
      <span style={{
        ...PLACEHOLDER_STYLE,
        color: player === 1 ? '#3399ff' : '#ff6b6b',
      }}>
        {value}
      </span>
    );
  }

  // Real Lottie skin (Phase 5+)
  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={skin.assetUrl}
      loop
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default MarkerSkin;
```

**Step 2: Commit**

```bash
git add src/components/skins/MarkerSkin.tsx
git commit -m "feat: add MarkerSkin component"
```

---

## Task 7: WonBoardSkin component

**Files:**
- Create: `src/components/skins/WonBoardSkin.tsx`

**Step 1: Write the component**

```typescript
// src/components/skins/WonBoardSkin.tsx
import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useSkins } from '../../contexts/SkinContext';
import { SkinEvent } from '../../skins/types';

interface WonBoardSkinProps {
  player: 1 | 2;
  currentEvent?: SkinEvent;
}

const WonBoardSkin: React.FC<WonBoardSkinProps> = ({ player, currentEvent }) => {
  const skins = useSkins();
  const skin = player === 1 ? skins.p1WonBoardSkin : skins.p2WonBoardSkin;
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (!lottieRef.current || skin.assetUrl === 'placeholder') return;
    // Phase 5: map SkinEvent → Lottie segment frames here
  }, [currentEvent, skin]);

  if (skin.assetUrl === 'placeholder') {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: player === 1 ? '#a0d8f080' : '#f0a0a080',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 2,
      }}>
        <span style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: player === 1 ? '#3399ff' : '#ff6b6b',
          opacity: 0.7,
        }}>
          {player === 1 ? 'X' : 'O'}
        </span>
      </div>
    );
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={skin.assetUrl}
      loop
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}
    />
  );
};

export default WonBoardSkin;
```

**Step 2: Commit**

```bash
git add src/components/skins/WonBoardSkin.tsx
git commit -m "feat: add WonBoardSkin component"
```

---

## Task 8: BoardSkin component

**Files:**
- Create: `src/components/skins/BoardSkin.tsx`

In Phase 2, the placeholder simply renders its children — it doesn't change the board's appearance. The current `MacroBoard` CSS grid lines remain visible. A real Lottie board skin in Phase 5 replaces the board background entirely.

**Step 1: Write the component**

```typescript
// src/components/skins/BoardSkin.tsx
import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useSkins } from '../../contexts/SkinContext';
import { SkinEvent } from '../../skins/types';

interface BoardSkinProps {
  currentEvent?: SkinEvent;
  children: React.ReactNode;
}

const BoardSkin: React.FC<BoardSkinProps> = ({ currentEvent, children }) => {
  const skins = useSkins();
  const skin = skins.boardSkin;
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (!lottieRef.current || skin.assetUrl === 'placeholder') return;
    // Phase 5: map SkinEvent → Lottie segment frames here
  }, [currentEvent, skin]);

  if (skin.assetUrl === 'placeholder') {
    // Transparent wrapper — board renders as normal
    return <div style={{ position: 'relative', display: 'inline-block' }}>{children}</div>;
  }

  // Real Lottie board skin (Phase 5+) — sits behind children
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={skin.assetUrl}
        loop
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};

export default BoardSkin;
```

**Step 2: Commit**

```bash
git add src/components/skins/BoardSkin.tsx
git commit -m "feat: add BoardSkin component"
```

---

## Task 9: Wire Cell.tsx to use MarkerSkin

**Files:**
- Modify: `src/components/Cell.tsx`

The `value` prop currently renders as `{value}`. Replace it with `<MarkerSkin>`. The `player` prop must be added to `Cell` so it knows whose skin to use.

**Step 1: Read the current Cell.tsx**

Read `src/components/Cell.tsx` in full before editing.

**Step 2: Update CellProps and render**

Add `player?: 1 | 2` to props. Replace `{value}` with `<MarkerSkin player={player ?? 1} value={value} />`.

The updated return statement:

```tsx
import MarkerSkin from './skins/MarkerSkin';

// Add to CellProps:
// player?: 1 | 2;

return (
  <button
    ref={cellRef}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '40px',
      height: '40px',
      fontSize: '24px',
      fontWeight: 'bold',
      cursor: disabled ? 'default' : 'pointer',
      backgroundColor: highlight ? '#def' : '#fff',
      border: '1px solid #555',
      outline: 'none',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    }}
    aria-label={`Cell with value ${value}`}
  >
    <MarkerSkin player={player ?? 1} value={value} />
  </button>
);
```

**Step 3: Update MicroBoard.tsx to pass `player` to Cell**

In `src/components/MicroBoard.tsx`, add `player?: 1 | 2` to `MicroBoardProps`. Pass it through to each `<Cell player={player} />`.

**Step 4: Update MacroBoard.tsx to pass `player` to MicroBoard**

In `src/components/MacroBoard.tsx`, the `microBoards` array items need a `player` field. Add `player: 1 | 2` to the microBoard data shape and pass it down.

> **Note on player assignment:** `value === 'X'` means Player 1 placed it; `value === 'O'` means Player 2. So `player` can be derived from `value` in `Cell` directly — no need to thread it through. Simplify: in `Cell`, derive `player` from `value`:
>
> ```tsx
> const player = value === 'X' ? 1 : 2;
> <MarkerSkin player={player} value={value} />
> ```
>
> This removes the need to add `player` to `MicroBoard` and `MacroBoard` props.

**Step 5: Visual verify**

Run `npm start`. Navigate to `/local`. The board should look identical to before — placeholder skin renders the same coloured X/O text.

**Step 6: Commit**

```bash
git add src/components/Cell.tsx src/components/MicroBoard.tsx
git commit -m "feat: wire Cell to use MarkerSkin component"
```

---

## Task 10: Wire MicroBoard.tsx to use WonBoardSkin

**Files:**
- Modify: `src/components/MicroBoard.tsx`

Replace the background colour logic and `"Winner: {winner}"` text with `<WonBoardSkin>`.

**Step 1: Update MicroBoard**

- Remove the `winner !== '' ? (winner === 'X' ? '#a0d8f0' : '#f0a0a0') : '#fff'` background colour logic. Set `backgroundColor` to `'#fff'` always.
- Remove the `{winner && <div>Winner: {winner}</div>}` block.
- Add `<WonBoardSkin>` overlay when `winner !== ''`.
- Make the outer div `position: 'relative'` (it already has `width: 'max-content'` — add `position`).

```tsx
import WonBoardSkin from './skins/WonBoardSkin';

// In the return, after the cells map:
{winner !== '' && (
  <WonBoardSkin player={winner === 'X' ? 1 : 2} />
)}
```

The outer div style change:
```tsx
const gridStyle: React.CSSProperties = {
  // ... existing styles ...
  backgroundColor: '#fff',         // remove winner-conditional colour
  position: 'relative',            // add this
};
```

**Step 2: Visual verify**

Run `npm start`. Play a game until a micro board is won. The board should show the overlay with a big X or O (placeholder) instead of the background colour change + text.

**Step 3: Commit**

```bash
git add src/components/MicroBoard.tsx
git commit -m "feat: wire MicroBoard to use WonBoardSkin"
```

---

## Task 11: Wire MacroBoard.tsx to use BoardSkin

**Files:**
- Modify: `src/components/MacroBoard.tsx`

Wrap the returned `<div>` with `<BoardSkin>`.

**Step 1: Update MacroBoard**

```tsx
import BoardSkin from './skins/BoardSkin';

// Wrap the return:
return (
  <BoardSkin>
    <div style={gridStyle} aria-label="Macro board">
      {/* existing content unchanged */}
    </div>
  </BoardSkin>
);
```

**Step 2: Visual verify**

Run `npm start`. Board should look identical — `BoardSkin` in placeholder mode is a transparent wrapper.

**Step 3: Commit**

```bash
git add src/components/MacroBoard.tsx
git commit -m "feat: wire MacroBoard to use BoardSkin"
```

---

## Task 12: Provide SkinContext in GameWrapper and OnlineGameView

**Files:**
- Modify: `src/components/GameWrapper.tsx`
- Modify: `src/components/game/OnlineGameView.tsx`

Both need to wrap their board in `<SkinProvider>`. In Phase 2, both use all-default skins. In Phase 6, they'll call the skin resolver with real user data.

**Step 1: Update GameWrapper.tsx**

Add the import and wrap the component's return in `<SkinProvider skins={defaultGameSkins}>`.

```tsx
import { SkinProvider } from '../contexts/SkinContext';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../skins/defaults';
import { GameSkins } from '../skins/types';

const defaultGameSkins: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

// In GameWrapper return, wrap everything:
return (
  <SkinProvider skins={defaultGameSkins}>
    {/* existing JSX */}
  </SkinProvider>
);
```

**Step 2: Update OnlineGameView.tsx**

Same pattern — import `SkinProvider` and the defaults, wrap the active-game JSX.

**Step 3: Visual verify both game modes**

- `/local` — local 2-player game works, skins apply
- `/game/:id` — online game works (start a game in two tabs)

**Step 4: Commit**

```bash
git add src/components/GameWrapper.tsx src/components/game/OnlineGameView.tsx
git commit -m "feat: provide SkinContext in GameWrapper and OnlineGameView"
```

---

## Task 13: Supabase schema — skins tables

**Files:**
- Create: `supabase/migrations/20260318000001_skins.sql` (or run in Supabase SQL editor)

**Step 1: Write the migration**

```sql
-- Skin catalog
CREATE TABLE skins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('board','marker_x','marker_o','won_board_x','won_board_o')),
  asset_url   TEXT NOT NULL DEFAULT 'placeholder',
  price       INTEGER,  -- NULL until Phase 6
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User inventory: one row = ownership
CREATE TABLE user_skins (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skin_id     UUID NOT NULL REFERENCES skins(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skin_id)
);

-- User equipped slots (one row per user, all nullable)
CREATE TABLE user_equipped_skins (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  board_skin_id       UUID REFERENCES skins(id),
  marker_x_skin_id    UUID REFERENCES skins(id),
  marker_o_skin_id    UUID REFERENCES skins(id),
  won_board_x_skin_id UUID REFERENCES skins(id),
  won_board_o_skin_id UUID REFERENCES skins(id)
);

-- Seed default skins
INSERT INTO skins (id, name, type, asset_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Default Board',        'board',        'placeholder'),
  ('00000000-0000-0000-0000-000000000002', 'Default X',            'marker_x',     'placeholder'),
  ('00000000-0000-0000-0000-000000000003', 'Default O',            'marker_o',     'placeholder'),
  ('00000000-0000-0000-0000-000000000004', 'Default Won Board X',  'won_board_x',  'placeholder'),
  ('00000000-0000-0000-0000-000000000005', 'Default Won Board O',  'won_board_o',  'placeholder');

-- RLS: users can read all skins; only service role can insert
ALTER TABLE skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read skins" ON skins FOR SELECT USING (true);

ALTER TABLE user_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own inventory" ON user_skins
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_equipped_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own equipped skins" ON user_equipped_skins
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Step 2: Run in Supabase SQL editor**

Log into the Supabase dashboard → SQL editor → paste and run.

**Step 3: Verify**

In Supabase Table Editor, confirm `skins` has 5 rows.

**Step 4: Commit the migration file**

```bash
git add supabase/migrations/20260318000001_skins.sql
git commit -m "feat: add skins, user_skins, user_equipped_skins tables"
```

---

## Task 14: Supabase schema — RPS columns on games table

**Files:**
- Create: `supabase/migrations/20260318000002_games_rps.sql`

The online RPS flow needs to store each player's pick and uses a new `'rps'` game status.

**Step 1: Write the migration**

```sql
-- Add RPS picks to games table.
-- rps_creator_pick: pick by the player who created the game (player_x_id pre-RPS)
-- rps_joiner_pick:  pick by the player who joined the game (player_o_id pre-RPS)
ALTER TABLE games
  ADD COLUMN rps_creator_pick TEXT,   -- 'rock' | 'paper' | 'scissors' | NULL
  ADD COLUMN rps_joiner_pick  TEXT;   -- 'rock' | 'paper' | 'scissors' | NULL

-- 'rps' is a valid status between 'waiting' and 'active'
-- No enum constraint exists — status is already plain TEXT in this schema.
-- Existing flow: waiting → active
-- New flow:      waiting → rps → active
```

**Step 2: Run in Supabase SQL editor**

**Step 3: Verify columns exist**

In Supabase Table Editor, confirm `games` now has `rps_creator_pick` and `rps_joiner_pick` columns.

**Step 4: Commit**

```bash
git add supabase/migrations/20260318000002_games_rps.sql
git commit -m "feat: add rps_creator_pick and rps_joiner_pick columns to games table"
```

---

## Task 15: RPS logic (pure functions + unit tests)

**Files:**
- Create: `src/lib/rps.ts`
- Create: `src/__tests__/rps.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/__tests__/rps.test.ts
import { resolveRPS, randomRPSPick } from '../lib/rps';

describe('resolveRPS', () => {
  it('returns "draw" on matching picks', () => {
    expect(resolveRPS('rock', 'rock')).toBe('draw');
    expect(resolveRPS('paper', 'paper')).toBe('draw');
  });

  it('rock beats scissors', () => {
    expect(resolveRPS('rock', 'scissors')).toBe('p1');
    expect(resolveRPS('scissors', 'rock')).toBe('p2');
  });

  it('scissors beats paper', () => {
    expect(resolveRPS('scissors', 'paper')).toBe('p1');
    expect(resolveRPS('paper', 'scissors')).toBe('p2');
  });

  it('paper beats rock', () => {
    expect(resolveRPS('paper', 'rock')).toBe('p1');
    expect(resolveRPS('rock', 'paper')).toBe('p2');
  });
});

describe('randomRPSPick', () => {
  it('returns rock, paper, or scissors', () => {
    const valid = new Set(['rock', 'paper', 'scissors']);
    for (let i = 0; i < 20; i++) {
      expect(valid.has(randomRPSPick())).toBe(true);
    }
  });
});
```

**Step 2: Run tests — expect fail**

```bash
npm test -- --testPathPattern=rps --watchAll=false
```

**Step 3: Write rps.ts**

```typescript
// src/lib/rps.ts

export type RPSPick = 'rock' | 'paper' | 'scissors';
export type RPSResult = 'p1' | 'p2' | 'draw';

const PICKS: RPSPick[] = ['rock', 'paper', 'scissors'];

/** Returns 'p1' if p1 wins, 'p2' if p2 wins, 'draw' if tied. */
export const resolveRPS = (p1Pick: RPSPick, p2Pick: RPSPick): RPSResult => {
  if (p1Pick === p2Pick) return 'draw';
  if (
    (p1Pick === 'rock'     && p2Pick === 'scissors') ||
    (p1Pick === 'scissors' && p2Pick === 'paper')    ||
    (p1Pick === 'paper'    && p2Pick === 'rock')
  ) return 'p1';
  return 'p2';
};

export const randomRPSPick = (): RPSPick =>
  PICKS[Math.floor(Math.random() * PICKS.length)];
```

**Step 4: Run tests — expect pass**

```bash
npm test -- --testPathPattern=rps --watchAll=false
```

**Step 5: Commit**

```bash
git add src/lib/rps.ts src/__tests__/rps.test.ts
git commit -m "feat: add RPS logic with tests"
```

---

## Task 16: RPSScreen component (online multiplayer)

**Files:**
- Create: `src/components/game/RPSScreen.tsx`

This component is shown in `OnlineGameView` when `status === 'rps'`. It lets each player submit their pick via Supabase, then waits for the opponent's pick.

**Step 1: Write the component**

```typescript
// src/components/game/RPSScreen.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RPSPick } from '../../lib/rps';

interface RPSScreenProps {
  gameId: string;
  isCreator: boolean;  // true if this player is player_x_id (game creator)
  onResolved: () => void;  // called when both picks are in — triggers re-render
}

const PICKS: RPSPick[] = ['rock', 'paper', 'scissors'];
const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const RPSScreen: React.FC<RPSScreenProps> = ({ gameId, isCreator, onResolved }) => {
  const [myPick, setMyPick] = useState<RPSPick | null>(null);
  const [waiting, setWaiting] = useState(false);

  const submitPick = async (pick: RPSPick) => {
    setMyPick(pick);
    setWaiting(true);
    const column = isCreator ? 'rps_creator_pick' : 'rps_joiner_pick';
    await supabase.from('games').update({ [column]: pick }).eq('id', gameId);
  };

  useEffect(() => {
    const channel = supabase
      .channel(`rps:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}`,
      }, (payload) => {
        const updated = payload.new as any;
        if (updated.rps_creator_pick && updated.rps_joiner_pick) {
          supabase.removeChannel(channel);
          onResolved();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [gameId, onResolved]);

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
      <h2 style={{ fontSize: '28px', margin: 0 }}>Rock Paper Scissors</h2>
      <p style={{ color: '#a0aec0', margin: 0 }}>
        {waiting ? 'Waiting for opponent...' : 'Pick to determine who goes first'}
      </p>
      {!myPick && (
        <div style={{ display: 'flex', gap: '16px' }}>
          {PICKS.map(pick => (
            <button
              key={pick}
              onClick={() => submitPick(pick)}
              style={{ fontSize: '48px', background: '#2a3441', border: '2px solid #3a4a5a', borderRadius: '12px', padding: '16px 24px', cursor: 'pointer' }}
            >
              {EMOJI[pick]}
            </button>
          ))}
        </div>
      )}
      {myPick && (
        <div style={{ fontSize: '48px' }}>{EMOJI[myPick]}</div>
      )}
    </div>
  );
};

export default RPSScreen;
```

**Step 2: Commit**

```bash
git add src/components/game/RPSScreen.tsx
git commit -m "feat: add RPSScreen component for online multiplayer"
```

---

## Task 17: RPSResultScreen component

**Files:**
- Create: `src/components/game/RPSResultScreen.tsx`

Shown after both picks are in. Displays the outcome, then proceeds to the game after a short delay.

**Step 1: Write the component**

```typescript
// src/components/game/RPSResultScreen.tsx
import React, { useEffect, useState } from 'react';
import { RPSPick, RPSResult, resolveRPS } from '../../lib/rps';

interface RPSResultScreenProps {
  creatorPick: RPSPick;
  joinerPick: RPSPick;
  isCreator: boolean;
  result: RPSResult;   // 'p1' = creator wins, 'p2' = joiner wins, 'draw' (should re-pick)
  onContinue: () => void;
}

const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const RPSResultScreen: React.FC<RPSResultScreenProps> = ({
  creatorPick, joinerPick, isCreator, result, onContinue,
}) => {
  const iWin = (result === 'p1' && isCreator) || (result === 'p2' && !isCreator);
  const outcomeText = result === 'draw' ? "It's a draw — re-picking..." : iWin ? 'You go first!' : 'Opponent goes first — your board will be shown!';

  useEffect(() => {
    const t = setTimeout(onContinue, 3000);
    return () => clearTimeout(t);
  }, [onContinue]);

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
      <div style={{ display: 'flex', gap: '48px', fontSize: '64px' }}>
        <div style={{ textAlign: 'center' }}>
          <div>{EMOJI[creatorPick]}</div>
          <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>
            {isCreator ? 'You' : 'Opponent'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '32px', color: '#a0aec0' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div>{EMOJI[joinerPick]}</div>
          <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>
            {isCreator ? 'Opponent' : 'You'}
          </div>
        </div>
      </div>
      <h3 style={{ fontSize: '24px', margin: 0, color: iWin ? '#00d4aa' : '#a0aec0' }}>
        {outcomeText}
      </h3>
      <p style={{ color: '#a0aec0', fontSize: '14px' }}>Starting game...</p>
    </div>
  );
};

export default RPSResultScreen;
```

**Step 2: Commit**

```bash
git add src/components/game/RPSResultScreen.tsx
git commit -m "feat: add RPSResultScreen component"
```

---

## Task 18: Wire RPS into the online game flow

**Files:**
- Modify: `src/components/game/MatchmakingPage.tsx`
- Modify: `src/hooks/useOnlineGame.ts`
- Modify: `src/components/game/OnlineGameView.tsx`

The flow change: when a joiner connects, set status to `'rps'` instead of `'active'`. Both clients show `RPSScreen`. When both picks are in, the client that sees both picks first resolves the winner, swaps `player_x_id`/`player_o_id` if needed, and sets status to `'active'`.

**Step 1: Update MatchmakingPage.tsx — joinGame function**

Change the `joinGame` update to set `status: 'rps'` instead of `status: 'active'`:

```typescript
const { error } = await supabase.from('games').update({
  player_o_id: user.id,
  status: 'rps',         // was 'active'
}).eq('id', game.id);
```

Also update the `createGame` listener — it currently navigates when status becomes `'active'`. Keep this — creator navigates to `/game/:id` when status becomes `'active'` (after RPS resolves):

```typescript
// This listener already navigates on 'active'. No change needed here.
// But also navigate if status becomes 'rps' (opponent has joined, go show the RPS screen):
if ((payload.new as any).status === 'rps' || (payload.new as any).status === 'active') {
  supabase.removeChannel(channel);
  navigate(`/game/${data.id}`);
}
```

**Step 2: Update useOnlineGame.ts — expose RPS data**

Add `rpsCreatorPick`, `rpsJoinerPick`, `isCreator` to the returned state:

```typescript
// Add to state:
const [rpsCreatorPick, setRpsCreatorPick] = useState<string | null>(null);
const [rpsJoinerPick, setRpsJoinerPick] = useState<string | null>(null);
const [isCreator, setIsCreator] = useState(false);

// In loadGame:
setIsCreator(data.player_x_id === user.id);
setRpsCreatorPick(data.rps_creator_pick);
setRpsJoinerPick(data.rps_joiner_pick);

// In the realtime handler:
setRpsCreatorPick(updated.rps_creator_pick);
setRpsJoinerPick(updated.rps_joiner_pick);

// Add to return:
return { game, status, myMarker, winner, placeMarker, rpsCreatorPick, rpsJoinerPick, isCreator };
```

**Step 3: Add RPS resolution logic to useOnlineGame.ts**

When both picks are present and status is `'rps'`, resolve the winner and update the game row. To avoid both clients writing simultaneously, only the **creator** performs the resolution write:

```typescript
useEffect(() => {
  if (
    status !== 'rps' ||
    !rpsCreatorPick ||
    !rpsJoinerPick ||
    !isCreator ||          // only creator resolves
    !user
  ) return;

  const result = resolveRPS(
    rpsCreatorPick as RPSPick,
    rpsJoinerPick as RPSPick
  );

  if (result === 'draw') {
    // Clear picks and re-pick
    supabase.from('games').update({
      rps_creator_pick: null,
      rps_joiner_pick: null,
    }).eq('id', gameId);
    return;
  }

  // result === 'p1' → creator (current player_x_id) wins → no swap needed
  // result === 'p2' → joiner wins → swap player_x_id and player_o_id
  const updatePayload: any = { status: 'active' };
  if (result === 'p2') {
    // Joiner wins RPS — joiner becomes X (first mover, Player 1)
    updatePayload.player_x_id = /* joiner id */ null; // need joiner id
    // ...
  }
  supabase.from('games').update(updatePayload).eq('id', gameId);
}, [status, rpsCreatorPick, rpsJoinerPick, isCreator, gameId, user]);
```

> **Note:** To swap `player_x_id` and `player_o_id` you need the joiner's ID. Add `player_o_id` to the `loadGame` select and store it in state as `joinerId`. Then the swap is:
>
> ```typescript
> const [joinerId, setJoinerId] = useState<string | null>(null);
>
> // in loadGame:
> setJoinerId(data.player_o_id);
>
> // in resolution:
> if (result === 'p2') {
>   updatePayload.player_x_id = joinerId;
>   updatePayload.player_o_id = user.id;  // creator becomes O
> }
> ```

**Step 4: Update OnlineGameView.tsx — show RPS screens**

Add two new render branches before the existing `status === 'loading'` / `status === 'waiting'` checks:

```tsx
import RPSScreen from './RPSScreen';
import RPSResultScreen from './RPSResultScreen';
import { resolveRPS, RPSPick, RPSResult } from '../../lib/rps';

// In the component, after destructuring useOnlineGame:
const { game, status, myMarker, winner, placeMarker, rpsCreatorPick, rpsJoinerPick, isCreator } = useOnlineGame(gameId);

const [showRPSResult, setShowRPSResult] = useState(false);

// Show result screen briefly when both picks arrive
useEffect(() => {
  if (rpsCreatorPick && rpsJoinerPick && status === 'rps') {
    setShowRPSResult(true);
  }
}, [rpsCreatorPick, rpsJoinerPick, status]);

// RPS pick screen
if (status === 'rps' && !showRPSResult) {
  return (
    <RPSScreen
      gameId={gameId}
      isCreator={isCreator}
      onResolved={() => setShowRPSResult(true)}
    />
  );
}

// RPS result screen
if (status === 'rps' && showRPSResult && rpsCreatorPick && rpsJoinerPick) {
  const result: RPSResult = resolveRPS(
    rpsCreatorPick as RPSPick,
    rpsJoinerPick as RPSPick
  );
  return (
    <RPSResultScreen
      creatorPick={rpsCreatorPick as RPSPick}
      joinerPick={rpsJoinerPick as RPSPick}
      isCreator={isCreator}
      result={result}
      onContinue={() => setShowRPSResult(false)}
    />
  );
}
```

**Step 5: Visual verify**

Open two browser tabs. Start a game in one, join in the other. Confirm:
1. Both tabs show the RPS pick screen after joining
2. Picks reveal simultaneously after both submit
3. Result screen shows for ~3 seconds
4. Game starts in both tabs

**Step 6: Commit**

```bash
git add src/components/game/MatchmakingPage.tsx src/hooks/useOnlineGame.ts src/components/game/OnlineGameView.tsx
git commit -m "feat: wire RPS into online game flow"
```

---

## Task 19: Wire RPS into local 2-player game

**Files:**
- Create: `src/components/game/LocalRPSScreen.tsx`
- Modify: `src/App.tsx`

The local game uses a single "Rock Paper Scissors" button that picks randomly for both players, shows a result screen, then starts the game.

**Step 1: Create LocalRPSScreen.tsx**

```typescript
// src/components/game/LocalRPSScreen.tsx
import React, { useState } from 'react';
import { randomRPSPick, resolveRPS, RPSPick, RPSResult } from '../../lib/rps';

interface LocalRPSScreenProps {
  onResult: (p1GoesFirst: boolean) => void;
}

const EMOJI: Record<RPSPick, string> = { rock: '🪨', paper: '📄', scissors: '✂️' };

const LocalRPSScreen: React.FC<LocalRPSScreenProps> = ({ onResult }) => {
  const [result, setResult] = useState<{ p1Pick: RPSPick; p2Pick: RPSPick; outcome: RPSResult } | null>(null);

  const play = () => {
    const p1Pick = randomRPSPick();
    const p2Pick = randomRPSPick();
    const outcome = resolveRPS(p1Pick, p2Pick);
    if (outcome === 'draw') {
      // Re-pick immediately on draw
      play();
      return;
    }
    setResult({ p1Pick, p2Pick, outcome });
  };

  if (result) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
        <div style={{ display: 'flex', gap: '48px', fontSize: '64px' }}>
          <div style={{ textAlign: 'center' }}>
            <div>{EMOJI[result.p1Pick]}</div>
            <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>Player 1</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '32px', color: '#a0aec0' }}>vs</div>
          <div style={{ textAlign: 'center' }}>
            <div>{EMOJI[result.p2Pick]}</div>
            <div style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>Player 2</div>
          </div>
        </div>
        <h3 style={{ fontSize: '24px', margin: 0, color: '#00d4aa' }}>
          {result.outcome === 'p1' ? 'Player 1 goes first!' : 'Player 2 goes first!'}
        </h3>
        <button
          onClick={() => onResult(result.outcome === 'p1')}
          style={{ padding: '14px 32px', fontSize: '16px', background: '#00d4aa', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: '24px' }}>
      <h2 style={{ fontSize: '28px', margin: 0 }}>Rock Paper Scissors</h2>
      <p style={{ color: '#a0aec0' }}>Determines who goes first</p>
      <button
        onClick={play}
        style={{ padding: '20px 48px', fontSize: '18px', background: '#2a3441', border: '2px solid #00d4aa', color: '#00d4aa', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Rock Paper Scissors
      </button>
    </div>
  );
};

export default LocalRPSScreen;
```

**Step 2: Update LocalGameRoute in App.tsx**

`LocalGameRoute` currently renders `<GameWrapper>` directly. Add a pre-game RPS step:

```tsx
import LocalRPSScreen from './components/game/LocalRPSScreen';

const LocalGameRoute: React.FC = () => {
  const navigate = useNavigate();
  const [p1GoesFirst, setP1GoesFirst] = useState<boolean | null>(null);

  if (p1GoesFirst === null) {
    return <LocalRPSScreen onResult={setP1GoesFirst} />;
  }

  return (
    <GameWrapper
      gameMode="local"
      onBackToMenu={() => navigate('/multiplayer')}
    />
  );
};
```

> **Note:** `p1GoesFirst` isn't yet used by `GameWrapper` in Phase 2 — the game always starts with X going first regardless. In Phase 6 when real skins are loaded, this value will determine which player's board skin is used. For now it's wired up but has no visual effect beyond the RPS screen itself.

**Step 3: Visual verify**

Navigate to `/local`. Confirm the RPS screen shows before the game, the button assigns randomly, and the game starts after the result screen.

**Step 4: Commit**

```bash
git add src/components/game/LocalRPSScreen.tsx src/App.tsx
git commit -m "feat: add local 2-player RPS pre-game screen"
```

---

## Task 20: Run all tests and update handover

**Step 1: Run the full test suite**

```bash
npm test -- --watchAll=false
```

Expected: all tests pass including the two new test files (`skinResolver`, `rps`).

**Step 2: Update RESTART-HANDOVER.md**

Update the "Where we left off" section to reflect that Phase 2 implementation plan is complete and ready to execute. Update the Phase 2 row in the roadmap table to "Implementation plan written".

**Step 3: Commit**

```bash
git add docs/plans/RESTART-HANDOVER.md
git commit -m "docs: Phase 2 implementation plan complete"
```

---

## Summary of new files

| File | Purpose |
|---|---|
| `src/skins/types.ts` | Skin type definitions |
| `src/skins/defaults.ts` | Default placeholder skins |
| `src/skins/registry.ts` | Skin registry (ID → Skin) |
| `src/skins/resolver.ts` | Game skin resolver |
| `src/contexts/SkinContext.tsx` | SkinProvider + useSkins hook |
| `src/components/skins/MarkerSkin.tsx` | Cell marker renderer |
| `src/components/skins/WonBoardSkin.tsx` | Won-board overlay renderer |
| `src/components/skins/BoardSkin.tsx` | Board background renderer |
| `src/lib/rps.ts` | RPS pure logic |
| `src/components/game/RPSScreen.tsx` | Online RPS pick screen |
| `src/components/game/RPSResultScreen.tsx` | Online RPS result screen |
| `src/components/game/LocalRPSScreen.tsx` | Local 2-player RPS screen |
| `supabase/migrations/20260318000001_skins.sql` | Skins schema |
| `supabase/migrations/20260318000002_games_rps.sql` | RPS columns on games |

## Modified files

| File | Change |
|---|---|
| `src/components/Cell.tsx` | Render MarkerSkin instead of `{value}` |
| `src/components/MicroBoard.tsx` | Render WonBoardSkin overlay instead of colour + text |
| `src/components/MacroBoard.tsx` | Wrap in BoardSkin |
| `src/components/GameWrapper.tsx` | Wrap in SkinProvider |
| `src/components/game/OnlineGameView.tsx` | Wrap in SkinProvider, add RPS screens |
| `src/components/game/MatchmakingPage.tsx` | Set status to `'rps'` on join |
| `src/hooks/useOnlineGame.ts` | Expose RPS state, handle RPS resolution |
| `src/App.tsx` | LocalGameRoute shows RPS before game |
