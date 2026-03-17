import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { serializeGame } from '../../lib/gameSerializer';
import { Game } from '../../models/Game';

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const MatchmakingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') ?? 'friendly';

  const [view, setView] = useState<'choose' | 'create' | 'join' | 'searching'>('choose');
  const [code, setCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createGame = async () => {
    if (!user) return;
    setLoading(true);
    const newCode = generateCode();
    const initialState = serializeGame(new Game());

    const { data, error } = await supabase.from('games').insert({
      player_x_id: user.id,
      state: initialState as any,
      match_type: mode,
      game_code: newCode,
      status: 'waiting',
    }).select('id').single();

    setLoading(false);
    if (error || !data) { setError('Could not create game'); return; }

    setCode(newCode);
    setView('create');

    // Wait for opponent to join via realtime
    const channel = supabase
      .channel(`lobby:${data.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${data.id}`
      }, (payload) => {
        if ((payload.new as any).status === 'active') {
          supabase.removeChannel(channel);
          navigate(`/game/${data.id}`);
        }
      }).subscribe();
  };

  const joinGame = async () => {
    if (!user || !joinCode) return;
    setLoading(true);
    setError('');

    const { data: game } = await supabase.from('games')
      .select('*').eq('game_code', joinCode.toUpperCase()).eq('status', 'waiting').single();

    if (!game) { setLoading(false); setError('Game not found or already started'); return; }
    if (game.player_x_id === user.id) { setLoading(false); setError('Cannot join your own game'); return; }

    const { error } = await supabase.from('games').update({
      player_o_id: user.id,
      status: 'active',
    }).eq('id', game.id);

    setLoading(false);
    if (error) { setError('Could not join game'); return; }
    navigate(`/game/${game.id}`);
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh', background: '#1a2332', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: '#fff'
  };
  const card: React.CSSProperties = {
    background: '#2a3441', borderRadius: '12px', padding: '40px',
    maxWidth: '400px', width: '100%', textAlign: 'center'
  };

  if (view === 'create') return (
    <div style={pageStyle}>
      <div style={card}>
        <h2>Waiting for opponent</h2>
        <p style={{ color: '#a0aec0' }}>Share this code:</p>
        <div style={{ fontSize: '36px', letterSpacing: '8px', color: '#00d4aa', fontWeight: 'bold', margin: '16px 0' }}>{code}</div>
        <p style={{ color: '#a0aec0', fontSize: '14px' }}>Game will start automatically when they join.</p>
        <button onClick={() => navigate('/menu')} style={{ marginTop: '24px', background: 'none', border: '1px solid #3a4a5a', color: '#a0aec0', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={card}>
        <h2 style={{ marginBottom: '8px' }}>Friendly Game</h2>
        {error && <div style={{ color: '#ff6b35', marginBottom: '16px' }}>{error}</div>}
        {view === 'choose' && (
          <>
            <button onClick={createGame} disabled={loading} style={{ display: 'block', width: '100%', padding: '14px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #00d4aa', background: 'transparent', color: '#fff', fontSize: '15px', cursor: 'pointer' }}>
              Create game (get a code)
            </button>
            <button onClick={() => setView('join')} style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #4299e1', background: 'transparent', color: '#fff', fontSize: '15px', cursor: 'pointer' }}>
              Join with code
            </button>
          </>
        )}
        {view === 'join' && (
          <>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter 6-digit code"
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #3a4a5a', background: '#1a2332', color: '#fff', fontSize: '20px', letterSpacing: '4px', textAlign: 'center', boxSizing: 'border-box', marginBottom: '16px' }} />
            <button onClick={joinGame} disabled={loading || joinCode.length < 6}
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#4299e1', color: '#fff', fontSize: '15px', cursor: 'pointer' }}>
              {loading ? 'Joining...' : 'Join Game'}
            </button>
            <button onClick={() => setView('choose')} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer' }}>← Back</button>
          </>
        )}
        <button onClick={() => navigate('/menu')} style={{ marginTop: '24px', background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', display: 'block' }}>← Back to menu</button>
      </div>
    </div>
  );
};

export default MatchmakingPage;
