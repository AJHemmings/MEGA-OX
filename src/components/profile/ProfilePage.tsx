import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileData {
  player_id: string;
  username: string;
  avatar_url: string | null;
  rank_tier: string;
  wins: number;
  losses: number;
  draws: number;
}

interface RecentGame {
  id: string;
  result: 'Win' | 'Loss' | 'Draw';
  opponentUsername: string;
  match_type: string;
}

const tierColour: Record<string, string> = {
  'Grand Master': '#ffd700', 'Master': '#c0c0c0', 'Expert': '#cd7f32',
  'Strategist': '#00d4aa', 'Tactician': '#4299e1', 'Challenger': '#a0aec0', 'Novice': '#5a6a7a'
};

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [leaderboardPos, setLeaderboardPos] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, player_stats(rank_tier, wins, losses, draws)')
        .eq('username', username)
        .single();

      if (!profileData) { setLoading(false); return; }

      const stats = (profileData as any).player_stats;
      const pid = profileData.id;

      setProfile({
        player_id: pid,
        username: profileData.username,
        avatar_url: profileData.avatar_url,
        rank_tier: stats?.rank_tier ?? 'Challenger',
        wins: stats?.wins ?? 0,
        losses: stats?.losses ?? 0,
        draws: stats?.draws ?? 0,
      });

      // Leaderboard position
      const { data: lb } = await supabase
        .from('leaderboard')
        .select('position')
        .eq('player_id', pid)
        .single();
      setLeaderboardPos(lb?.position ?? null);

      // Recent games
      const { data: games } = await supabase
        .from('games')
        .select('id, winner, match_type, player_x_id, player_o_id')
        .or(`player_x_id.eq.${pid},player_o_id.eq.${pid}`)
        .eq('status', 'complete')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (games) {
        const formatted = await Promise.all(games.map(async (g) => {
          const opponentId = (g.player_x_id === pid ? g.player_o_id : g.player_x_id) ?? '';
          const { data: opp } = await supabase.from('profiles').select('username').eq('id', opponentId).single();
          const myMarker = g.player_x_id === pid ? 'X' : 'O';
          const result: 'Win' | 'Loss' | 'Draw' =
            g.winner === 'draw' ? 'Draw' :
            g.winner === myMarker ? 'Win' : 'Loss';
          return { id: g.id, result, opponentUsername: opp?.username ?? 'Unknown', match_type: g.match_type };
        }));
        setRecentGames(formatted);
      }

      setLoading(false);
    };

    loadProfile();
  }, [username]);

  const isOwnProfile = user && profile && user.id === profile.player_id;

  const resultColour = { Win: '#00d4aa', Loss: '#ff6b35', Draw: '#a0aec0' };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
      Loading...
    </div>
  );

  if (!profile) return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', gap: '16px' }}>
      <div>Player not found.</div>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid #4a5568', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Back</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <h1 style={{ margin: 0, color: '#fff' }}>Profile</h1>
          {isOwnProfile && (
            <button onClick={() => navigate('/settings')}
              style={{ marginLeft: 'auto', background: '#2a3441', border: '1px solid #4a5568', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Edit Profile
            </button>
          )}
        </div>

        {/* Avatar + name */}
        <div style={{ background: '#2a3441', borderRadius: '12px', padding: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1a2332', overflow: 'hidden', border: '2px solid #4a5568', flexShrink: 0 }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#a0aec0' }}>
                  {profile.username[0]?.toUpperCase()}
                </div>
            }
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{profile.username}</div>
            <div style={{ color: tierColour[profile.rank_tier] ?? '#a0aec0', fontSize: '14px', marginTop: '4px' }}>{profile.rank_tier}</div>
            {leaderboardPos && <div style={{ color: '#a0aec0', fontSize: '12px', marginTop: '4px' }}>Rank #{leaderboardPos}</div>}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Wins', value: profile.wins, colour: '#00d4aa' },
            { label: 'Losses', value: profile.losses, colour: '#ff6b35' },
            { label: 'Draws', value: profile.draws, colour: '#a0aec0' },
          ].map(({ label, value, colour }) => (
            <div key={label} style={{ background: '#2a3441', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: colour }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Recent games */}
        <div style={{ background: '#2a3441', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#a0aec0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Games</div>
          {recentGames.length === 0
            ? <div style={{ color: '#4a5568', fontSize: '14px' }}>No games played yet.</div>
            : recentGames.map((g) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #1a2332' }}>
                <span style={{ fontWeight: 'bold', color: resultColour[g.result], minWidth: '40px', fontSize: '13px' }}>{g.result}</span>
                <span style={{ flex: 1, color: '#fff', fontSize: '14px' }}>vs {g.opponentUsername}</span>
                <span style={{ color: '#4a5568', fontSize: '12px' }}>{g.match_type}</span>
              </div>
            ))
          }
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
