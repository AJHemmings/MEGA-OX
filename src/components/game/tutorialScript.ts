// ─────────────────────────────────────────────────────────────────────────────
// TUTORIAL SCRIPT
//
// Edit this file to change what the tutorial says and does.
// You do NOT need to touch HowToPlayPage.tsx.
//
// HOW THE BOARD IS INDEXED
//
//   Macro boards are labelled A–I (indices 0–8):
//     A | B | C
//     ---------
//     D | E | F
//     ---------
//     G | H | I
//
//   Cells inside each micro board are numbered 1–9 (indices 0–8):
//     1 | 2 | 3
//     ---------
//     4 | 5 | 6
//     ---------
//     7 | 8 | 9
//
//   THE KEY RULE: the cell number you play = the next active board.
//   Play Cell 5 → opponent goes to Board E. Play Cell 1 → opponent goes to Board A.
//
// DOM SELECTORS
//   '#tutorial-macro-board'    — the whole 3×3 grid
//   '#tutorial-micro-N'        — macro board N (0-indexed, so A=0, E=4, I=8)
//   '#tutorial-cell-B-C'       — cell C (0-indexed) inside macro board B (0-indexed)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Preload state — used to teleport the game to a preset board configuration
// without playing through every move. Applied when a step has `preloadState`.
// ─────────────────────────────────────────────────────────────────────────────
export interface MicroBoardPreload {
  /** 9-element array of cell markers. '' = empty. */
  cells: Array<'X' | 'O' | ''>;
  /** '' = not won. */
  winner: 'X' | 'O' | '';
}

export interface PreloadState {
  microBoards: MicroBoardPreload[]; // length 9
  nextMicroBoardIndex: number | null;
  currentPlayerIndex: number; // 0 = X, 1 = O
}

