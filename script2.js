function loadGame() {
    const playerX = new Player('x', 'player 1', 'x.svg')
    const playerO = new Player('o', 'player 2', 'o.svg')
    const game = new Game([playerX, playerO], 1)
    game.startGame()
}

document.addEventListener('DOMContentLoaded', loadGame)
