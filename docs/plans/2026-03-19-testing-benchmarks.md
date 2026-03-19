# Live Testing Benchmarks

Run these tests on the private Vercel deployment before merging `feat/disconnect-handling`.

**Deployment:** `mega-ox-dev-git-feat-disconnect-8ee57f-adams-projects-ff804fb2.vercel.app`

**Setup:** Two devices or two separate browsers (e.g. Chrome + Firefox), each logged in as a different user. Start a hosted multiplayer game.

**How to record results:** Mark each test ✅ Pass / ❌ Fail / ⚠️ Partial, and add notes on any failures.

---

## 1. Move sync

| # | Test | How to test | Expected |
|---|------|-------------|----------|
| 1.1 | Move appears instantly | Player A places a marker | Appears on Player B's screen with no noticeable lag (<300ms) |
| 1.2 | Turns alternate correctly | Play 6 moves back and forth | Both screens show the same board state throughout |
| 1.3 | Board constraint respected | Player A places in cell 4 of any micro board | Player B is forced into micro board 4 on their next move (highlighted) |
| 1.4 | Micro board win registers | Either player wins a micro board | Both screens show the claimed board simultaneously |
| 1.5 | Game over registers | Either player wins the macro board | Both screens show the win modal at the same time |

**Results:**

---

## 2. Reconnect / disconnect handling

| # | Test | How to test | Expected |
|---|------|-------------|----------|
| 2.1 | Move during opponent tab close | Player B closes their tab. Player A makes a move. | Move appears on Player A's screen immediately |
| 2.2 | Board state on reconnect | Player B closes tab and reopens the game URL | Player B sees the current board state (not a blank or stale board) |
| 2.3 | Move at moment of reconnect | Player B opens the game as Player A is placing a marker | Both screens end up on the correct state |
| 2.4 | Forfeit countdown shows | Player B closes tab | Player A sees "Opponent disconnected — forfeiting in Xs" countdown banner |
| 2.5 | Forfeit countdown cancels | Player B closes tab, then reopens before 90s | Player A's countdown disappears |
| 2.6 | Auto-forfeit fires | Player B closes tab and stays away for 90s | Player A is declared winner; game ends |
| 2.7 | Resume toast appears | Player B has an active game and navigates to `/menu` | "Resume Game" toast appears |

**Results:**

---

## 3. Intentional exit

| # | Test | How to test | Expected |
|---|------|-------------|----------|
| 3.1 | ← Menu button during active game | Click ← Menu while a game is in progress | Forfeit confirmation modal appears |
| 3.2 | Confirm forfeit | Click "Forfeit & Leave" in the modal | You navigate to menu; opponent wins and sees win screen |
| 3.3 | Cancel forfeit | Click "Stay" in the modal | Modal closes; game continues as normal |
| 3.4 | Browser back button | Press browser back during active game | Forfeit confirmation modal appears (not navigated away) |
| 3.5 | Tab close prompt | Attempt to close the tab during active game | Browser shows native "Leave site?" prompt |

**Results:**

---

## 4. Audio

Test these in a quiet environment with device audio on. One player only needs to test audio (the other's audio is mirrored).

| # | Test | How to test | Expected |
|---|------|-------------|----------|
| 4.1 | Marker placed sound | Make any move | Short click/tick sound |
| 4.2 | Opponent marker sound | Opponent makes a move | Same short click sound (both sides hear it) |
| 4.3 | Your turn chime | After opponent places, it becomes your turn | Two-note rising chime |
| 4.4 | No chime on game load | Open a game where it's already your turn (refresh mid-game) | No chime fires immediately on load |
| 4.5 | Micro board won | Win a micro board | Three-note ascending fanfare |
| 4.6 | Game won | Win the macro board | Four-note ascending arpeggio |
| 4.7 | Game lost | Lose the macro board | Descending two-note tone |
| 4.8 | Audio in AI game | Play vs AI, make a move and win a board | Click on placement, fanfare on board win |

**Results:**

---

## 5. Play Again

| # | Test | How to test | Expected |
|---|------|-------------|----------|
| 5.1 | Play Again navigates both players | Game ends normally, Player A clicks "Play Again" | Both players navigate to a new game and see the RPS screen |
| 5.2 | RPS in rematch | After clicking Play Again | Both players go through RPS turn-order pick again |
| 5.3 | Players swap order | Note who went first in game 1. After Play Again, check game 2 | The player who was O in game 1 becomes X in game 2 (goes first) |
| 5.4 | Back to Menu still works | Game ends, click "Back to Menu" | Only that player navigates to menu; opponent stays on result screen |
| 5.5 | No Play Again on forfeit win | Win because opponent disconnected | Play Again button is NOT shown — only "Back to Menu" |

**Results:**

---

## 6. Regression — existing features

Verify the broadcast sync changes haven't broken anything that worked before.

| # | Test | Expected |
|---|------|----------|
| 6.1 | RPS turn-order pick | Both players pick RPS, result resolves correctly, game starts | Works as before |
| 6.2 | RPS draw re-picks | Both players pick the same option | Re-pick screen shown, result resolves on second pick |
| 6.3 | Local 2-player game | Start a local game, play to completion | Works as before |
| 6.4 | AI game — Easy | Start vs Easy AI, make a few moves | AI responds, game plays through |
| 6.5 | AI game — Hard | Start vs Hard AI | AI responds correctly, noticeably harder than Easy |
| 6.6 | Tutorial loads | Open Beginner tutorial | Steps progress correctly |
| 6.7 | Leaderboard loads | Navigate to leaderboard | Loads without error |
| 6.8 | Demo game | Visit `/demo` as a guest | Demo game playable, Want More modal appears on completion |

**Results:**

---

## Sign-off

Once all critical tests (1.x, 2.x, 3.x, 5.x, 6.x) pass and any failures are fixed:

1. Record pass/fail results above
2. Note the date tested
3. Proceed to merge — see merge order in `RESTART-HANDOVER.md`

**Date tested:** ___________

**Tested by:** ___________

**Overall result:** ___________
