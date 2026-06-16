import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Marker } from '../../models/Game';
import MacroBoard from '../MacroBoard';
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
import { useProgressionContext } from '../../contexts/ProgressionContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAdminRole } from '../../hooks/useAdminRole';
import { usePlayerProfile, PlayerProfile } from '../../hooks/usePlayerProfile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';
import Pill from '../common/Pill';
import BackButton from '../common/BackButton';
import { LevelBadge } from '../progression/LevelBadge';

const defaultGameSkins: GameSkins = {
  boardSkin:      DEFAULT_BOARD_SKIN,
  p1MarkerSkin:   DEFAULT_MARKER_X_SKIN,
  p2MarkerSkin:   DEFAULT_MARKER_O_SKIN,
  p1WonBoardSkin: DEFAULT_WON_BOARD_X_SKIN,
  p2WonBoardSkin: DEFAULT_WON_BOARD_O_SKIN,
};

const RING_RADIUS = 36;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const BOARD_NAMES = ['Top-Left', 'Top', 'Top-Right', 'Left', 'Center', 'Right', 'Bottom-Left', 'Bottom', 'Bottom-Right'];

const CountdownRing: React.FC<{ seconds: number; total: number }> = ({ seconds, total }) => {
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - seconds / total);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle cx="44" cy="44" r={RING_RADIUS} fill="none" stroke={tokens.accent} strokeWidth="4"
        strokeLinecap="round" strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 44 44)" style={{ transition: 'stroke-dashoffset 0.9s linear' }} />
      <text x="44" y="50" textAnchor="middle" fill={tokens.text} fontSize="22" fontWeight="bold" fontFamily={tokens.font}>
        {seconds}
      </text>
    </svg>
  );
};

