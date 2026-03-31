import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LevelBadge } from '../progression/LevelBadge';

interface LeaderboardEntry {
  position: number;
  player_id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  rank_tier: string;
  wins: number;
  losses: number;
  draws: number;
}

const tierColour: Record<string, string> = {
  'Grand Master': '#ffd700', 'Master': '#c0c0c0', 'Expert': '#cd7f32',
  'Strategist': '#00d4aa', 'Tactician': '#4299e1', 'Challenger': '#a0aec0', 'Novice': '#5a6a7a'
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('leaderboard').select('*').then(({ data }) => {
      setEntries((data as LeaderboardEntry[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <h1 style={{ color: '#00d4aa', margin: 0 }}>Leaderboard</h1>
        </div>
        {loading ? <div style={{ color: '#a0aec0' }}>Loading...</div> : (
          <div>
            {entries.map(entry => (
              <div key={entry.player_id} onClick={() => navigate(`/profile/${entry.username}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', marginBottom: '8px', background: '#2a3441', borderRadius: '8px', cursor: 'pointer' }}>
                <span style={{ width: '40px', color: entry.position <= 3 ? '#ffd700' : '#a0aec0', fontWeight: 'bold', fontSize: '18px' }}>#{entry.position}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {entry.username}
                    <LevelBadge level={entry.level ?? 1} size="sm" />
                  </div>
                  <div style={{ fontSize: '12px', color: tierColour[entry.rank_tier] ?? '#a0aec0' }}>{entry.rank_tier}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '13px', color: '#a0aec0' }}>
                  <span style={{ color: '#00d4aa' }}>{entry.wins}W </span>
                  <span style={{ color: '#ff6b35' }}>{entry.losses}L </span>
                  <span>{entry.draws}D</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
