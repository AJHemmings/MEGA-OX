import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Marker } from '../../models/Game';
import MacroBoard from '../MacroBoard';
import PlayerIndicator from '../PlayerIndicator';
import { useOnlineGame } from '../../hooks/useOnlineGame';
import { SkinProvider } from '../../contexts/SkinContext';
import {
  DEFAULT_BOARD_SKIN,
  DEFAULT_MARKER_X_SKIN,
  DEFAULT_MARKER_O_SKIN,
  DEFAULT_WON_BOARD_X_SKIN,
  DEFAULT_WON_BOARD_O_SKIN,
} from '../../skins/defaults';
import { GameSkins } from '../../skins/types';
import RPSScreen from './RPSScreen';
import RPSResultScreen from './RPSResultScreen';
import RematchOutcomeOverlay from './RematchOutcomeOverlay';
import { resolveRPS, RPSResult } from '../../lib/rps';
import {
  playMarkerPlaced,
  playYourTurn,
  playMicroBoardWon,
  playGameWon,
  playGameLost,
  resumeAudio,
} from '../../lib/sounds';
import { callPostGameHandler } from '../../lib/postGame';
import { PostGameModal, PostGameResult } from '../progression/PostGameModal';
import EmojiPanel from './EmojiPanel';
import EmojiBubble from './EmojiBubble';
import { useProgression } from '../../hooks/useProgression';

const defaultGameSkins: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

// Countdown ring shown while waiting for the opponent to decide on a rematch.
const RING_RADIUS = 36;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CountdownRing: React.FC<{ seconds: number; total: number }> = ({ seconds, total }) => {
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - seconds / total);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      {/* Background track */}
      <circle cx="44" cy="44" r={RING_RADIUS} fill="none" stroke="#3a4a5a" strokeWidth="4" />
      {/* Depleting arc */}
      <circle
        cx="44"
        cy="44"
        r={RING_RADIUS}
        fill="none"
        stroke="#00d4aa"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dashoffset 0.9s linear' }}
      />
      {/* Countdown number */}
      <text
        x="44"
        y="50"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="22"
        fontWeight="bold"
        fontFamily="Segoe UI, Tahoma, Geneva, Verdana, sans-serif"
      >
        {seconds}
      </text>
    </svg>
  );
};

interface OnlineGameViewProps {
  gameId: string;
}

