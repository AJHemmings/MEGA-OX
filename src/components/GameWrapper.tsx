import React, { useState, useEffect, useRef } from "react";
import { Marker } from "../models/Game";
import { easyMove, mediumMove, hardMove, Move } from '../ai/aiPlayer';
import { useAiConfig } from '../hooks/useAiConfig';
import MacroBoard from "./MacroBoard";
import { useGameLogic } from "../hooks/useGameLogic";
import { Modal } from "./modal";
import { SkinProvider } from '../contexts/SkinContext';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../skins/defaults';
import { GameSkins } from '../skins/types';
import { playMarkerPlaced, playMicroBoardWon, playGameWon } from '../lib/sounds';
import { tokens } from '../styles/tokens';
import PageBackground from './common/PageBackground';
import Glass from './common/Glass';
import PrimaryButton from './common/PrimaryButton';
import SecondaryButton from './common/SecondaryButton';
import Pill from './common/Pill';
import BackButton from './common/BackButton';
import { useIsMobile } from '../hooks/useIsMobile';

const defaultGameSkins: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

const BOARD_NAMES = ['Top-Left', 'Top', 'Top-Right', 'Left', 'Center', 'Right', 'Bottom-Left', 'Bottom', 'Bottom-Right'];

interface GameWrapperProps {
  gameMode: "single" | "local";
  onBackToMenu: () => void;
  onGameOver?: (winner: string) => void;
  navExtra?: React.ReactNode;
  difficulty?: 'easy' | 'medium' | 'hard';
  demoMode?: boolean;
  p1GoesFirst?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────

const PlayerCard: React.FC<{
  name: string;
  marker: 'X' | 'O';
  isActive: boolean;
  roundWins: number;
}> = ({ name, marker, isActive, roundWins }) => {
  const color = marker === 'X' ? tokens.accent : tokens.loss;
  return (
    <div style={{
      flex: 1, padding: '8px 10px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10,
      background: isActive
        ? `linear-gradient(135deg, ${color}33, ${color}0d)`
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
      boxShadow: isActive ? `0 0 20px ${color}4d` : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: `${color}22`, border: `1.5px solid ${color}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 900, color,
      }}>
        {marker}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: tokens.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {isActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.3 }}>YOUR TURN</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: 16, fontWeight: 900, color, flexShrink: 0 }}>{roundWins}</div>
    </div>
  );
};

const ScoreChip: React.FC<{ x: number; o: number }> = ({ x, o }) => (
  <div style={{
    padding: '4px 8px', borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    fontSize: 13, fontWeight: 900, fontFamily: 'monospace',
    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: tokens.text,
  }}>
    <span style={{ color: tokens.accent }}>{x}</span>
    <span style={{ color: tokens.textMuted }}>:</span>
    <span style={{ color: tokens.loss }}>{o}</span>
  </div>
);

// ─── Main component ───────────────────────────────────────────────

const GameWrapper: React.FC<GameWrapperProps> = ({
  gameMode, onBackToMenu, onGameOver, navExtra, difficulty = 'easy', demoMode = false, p1GoesFirst,
}) => {
  const { game, gameOver, winner, onPlaceMarker, resetGame, lastMove } = useGameLogic();
  const { config: aiConfig } = useAiConfig();
  const [showRules, setShowRules] = useState(false);
  const [isAiTurn, setIsAiTurn] = useState(false);

  function getAiMove(diff: 'easy' | 'medium' | 'hard', g: typeof game): Move {
    if (diff === 'easy')   return easyMove(g);
    if (diff === 'medium') return mediumMove(g, {
      winRuleStrength:      aiConfig.medium.win_rule_strength,
      poisonFilterStrength: aiConfig.medium.poison_filter_strength,
    });
    return hardMove(g, {
      winRuleStrength:      aiConfig.hard.win_rule_strength,
      poisonFilterStrength: aiConfig.hard.poison_filter_strength,
      minimaxDepth:         aiConfig.hard.minimax_depth,
    });
  }
  const prevMicroWinnersRef = useRef<string[]>([]);
  const gameWonFiredRef = useRef(false);
  const isMobile = useIsMobile();

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  // AI logic
  useEffect(() => {
    if (gameMode === "single" && game.currentPlayer.marker === Marker.O && !gameOver) {
      setIsAiTurn(true);
      const DELAY_RANGES = {
        easy:   { min: 500,  max: 1500 },
        medium: { min: 1000, max: 2500 },
        hard:   { min: 1500, max: 3000 },
      };
      const { min, max } = DELAY_RANGES[difficulty];
      const delay = Math.floor(Math.random() * (max - min + 1)) + min;
      const timer = setTimeout(() => {
        const move = getAiMove(difficulty, game);
        const ok = onPlaceMarker(move.microIndex, move.cellIndex);
        if (ok) playMarkerPlaced();
        setIsAiTurn(false);
      }, delay);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.currentPlayer, gameOver, gameMode, difficulty]);

  useEffect(() => {
    if (gameOver && onGameOver) onGameOver(winner === Marker.None ? "draw" : winner);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  useEffect(() => {
    if (!game) return;
    const currentWinners = game.macroBoard.microBoards.map(mb => mb.winner);
    currentWinners.forEach((w, i) => {
      if (w && w !== prevMicroWinnersRef.current[i]) playMicroBoardWon();
    });
    prevMicroWinnersRef.current = currentWinners;
    if (game.macroBoard.winner && !gameWonFiredRef.current) {
      gameWonFiredRef.current = true;
      playGameWon();
    }
  }, [game]);

  const handleRestart = () => {
    gameWonFiredRef.current = false;
    prevMicroWinnersRef.current = [];
    resetGame();
  };

  const getPlayerName = (marker: string) => {
    if (gameMode === "single") return marker === "X" ? "You" : "AI";
    if (p1GoesFirst == null) return `Player ${marker}`;
    const p1Marker = p1GoesFirst ? "X" : "O";
    return marker === p1Marker ? "Player 1" : "Player 2";
  };

  const getWinnerText = () => {
    if (winner === Marker.None) return "It's a draw!";
    if (gameMode === "single") return winner === Marker.X ? "You Win! 🎉" : "AI Wins! 🤖";
    return `${getPlayerName(winner)} Wins!`;
  };

  const activeMarker = game.currentPlayer.marker;
  const xIsActive = !gameOver && activeMarker === Marker.X && !(gameMode === 'single' && isAiTurn);
  const oIsActive = !gameOver && activeMarker === Marker.O;
  const isMyTurn  = !gameOver && (gameMode === 'local' || !isAiTurn);

  const boardConstraint = game.nextMicroBoardIndex !== null
    ? `PLAY IN ${BOARD_NAMES[game.nextMicroBoardIndex].toUpperCase()} BOARD`
    : 'FREE CHOICE';

  const matchType    = demoMode ? 'DEMO MODE' : gameMode === 'single' ? 'TRAINING' : 'LOCAL';
  const pillVariant  = demoMode ? 'purple' : gameMode === 'single' ? 'gold' : 'teal';

  // Pill variant type for Pill component
  type PillVariant = 'teal' | 'purple' | 'gold' | 'red' | 'muted';
  const pillVar: PillVariant = pillVariant as PillVariant;

  const chrome = (
    <div style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 524, margin: '0 auto', padding: '0 14px', userSelect: 'none' }}>

      {/* Header strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 12px' }}>
        <BackButton onClick={onBackToMenu} />
        <Pill variant={pillVar}>{matchType}</Pill>
        {navExtra && <div style={{ flex: 1 }}>{navExtra}</div>}
        <div style={{ marginLeft: navExtra ? 0 : 'auto' }}>
          <SecondaryButton size="sm" onClick={() => setShowRules(true)}>⋯</SecondaryButton>
        </div>
      </div>

      {/* VS player strip */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginBottom: 10 }}>
        <PlayerCard name={getPlayerName('X')} marker="X" isActive={xIsActive} roundWins={game.winCounts[Marker.X]} />
        <ScoreChip x={game.winCounts[Marker.X]} o={game.winCounts[Marker.O]} />
        <PlayerCard name={getPlayerName('O')} marker="O" isActive={oIsActive} roundWins={game.winCounts[Marker.O]} />
      </div>

      {/* Turn pill */}
      {!gameOver && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          {isMyTurn
            ? <div style={{ padding: '6px 14px', borderRadius: tokens.rPill, background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.35)', color: tokens.accent, fontSize: 11, fontWeight: 800, letterSpacing: 0.4 }}>
                ▪ {boardConstraint}
              </div>
            : <div style={{ padding: '6px 14px', borderRadius: tokens.rPill, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.35)', color: tokens.loss, fontSize: 11, fontWeight: 800, letterSpacing: 0.4 }}>
                AI thinking…
              </div>
          }
        </div>
      )}

      {/* Demo subtitle */}
      {demoMode && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{
            fontSize: 15, fontWeight: 900, letterSpacing: 1.5,
            background: 'linear-gradient(135deg, #fff 30%, #00d4aa 70%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}>MEGA OX</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
            Get a feel for the game — no account needed
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="How to Play Mega OX">
        <div style={{ textAlign: "left", fontSize: "14px", lineHeight: "1.6", fontFamily: tokens.font }}>
          <h3 style={{ color: tokens.text, marginTop: 0 }}>🎯 Objective</h3>
          <p style={{ color: tokens.textMuted }}>Win 3 micro boards in a row on the macro board to win the game.</p>
          <h3 style={{ color: tokens.text }}>🎮 How to Play</h3>
          <ul style={{ color: tokens.textMuted, paddingLeft: 20 }}>
            <li>Players take turns placing their marker (X or O) in cells</li>
            <li>The first player can choose any cell on the macro board</li>
            <li>Your move determines which micro board your opponent must play in next</li>
            <li>Win a micro board by getting 3 in a row within it</li>
            <li>If the required micro board is full, you can choose any available board</li>
          </ul>
          <h3 style={{ color: tokens.text }}>🏆 Winning</h3>
          <ul style={{ color: tokens.textMuted, paddingLeft: 20 }}>
            <li>Get 3 micro board wins in a row (horizontal, vertical, or diagonal)</li>
            <li>If all micro boards are filled without a macro winner, it's a draw</li>
          </ul>
        </div>
      </Modal>

      {/* Board canvas — scale to fit viewport while keeping all internal pixel values intact */}
      {(() => {
        const BOARD_PX = 490;
        const availW = Math.min(524, window.innerWidth) - 28;
        const scale  = Math.min(1, availW / BOARD_PX);
        return (
          <div style={{ overflow: 'hidden', height: Math.round(BOARD_PX * scale) }}>
            <div style={{ width: BOARD_PX, height: BOARD_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <MacroBoard
                microBoards={microBoardsData}
                onPlaceMarker={(micro, cell) => {
                  if (gameMode === "single" && isAiTurn) return;
                  const ok = onPlaceMarker(micro, cell);
                  if (ok) playMarkerPlaced();
                }}
                nextMicroBoardIndex={game.nextMicroBoardIndex}
                macroWinner={winner === Marker.None ? "" : winner}
                lastMove={lastMove}
              />
            </div>
          </div>
        );
      })()}

      {/* Win result */}
      {gameOver && !onGameOver && (
        <Glass style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: winner === Marker.X ? tokens.accent : winner === Marker.O ? tokens.loss : tokens.text, marginBottom: 16 }}>
            {getWinnerText()}
          </div>
          <PrimaryButton onClick={handleRestart} fullWidth>🔄 New Game</PrimaryButton>
          <SecondaryButton onClick={onBackToMenu} fullWidth style={{ marginTop: 10 }}>← Main Menu</SecondaryButton>
        </Glass>
      )}

      {/* New Game button (when onGameOver handles the modal) */}
      {(!gameOver || !!onGameOver) && (
        <div style={{ marginTop: 16 }}>
          <SecondaryButton onClick={handleRestart} fullWidth>🔄 New Game</SecondaryButton>
        </div>
      )}
    </div>
  );

  // Desktop: wider container, same single-column layout (board is narrow by design)
  return (
    <SkinProvider skins={defaultGameSkins}>
      <PageBackground>
        <div style={{ minHeight: '100vh', paddingBottom: 40, paddingTop: isMobile ? 0 : 20 }}>
          {chrome}
        </div>
      </PageBackground>
    </SkinProvider>
  );
};

export default GameWrapper;
