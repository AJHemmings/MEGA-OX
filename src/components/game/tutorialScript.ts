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
    // Arrow: from the centre micro board → to the macro board, illustrating the "sent here" concept.
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