const OnlineGameView: React.FC<OnlineGameViewProps> = ({ gameId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { game, status, myMarker, winner, placeMarker, rpsResultPicks, rpsRound, dismissRPSResult, isCreator, opponentConnected, disconnectCountdown, rematchGameId, forfeitPlayerId, myRematchIntent, opponentRematchIntent, signalRematchIntent, submitRPSPick, myEmoji, opponentEmoji, sendEmoji } = useOnlineGame(gameId);

  const [showForfeitModal, setShowForfeitModal] = useState(false);

  // Rematch outcome overlay — 'agreed' (cover screen) or 'opted_out' (modal)
  const [rematchOverlay, setRematchOverlay] = useState<'agreed' | 'opted_out' | null>(null);
  // Counts down from 30 while waiting for opponent to decide; null when not waiting
  const [waitCountdown, setWaitCountdown] = useState<number | null>(null);
  // Keeps rematchGameId accessible in dismiss callbacks without stale closures
  const rematchGameIdRef = useRef<string | null>(null);
  // Guards against showing the overlay more than once per game
  const overlayShownRef = useRef(false);
  // Prevents countdown from being started more than once per game
  const countdownStartedRef = useRef(false);
  // Prevents the rematch navigation from firing twice (effect + dismiss handler)
  const rematchNavFiredRef = useRef(false);

  // Post-game reward state — result from the edge function, cleared on dismiss or new game
  const [postGameResult, setPostGameResult] = useState<PostGameResult | null>(null);
  // True while the edge function call is in-flight — hides Play Again / Back to Menu until resolved
  const [postGameLoading, setPostGameLoading] = useState(false);
  // Guards against calling the edge function more than once per game
  const postGameCalledRef = useRef(false);

  // Progression data for the XP bar displayed in PostGameModal
  const progression = useProgression(user?.id);
  const { refresh: refreshProgression } = progression;

  // Derived from DB — not from presence, so no race condition when opponent navigates away after game ends
  const wonByForfeit = forfeitPlayerId !== null;
  const opponentForfeited = forfeitPlayerId !== null && forfeitPlayerId !== user?.id;

  const prevMicroWinnersRef = useRef<string[]>([]);
  const prevIsMyTurnRef = useRef<boolean>(false);
  const prevStatusRef = useRef<string>('loading');
  const prevCellCountRef = useRef<number>(0);
  const hasGameStartedRef = useRef<boolean>(false);
  // True once the result screen has been shown and dismissed for a non-draw round.
  // Prevents RPSScreen flashing back during the 'rps'→'active' status gap (race condition
  // where the result screen auto-continues before postgres_changes delivers status='active').
  // Must be state (not a ref) so that resetting it on gameId change triggers a re-render —
  // a ref reset is silent and the RPSScreen would never re-appear for the new game.
  const [rpsResultShown, setRpsResultShown] = useState(false);

  // Keep rematchGameIdRef current so dismiss callbacks always have the latest value
  useEffect(() => { rematchGameIdRef.current = rematchGameId; }, [rematchGameId]);

  // Fire the post-game edge function exactly once when status reaches 'complete'.
  useEffect(() => {
    if (status !== 'complete' || postGameCalledRef.current) return;
    postGameCalledRef.current = true;
    setPostGameLoading(true);

    callPostGameHandler(gameId).then(result => {
      setPostGameLoading(false);
      if (result && !result.alreadyProcessed) {
        setPostGameResult(result);
        refreshProgression(); // re-fetch so PostGameModal shows updated XP
      }
    });
  }, [status, gameId, refreshProgression]);

  // Reset RPS guard AND all rematch overlay state when gameId changes.
  // React Router reuses this component instance across /game/:id navigations (Play Again),
  // so every piece of per-game state must be explicitly reset here.
  useEffect(() => {
    setRpsResultShown(false);
    setRematchOverlay(null);
    setWaitCountdown(null);
    overlayShownRef.current = false;
    countdownStartedRef.current = false;
    rematchNavFiredRef.current = false;
    postGameCalledRef.current = false;
    setPostGameResult(null);
    setPostGameLoading(false);
  }, [gameId]);

  // Auto-navigate when rematch game is ready — suppressed while the 'agreed' overlay is
  // showing so the overlay can navigate on dismiss instead. rematchNavFiredRef prevents the
  // effect and the dismiss handler from both firing a navigate.
  useEffect(() => {
    if (!rematchGameId) return;
    // Guard: rematchGameId still holds the previous game's ID during the async gap between
    // gameId changing (React Router navigate) and setRematchGameId(null) applying. Treating
    // a self-ID as a real rematch would show a spurious overlay and poison rematchNavFiredRef,
    // blocking navigation when the *real* rematch is created later.
    if (rematchGameId === gameId) return;
    if (rematchNavFiredRef.current) return;
    if (rematchOverlay === 'agreed') return;
    // If this player already clicked Play Again, show the overlay before navigating.
    // Closes the race where rematchGameId arrives before the intent watcher fires.
    if (myRematchIntent === 'play_again' && !overlayShownRef.current) {
      overlayShownRef.current = true;
      setWaitCountdown(null);
      setRematchOverlay('agreed');
      return;
    }
    rematchNavFiredRef.current = true;
    navigate(`/game/${rematchGameId}`);
  }, [rematchGameId, gameId, navigate, rematchOverlay, myRematchIntent]);

  // Show overlay when both intents are known — or immediately if opponent already decided.
  // Runs on every intent change so it catches the case where opponent decided before I clicked.
  useEffect(() => {
    if (myRematchIntent !== 'play_again') return;
    if (overlayShownRef.current) return;

    if (opponentRematchIntent === 'play_again') {
      overlayShownRef.current = true;
      setWaitCountdown(null);
      setRematchOverlay('agreed');
    } else if (opponentRematchIntent === 'back_to_menu') {
      overlayShownRef.current = true;
      setWaitCountdown(null);
      setRematchOverlay('opted_out');
    }
  }, [myRematchIntent, opponentRematchIntent]);

  // Start the 30-second countdown the first time I click Play Again and opponent is undecided.
  useEffect(() => {
    if (myRematchIntent !== 'play_again') return;
    if (countdownStartedRef.current) return;
    if (opponentRematchIntent !== null) return; // opponent already decided — overlay handles it
    countdownStartedRef.current = true;
    setWaitCountdown(30);
  }, [myRematchIntent, opponentRematchIntent]);

  // Countdown tick — triggers 'opted_out' overlay when it reaches zero.
  useEffect(() => {
    if (waitCountdown === null) return;
    if (waitCountdown <= 0) {
      setWaitCountdown(null);
      if (!overlayShownRef.current) {
        overlayShownRef.current = true;
        setRematchOverlay('opted_out');
        // Write 'back_to_menu' to DB so the opponent can't trigger a rematch
        // after the countdown expires — without this, a late Play Again click
        // from the opponent would find both intents = 'play_again' and create a game.
        signalRematchIntent('back_to_menu');
      }
      return;
    }
    const timer = setTimeout(() => setWaitCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => clearTimeout(timer);
  }, [waitCountdown, signalRematchIntent]);

  const handleForfeit = useCallback(async () => {
    if (!myMarker || !user) return;
    await supabase.from('games').update({
      status: 'complete',
      winner: myMarker === 'X' ? 'O' : 'X',
      forfeit_player_id: user.id,
    }).eq('id', gameId);
    navigate('/menu');
  }, [myMarker, user, gameId, navigate]);

  // Intercept browser back button — push a dummy state so popstate fires instead of navigating away
  useEffect(() => {
    if (status !== 'active') return;
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowForfeitModal(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status]);

  useEffect(() => {
    if (status !== 'active') return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  useEffect(() => {
    if (!game || !myMarker) return;

    // Seed initial state on first active render so sounds don't fire on mount
    const currentIsMyTurn =
      (myMarker === 'X' && game.currentPlayerIndex === 0) ||
      (myMarker === 'O' && game.currentPlayerIndex === 1);

    if (status === 'active' && !hasGameStartedRef.current) {
      hasGameStartedRef.current = true;
      prevIsMyTurnRef.current = currentIsMyTurn; // seed so first turn doesn't fire
      prevCellCountRef.current = game.macroBoard.microBoards
        .reduce((total, mb) => total + mb.cells.filter(c => c.marker !== Marker.None).length, 0);
    }

    // Marker placed — only fire when total filled cells increases by exactly 1
    const currentCellCount = game.macroBoard.microBoards
      .reduce((total, mb) => total + mb.cells.filter(c => c.marker !== Marker.None).length, 0);
    if (status === 'active' && currentCellCount === prevCellCountRef.current + 1) {
      playMarkerPlaced();
    }
    prevCellCountRef.current = currentCellCount;

    // Micro board won — check if any new winners appeared
    const currentWinners = game.macroBoard.microBoards.map(mb => mb.winner);
    currentWinners.forEach((w, i) => {
      if (w && w !== prevMicroWinnersRef.current[i]) {
        playMicroBoardWon();
      }
    });
    prevMicroWinnersRef.current = currentWinners;

    // Your turn — only fire after game has started (not on mount)
    if (hasGameStartedRef.current && currentIsMyTurn && !prevIsMyTurnRef.current && status === 'active') {
      playYourTurn();
    }
    prevIsMyTurnRef.current = currentIsMyTurn;

    // Game over
    if (status === 'complete' && prevStatusRef.current !== 'complete') {
      if (winner === myMarker) {
        playGameWon();
      } else if (winner && winner !== 'draw') {
        playGameLost();
      }
    }

    prevStatusRef.current = status;
  }, [game, status, myMarker, winner]);

  const handleRPSContinue = useCallback(() => {
    if (rpsResultPicks) {
      const result = resolveRPS(rpsResultPicks.creator, rpsResultPicks.joiner);
      // Only set the guard on a decisive result. For draws, the re-pick screen must show
      // again, so we leave rpsResultShownRef as-is (dismissRPSResult resets it via rpsRound).
      if (result !== 'draw') {
        setRpsResultShown(true);
      }
      dismissRPSResult(result === 'draw');
    }
  }, [rpsResultPicks, dismissRPSResult]);

  // Navigate to the agreed rematch game — called by the 'agreed' overlay on dismiss.
  // Uses rematchGameIdRef so the callback is never stale even if rematchGameId arrived late.
  const handleAgreedDismiss = useCallback(() => {
    setRematchOverlay(null);
    if (!rematchNavFiredRef.current) {
      const targetId = rematchGameIdRef.current;
      if (targetId && targetId !== gameId) {
        // Navigate now and lock the flag so the auto-navigate effect doesn't double-fire.
        rematchNavFiredRef.current = true;
        navigate(`/game/${targetId}`);
      }
      // If targetId === gameId, rematchGameId is stale (async clear hasn't applied yet).
      // Don't poison rematchNavFiredRef — the real rematch will arrive later and the
      // auto-navigate effect will handle it then.
      // If rematchGameId hasn't arrived yet (e.g. Player O polling lag), leave the flag
      // unset. The auto-navigate effect will fire the moment rematchGameId lands, and by
      // then rematchOverlay is null so its guard won't block it.
    }
  }, [navigate, gameId]);

  // Navigate to menu when the 'opted_out' overlay (or countdown timeout) dismisses.
  const handleOptedOutDismiss = useCallback(() => {
    setRematchOverlay(null);
    navigate('/menu');
  }, [navigate]);

  // RPS result screen — shown for the full 3s timer regardless of status/pick changes.
  // rpsResultPicks is captured synchronously in the hook's event handlers, so it is immune
  // to the React 18 batching race where DB null-clear can arrive in the same batch as the
  // "both picks in" event and prevent the result screen from ever showing.
  if (rpsResultPicks) {
    const result: RPSResult = resolveRPS(rpsResultPicks.creator, rpsResultPicks.joiner);
    return (
      <RPSResultScreen
        creatorPick={rpsResultPicks.creator}
        joinerPick={rpsResultPicks.joiner}
        isCreator={isCreator}
        result={result}
        onContinue={handleRPSContinue}
      />
    );
  }

  // RPS pick screen (no picks submitted yet, or draw re-pick).
  // key={rpsRound} forces a full remount on each draw round, clearing RPSScreen's internal
  // myPick/waiting state so the player gets a clean pick UI for the next round.
  // Guard: if the result screen was already shown and dismissed, don't flash RPSScreen
  // during the brief gap before status advances from 'rps' to 'active'.
  if (status === 'rps' && !rpsResultShown) {
    return (
      <RPSScreen key={rpsRound} onSubmitPick={submitRPSPick} />
    );
  }

  if (status === 'loading' || !game) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Loading game...</p>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexDirection: 'column', gap: '16px' }}>
        <p>Waiting for opponent to join...</p>
        <button onClick={() => navigate('/menu')} style={{ background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    );
  }

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  const isMyTurn = myMarker !== null && (
    (myMarker === 'X' && game.currentPlayerIndex === 0) ||
    (myMarker === 'O' && game.currentPlayerIndex === 1)
  );

  const getWinnerText = () => {
    if (winner === 'draw') return "It's a draw!";
    if (winner === myMarker) return 'You Win!';
    return 'Opponent Wins!';
  };

  const macroWinner = game.macroBoard.winner === Marker.None ? '' : game.macroBoard.winner;

  return (
    <SkinProvider skins={defaultGameSkins}>
    <div onClick={resumeAudio} style={{ maxWidth: 480, margin: '20px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', textAlign: 'center', userSelect: 'none', padding: '20px', minHeight: '100vh', background: '#1a2332', color: '#ffffff' }}>
      {showForfeitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#2a3441', borderRadius: '16px', padding: '32px', maxWidth: '320px', textAlign: 'center', border: '1px solid #ff6b35' }}>
            <h3 style={{ color: '#fff', margin: '0 0 12px' }}>Leave game?</h3>
            <p style={{ color: '#a0aec0', margin: '0 0 24px', fontSize: '14px' }}>
              Leaving this game will forfeit it. Your opponent wins.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowForfeitModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3a4a5a', background: 'transparent', color: '#a0aec0', cursor: 'pointer' }}
              >
                Stay
              </button>
              <button
                onClick={handleForfeit}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ff6b35', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Forfeit & Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#2a3441', padding: '15px 20px', borderRadius: '16px', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
        <button
          onClick={() => {
            if (status === 'active') {
              setShowForfeitModal(true);
            } else {
              navigate('/menu');
            }
          }}
          style={{ padding: '10px 16px', fontSize: '14px', cursor: 'pointer', borderRadius: 12, border: '2px solid #ff6b35', backgroundColor: 'transparent', color: '#ff6b35', fontWeight: 'bold' }}
        >
          ← Menu
        </button>
        <h1 style={{ margin: 0, fontSize: '2em', color: '#ffffff' }}>Mega OX</h1>
        <div style={{ width: 72 }} />
      </div>

      {/* Turn indicator */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#00d4aa20', borderRadius: '12px', border: '2px solid #00d4aa', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '56px' }}>
        <strong style={{ color: '#00d4aa', fontSize: '16px' }}>
          {status === 'complete'
            ? getWinnerText()
            : isMyTurn
            ? `Your turn (${myMarker})`
            : "Opponent's turn..."}
        </strong>
      </div>

      {!opponentConnected && disconnectCountdown !== null && status === 'active' && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#ff6b3520', border: '1px solid #ff6b35', borderRadius: '10px', color: '#ff6b35', fontSize: '14px' }}>
          Opponent disconnected — forfeiting in {disconnectCountdown}s
        </div>
      )}

      <PlayerIndicator
        currentPlayer={isMyTurn ? `You (${myMarker})` : `Opponent (${myMarker === 'X' ? 'O' : 'X'})`}
        playerScores={{ X: game.winCounts[Marker.X], O: game.winCounts[Marker.O] }}
        drawCount={game.drawCount}
      />

      <div style={{ position: 'relative' }}>
        {myEmoji       && <EmojiBubble emoji={myEmoji}       side="left"  />}
        {opponentEmoji && <EmojiBubble emoji={opponentEmoji} side="right" />}
        <MacroBoard
          microBoards={microBoardsData}
          onPlaceMarker={placeMarker}
          nextMicroBoardIndex={game.nextMicroBoardIndex}
          macroWinner={macroWinner}
          lastMove={null}
        />
      </div>

      {status === 'active' && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
          <EmojiPanel onSend={sendEmoji} />
        </div>
      )}

      {status === 'complete' && (
        <div style={{ marginTop: 20, fontWeight: 'bold', fontSize: '20px', padding: '25px', backgroundColor: '#2a3441', borderRadius: '16px', border: '3px solid #00d4aa', color: '#00d4aa', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
          {opponentForfeited
            ? 'Your opponent disconnected. You win!'
            : getWinnerText()}
          {wonByForfeit ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button
                onClick={() => navigate('/menu')}
                style={{ padding: '12px 24px', fontSize: '15px', cursor: 'pointer', borderRadius: 10, border: 'none', backgroundColor: '#00d4aa', color: '#fff', fontWeight: 'bold' }}
              >
                Back to Menu
              </button>
            </div>
          ) : postGameLoading ? (
            <div style={{ color: '#a0aec0', fontSize: '14px', marginTop: '12px' }}>
              Loading rewards...
            </div>
          ) : (
            <>
              {/* Readiness dots — green = play again, red = leaving, grey = undecided */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '14px 0 6px' }}>
                <span title="You" style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: myRematchIntent === 'play_again' ? '#00d4aa' : myRematchIntent === 'back_to_menu' ? '#ff6b35' : '#3a4a5a' }} />
                <span title="Opponent" style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: opponentRematchIntent === 'play_again' ? '#00d4aa' : opponentRematchIntent === 'back_to_menu' ? '#ff6b35' : '#3a4a5a' }} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                {myRematchIntent === 'play_again' && waitCountdown !== null ? (
                  // Countdown ring replaces the disabled "Waiting..." button
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                    <CountdownRing seconds={waitCountdown} total={30} />
                    <span style={{ color: '#a0aec0', fontSize: '13px' }}>Waiting for opponent...</span>
                  </div>
                ) : (
                  <button
                    onClick={() => signalRematchIntent('play_again')}
                    disabled={myRematchIntent !== null}
                    style={{ marginTop: '10px', padding: '12px 24px', fontSize: '15px', cursor: myRematchIntent !== null ? 'default' : 'pointer', borderRadius: 10, border: '2px solid #00d4aa', backgroundColor: 'transparent', color: myRematchIntent !== null ? '#3a4a5a' : '#00d4aa', fontWeight: 'bold', borderColor: myRematchIntent !== null ? '#3a4a5a' : '#00d4aa' }}
                  >
                    {myRematchIntent === 'play_again' ? 'Waiting...' : 'Play Again'}
                  </button>
                )}
                <button
                  onClick={() => { signalRematchIntent('back_to_menu'); navigate('/menu'); }}
                  style={{ marginTop: '10px', padding: '12px 24px', fontSize: '15px', cursor: 'pointer', borderRadius: 10, border: 'none', backgroundColor: '#00d4aa', color: '#fff', fontWeight: 'bold' }}
                >
                  Back to Menu
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {/* Rematch outcome overlays — rendered outside the scroll container so they cover everything */}
      {rematchOverlay && (
        <RematchOutcomeOverlay
          type={rematchOverlay}
          onDismiss={rematchOverlay === 'agreed' ? handleAgreedDismiss : handleOptedOutDismiss}
        />
      )}
      {postGameResult && (
        <PostGameModal
          result={postGameResult}
          level={progression.level}
          xpIntoLevel={progression.xpIntoLevel}
          xpNeededForLevel={progression.xpNeededForLevel}
          xpToNext={progression.xpToNext}
          onContinue={() => setPostGameResult(null)}
        />
      )}
    </div>
    </SkinProvider>
  );
};

export default OnlineGameView;
