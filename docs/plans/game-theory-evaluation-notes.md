# Game Theory & Evaluation Notes — Mega OX
**Date:** 2026-03-18

---

## Is Ultimate Tic-Tac-Toe Solved?

Regular 3×3 Tic-Tac-Toe is solved — optimal play always draws. UTTT is a different beast.

The branching factor is enormous. On the first move there are 81 choices. Each subsequent
move has ~30–50 legal moves on average. A full minimax tree to the end of the game is
computationally infeasible — the game tree has been estimated at around 10²⁶ possible
states. For comparison, chess is ~10¹²³ but has excellent pruning. UTTT has not been
formally solved.

**Implication for AI design:** Hard difficulty with minimax + alpha-beta pruning at a
limited search depth (3–5 plies) will play very well but won't be perfect. A "beatable
but difficult" Hard mode is more fun than an unbeatable one.

---

## Is There a Meta Pick?

There are known strategic principles, but not a guaranteed win line:

- **Centre board (index 4) is strategically the most valuable** — it appears in 4 macro
  win lines vs 2 for corners and 2 for edges. Winning it gives the broadest coverage.
- **Sending your opponent to an already-won or full board** is powerful — they get free
  choice, but the positional gain can be worth it.
- **Corner micro boards** are next most valuable (appear in 2 macro win lines each).
- **The "poison send"** — playing a cell that sends your opponent to a micro board where
  they can immediately win — is the most critical mistake to avoid. Medium and Hard AI
  must both check for this.

Strategic principles exist and are meaningful, but the game has enough variability that
multiple opening strategies are viable. It is not degenerate like regular Tic-Tac-Toe.

---

## Simulation & Evaluation Harness

### Why It's Possible

`Game.ts` is pure OOP with no React dependencies. Headless games can be run in a Node
script without a browser, making automated simulation straightforward.

### Proposed File Structure

```
src/ai/aiPlayer.ts      ← AI move functions (shipped to users)
src/ai/simulate.ts      ← Headless evaluation harness (dev tool only, not shipped)
```

### What simulate.ts Does

1. Instantiates a `Game`
2. Has two AI strategies play against each other (e.g. Easy vs Medium, Medium vs Hard)
3. Runs N games (1,000–10,000 recommended for statistical confidence)
4. Counts win rates and average game lengths
5. Outputs a summary to the terminal

Run with: `ts-node src/ai/simulate.ts` or a dedicated npm script.

### Matchups to Run

| Matchup | What it tells you |
|---|---|
| Easy vs Medium | Is Medium meaningfully better, or only marginally? |
| Medium vs Hard | Is the difficulty curve well-spaced? |
| Hard vs Hard | Does the Hard heuristic produce symmetrical, contested games? |
| Easy vs Hard | Sanity check — Hard should dominate heavily |
| Random vs Random | Baseline: how often does first player win with no strategy? |

### Interpreting Results

- Medium beats Easy **70%+** → Medium is a real step up
- Hard beats Medium **80%+** → difficulty curve is well-spaced
- Hard vs Hard produces frequent draws → heuristic is sound and symmetrical
- Average move count rising with difficulty → harder AI plays longer, more contested games
  (short Hard wins may indicate a dominant strategy the AI has found)

### Tuning Minimax Depth

Run Hard (depth 3) vs Hard (depth 5) to see if extra depth changes outcomes enough to
justify the added compute. If win rate is near 50% and game length is similar, depth 3
is sufficient. Deeper search = longer AI turn delay in the browser, so find the minimum
depth that produces good play.

---

## External Repo / Testing Tool

Space reserved here for notes once the external repo has been evaluated.

- **Repo:** TBD
- **Purpose:** Simulated game evaluation
- **Integration approach:** TBD

---

## Open Questions

- What search depth for Hard minimax is the practical browser limit before turn delay
  becomes noticeable? (Target: under 500ms per move)
- Should the simulation harness be run in CI or purely as a local dev tool?
- Is the external repo a drop-in evaluator, or does it need adapting to the UTTT ruleset?
