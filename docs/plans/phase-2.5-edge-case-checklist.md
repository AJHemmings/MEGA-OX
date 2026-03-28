# Phase 2.5 — Edge Case Checklist

Run these before closing out Phase 2.5. Two browser windows required for all tests.

---

## 1. RPS — 3 consecutive draws

**Steps:**

1. Start a multiplayer game
2. Both players pick the same option (draw)
3. Both players pick the same option again (draw)
4. Both players pick the same option a third time (draw)
5. One player wins the fourth round

**Expected behaviour:**

- After each draw: result screen shows on both browsers, both return to the pick screen automatically
- Round counter increments each time (Round 1 → Round 2 → Round 3 → Round 4)
- Pick screen remounts cleanly each round — no stale picks visible, no "Waiting..." stuck state
- On the winning round: result screen shows on both browsers, then both transition to the active game

**Result:** ✅

**Actual behaviour if failed:**

---

## 2. RPS — Refresh mid-pick

**Steps:**

1. Start a multiplayer game (RPS phase begins)
2. Player A submits their pick
3. Before Player B submits, Player A refreshes the page
4. Player B submits their pick

**Expected behaviour:**

- After refresh, Player A rejoins the game and sees the RPS pick screen
- Player A can re-submit their pick
- Once both picks are in, the result screen shows on both browsers normally
- Game proceeds to active state

**Result:** ✅

**Actual behaviour if failed:**

---

## 3. Play Again — Chained rematches (3 games back to back)

**Steps:**

1. Play a full game to completion (Game 1)
2. Both players click Play Again → complete Game 2 via RPS + play
3. Both players click Play Again again → complete Game 3 via RPS + play

**Expected behaviour:**

- Each Play Again flow triggers a fresh RPS round with no stale state from the previous game
- Game 3 starts cleanly — correct player markers, no leftover intents/status from Game 2
- Resume toast does not appear at any point during this flow
- Stats update correctly after each game

**Result:** ❌

**Fix attempt (2026-03-27):** Added `setRematchGameId(null)` to the gameId-change reset block in `useOnlineGame.ts`. Root cause was correct (stale `rematchGameId` poisoning `rematchNavFiredRef`) but fix did not resolve the symptom — third game still hangs. Suspected: `setRematchGameId(null)` is a batched state update; there may be a render cycle where `rematchGameId` is still the old value and the auto-navigate effect fires before the null lands. Needs further investigation — see handover.

**Actual behaviour if failed:**

- After game 2 both players hit play again and both browsers show 2 green dots and "waiting" refreshing takes the user to rps. clicking back to menu takes the user back to menu with resume game toast, clicking resume game takes user to the rps in progress.

---

## 4. Play Again — Tab close during countdown

**Steps:**

1. Play a full game to completion
2. Both players see the Play Again dots / countdown ring (30s)
3. Player B closes their tab entirely (does not click decline)
4. Wait for Player A's countdown to expire (30 seconds)

**Expected behaviour:**

- Player A sees the "Opponent opted out" overlay when the timer hits 0
- Player A is redirected to the menu after the overlay dismisses
- No stuck state, no error

**Result:** ✅ (fixed 2026-03-27)

**Fix:** When the countdown hit zero, the DB column was never updated — `rematch_x/o_intent` stayed as `'play_again'`. If the opponent clicked Play Again afterwards, both intents matched and `createRematch` fired. Added `signalRematchIntent('back_to_menu')` in the countdown-zero branch of `OnlineGameView.tsx`.

**Actual behaviour if failed:**

- browser 1 clicked play again and the timer hit 0 then got "your oppenet opted out" then on browser two I clicked play again and it said oppennent agreed to a rematch. If time runs out the other user should not get the option to click play again.

---

## 5. Toast — Forfeit game followed by Play Again

**Steps:**

1. Play a game where one player forfeits (either intentionally via the exit button, or by disconnecting for 90s)
2. The non-forfeiting player sees the forfeit result screen
3. Both players log out and log back in

**Expected behaviour:**

- After logging back in, neither player sees a "Resume Game" toast (game is complete)
- The forfeiting player may see the forfeit notification toast, but it should be dismissible and not loop
- No toast appears pointing to the forfeited game on subsequent logins

**Result:** ✅

**Actual behaviour if failed:**

---

## Sign-off

| #   | Test                                  | Result |
| --- | ------------------------------------- | ------ |
| 1   | RPS 3 consecutive draws               |        |
| 2   | RPS refresh mid-pick                  |        |
| 3   | Play Again chained rematches          | ❌     |
| 4   | Play Again tab close during countdown | ✅     |
| 5   | Toast after forfeit + re-login        |        |

All passing → Phase 2.5 closed. Move to Phase 3.
