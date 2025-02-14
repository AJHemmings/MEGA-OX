class Game {

    players= []
    boards = []

    constructor(players, numberOfBoards = 1) {
        this.onBoardCellClick = this.onBoardCellClick.bind(this)
        this.playerOne = players[0]
        this.playerTwo = players[1]
        this.currentPlayer = players[0]
        this.numberOfBoards = numberOfBoards
    }

    startGame() {
        for(let i = 0; i < this.numberOfBoards; i++) {
            const board = new Board(i, this.onBoardCellClick)
            this.boards.push(board)
        }
    }

    onBoardCellClick(cell, boardId) {
        const board = this.boards.find((el) => el.id === boardId)
        if (board) {
            board.placeMarker(cell, this.currentPlayer)
            // swap the turns
            console.log('current player', this.currentPlayer)
            this.currentPlayer = this.currentPlayer.id !== this.playerOne.id ? this.playerOne : this.playerTwo

            console.log('next player', this.currentPlayer)

            // check if game should end
        }
    }

    isGameOver() {
        for (const board of this.boards) {
            if (board.hasPlayerWon()) {
                return true
            }
        }
        return false
    }

    endGame() {
        console.log('Game ended')
    }
}
