import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface LeaderboardRow {
  user_id: string;
  username: string;
  xp: number;
  level: number;
  wins: number;
  losses: number;
  draws: number;
  mmr: number;
  rank_tier: string;
}

export function FriendsLeaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await (supabase as any).rpc('get_friends_leaderboard');
      if (!mounted) return;
      if (rpcError) { setError("Couldn't load leaderboard."); setLoading(false); return; }
      setRows(data ?? []);
      setLoading(false);
    }

    loadRef.current = load;
    load();

    return () => { mounted = false; };
  }, []);

  if (loading) return <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading…</p>;
  if (error) return (
    <div>
      <p style={{ color: '#f87171', fontSize: 13 }}>{error}</p>
      <button onClick={() => loadRef.current()} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: '#6c63ff', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
        Retry
      </button>
    </div>
  );
  if (rows.length === 0) return <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No data yet.</p>;

  return (
    <div>
      <div style={{
        display: 'grid', gridTemplateColumns: '24px 1fr 60px 60px',
        gap: 8, padding: '6px 0',
        color: 'rgba(255,255,255,0.4)', fontSize: 11,
        textTransform: 'uppercase', letterSpacing: 1,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span>#</span><span>Player</span><span style={{ textAlign: 'right' }}>XP</span><span style={{ textAlign: 'right' }}>W/L</span>
      </div>
      {rows.map((row, i) => (
        <div
          key={row.user_id}
          style={{
            display: 'grid', gridTemplateColumns: '24px 1fr 60px 60px',
            gap: 8, padding: '8px 0', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{i + 1}</span>
          <span style={{ color: '#fff', fontSize: 14 }}>{row.username}</span>
          <span style={{ color: '#a78bfa', fontSize: 13, textAlign: 'right' }}>{row.xp ?? 0}</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'right' }}>
            {row.wins ?? 0}/{row.losses ?? 0}
          </span>
        </div>
      ))}
    </div>
  );
}
