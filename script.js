document.addEventListener('DOMContentLoaded', () => {
    // Define the player markers X O
    const X_MARKER = `x`
    const CIRCLE_MARKER = `circle`

    // Define win condition
    const winCondition = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ]

    // Define the cells for DOM manip
    const cellElements = document.querySelectorAll(`[data-cell]`);

    // Define the board for DOM manip
    const board = document.getElementById(`board`)

    //define the message element to up for win condition
    const winningMessageElement = document.getElementById(`winningMessage`)

    // define the button for DOM manip
    const restartButton = document.getElementById(`restartButton`)

    //define the end game message
    const winningMessageTextElement = document.querySelector(`[data-winning-message-text]`)

    // Define whose turn it is
    let circleTurn

    startGame()

    restartButton.addEventListener(`click`, startGame)

    // Start the game logic loop
    function startGame() {
        circleTurn = false
        // Create event for DOM manipulation on cells once per click only
        // so users cannot overwrite previous plays
        cellElements.forEach(cell => {
            // removes previous game board
            // cell.classList.remove(X_MARKER)  these have been removed to allow for images to be used in place of css markers
            // cell.classList.remove(CIRCLE_MARKER)

            // this is the removal of the images on new game restart
            while (cell.firstChild) {
                cell.removeChild(cell.firstChild);  
            }
            cell.removeEventListener(`click`, handleClick)
            // starts a fresh game from here on
            cell.addEventListener(`click`, handleClick, { once: true });
        });
        setBoardHoverClass()
        winningMessageElement.classList.remove(`show`)
    }

    function handleClick(e) {
        // Place user marker
        const cell = e.target
        const currentTurn = circleTurn ? CIRCLE_MARKER : X_MARKER
        placeMarker(cell, currentTurn)
        // Check for win
        if (checkWin(currentTurn)) {
            endGame(false)
            console.log(`${currentTurn} wins!`)
            return
        }
        // Check for draw
        else if (isDraw()) {
            endGame(true)
            console.log(`Draw!`)
            return
        } else {
            // Switch turn
            swapTurns()
            setBoardHoverClass()
        }
    }

    function endGame(draw) {
        if (draw) {
            winningMessageTextElement.innerText = `Draw!`
        } else {
            winningMessageTextElement.innerText = `${circleTurn ? "O's" : "X's"} Wins!!`
        }
        winningMessageElement.classList.add(`show`)
    }

    function createMarker(markerType) {
        const marker = document.createElement(`img`)
        if (markerType === X_MARKER) {
            marker.src = "x.svg"
        } else {
            marker.src = "o.svg"
        } return marker
    }

    // Function to add a marker
    function placeMarker(cell, currentTurn) {
        cell.classList.add(currentTurn)
        cell.classList.add(`occupied`)
        const marker = createMarker(currentTurn)
        cell.appendChild(marker)
    }

    // Function to swap turns
    function swapTurns() {
        circleTurn = !circleTurn
    }

    function setBoardHoverClass() {
        // Start with no classes
        board.classList.remove(X_MARKER)
        board.classList.remove(CIRCLE_MARKER)
        // Add hover marker depending on whose turn it is
        if (circleTurn) {
            board.classList.add(CIRCLE_MARKER)
        } else {
            board.classList.add(X_MARKER)
        }
    }

    // create function to check array for win condition
    function checkWin(currentTurn) {
        return winCondition.some(combination => {
            return combination.every(index => {
                return cellElements[index].classList.contains(currentTurn)
            })
        })
    }
    // create function for draw condition
    function isDraw() {
        return [...cellElements].every(cell => {
            return cell.classList.contains(X_MARKER) || cell.classList.contains(CIRCLE_MARKER)
        })
    }
});

// class person{
//     this.age
// }