// The Game class manages the overall game logic, including players and boards
class Game {
  // Initialize players and boards arrays
  players = [];
  boards = [];

  // Constructor to set up the game with players and number of boards
  constructor(players, numberOfBoards = 1) {
    // Bind the onBoardCellClick method to the current instance
    this.onBoardCellClick = this.onBoardCellClick.bind(this);
    // Assign the first and second players
    this.playerOne = players[0];
    this.playerTwo = players[1];
    // Set the current player to the first player
    this.currentPlayer = players[0];
    // Set the number of boards for the game
    this.numberOfBoards = numberOfBoards;
  }

  // Starts the game by creating the boards
  startGame() {
    // Loop to create the specified number of boards
    for (let i = 0; i < this.numberOfBoards; i++) {
      // Create a new board with an ID and the onBoardCellClick handler
      const board = new Board(i, this.onBoardCellClick);
      // Add the board to the boards array
      this.boards.push(board);
    }
  }

  // Handles the cell click event on the board
  onBoardCellClick(cell, boardId) {
    // Find the board with the matching ID
    const board = this.boards.find((el) => el.id === boardId);
    if (board) {
      // Place the current player's marker on the clicked cell
      board.placeMarker(cell, this.currentPlayer);
      // Log the current player
      console.log("current player", this.currentPlayer);
      // Swap the turns between player one and player two
      this.currentPlayer =
        this.currentPlayer.id !== this.playerOne.id
          ? this.playerOne
          : this.playerTwo;
      // Log the next player
      console.log("next player", this.currentPlayer);

      // Check if game should end (this part is not implemented yet)

      if (this.isGameOver()) {
        this.endGame;
      }
    }
  }

  // Checks if the game is over by checking if any board has a winning player
  isGameOver() {
    // Loop through all boards
    for (const board of this.boards) {
      // If any board has a winning player, return true
      if (board.hasPlayerWon()) {
        return true;
      }
    }
    // If no board has a winning player, return false
    return false;
  }

  // Ends the game by logging a message (additional logic can be added here)
  endGame() {
    console.log("Game ended");
    this.restartGame;
  }

  restartGame() {
    console.log("Restarting game");
    this.boards = [];
    this.currentPlayer = this.playerOne;
    this.startGame;
  }
}
