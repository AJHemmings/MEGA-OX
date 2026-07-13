import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Glass from '../common/Glass';
import { tokens, tierColour } from '../../styles/tokens';

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

interface FriendsLeaderboardProps {
  compact?: boolean;
}

const MEDAL = { 1: '#f9a825', 2: '#c0c0c0', 3: '#cd7f32' } as Record<number, string>;
const STAND_H = { 1: 80, 2: 64, 3: 48 } as Record<number, number>;

export function FriendsLeaderboard({ compact = false }: FriendsLeaderboardProps) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('get_friends_leaderboard');
      if (!mounted) return;
      if (rpcError) { setError("Couldn't load leaderboard."); setLoading(false); return; }
      setRows(data ?? []);
      setLoading(false);
    }

    loadRef.current = load;
    load();

    return () => { mounted = false; };
  }, []);

  if (loading) return <p style={{ color: tokens.textMuted, fontSize: 13 }}>Loading…</p>;
  if (error) return (
    <div>
      <p style={{ color: tokens.loss, fontSize: 13 }}>{error}</p>
      <button
        onClick={() => loadRef.current()}
        style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, background: '#6c63ff', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
      >Retry</button>
    </div>
  );
  if (rows.length === 0) return <p style={{ color: tokens.textMuted, fontSize: 13 }}>No friends data yet.</p>;

  // Compact mode — simple ranked list for the drawer
  if (compact) {
    return (
      <div>
        <div style={{
          display: 'grid', gridTemplateColumns: '24px 1fr 50px 50px',
          gap: 8, padding: '6px 0',
          color: 'rgba(255,255,255,0.4)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: 1,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span>#</span><span>Player</span>
          <span style={{ textAlign: 'right' }}>XP</span>
          <span style={{ textAlign: 'right' }}>W/L</span>
        </div>
        {rows.map((row, i) => {
          const isYou = row.user_id === user?.id;
          return (
            <div key={row.user_id} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 50px 50px',
              gap: 8, padding: '8px 4px', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              borderRadius: isYou ? 6 : 0,
              background: isYou ? 'rgba(0,212,170,0.08)' : 'transparent',
            }}>
              <span style={{ color: tokens.textMuted, fontSize: 13 }}>{i + 1}</span>
              <span style={{ color: isYou ? tokens.accent : '#fff', fontSize: 13, fontWeight: isYou ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.username}{isYou ? ' (You)' : ''}
              </span>
              <span style={{ color: '#a78bfa', fontSize: 12, textAlign: 'right' }}>{row.xp ?? 0}</span>
              <span style={{ color: tokens.textMuted, fontSize: 12, textAlign: 'right' }}>{row.wins ?? 0}/{row.losses ?? 0}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Full page mode — matches global leaderboard design
  const top3 = rows.slice(0, Math.min(3, rows.length));
  const rest = rows.slice(3);

  // Podium display order: 2nd, 1st, 3rd
  const podium = [
    top3[1] ? { row: top3[1], rank: 2 } : null,
    top3[0] ? { row: top3[0], rank: 1 } : null,
    top3[2] ? { row: top3[2], rank: 3 } : null,
  ].filter(Boolean) as { row: LeaderboardRow; rank: number }[];

  return (
    <div>
      {/* Podium */}
      {podium.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
          {podium.map(({ row, rank }) => {
            const color = MEDAL[rank];
            const standH = STAND_H[rank];
            const avatarSize = rank === 1 ? 56 : 44;
            const isYou = row.user_id === user?.id;
            return (
              <div
                key={row.user_id}
                onClick={() => navigate(`/profile/${row.username}`)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flex: rank === 1 ? '0 0 120px' : '0 0 96px' }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: avatarSize, height: avatarSize, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: avatarSize * 0.4, fontWeight: 900, color: tokens.textMuted,
                  }}>
                    {row.username[0]?.toUpperCase()}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -6, right: -6,
                    width: 22, height: 22, borderRadius: '50%',
                    background: color, border: '2px solid #060d1f',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#000',
                  }}>{rank}</div>
                </div>
                <div style={{
                  fontSize: rank === 1 ? 13 : 12, fontWeight: 800, textAlign: 'center',
                  maxWidth: rank === 1 ? 110 : 90,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: isYou ? tokens.accent : tokens.text,
                }}>
                  {row.username}{isYou ? ' (You)' : ''}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.accent }}>{row.wins}W</div>
                <div style={{ width: '100%', height: standH, borderRadius: '8px 8px 0 0', background: `linear-gradient(180deg, ${color}AA, ${color}11)` }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Rank list (4th place onwards) */}
      {rest.length > 0 && (
        <Glass>
          {rest.map((row, i) => {
            const isYou = row.user_id === user?.id;
            const position = i + 4;
            return (
              <div
                key={row.user_id}
                onClick={() => navigate(`/profile/${row.username}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: isYou ? 'rgba(0,212,170,0.10)' : 'transparent',
                  border: isYou ? '1px solid rgba(0,212,170,0.25)' : '1px solid transparent',
                  marginBottom: i < rest.length - 1 ? 4 : 0,
                }}
              >
                <div style={{ width: 30, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: tokens.textDim, flexShrink: 0, textAlign: 'right' }}>
                  #{position}
                </div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: tokens.textMuted, flexShrink: 0,
                }}>
                  {row.username[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.username}</span>
                    {isYou && <span style={{ fontSize: 10, fontWeight: 800, color: tokens.accent, flexShrink: 0 }}>(YOU)</span>}
                  </div>
                  <div style={{ fontSize: 10, color: tierColour[row.rank_tier] ?? tokens.textMuted, fontWeight: 700 }}>{row.rank_tier}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, textAlign: 'right' }}>
                  <span style={{ color: tokens.win }}>{row.wins}W </span>
                  <span style={{ color: tokens.loss }}>{row.losses}L </span>
                  <span style={{ color: tokens.textDim }}>{row.draws}D</span>
                </div>
              </div>
            );
          })}
        </Glass>
      )}
    </div>
  );
}
