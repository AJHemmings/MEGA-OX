class Board {

    constructor(id, onCellClick) {
        this.handleCellClick = this.handleCellClick.bind(this)
        this.id = id
        this.onCellClick = onCellClick
        this.cells = []  // A cell is { element: '', player: player}
        this.initialize()
    }

    hasPlayerWon() {
        const seeds = [true, false, false, true, false, false]
        const randInt = Math.floor((Math.random) * seeds.length)
        return seeds[randInt]
    }

    createMarker(player) {
        // returns an element <img src="{}" />
        const marker = document.createElement('img')
        marker.src = player.avatar
        return marker
    }

    placeMarker(cell, player) {
        cell.element.classList.add('occupied')
        const marker = this.createMarker(player)
        cell.element.appendChild(marker)
    }

    handleCellClick(e) {
        const el = e.target
        const index = el.getAttribute('index')
        const cell = this.cells[parseInt(index)]
        this.onCellClick(cell, this.id)
    }

    initialize() {
        const cellElements = document.querySelectorAll(`[data-cell]`);
        this.cells = Array.from(cellElements).map((cell) => {
            return {
                element: cell,
                player: null
            }
        })
        this.cells.forEach((cell, index) => {
            cell.element.setAttribute('board', this.id)
            cell.element.setAttribute('index', `${index}`)
            cell.element.addEventListener(`click`, this.handleCellClick, { once: true });
        })
    }
}