export interface TutorialStep {
  title?: string;
  intro: string;
  targetSelector: string;
  requiresClick: boolean;
  boardIndex: number | null;
  cellIndex: number | null;
  aiMoveAfter: boolean;
  aiBoardIndex: number | null;
  aiCellIndex: number | null;
  arrow: { from: string; to: string } | null;
  /** If set, the game is replaced with this preset state when entering the step. */
  preloadState?: PreloadState;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE TRACE (for anyone editing this file)
//
//   Start : nextMicroBoardIndex = null (free choice), current player = X
//
//   Step 3  (idx 2): X plays Board E (4), Cell 1 (idx 0) → nextMBIdx = 0 (Board A)
//                    AI (O) plays Board A (0), Cell 5 (idx 4) → nextMBIdx = 4 (Board E)
//   Step 4  (idx 3): [no move] — spotlight AI's marker at Board A Cell 5
//   Step 5  (idx 4): [no move] — explain chain; arrow Board A Cell 5 → Board E
//   Step 6  (idx 5): X plays Board E (4), Cell 5 (idx 4) → nextMBIdx = 4 (Board E)
//   Step 7  (idx 6): [bridge — no move] — plain transition to endgame section
//
//   ── PRELOAD (step 8, idx 7) resets to endgame state ──────────────────────
//   Endgame: X has won Board B (1). X needs E (4) and H (7) for middle column.
//            nextMBIdx = null, currentPlayerIndex = 1 (Circle's turn, free choice)
//
//   Step 9  (idx 8): O plays Board D (3), Cell 2 (idx 1) → nextMBIdx = 1 (Board B, won → null)
//                    currentPlayerIndex = 0 (X's turn, free choice)
//   Step 10 (idx 9): [no move] — Board B spotlit, "X gets free choice"
//   Step 11 (idx 10): X plays Board E (4), Cell 5 (idx 4) — free choice, diagonal win
//                     X wins Board E! nextMBIdx = 4 (won → null). O's turn.
//                     AI (O) plays Board I (8), Cell 8 (idx 7) → nextMBIdx = 7 (Board H) ✓
//   Step 12 (idx 11): [no move] — "Circle's free pick" explanation, arrow Board I → Board H
//   Step 13 (idx 12): X plays Board H (7), Cell 3 (idx 2) — top-row win
//                     X wins Board H → macroBoard.winner = X (B + E + H = middle column) ✓
//   Step 14 (idx 13): Win celebration
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// ENDGAME PRESET BOARD
//
//  Macro layout after preload:
//    .  | B(X) | .
//    ----------------
//    .  |  E   | .
//    ----------------
//    .  |  H   | .
//
//  Board E (4): X at cells 0 and 8 (top-left and bottom-right corners).
//               One click on cell 4 (centre) = diagonal win (0-4-8).
//
//  Board H (7): X at cells 0 and 1 (top row, cells 1 and 2).
//               One click on cell 2 (top-right) = top-row win.
//
//  nextMicroBoardIndex = null, currentPlayerIndex = 1 (Circle's turn, free choice).
// ─────────────────────────────────────────────────────────────────────────────
const ENDGAME_PRELOAD: PreloadState = {
  microBoards: [
    // Board A (0): mixed — realistic filler
    { cells: ['O', '', 'X', '', 'O', '', 'X', '', ''], winner: '' },
    // Board B (1): X won — left column (cells 0, 3, 6)
    { cells: ['X', 'O', '', 'X', 'O', '', 'X', '', ''], winner: 'X' },
    // Board C (2): realistic filler
    { cells: ['', 'X', '', '', '', 'O', '', 'O', ''], winner: '' },
    // Board D (3): realistic filler
    { cells: ['O', '', 'X', '', '', '', '', '', 'O'], winner: '' },
    // Board E (4): X at 0 and 8 (diagonal corners) — needs cell 4 to win
    { cells: ['X', '', '', 'O', '', 'O', '', '', 'X'], winner: '' },
    // Board F (5): realistic filler
    { cells: ['X', '', '', '', 'O', '', '', '', ''], winner: '' },
    // Board G (6): realistic filler
    { cells: ['O', '', '', 'X', 'O', '', '', '', ''], winner: '' },
    // Board H (7): X at 0 and 1 (top row) — needs cell 2 to win
    { cells: ['X', 'X', '', 'O', 'O', '', '', '', ''], winner: '' },
    // Board I (8): X at 1, 5; O at 2 — AI will play cell 7 here in step 8
    { cells: ['', 'X', 'O', '', '', 'X', '', '', ''], winner: '' },
  ],
  nextMicroBoardIndex: null, // free choice — O's turn, can play anywhere
  currentPlayerIndex: 1,    // O's turn
};

export const INTERMEDIATE_STEPS: TutorialStep[] = [

  // ── Step 1 (idx 0): Introduce the whole board ─────────────────────────────
  {
    title: 'Welcome to MEGA OX',
    intro:
      'This is an <b>Ultimate Tic-Tac-Toe</b> board — 9 small games (A to I) arranged in a 3×3 grid. ' +
      'Win a small game to claim that position on the big grid. ' +
      'Win <b>three positions in a row</b> on the big grid to win.',
    targetSelector: '#tutorial-macro-board',
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 2 (idx 1): Explain the cell → board rule ─────────────────────────
  {
    title: 'The key rule',
    intro:
      'Every cell is numbered <b>1 to 9</b>. ' +
      'The cell you play in sends your opponent to the <b>matching board</b>. ' +
      'Play Cell 5 → opponent goes to Board E (centre). ' +
      'Play Cell 1 → opponent goes to Board A (top-left). ' +
      'Your move is a move for you <em>and</em> a constraint for them.',
    targetSelector: '#tutorial-micro-4', // Board E — centre
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: { from: '#tutorial-micro-4', to: '#tutorial-macro-board' },
  },

  // ── Step 3 (idx 2): Player's first move ───────────────────────────────────
  // State : nextMicroBoardIndex = null → free choice, all boards active.
  // Move  : X plays Board E (4), Cell 1 (idx 0).
  // After : nextMBIdx = 0 (Board A) — directly demonstrates the step 2 rule.
  // AI    : O plays Board A (0), Cell 5 (idx 4) → nextMBIdx = 4 (Board E).
  {
    title: 'Your turn — first move is free',
    intro:
      'On the very first move <b>all boards are open</b>. ' +
      'Click <b>Cell 1</b> (top-left) of Board E. ' +
      'Remember the rule: Cell 1 sends your opponent to Board A.',
    targetSelector: '#tutorial-cell-4-0', // Cell 1 (idx 0) of Board E (4)
    requiresClick: true,
    boardIndex: 4,
    cellIndex: 0,
    aiMoveAfter: true,
    aiBoardIndex: 0,  // O goes to Board A (sent by X's Cell 1)
    aiCellIndex: 4,   // O plays Cell 5 (idx 4) → sends X back to Board E
    arrow: null,
  },

  // ── Step 4 (idx 3): Spotlight the opponent's move ─────────────────────────
  // State : X at E-1, O just played A-5. nextMBIdx = 4 (Board E).
  // This step spotlights the O marker so the player sees where the opponent went.
  {
    title: "The opponent's move",
    intro:
      'Your opponent was sent to <b>Board A</b> and played <b>Cell 5</b> — the centre. ' +
      'Reminder: Cell 5 sends the next player to Board E. ' +
      'Follow the arrow to see where you must go next.',
    targetSelector: '#tutorial-cell-0-4', // O's marker — Board A (0), Cell 5 (idx 4)
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: { from: '#tutorial-cell-0-4', to: '#tutorial-micro-4' },
  },

  // ── Step 5 (idx 4): Explain the chain ─────────────────────────────────────
  // State : nextMBIdx = 4. Board E highlighted.
  {
    title: 'The chain in action',
    intro:
      'You played <b>Cell 1</b> → opponent went to <b>Board A</b>. ' +
      'They played <b>Cell 5</b> → now <em>you</em> are sent back to <b>Board E</b>. ' +
      'Every move is a move for you and a constraint for them.',
    targetSelector: '#tutorial-micro-4', // Board E
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: { from: '#tutorial-cell-0-4', to: '#tutorial-micro-4' },
  },

  // ── Step 6 (idx 5): Player's second move ──────────────────────────────────
  // State : nextMBIdx = 4 → only Board E is active.
  // Move  : X plays Board E (4), Cell 5 (idx 4) → nextMBIdx = 4 (Board E).
  {
    title: 'Forced to Board E',
    intro:
      'You <b>must</b> play in Board E — that is where your opponent sent you. ' +
      'Click <b>Cell 5</b> (centre) to continue.',
    targetSelector: '#tutorial-cell-4-4', // Cell 5 (idx 4) of Board E (4)
    requiresClick: true,
    boardIndex: 4,
    cellIndex: 4,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 7 (idx 6): Bridge — transition between sections ──────────────────
  // No board change, no click required. Prepares the player for the preload.
  {
    title: 'Core rule — complete!',
    intro:
      'Great — you\'ve got the core rule. ' +
      'Every move sends your opponent somewhere, and every move they make sends you somewhere. ' +
      'Now let\'s jump to an endgame situation and see it pay off.',
    targetSelector: '#tutorial-macro-board',
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 8 (idx 7): PRELOAD — endgame overview, Circle's turn ────────────
  // Resets the game to the near-endgame preset. O's turn, free choice.
  {
    title: 'The endgame',
    intro:
      'Fast forward — the game is near its end. X has claimed <b>Board B</b> (middle column, top). ' +
      'X needs <b>Board E</b> and <b>Board H</b> to win the middle column. ' +
      'But it\'s <b>Circle\'s turn</b>, and Circle has free choice. Let\'s see how this plays out.',
    targetSelector: '#tutorial-macro-board',
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
    preloadState: ENDGAME_PRELOAD,
  },

  // ── Step 9 (idx 8): Circle's move — forces X to won Board B ───────────────
  // State : nextMBIdx = null (O free choice). O's turn (currentPlayerIndex = 1).
  // Move  : O plays Board D (3), Cell 2 (idx 1) → nextMBIdx = 1 (Board B, won → null).
  // After : X's turn, free choice.
  {
    title: "Circle's move",
    intro:
      'You\'re controlling Circle for this move. ' +
      'Click <b>Cell 2</b> (top-right) of <b>Board D</b>. ' +
      'Cell 2 sends the next player to <b>Board B</b> — which X already owns!',
    targetSelector: '#tutorial-cell-3-1', // Cell 2 (idx 1) of Board D (3)
    requiresClick: true,
    boardIndex: 3,
    cellIndex: 1,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 10 (idx 9): X gets free choice — Board B spotlit ─────────────────
  // State : nextMBIdx = null. X's turn.
  {
    title: 'Free choice for X',
    intro:
      'Circle sent X to <b>Board B</b> — but X already won it! ' +
      'When your forced board is already won, you get a <b>free pick</b>. ' +
      'X can play anywhere.',
    targetSelector: '#tutorial-micro-1', // Board B — won, spotlit
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 11 (idx 10): X plays Board E centre — wins it ────────────────────
  // State : nextMBIdx = null, X's turn (free choice).
  // Move  : X plays Board E (4), Cell 5 (idx 4) — completes diagonal 0-4-8.
  // After : X wins Board E! nextMBIdx = 4 (won → null). O's turn.
  // AI    : O plays Board I (8), Cell 8 (idx 7) → nextMBIdx = 7 (Board H). ✓
  {
    title: 'Free pick — win Board E!',
    intro:
      'Use your free pick wisely. X has the two diagonal corners of Board E. ' +
      'Click the <b>centre cell</b> to complete the diagonal and win Board E!',
    targetSelector: '#tutorial-cell-4-4', // Cell 5 (idx 4) of Board E (4)
    requiresClick: true,
    boardIndex: 4,
    cellIndex: 4,
    aiMoveAfter: true,
    aiBoardIndex: 8,  // O has free pick → plays Board I
    aiCellIndex: 7,   // Cell 8 (idx 7) → nextMBIdx = 7 (Board H) ✓
    arrow: null,
  },

  // ── Step 12 (idx 11): Circle's free pick explained ────────────────────────
  // State : X won B and E. O played Board I Cell 7 (sync). nextMBIdx = 7 (Board H).
  {
    title: "Circle's free pick",
    intro:
      'X won Board E! By playing Cell 5, you sent Circle to Board E — ' +
      'but you just won it! Circle got a <b>free pick</b> and played Board I, ' +
      'sending you to <b>Board H</b>. Win it to complete the middle column!',
    targetSelector: '#tutorial-cell-8-7', // O's marker — Board I (8), Cell 8 (idx 7)
    requiresClick: false,
    boardIndex: null,
    cellIndex: null,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: { from: '#tutorial-cell-8-7', to: '#tutorial-micro-7' },
  },

  // ── Step 13 (idx 12): X plays Board H — wins macro game ───────────────────
  // State : nextMBIdx = 7 → only Board H is active.
  // Move  : X plays Board H (7), Cell 3 (idx 2) — completes top row 0-1-2.
  // After : X wins Board H → macroBoard.winner = X (B + E + H = middle column). ✓
  {
    title: 'Finish it!',
    intro:
      'You <b>must</b> play in Board H. X has the first two cells of the top row. ' +
      'Click <b>Cell 3</b> (top-right) to complete the row and win the game!',
    targetSelector: '#tutorial-cell-7-2', // Cell 3 (idx 2) of Board H (7)
    requiresClick: true,
    boardIndex: 7,
    cellIndex: 2,
    aiMoveAfter: false,
    aiBoardIndex: null,
    aiCellIndex: null,
    arrow: null,
  },

  // ── Step 14 (idx 13): Win celebration ─────────────────────────────────────
  {
    title: 'You won!',
    intro:
      'X has <b>Board B, Board E, and Board H</b> — three in a row down the middle column. ' +
      'Every move sends your opponent somewhere, and every move they make sends you somewhere. ' +
      'Think one move ahead: where will your opponent end up? Good luck out there!',
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

// Beginner = steps idx 0–6: Welcome → Key rule → First move → AI spotlight → Chain → Forced board → Bridge.
// Update the slice bound if steps are inserted before the bridge (idx 6).
export const BEGINNER_STEPS: TutorialStep[] = INTERMEDIATE_STEPS.slice(0, 7);