const PlayerAvatar: React.FC<{ profile: PlayerProfile | null; fallback: string; size: number; color: string }> = ({ profile, fallback, size, color }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}44`, overflow: 'hidden', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' as const, flexShrink: 0 }}>
    {profile?.avatar_url
      ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : <span style={{ fontSize: size * 0.42, fontWeight: 900, color, fontFamily: tokens.font }}>
          {(profile?.username ?? fallback)[0]?.toUpperCase()}
        </span>
    }
  </div>
);

const DesktopPanel: React.FC<{
  profile: PlayerProfile | null;
  marker: 'X' | 'O';
  isSelf: boolean;
  isActive: boolean;
  status: string;
  sendEmoji: (emoji: string) => void;
  emoji: string | null;
}> = ({ profile, marker, isSelf, isActive, status, sendEmoji, emoji }) => {
  const color = marker === 'X' ? tokens.accent : tokens.loss;
  return (
    <Glass style={{
      border: isActive ? `1px solid ${color}` : tokens.glassBorder,
      boxShadow: isActive ? `0 0 20px ${color}4d` : 'none',
      transition: 'box-shadow 0.3s ease',
      position: 'sticky' as const, top: 20,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <div style={{ position: 'relative', width: 68, height: 68 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', border: `2px solid ${color}44`, overflow: 'hidden', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' as const }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 26, fontWeight: 900, color, fontFamily: tokens.font }}>{(profile?.username ?? marker)[0]?.toUpperCase()}</span>
            }
          </div>
          <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
            <LevelBadge level={profile?.level ?? 1} size="sm" />
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{profile?.username ?? (isSelf ? 'You' : 'Opponent')}{isSelf ? ' (You)' : ''}</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>{profile?.rank_tier ?? ''}</div>
          {emoji && <EmojiBubble emoji={emoji} align="center" />}
        </div>
        {isSelf && status === 'active' && (
          <div style={{ marginTop: 4, width: '100%' }}>
            <EmojiPanel onSend={sendEmoji} />
          </div>
        )}
      </div>
    </Glass>
  );
};

// Shared between OnlineGameMobile and OnlineGameDesktop — OnlineGameView is the coordinator
// that owns all state/effects; these two only render it. Several fields (forfeitModal,
// disconnectWarning, turnPill, completeState, debugTurnPill) are pre-rendered JSX because
// they're byte-identical between both layouts.
interface OnlineGameLayoutProps {
  status: string;
  matchType: string;
  matchTypePillVariant: string;
  onHeaderAction: () => void;
  forfeitModal: React.ReactNode;
  disconnectWarning: React.ReactNode;
  vsStrip: React.ReactNode;
  turnPill: React.ReactNode;
  completeState: React.ReactNode;
  debugTurnPill: React.ReactNode;
  myEmoji: string | null;
  opponentEmoji: string | null;
  sendEmoji: (emoji: string) => void;
  microBoardsData: { cells: string[]; winner: string }[];
  handlePlaceMarker: (microBoardIndex: number, cellIndex: number) => void;
  nextMicroBoardIndex: number | null;
  macroWinner: string;
  myProfile: PlayerProfile | null;
  opponentProfile: PlayerProfile | null;
  isMyTurn: boolean;
  myMarker: 'X' | 'O' | null;
}

const OnlineGameMobile: React.FC<OnlineGameLayoutProps> = ({
  status, matchType, matchTypePillVariant, onHeaderAction,
  forfeitModal, disconnectWarning, vsStrip, turnPill, completeState, debugTurnPill,
  sendEmoji,
  microBoardsData, handlePlaceMarker, nextMicroBoardIndex, macroWinner,
}) => (
  <div onClick={resumeAudio} style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 520, margin: '0 auto', padding: '0 14px', userSelect: 'none', paddingBottom: 40 }}>
    {forfeitModal}

    {/* Header strip */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0 12px' }}>
      <BackButton onClick={onHeaderAction} />
      <Pill variant={matchTypePillVariant as any}>{matchType.toUpperCase()}</Pill>
      <div style={{ marginLeft: 'auto' }}>
        <SecondaryButton size="sm" onClick={onHeaderAction}>⋯</SecondaryButton>
      </div>
    </div>

    {vsStrip}
    {disconnectWarning}

    {/* Board canvas — scale to fit viewport while keeping all internal pixel values intact */}
    <div style={{ position: 'relative' }}>
      {debugTurnPill}
      {(() => {
        const BOARD_PX = 490;
        const availW = Math.min(524, window.innerWidth) - 28;
        const scale  = Math.min(1, availW / BOARD_PX);
        return (
          <div style={{ overflow: 'hidden', height: Math.round(BOARD_PX * scale) }}>
            <div style={{ width: BOARD_PX, height: BOARD_PX, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <MacroBoard
                microBoards={microBoardsData}
                onPlaceMarker={handlePlaceMarker}
                nextMicroBoardIndex={nextMicroBoardIndex}
                macroWinner={macroWinner}
                lastMove={null}
              />
            </div>
          </div>
        );
      })()}
    </div>

    {turnPill}

    {status === 'active' && (
      <div style={{ marginTop: 12 }}>
        <EmojiPanel onSend={sendEmoji} />
      </div>
    )}

    {completeState}
  </div>
);

const OnlineGameDesktop: React.FC<OnlineGameLayoutProps> = ({
  status, matchType, matchTypePillVariant, onHeaderAction,
  forfeitModal, disconnectWarning, turnPill, completeState, debugTurnPill,
  myEmoji, opponentEmoji, sendEmoji,
  microBoardsData, handlePlaceMarker, nextMicroBoardIndex, macroWinner,
  myProfile, opponentProfile, isMyTurn, myMarker,
}) => {
  const leftMarker  = myMarker === 'X' ? 'X' : 'O';
  const rightMarker = myMarker === 'X' ? 'O' : 'X';

  return (
    <div onClick={resumeAudio} style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 1200, margin: '0 auto', padding: '20px 32px 60px', userSelect: 'none' }}>
      {forfeitModal}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <BackButton onClick={onHeaderAction} />
        <Pill variant={matchTypePillVariant as any}>{matchType.toUpperCase()}</Pill>
        <div style={{ marginLeft: 'auto' }}>
          <SecondaryButton size="sm" onClick={onHeaderAction}>⋯</SecondaryButton>
        </div>
      </div>

      {/* Three-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 520px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
        {/* Left — my panel */}
        <DesktopPanel profile={myProfile} marker={leftMarker as 'X' | 'O'} isSelf={true} isActive={isMyTurn} status={status} sendEmoji={sendEmoji} emoji={myEmoji} />

        {/* Center — turn pill + board + disconnect */}
        <div>
          {disconnectWarning}
          {turnPill}
          <div style={{ position: 'relative' }}>
            {debugTurnPill}
            <MacroBoard
              microBoards={microBoardsData}
              onPlaceMarker={handlePlaceMarker}
              nextMicroBoardIndex={nextMicroBoardIndex}
              macroWinner={macroWinner}
              lastMove={null}
            />
          </div>
          {completeState}
        </div>

        {/* Right — opponent panel */}
        <DesktopPanel profile={opponentProfile} marker={rightMarker as 'X' | 'O'} isSelf={false} isActive={!isMyTurn} status={status} sendEmoji={sendEmoji} emoji={opponentEmoji} />
      </div>
    </div>
  );
};

interface OnlineGameViewProps {
  gameId: string;
}

const OnlineGameView: React.FC<OnlineGameViewProps> = ({ gameId }) => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isMobile  = useIsMobile();
  const {
    game, status, myMarker, winner, placeMarker,
    rpsResultPicks, rpsRound, dismissRPSResult,
    isPlayerX, opponentConnected, disconnectCountdown,
    rematchGameId, forfeitPlayerId,
    myRematchIntent, opponentRematchIntent, signalRematchIntent,
    submitRPSPick, myEmoji, opponentEmoji, sendEmoji,
  } = useOnlineGame(gameId);

  const { role: adminRole } = useAdminRole();
  const [searchParams] = useSearchParams();
  const debugBothSides = searchParams.get('debug') === 'both' && adminRole !== null;

  const handlePlaceMarker = useCallback((microBoardIndex: number, cellIndex: number): void => {
    void placeMarker(
      microBoardIndex,
      cellIndex,
      debugBothSides ? { skipTurnGuard: true } : undefined,
    );
  }, [placeMarker, debugBothSides]);

  const [showForfeitModal, setShowForfeitModal]   = useState(false);
  const [rematchOverlay, setRematchOverlay]       = useState<'agreed' | 'opted_out' | null>(null);
  const [waitCountdown, setWaitCountdown]         = useState<number | null>(null);
  const [postGameResult, setPostGameResult]       = useState<PostGameResult | null>(null);
  const [postGameLoading, setPostGameLoading]     = useState(false);
  const [rpsResultShown, setRpsResultShown]       = useState(false);
  const [matchType, setMatchType]                 = useState<string>('friendly');
  const [opponentId, setOpponentId]               = useState<string | null>(null);

  const rematchGameIdRef      = useRef<string | null>(null);
  const overlayShownRef       = useRef(false);
  const countdownStartedRef   = useRef(false);
  const rematchNavFiredRef    = useRef(false);
  const postGameCalledRef     = useRef(false);

  const prevMicroWinnersRef   = useRef<string[]>([]);
  const prevIsMyTurnRef       = useRef<boolean>(false);
  const prevStatusRef         = useRef<string>('loading');
  const prevCellCountRef      = useRef<number>(0);
  const hasGameStartedRef     = useRef<boolean>(false);

  const progression = useProgressionContext();
  const { refresh: refreshProgression } = progression;

  const wonByForfeit      = forfeitPlayerId !== null;
  const opponentForfeited = forfeitPlayerId !== null && forfeitPlayerId !== user?.id;

  // ── Resolve opponent id & match type ──
  useEffect(() => {
    if (!user || !myMarker) return;
    (async () => {
      const { data: gameRow } = await supabase.from('games')
        .select('player_x_id, player_o_id, match_type')
        .eq('id', gameId).single();
      if (!gameRow) return;
      if (gameRow.match_type) setMatchType(gameRow.match_type);
      setOpponentId(myMarker === 'X' ? gameRow.player_o_id : gameRow.player_x_id);
    })();
  }, [gameId, user, myMarker]);

  const myProfile = usePlayerProfile();
  const opponentProfile = usePlayerProfile(opponentId);

  // ── Preserved logic ──

  useEffect(() => { rematchGameIdRef.current = rematchGameId; }, [rematchGameId]);

  useEffect(() => {
    if (status !== 'complete' || postGameCalledRef.current) return;
    postGameCalledRef.current = true;
    if (debugBothSides) return; // suppress rewards in admin test games
    setPostGameLoading(true);
    callPostGameHandler(gameId).then(result => {
      setPostGameLoading(false);
      if (result && !result.alreadyProcessed) {
        setPostGameResult(result);
        refreshProgression();
      }
    });
  }, [status, gameId, refreshProgression, debugBothSides]);

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

  useEffect(() => {
    if (!rematchGameId) return;
    if (rematchGameId === gameId) return;
    if (rematchNavFiredRef.current) return;
    if (rematchOverlay === 'agreed') return;
    if (myRematchIntent === 'play_again' && !overlayShownRef.current) {
      overlayShownRef.current = true;
      setWaitCountdown(null);
      setRematchOverlay('agreed');
      return;
    }
    rematchNavFiredRef.current = true;
    navigate(`/game/${rematchGameId}`);
  }, [rematchGameId, gameId, navigate, rematchOverlay, myRematchIntent]);

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

  useEffect(() => {
    if (myRematchIntent !== 'play_again') return;
    if (countdownStartedRef.current) return;
    if (opponentRematchIntent !== null) return;
    countdownStartedRef.current = true;
    setWaitCountdown(30);
  }, [myRematchIntent, opponentRematchIntent]);

  useEffect(() => {
    if (waitCountdown === null) return;
    if (waitCountdown <= 0) {
      setWaitCountdown(null);
      if (!overlayShownRef.current) {
        overlayShownRef.current = true;
        setRematchOverlay('opted_out');
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

  const handleHeaderAction = useCallback(() => {
    if (status === 'active') setShowForfeitModal(true);
    else navigate('/menu');
  }, [status, navigate]);

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  useEffect(() => {
    if (!game || !myMarker) return;
    const currentIsMyTurn =
      (myMarker === 'X' && game.currentPlayerIndex === 0) ||
      (myMarker === 'O' && game.currentPlayerIndex === 1);

    if (status === 'active' && !hasGameStartedRef.current) {
      hasGameStartedRef.current = true;
      prevIsMyTurnRef.current = currentIsMyTurn;
      prevCellCountRef.current = game.macroBoard.microBoards
        .reduce((t, mb) => t + mb.cells.filter(c => c.marker !== Marker.None).length, 0);
    }

    const currentCellCount = game.macroBoard.microBoards
      .reduce((t, mb) => t + mb.cells.filter(c => c.marker !== Marker.None).length, 0);
    if (status === 'active' && currentCellCount === prevCellCountRef.current + 1) playMarkerPlaced();
    prevCellCountRef.current = currentCellCount;

    const currentWinners = game.macroBoard.microBoards.map(mb => mb.winner);
    currentWinners.forEach((w, i) => { if (w && w !== prevMicroWinnersRef.current[i]) playMicroBoardWon(); });
    prevMicroWinnersRef.current = currentWinners;

    if (hasGameStartedRef.current && currentIsMyTurn && !prevIsMyTurnRef.current && status === 'active') playYourTurn();
    prevIsMyTurnRef.current = currentIsMyTurn;

    if (status === 'complete' && prevStatusRef.current !== 'complete') {
      if (winner === myMarker) playGameWon();
      else if (winner && winner !== 'draw') playGameLost();
    }
    prevStatusRef.current = status;
  }, [game, status, myMarker, winner]);

  const handleRPSContinue = useCallback(() => {
    if (rpsResultPicks) {
      const result = resolveRPS(rpsResultPicks.creator, rpsResultPicks.joiner);
      if (result !== 'draw') setRpsResultShown(true);
      dismissRPSResult(result === 'draw');
    }
  }, [rpsResultPicks, dismissRPSResult]);

  const handleAgreedDismiss = useCallback(() => {
    setRematchOverlay(null);
    if (!rematchNavFiredRef.current) {
      const targetId = rematchGameIdRef.current;
      if (targetId && targetId !== gameId) {
        rematchNavFiredRef.current = true;
        navigate(`/game/${targetId}`);
      }
    }
  }, [navigate, gameId]);

  const handleOptedOutDismiss = useCallback(() => { setRematchOverlay(null); navigate('/menu'); }, [navigate]);

  // ── Early returns (RPS, loading, waiting) ──

  if (rpsResultPicks) {
    const result: RPSResult = resolveRPS(rpsResultPicks.creator, rpsResultPicks.joiner);
    return <RPSResultScreen creatorPick={rpsResultPicks.creator} joinerPick={rpsResultPicks.joiner} isPlayerX={isPlayerX} result={result} onContinue={handleRPSContinue} />;
  }

  if (status === 'rps' && !rpsResultShown) {
    return <RPSScreen key={rpsRound} onSubmitPick={submitRPSPick} />;
  }

  if (status === 'loading' || !game) return (
    <PageBackground>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textMuted, fontFamily: tokens.font }}>
        Loading game…
      </div>
    </PageBackground>
  );

  if (status === 'waiting') return (
    <PageBackground>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: tokens.font }}>
        <div style={{ color: tokens.textMuted, fontSize: 16 }}>Waiting for opponent to join…</div>
        <SecondaryButton onClick={() => navigate('/menu')}>Cancel</SecondaryButton>
      </div>
    </PageBackground>
  );

  // ── Derived values ──

  const microBoardsData = game.macroBoard.microBoards.map((mb) => ({
    cells: mb.cells.map((c) => c.marker),
    winner: mb.winner,
  }));

  const isMyTurn = myMarker !== null && (
    (myMarker === 'X' && game.currentPlayerIndex === 0) ||
    (myMarker === 'O' && game.currentPlayerIndex === 1)
  );

  const debugTurnPill = debugBothSides ? (
    <div style={{
      textAlign: 'center', padding: '6px 0', marginBottom: 4,
      fontSize: 12, fontWeight: 700, color: tokens.accent,
      fontFamily: tokens.font, letterSpacing: 0.5,
    }}>
      🛠 Playing as: <strong>{game.currentPlayerIndex === 0 ? 'X' : 'O'}</strong>
    </div>
  ) : null;

  const getWinnerText = () => {
    if (winner === 'draw') return "It's a draw!";
    if (winner === myMarker) return 'You Win!';
    return 'Opponent Wins!';
  };

  const macroWinner = game.macroBoard.winner === Marker.None ? '' : game.macroBoard.winner;

  const boardConstraint = game.nextMicroBoardIndex !== null
    ? `▪ PLAY IN ${BOARD_NAMES[game.nextMicroBoardIndex].toUpperCase()} BOARD`
    : '▪ FREE CHOICE';

  const matchTypePillVariant = matchType === 'ranked' ? 'red' : matchType === 'friendly' ? 'teal' : 'gold';

  const myColor  = myMarker === 'X' ? tokens.accent : tokens.loss;
  const oppColor = myMarker === 'X' ? tokens.loss : tokens.accent;
  const myName   = myProfile?.username ?? (myMarker === 'X' ? 'Player X' : 'Player O');
  const oppName  = opponentProfile?.username ?? (myMarker === 'X' ? 'Player O' : 'Player X');

  // ── Forfeit modal ──
  const forfeitModal = showForfeitModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, fontFamily: tokens.font }}>
      <Glass style={{ maxWidth: 320, width: 'calc(100% - 40px)', padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: tokens.text, marginBottom: 8 }}>Leave game?</div>
        <div style={{ color: tokens.textMuted, fontSize: 14, marginBottom: 24 }}>Leaving will forfeit the game. Your opponent wins.</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <SecondaryButton onClick={() => setShowForfeitModal(false)}>Stay</SecondaryButton>
          <PrimaryButton onClick={handleForfeit}>Forfeit & Leave</PrimaryButton>
        </div>
      </Glass>
    </div>
  );

  // ── Disconnect warning ──
  const disconnectWarning = !opponentConnected && disconnectCountdown !== null && status === 'active' && (
    <div style={{ padding: '10px 16px', background: 'rgba(255,107,107,0.12)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, color: tokens.loss, fontSize: 13, marginBottom: 10 }}>
      Opponent disconnected — forfeiting in {disconnectCountdown}s
    </div>
  );

  // ── VS player strip ──
  const vsStrip = (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, marginBottom: 10 }}>
      {/* My column */}
      <div style={{
        flex: 1, minWidth: 0, position: 'relative', padding: '16px 12px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10,
        background: isMyTurn ? `linear-gradient(135deg, ${myColor}33, ${myColor}0d)` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isMyTurn ? myColor : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isMyTurn ? `0 0 20px ${myColor}4d` : 'none',
        transition: 'all 0.3s ease',
      }}>
        <PlayerAvatar profile={myProfile} fallback={myMarker ?? 'X'} size={48} color={myColor} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <LevelBadge level={myProfile?.level ?? 1} size="sm" />
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: tokens.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myName}</div>
          </div>
          {isMyTurn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: myColor }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: myColor, letterSpacing: 0.3 }}>YOUR TURN</span>
            </div>
          )}
          {!isMyTurn && myProfile?.rank_tier && (
            <div style={{ fontSize: 10, color: tokens.textDim, marginTop: 2 }}>{myProfile.rank_tier}</div>
          )}
        </div>
        {myEmoji && <EmojiBubble emoji={myEmoji} align="left" />}
      </div>

      {/* Score chip */}
      <div style={{ alignSelf: 'center', padding: '4px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', fontSize: 13, fontWeight: 900, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, color: tokens.text }}>
        <span style={{ color: tokens.accent }}>{game.winCounts[Marker.X]}</span>
        <span style={{ color: tokens.textMuted }}>:</span>
        <span style={{ color: tokens.loss }}>{game.winCounts[Marker.O]}</span>
      </div>

      {/* Opponent column */}
      <div style={{
        flex: 1, minWidth: 0, position: 'relative', padding: '16px 12px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10,
        background: !isMyTurn ? `linear-gradient(135deg, ${oppColor}33, ${oppColor}0d)` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${!isMyTurn ? oppColor : 'rgba(255,255,255,0.08)'}`,
        boxShadow: !isMyTurn ? `0 0 20px ${oppColor}4d` : 'none',
        transition: 'all 0.3s ease',
        flexDirection: 'row-reverse' as const,
      }}>
        <PlayerAvatar profile={opponentProfile} fallback={myMarker === 'X' ? 'O' : 'X'} size={48} color={oppColor} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' as const }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', minWidth: 0 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, color: tokens.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{oppName}</div>
            <LevelBadge level={opponentProfile?.level ?? 1} size="sm" />
          </div>
          {!isMyTurn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: oppColor, letterSpacing: 0.3 }}>THEIR TURN</span>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: oppColor }} />
            </div>
          )}
          {isMyTurn && opponentProfile?.rank_tier && (
            <div style={{ fontSize: 10, color: tokens.textDim, marginTop: 2 }}>{opponentProfile.rank_tier}</div>
          )}
        </div>
        {opponentEmoji && <EmojiBubble emoji={opponentEmoji} align="right" />}
      </div>
    </div>
  );

  // ── Turn pill ──
  const turnPill = status === 'active' && (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      {isMyTurn
        ? <div style={{ padding: '6px 14px', borderRadius: tokens.rPill, background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.35)', color: tokens.accent, fontSize: 11, fontWeight: 800, letterSpacing: 0.4 }}>
            {boardConstraint}
          </div>
        : <div style={{ padding: '6px 14px', borderRadius: tokens.rPill, background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.35)', color: tokens.loss, fontSize: 11, fontWeight: 800, letterSpacing: 0.4 }}>
            Opponent thinking
          </div>
      }
    </div>
  );

  // ── Complete state ──
  const completeState = status === 'complete' && (
    <Glass style={{ marginTop: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: winner === myMarker ? tokens.win : winner === 'draw' ? tokens.textMuted : tokens.loss, marginBottom: 12 }}>
        {opponentForfeited ? 'Your opponent disconnected. You win!' : getWinnerText()}
      </div>
      {wonByForfeit ? (
        <PrimaryButton onClick={() => navigate('/menu')} fullWidth>Back to Menu</PrimaryButton>
      ) : postGameLoading ? (
        <div style={{ color: tokens.textMuted, fontSize: 14 }}>Loading rewards…</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '10px 0' }}>
            <span title="You" style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: myRematchIntent === 'play_again' ? tokens.accent : myRematchIntent === 'back_to_menu' ? tokens.loss : tokens.textDim }} />
            <span title="Opponent" style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block', background: opponentRematchIntent === 'play_again' ? tokens.accent : opponentRematchIntent === 'back_to_menu' ? tokens.loss : tokens.textDim }} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const, alignItems: 'center' }}>
            {myRematchIntent === 'play_again' && waitCountdown !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <CountdownRing seconds={waitCountdown} total={30} />
                <span style={{ color: tokens.textMuted, fontSize: 13 }}>Waiting for opponent…</span>
              </div>
            ) : (
              <SecondaryButton onClick={() => signalRematchIntent('play_again')} disabled={myRematchIntent !== null}>
                {myRematchIntent === 'play_again' ? 'Waiting…' : 'Play Again'}
              </SecondaryButton>
            )}
            <PrimaryButton onClick={() => { signalRematchIntent('back_to_menu'); navigate('/menu'); }}>
              Back to Menu
            </PrimaryButton>
          </div>
        </>
      )}
    </Glass>
  );

  const layoutProps: OnlineGameLayoutProps = {
    status, matchType, matchTypePillVariant, onHeaderAction: handleHeaderAction,
    forfeitModal, disconnectWarning, vsStrip, turnPill, completeState, debugTurnPill,
    myEmoji, opponentEmoji, sendEmoji,
    microBoardsData, handlePlaceMarker, nextMicroBoardIndex: game.nextMicroBoardIndex, macroWinner,
    myProfile, opponentProfile, isMyTurn, myMarker,
  };

  return (
    <SkinProvider skins={defaultGameSkins}>
      <PageBackground>
        {isMobile ? <OnlineGameMobile {...layoutProps} /> : <OnlineGameDesktop {...layoutProps} />}

        {rematchOverlay && <RematchOutcomeOverlay type={rematchOverlay} onDismiss={rematchOverlay === 'agreed' ? handleAgreedDismiss : handleOptedOutDismiss} />}
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
      </PageBackground>
    </SkinProvider>
  );
};

export default OnlineGameView;
