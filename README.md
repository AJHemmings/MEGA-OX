# Mega OX - A Macro/Micro Board Game

## Overview

This project is a modern twist on the classic Naughts and Crosses (Tic-Tac-Toe) game. The game features a macro board with 9 micro boards in each cell, creating a layered and strategic gameplay experience. Two players take turns selecting cells on the macro and micro boards, with the goal to win 3 micro boards in a row on the macro board.

The project is built using React and TypeScript, designed with scalability in mind to support future features like user profiles, network play, and customizable avatar/themes.

---

## Game Rules

- The macro board is a 3x3 grid; each cell contains a micro board (3x3).
- Players alternate turns by selecting a macro board cell, then placing their marker (naught or cross) inside the corresponding micro board.
- The position of the placed marker in the micro board dictates which micro board the next player must play on.
- When a player wins a micro board by lining up three markers in a row, that micro board is considered won and the corresponding macro board cell is marked for that player.
- The overall winner is the first player to win three cells in a row on the macro board.
- If all micro boards are filled without a macro board winner, the game ends in a draw.

---

## How to Play

1. Launch the game in a browser.
2. Players take turns selecting a cell on the macro board (highlighted micro board area).
3. Within the micro board, players select a cell to place their marker (X or O).
4. The position of the last move determines the next micro board the other player must play in.
5. Win 3 micro boards in a row on the macro board to win.
6. The UI shows the active player, score counters (wins/losses/draws), and an option to restart.
7. Future versions will include profile customization, chat, emoji communication, and network play.

---

## Tech Stack and Design Choices

### Technologies Used

- **React** (with functional components and hooks)
- **TypeScript** for strong typing and maintainability
- CSS modules and inline styles for modern, responsive UI
- Minimal dependencies to keep the app lightweight and fast

### Object-Oriented Programming (OOP) Approach

To model the complex game logic and rules, the core game state and operations are encapsulated in TypeScript classes representing entities such as the macro board, micro boards, cells, and game controller. This approach provides:

#### Pros:

- **Encapsulation:** Game logic and state are grouped logically within objects.
- **Scalability:** Easier to extend and maintain as new features (e.g., network play, user profiles) are added.
- **Reusability:** Classes can be tested and reused independently from the React UI.
- **Clear abstraction:** Real-world game concepts are represented naturally in code.

#### Cons:

- React ecosystem generally favors functional programming patterns; mixing paradigms requires careful state management.
- Mutable class state needs to be managed thoughtfully to ensure React re-renders correctly.
- Slightly more initial complexity compared to purely functional approaches.

### Final Design Decision

The project uses a hybrid approach:

- **Game logic** is handled via TypeScript classes following OOP principles.
- **UI components** are functional React components using hooks for state and effects.
- State updates from class instances trigger React updates by immutable state replacement.
- This approach ensures clean separation between logic and presentation, maximizing maintainability and future scalability.

---

## Folder Structure

```
naughts-and-crosses/
├── public/                # Static assets and HTML template
├── src/                   # Application source code
│   ├── components/        # React components (MacroBoard, MicroBoard, UI elements)
│   ├── hooks/             # Custom React hooks (e.g., useGameLogic)
│   ├── models/            # TypeScript classes for game logic (Board, Cell, Game)
│   ├── styles/            # CSS files or styled components
│   ├── App.tsx            # Main application component
│   ├── index.tsx          # React app entry point
│   └── types.ts           # TypeScript types and interfaces
├── package.json           # Project metadata and dependencies
├── tsconfig.json          # TypeScript config
└── README.md              # Project documentation

```

---


## Versioning

- Version 1.0.0 - Base game with core mechanics implemented using React and TypeScript.
- Future updates will add multi-player networking, user authentication, profiles, emoji chat, and theming.

---

## Future Improvements

- Add user signup/login and persistent profiles.
- Enable real-time network play using WebSockets or similar.
- Implement avatar, marker, and board theme customization.
- Include chat window with emoji wheel for in-game communication.
- Improve responsive design and mobile support for smooth gameplay on all devices.

---

Thank you for exploring this strategic twist on a classic game!  
Enjoy playing Mega OX.
