class Board {
  constructor(id, onCellClick) {
    // Bind the handleCellClick method to the current instance
    this.handleCellClick = this.handleCellClick.bind(this);
    // Set the board ID
    this.id = id;
    // Set the callback function for cell click events
    this.onCellClick = onCellClick;
    // Initialize the cells array (each cell is an object with element and player properties)
    this.cells = [];
    // Initialize the board
    this.initialize();
  }

  // Simulates checking if a player has won
  hasPlayerWon() {
    // Array of possible outcomes (true means win, false means no win)
    const seeds = [true, false, false, true, false, false];
    // Generate a random index to pick a value from the seeds array
    const randInt = Math.floor(Math.random() * seeds.length);
    // Return the randomly selected value (true or false)
    return seeds[randInt];
  }

  // Creates a marker element for the player
  createMarker(player) {
    // Create an img element
    const marker = document.createElement("img");
    // Set the src attribute to the player's avatar
    marker.src = player.avatar;
    // Return the created marker element
    return marker;
  }

  // Places a marker on the cell for the player
  placeMarker(cell, player) {
    // Add the 'occupied' class to the cell element
    cell.element.classList.add("occupied");
    // Create a marker for the player
    const marker = this.createMarker(player);
    // Append the marker to the cell element
    cell.element.appendChild(marker);
  }

  // Handles the cell click event
  handleCellClick(e) {
    // Get the clicked element
    const el = e.target;
    // Get the index attribute of the clicked element
    const index = el.getAttribute("index");
    // Find the corresponding cell in the cells array
    const cell = this.cells[parseInt(index)];
    // Call the onCellClick callback with the cell and board ID
    this.onCellClick(cell, this.id);
  }

  // Initializes the board by setting up cells and event listeners
  initialize() {
    // Select all elements with the data-cell attribute
    const cellElements = document.querySelectorAll(`[data-cell]`);
    // Map the selected elements to the cells array
    this.cells = Array.from(cellElements).map((cell) => {
      return {
        element: cell,
        player: null,
      };
    });
    // Set attributes and event listeners for each cell
    this.cells.forEach((cell, index) => {
      // Set the board attribute to the board ID
      cell.element.setAttribute("board", this.id);
      // Set the index attribute to the cell index
      cell.element.setAttribute("index", `${index}`);
      // Add a click event listener to the cell element
      cell.element.addEventListener(`click`, this.handleCellClick, {
        once: true,
      });
    });
  }
}
