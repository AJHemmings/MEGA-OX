// Game.ts - Core game logic OOP classes for macro and micro boards

export enum Marker {
  None = "",
  X = "X",
  O = "O",
}

export type Player = {
  id: number;
  name: string;
  marker: Marker;
};

export class Cell {
  marker: Marker;

  constructor() {
    this.marker = Marker.None;
  }

  isEmpty() {
    return this.marker === Marker.None;
  }

  setMarker(marker: Marker) {
    if (this.marker === Marker.None) {
      this.marker = marker;
      return true;
    }
    return false;
  }
}

export class MicroBoard {
  readonly size = 3;
  cells: Cell[];
  winner: Marker;
  isFull: boolean;

  constructor() {
    this.cells = [];
    for (let i = 0; i < this.size * this.size; i++) {
      this.cells.push(new Cell());
    }
    this.winner = Marker.None;
    this.isFull = false;
  }

  // Check if this microboard is won and return true if so
  checkWinner(): Marker {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (
        this.cells[a].marker !== Marker.None &&
        this.cells[a].marker === this.cells[b].marker &&
        this.cells[a].marker === this.cells[c].marker
      ) {
        this.winner = this.cells[a].marker;
        return this.winner;
      }
    }

    this.winner = Marker.None;
    return this.winner;
  }

  // Check if board is full
  checkFull() {
    this.isFull = this.cells.every((cell) => cell.marker !== Marker.None);
    return this.isFull;
  }

  // Attempts to place a marker in the cell index, returns true if successful
  placeMarker(index: number, marker: Marker): boolean {
    if (this.winner !== Marker.None) {
      return false; // Already won, locked
    }
    if (this.cells[index].isEmpty()) {
      this.cells[index].setMarker(marker);
      this.checkWinner();
      this.checkFull();
      return true;
    }
    return false;
  }
}

export class MacroBoard {
  readonly size = 3;
  microBoards: MicroBoard[];
  winner: Marker;

  constructor() {
    this.microBoards = [];
    for (let i = 0; i < this.size * this.size; i++) {
      this.microBoards.push(new MicroBoard());
    }
    this.winner = Marker.None;
  }

  // Check if macro board is won according to micro board wins
  checkWinner(): Marker {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    // Map microboard winners to macro board cells - empty if no winner microboard
    const macroState = this.microBoards.map((mb) => mb.winner);

    for (const [a, b, c] of lines) {
      if (
        macroState[a] !== Marker.None &&
        macroState[a] === macroState[b] &&
        macroState[a] === macroState[c]
      ) {
        this.winner = macroState[a];
        return this.winner;
      }
    }
    this.winner = Marker.None;
    return this.winner;
  }
}

export class Game {
  macroBoard: MacroBoard;
  players: Player[];
  currentPlayerIndex: number;
  nextMicroBoardIndex: number | null; // null means player can choose any microboard

  winCounts: { [key in Marker]: number };
  drawCount: number;

  constructor(player1Name = "Player 1", player2Name = "Player 2") {
    this.macroBoard = new MacroBoard();
    this.players = [
      { id: 1, name: player1Name, marker: Marker.X },
      { id: 2, name: player2Name, marker: Marker.O },
    ];
    this.currentPlayerIndex = 0;
    this.nextMicroBoardIndex = null;
    this.winCounts = {
      [Marker.X]: 0,
      [Marker.O]: 0,
      [Marker.None]: 0,
    };
    this.drawCount = 0;
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  switchPlayer() {
    this.currentPlayerIndex = 1 - this.currentPlayerIndex;
  }
  // HOLY GRAIL
  placeMarker(microBoardIndex: number, cellIndex: number): boolean {
    if (
      this.nextMicroBoardIndex !== null &&
      microBoardIndex !== this.nextMicroBoardIndex
    ) {
      return false;
    }

    const microBoard = this.macroBoard.microBoards[microBoardIndex];
    if (!microBoard) {
      return false;
    }

    const placed = microBoard.placeMarker(cellIndex, this.currentPlayer.marker);
    if (!placed) {
      return false;
    }

    this.macroBoard.checkWinner();
    // The key to everything
    const nextBoard = this.macroBoard.microBoards[cellIndex];
    if (!nextBoard || nextBoard.winner !== Marker.None || nextBoard.isFull) {
      this.nextMicroBoardIndex = null; // any allowed
    } else {
      this.nextMicroBoardIndex = cellIndex;
    }

    // Switch player turn
    this.switchPlayer();

    return true;
  }

  resetGame() {
    this.macroBoard = new MacroBoard();
    this.currentPlayerIndex = 0;
    this.nextMicroBoardIndex = null;
  }

  // Check if game over by macroBoard winner or full boards with no winner
  isGameOver(): boolean {
    if (this.macroBoard.winner !== Marker.None) {
      return true;
    }
    // If all microboards full and no winner, then draw
    const allFull = this.macroBoard.microBoards.every(
      (mb) => mb.isFull || mb.winner !== Marker.None
    );
    return allFull;
  }

  incrementWin(marker: Marker) {
    if (marker === Marker.None) {
      this.drawCount += 1;
    } else {
      this.winCounts[marker] += 1;
    }
  }
}
