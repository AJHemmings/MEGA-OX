import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { serializeGame } from '../../lib/gameSerializer';
import { Game } from '../../models/Game';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';
import { SearchIcon } from '../icons';
import BackButton from '../common/BackButton';

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const MatchmakingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profile = usePlayerProfile();

  const mode = searchParams.get('mode') ?? 'friendly';
  const viewParam = searchParams.get('view') as 'create' | 'join' | 'searching' | null;

  const [view, setView]         = useState<'searching' | 'create' | 'join'>(viewParam ?? 'join');
  const [code, setCode]         = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [elapsed, setElapsed]   = useState(0);
  const hasAutoCreated          = useRef(false);
  const joinInputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (view !== 'searching') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [view]);

  const createGame = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    const newCode = generateCode();
    const initialState = serializeGame(new Game());

    const { data, error: err } = await supabase.from('games').insert({
      player_x_id: user.id,
      state: initialState as any,
      match_type: mode,
      game_code: newCode,
      status: 'waiting',
    }).select('id').single();

    setLoading(false);
    if (err || !data) { setError('Could not create game'); return; }

    setCode(newCode);
    setView('create');

    const channel = supabase
      .channel(`lobby:${data.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${data.id}`
      }, (payload) => {
        if (['rps', 'active'].includes((payload.new as any).status)) {
          supabase.removeChannel(channel);
          navigate(`/game/${data.id}`);
        }
      }).subscribe(async (subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          const { data: current } = await supabase.from('games').select('status').eq('id', data.id).single();
          if (current && ['rps', 'active'].includes(current.status)) {
            supabase.removeChannel(channel);
            navigate(`/game/${data.id}`);
          }
        }
      });
  };

  const joinGame = async () => {
    if (!user || !joinCode) return;
    setLoading(true);
    setError('');

    const { data: game } = await supabase.from('games')
      .select('*').eq('game_code', joinCode.toUpperCase()).eq('status', 'waiting').single();

    if (!game)                    { setLoading(false); setError('Game not found or already started'); return; }
    if (game.player_x_id === user.id) { setLoading(false); setError('Cannot join your own game'); return; }

    const { error: err } = await supabase.from('games').update({
      player_o_id: user.id,
      status: 'rps',
    }).eq('id', game.id);

    setLoading(false);
    if (err) { setError('Could not join game'); return; }
    navigate(`/game/${game.id}`);
  };

  // Auto-trigger create when landing on the create view from MultiplayerMenu
  useEffect(() => {
    if (viewParam === 'create' && !hasAutoCreated.current) {
      hasAutoCreated.current = true;
      createGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elapsedFmt = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const headerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px', fontFamily: tokens.font,
  };
  const pageWrap: React.CSSProperties = {
    fontFamily: tokens.font, color: tokens.text,
    maxWidth: 480, margin: '0 auto', padding: '0 20px 60px',
  };

  return (
    <PageBackground>
      <div style={pageWrap}>

        {/* Error toast */}
        {error && (
          <div style={{ color: tokens.loss, fontSize: 13, fontWeight: 600, padding: '12px 16px', marginTop: 8, background: 'rgba(255,107,107,0.1)', borderRadius: 10, border: `1px solid rgba(255,107,107,0.2)` }}>
            {error}
          </div>
        )}

        {/* ── SEARCHING VIEW ── */}
        {view === 'searching' && (
          <>
            <div style={headerStyle}>
              <BackButton onClick={() => navigate('/multiplayer')} />
              <span style={{ fontSize: 18, fontWeight: 800 }}>Searching…</span>
            </div>

            {/* Pulse rings */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 240, position: 'relative', marginBottom: 24 }}>
              {[0, 0.4, 0.8].map((delay) => (
                <div key={delay} style={{
                  position: 'absolute', width: 220, height: 220, borderRadius: '50%',
                  border: '1.5px solid rgba(0,212,170,0.35)',
                  animation: `mxRingPulse 2.4s ease-out ${delay}s infinite`,
                }} />
              ))}
              <div style={{
                width: 88, height: 88, borderRadius: '50%', background: tokens.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 60px #00d4aa', zIndex: 1, position: 'relative',
              }}>
                <SearchIcon size={34} />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Finding opponent</div>
              <div style={{ fontSize: 14, color: tokens.textMuted }}>Matching you with a nearby-rated player</div>
            </div>

            {/* VS card */}
            <Glass style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Your side */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, rgba(124,77,255,0.5), rgba(0,212,170,0.3))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                    {profile?.username?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{profile?.username ?? 'You'}</div>
                    <div style={{ fontSize: 11, color: tokens.textMuted }}>{profile?.rank_tier ?? ''}</div>
                  </div>
                </div>
                {/* VS */}
                <div style={{ fontSize: 13, fontWeight: 900, color: tokens.textMuted, flexShrink: 0 }}>VS</div>
                {/* Opponent placeholder */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: tokens.textMuted }}>
                      Searching
                      <span style={{ animation: 'mxBlink 1.2s step-end infinite' }}> · · ·</span>
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px dashed rgba(255,255,255,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: tokens.textDim, fontSize: 18 }}>
                    ?
                  </div>
                </div>
              </div>
            </Glass>

            <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: tokens.textDim, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 16 }}>
              ELAPSED · {elapsedFmt}
            </div>

            <SecondaryButton onClick={() => navigate('/multiplayer')} fullWidth>Cancel</SecondaryButton>
          </>
        )}

        {/* ── CREATE (HOST) VIEW ── */}
        {view === 'create' && (
          <>
            <div style={headerStyle}>
              <BackButton onClick={() => navigate('/multiplayer')} />
              <span style={{ fontSize: 18, fontWeight: 800 }}>Friendly game</span>
            </div>

            {loading && !code ? (
              <Glass style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ color: tokens.textMuted, fontSize: 14 }}>Creating game…</div>
              </Glass>
            ) : (
              <Glass style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: tokens.accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
                  Share this code
                </div>
                {/* Individual letter cells */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  {(code || '      ').split('').slice(0, 6).map((char, i) => (
                    <div key={i} style={{
                      width: 38, height: 50, borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,212,170,0.10)', border: '1px solid rgba(0,212,170,0.30)',
                      fontSize: 26, fontWeight: 900, color: tokens.accent, fontFamily: 'monospace',
                    }}>
                      {char.trim() || ''}
                    </div>
                  ))}
                </div>
                <SecondaryButton onClick={() => navigator.clipboard.writeText(code)} fullWidth>
                  📋 Copy code
                </SecondaryButton>
              </Glass>
            )}

            {/* Status row */}
            <Glass style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: tokens.accent, marginTop: 4, flexShrink: 0,
                  boxShadow: `0 0 6px ${tokens.accent}`, animation: 'mxPulse 1.5s ease-in-out infinite',
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Waiting for opponent</div>
                  <div style={{ fontSize: 12, color: tokens.textMuted }}>Game starts automatically when they join.</div>
                </div>
              </div>
            </Glass>

            {/* Share via */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['Link', 'iMessage', 'WhatsApp', 'More'].map((label) => (
                <button key={label} onClick={() => {
                  if (label === 'Link' || label === 'More') navigator.clipboard.writeText(code);
                }} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  color: tokens.textMuted, cursor: 'pointer', fontFamily: tokens.font, textAlign: 'center',
                }}>
                  {label}
                </button>
              ))}
            </div>

            <SecondaryButton onClick={() => navigate('/multiplayer')} fullWidth>Cancel</SecondaryButton>
          </>
        )}

        {/* ── JOIN VIEW ── */}
        {view === 'join' && (
          <>
            <div style={headerStyle}>
              <BackButton onClick={() => navigate('/multiplayer')} />
              <span style={{ fontSize: 18, fontWeight: 800 }}>Join a game</span>
            </div>

            <Glass style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: tokens.accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                Enter code
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>Got a code from a friend?</div>

              {/* 6-cell code input */}
              <div style={{ position: 'relative', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {Array.from({ length: 6 }, (_, i) => {
                    const char = joinCode[i] ?? '';
                    const isActive = i === joinCode.length && joinCode.length < 6;
                    return (
                      <div
                        key={i}
                        onClick={() => joinInputRef.current?.focus()}
                        style={{
                          width: 42, height: 56, borderRadius: 12, cursor: 'text',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: char ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.04)',
                          border: isActive
                            ? `1.5px solid ${tokens.accent}`
                            : char
                              ? '1px solid rgba(0,212,170,0.35)'
                              : '1px solid rgba(255,255,255,0.12)',
                          boxShadow: isActive ? '0 0 0 3px rgba(0,212,170,0.20)' : 'none',
                          fontSize: 26, fontWeight: 900, color: tokens.text, fontFamily: 'monospace',
                          position: 'relative',
                        }}
                      >
                        {char || (isActive
                          ? <span style={{ width: 2, height: 28, background: tokens.accent, borderRadius: 1, animation: 'mxBlink 1s step-end infinite' }} />
                          : null
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Hidden input captures keyboard */}
                <input
                  ref={joinInputRef}
                  autoFocus
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === 'Enter' && joinCode.length === 6) joinGame(); }}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'text', fontSize: 0 }}
                />
              </div>

              <PrimaryButton
                onClick={joinGame}
                fullWidth
                disabled={loading || joinCode.length < 6}
              >
                {loading ? 'Joining…' : 'Join Game'}
              </PrimaryButton>
            </Glass>

            <SecondaryButton
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  setJoinCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                } catch (_) {}
              }}
              fullWidth
            >
              Paste from clipboard
            </SecondaryButton>

            <div style={{ marginTop: 12 }}>
              <SecondaryButton onClick={() => navigate('/multiplayer')} fullWidth>← Back</SecondaryButton>
            </div>
          </>
        )}

      </div>
    </PageBackground>
  );
};

export default MatchmakingPage;
