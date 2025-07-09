# Mega OX - Ultimate Tic-Tac-Toe Experience

## Overview

Mega OX is a modern twist on the classic Tic-Tac-Toe game, featuring a sophisticated macro/micro board system that creates deep strategic gameplay. The game now includes a beautiful main menu system, multiple game modes, and AI opponents, with plans for online multiplayer.

## 🎮 Game Features

### Current Features
- **🏠 Main Menu Splash Screen** - Beautiful gradient interface with game mode selection
- **🤖 Single Player Mode** - Challenge an AI opponent with intelligent moves
- **👥 Local Multiplayer** - Play with friends on the same device
- **📖 Interactive Rules** - Learn how to play with detailed explanations
- **👤 Profile System** - Ready for user authentication integration
- **🎯 Smart Game Logic** - Advanced macro/micro board mechanics
- **📊 Score Tracking** - Win/loss/draw statistics
- **🎨 Modern UI** - Responsive design with smooth animations

### Planned Features (Online Mode)
- **🌐 Network Multiplayer** - Real-time online games
- **🔗 Friend Invites** - Share game codes with friends
- **🔍 Matchmaking** - Find random opponents
- **💬 Chat System** - Communicate during games
- **🏆 Rankings & Stats** - Player profiles with match history
- **🎨 Themes & Avatars** - Customizable appearance

## 🎯 Game Rules

The game uses a **macro board** (3x3 grid) where each cell contains a **micro board** (also 3x3):

1. **Starting:** First player can choose any cell on any micro board
2. **Movement Constraint:** Your move determines which micro board your opponent must play in next
3. **Winning Micro Boards:** Get 3 in a row within a micro board to win it
4. **Winning the Game:** Win 3 micro boards in a row on the macro board
5. **Special Rule:** If the required micro board is full, you can choose any available board
6. **Draw Condition:** All micro boards filled without a macro winner = draw

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd mega-ox-v3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🛠 Tech Stack

### Core Technologies
- **React 18** - Modern functional components with hooks
- **TypeScript** - Type safety and better development experience
- **React Router DOM** - Navigation between menu and game screens
- **CSS-in-JS** - Styled components with modern design

### Architecture Decisions

#### Object-Oriented Game Logic
The core game mechanics are built using TypeScript classes for better organization:

**Pros:**
- **Encapsulation:** Game state and logic grouped logically
- **Scalability:** Easy to extend for network features
- **Testability:** Independent testing of game mechanics
- **Maintainability:** Clear separation of concerns

**Classes:**
- `Game` - Main game controller and state management
- `MacroBoard` - Manages the 3x3 grid of micro boards
- `MicroBoard` - Individual 3x3 game boards
- `Cell` - Individual game cells with markers
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
