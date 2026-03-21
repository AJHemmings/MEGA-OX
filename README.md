# Mega OX - Ultimate Naughts and Crosses

A strategic twist on a classic game. Mega OX is a 3x3 grid of tic-tac-toe boards.
Winning a micro board claims that cell on the macro board. Win three macro cells in a row
to win the game. Every move you make determines where your opponent must play next.

**Status: Active development.** Core gameplay is live. Extended features are currently in alpha testing.

---

## What's in the game now

- **Single player** - challenge an AI opponent
- **Local multiplayer** - two players on the same device
- **Core game mechanics** - the full Mega OX rule set

---

## Currently in alpha testing

- Guest access with instant demo
- Network multiplayer - play against a real opponent online
- User accounts with persistent profiles
- Leaderboard
- Stats tracking - games played, wins, losses, draws
- Interactive tutorial - Beginner and Intermediate walkthroughs

---

## What's coming

The roadmap is broken into phases, each building on the last:

**✅ Phase 1 - AI difficulty**
Selectable Easy, Medium, and Hard opponents, replacing the current random-move AI.

**✅ Phase 2 - Cosmetics system**
Architectural groundwork to support swappable marker skins and board overlays.

**⏳ Phase 3 - Progression, achievements, and currency**
Earn XP and level up by playing. Unlock achievements for skill-based and milestone goals.
Earn in-game currency to spend on cosmetics.

**Phase 4 - Profile customisation and emoji communication**
Custom avatars, badges, and banners on your profile. An in-game emoji panel for
expression during matches, with no free-text chat and no moderation overhead.

**Phase 5 - Visual redesign**
A full visual pass across every screen once all systems are in place.

**Phase 6 - Cash shop**
Spend in-game currency on cosmetics. Real-money top-ups via Stripe for players who
want to skip the grind.

**Phase 7 - Admin tools and bug reporting**
Internal content management and a player-facing bug report system.

---

## Game rules

Mega OX uses a **macro board** (3x3) where each cell contains a **micro board** (also 3x3):

1. **First move:** choose any cell on any micro board
2. **Movement constraint:** the cell index you play determines which micro board your opponent must play in next
3. **Win a micro board:** get three in a row within it
4. **Win the game:** claim three micro boards in a row on the macro board
5. **Free choice:** if the required micro board is already won or full, your opponent may play anywhere
6. **Draw:** all micro boards filled with no macro winner

---

## Tech stack

- **React + TypeScript** - component-based UI with full type safety
- **Supabase** - authentication, database, real-time multiplayer
- **React Router v7** - client-side routing
- **Vercel** - hosting and deployment

### Architecture

Game logic lives in pure TypeScript classes (`src/models/Game.ts`) with no React dependency.
A custom hook (`src/hooks/useGameLogic.ts`) wraps those classes in React state.
This keeps game rules cleanly separated from rendering and makes the logic independently testable.

---

## Running locally

```bash
npm install
npm start       # dev server at localhost:3000
npm run build   # production build
```

Requires a `.env.local` file with your Supabase project URL and anon key.

---

## Version history

- **v1.3.3** - Base game: core mechanics, single player vs AI, local multiplayer
- **v2.0.0** *(current alpha)* - Network multiplayer, user auth, profiles, leaderboard, stat tracking

---

Mega OX is built in public. Feedback and bug reports welcome.
