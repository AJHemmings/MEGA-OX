import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LevelBadge } from '../progression/LevelBadge';
import { XPProgressBar } from '../progression/XPProgressBar';
import { useProgression } from '../../hooks/useProgression';
import { useAchievements } from '../../hooks/useAchievements';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens, tierColour } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import SecondaryButton from '../common/SecondaryButton';
import PrimaryButton from '../common/PrimaryButton';
import { Flame, ChevronLeft } from '../icons';
import TabBar from '../common/TabBar';

interface ProfileData {
  player_id:   string;
  username:    string;
  avatarUrl:   string | null;
  badgeUrl:    string | null;
  badgeName:   string | null;
  bannerUrl:   string | null;
  level:       number;
  rank_tier:   string;
  wins:        number;
  losses:      number;
  draws:       number;
  best_streak: number;
}

interface RecentGame {
  id: string;
  result: 'Win' | 'Loss' | 'Draw';
  opponentUsername: string;
  match_type: string;
}


// ────────── sub-components ──────────

const ResultPill: React.FC<{ result: 'Win' | 'Loss' | 'Draw' }> = ({ result }) => {
  const bg    = result === 'Win' ? 'rgba(0,212,170,0.15)' : result === 'Loss' ? 'rgba(255,107,107,0.15)' : 'rgba(160,174,192,0.15)';
  const color = result === 'Win' ? tokens.win : result === 'Loss' ? tokens.loss : tokens.draw;
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: tokens.rPill, letterSpacing: 0.4, textTransform: 'uppercase' as const, fontFamily: tokens.font }}>
      {result}
    </span>
  );
};

const GameRow: React.FC<{ game: RecentGame; isLast: boolean }> = ({ game, isLast }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: isLast ? 'none' : tokens.innerBorder }}>
    <ResultPill result={game.result} />
    <span style={{ flex: 1, color: tokens.text, fontSize: 14, fontWeight: 600 }}>vs {game.opponentUsername}</span>
    <span style={{ color: tokens.textDim, fontSize: 12 }}>{game.match_type}</span>
  </div>
);

const AvatarCluster: React.FC<{ avatarUrl: string | null; username: string; level: number; size: number; badgeSize: 'sm' | 'md' | 'lg' }> = ({
  avatarUrl, username, level, size, badgeSize,
}) => (
  <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '4px solid #060d1f', overflow: 'hidden', boxSizing: 'border-box' as const,
      background: 'linear-gradient(135deg, rgba(124,77,255,0.5), rgba(0,212,170,0.3))',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 900, color: tokens.text, fontFamily: tokens.font }}>
            {username[0]?.toUpperCase()}
          </div>
      }
    </div>
    <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
      <LevelBadge level={level} size={badgeSize} />
    </div>
  </div>
);

// Mobile achievement tile (48×48)
const AchTile: React.FC<{ icon_url: string | null; unlocked: boolean; name: string }> = ({ icon_url, unlocked, name }) => (
  <div style={{
    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
    background: unlocked ? 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(124,77,255,0.15))' : 'rgba(255,255,255,0.04)',
    border: unlocked ? `1.5px solid ${tokens.accent}` : '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
    opacity: unlocked ? 1 : 0.4,
  }} title={name}>
    {icon_url
      ? <img src={icon_url} alt={name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
      : unlocked ? '🏆' : '🔒'
    }
  </div>
);

// ────────── Mobile layout ──────────

const MobileProfile: React.FC<{
  profile: ProfileData;
  recentGames: RecentGame[];
  leaderboardPos: number | null;
  isOwnProfile: boolean;
  progression: ReturnType<typeof useProgression>;
  achievements: ReturnType<typeof useAchievements>;
  username?: string;
  onCustomise: () => void;
}> = ({ profile, recentGames, leaderboardPos, isOwnProfile, progression, achievements, username, onCustomise }) => {
  const navigate = useNavigate();
  const total = profile.wins + profile.losses + profile.draws;
  const winRate = total > 0 ? `${((profile.wins / total) * 100).toFixed(0)}%` : '—';
  const tierColor = tierColour[profile.rank_tier] ?? tokens.textMuted;

  const unlockedCount = achievements.achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.achievements.length;
  const previewTiles = achievements.achievements.slice(0, 5);

  return (
    <PageBackground>
      <div style={{ fontFamily: tokens.font, color: tokens.text, paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 800, flex: 1 }}>Profile</span>
          {isOwnProfile && (
            <SecondaryButton size="sm" onClick={onCustomise}>Customise</SecondaryButton>
          )}
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Banner card */}
          <Glass padding={0} style={{ overflow: 'hidden' }}>
            {/* Banner area */}
            <div style={{ height: 110, position: 'relative', overflow: 'hidden' }}>
              {profile.bannerUrl
                ? <img src={profile.bannerUrl} alt="" aria-hidden style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(124,77,255,0.45), rgba(0,212,170,0.25))' }} />
              }
            </div>
            {/* Avatar + name, overlapping banner by 20px */}
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: -20 }}>
                <AvatarCluster avatarUrl={profile.avatarUrl} username={profile.username} level={profile.level} size={80} badgeSize="md" />
                <div style={{ paddingBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 19, fontWeight: 900, color: tokens.text }}>{profile.username}</span>
                    {profile.badgeUrl && (
                      <img src={profile.badgeUrl} alt={profile.badgeName ?? ''} title={profile.badgeName ?? ''} style={{ width: 20, height: 20 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: tierColor, letterSpacing: 0.4, marginTop: 2 }}>
                    {profile.rank_tier}{leaderboardPos !== null ? ` · Rank #${leaderboardPos}` : ''}
                  </div>
                </div>
              </div>
            </div>
          </Glass>

          {/* XP card — own profile only */}
          {isOwnProfile && !progression.loading && (
            <Glass>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Level Progress</div>
              <XPProgressBar
                level={progression.level}
                xpIntoLevel={progression.xpIntoLevel}
                xpNeededForLevel={progression.xpNeededForLevel}
                xpToNext={progression.xpToNext}
              />
            </Glass>
          )}

          {/* 3-stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'WINS',   value: profile.wins,   color: tokens.win },
              { label: 'LOSSES', value: profile.losses, color: tokens.loss },
              { label: 'DRAWS',  value: profile.draws,  color: tokens.draw },
            ].map(({ label, value, color }) => (
              <Glass key={label} padding={16} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
              </Glass>
            ))}
          </div>

          {/* Win rate + Best streak */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Glass padding={16}>
              <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Win Rate</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: tokens.accent }}>{winRate}</div>
            </Glass>
            <Glass padding={16}>
              <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Best Streak</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={16} />
                <span style={{ fontSize: 22, fontWeight: 900, color: tokens.credits }}>{profile.best_streak || '—'}</span>
              </div>
            </Glass>
          </div>

          {/* Achievements summary — own profile only */}
          {isOwnProfile && (
            <Glass>
              <button
                onClick={() => navigate('/achievements')}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: tokens.text }}>
                    Achievements · {unlockedCount} / {totalCount || '—'} ›
                  </span>
                </div>
                {!achievements.loading && (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {previewTiles.map((a) => (
                      <AchTile key={a.id} icon_url={a.icon_url} unlocked={a.unlocked} name={a.name} />
                    ))}
                  </div>
                )}
              </button>
            </Glass>
          )}

          {/* Recent games */}
          <Glass>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Recent Games</div>
            {recentGames.length === 0
              ? <div style={{ color: tokens.textDim, fontSize: 14 }}>No games played yet.</div>
              : recentGames.map((g, i) => (
                <GameRow key={g.id} game={g} isLast={i === recentGames.length - 1} />
              ))
            }
          </Glass>

        </div>
      </div>
      <TabBar username={username} />
    </PageBackground>
  );
};

// ────────── Desktop layout ──────────

const DesktopProfile: React.FC<{
  profile: ProfileData;
  recentGames: RecentGame[];
  leaderboardPos: number | null;
  isOwnProfile: boolean;
  progression: ReturnType<typeof useProgression>;
  achievements: ReturnType<typeof useAchievements>;
  onCustomise: () => void;
}> = ({ profile, recentGames, leaderboardPos, isOwnProfile, progression, achievements, onCustomise }) => {
  const navigate = useNavigate();
  const total = profile.wins + profile.losses + profile.draws;
  const winRate = total > 0 ? `${((profile.wins / total) * 100).toFixed(0)}%` : '—';
  const tierColor = tierColour[profile.rank_tier] ?? tokens.textMuted;

  const unlockedCount = achievements.achievements.filter(a => a.unlocked).length;
  const gridTiles = achievements.achievements.slice(0, 24);

  const perfRows = [
    { label: 'Win rate',      value: winRate,                          color: tokens.accent },
    { label: 'Best streak',   value: profile.best_streak ? `${profile.best_streak}` : '—', color: tokens.credits, icon: <Flame size={12} /> },
    { label: 'Avg. match',    value: '—',                              color: tokens.text },
    { label: 'Favourite mode', value: '—',                             color: tokens.text },
  ];

  return (
    <PageBackground>
      <div style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 1100, margin: '0 auto', padding: '0 32px 60px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Profile</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <SecondaryButton size="sm" onClick={() => {}}>Share</SecondaryButton>
            {isOwnProfile && <PrimaryButton size="sm" onClick={onCustomise}>Customise</PrimaryButton>}
          </div>
        </div>

        {/* Full-width banner card */}
        <Glass padding={0} style={{ overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
            {profile.bannerUrl
              ? <img src={profile.bannerUrl} alt="" aria-hidden style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(124,77,255,0.45), rgba(0,212,170,0.25))' }} />
            }
          </div>
          <div style={{ padding: '0 32px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginTop: -40 }}>
              <AvatarCluster avatarUrl={profile.avatarUrl} username={profile.username} level={profile.level} size={110} badgeSize="lg" />
              <div style={{ paddingBottom: 8, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 900 }}>{profile.username}</span>
                  {profile.badgeUrl && (
                    <img src={profile.badgeUrl} alt={profile.badgeName ?? ''} title={profile.badgeName ?? ''} style={{ width: 22, height: 22 }} />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                  <span style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${tierColor}44`, color: tierColor, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: tokens.rPill, letterSpacing: 0.4 }}>
                    {profile.rank_tier}
                  </span>
                  {leaderboardPos !== null && (
                    <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: tokens.textMuted, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: tokens.rPill }}>
                      Rank #{leaderboardPos}
                    </span>
                  )}
                  <span style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: tokens.textMuted, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: tokens.rPill }}>
                    {total} games
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Glass>

        {/* Two-column body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* XP card */}
            {isOwnProfile && !progression.loading && (
              <Glass>
                <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Level Progress</div>
                <XPProgressBar
                  level={progression.level}
                  xpIntoLevel={progression.xpIntoLevel}
                  xpNeededForLevel={progression.xpNeededForLevel}
                  xpToNext={progression.xpToNext}
                  height={10}
                />
              </Glass>
            )}

            {/* 3-stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'WINS',   value: profile.wins,   color: tokens.win },
                { label: 'LOSSES', value: profile.losses, color: tokens.loss },
                { label: 'DRAWS',  value: profile.draws,  color: tokens.draw },
              ].map(({ label, value, color }) => (
                <Glass key={label} padding={16} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
                </Glass>
              ))}
            </div>

            {/* Performance card */}
            <Glass>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>Performance</div>
              {perfRows.map(({ label, value, color, icon }, i) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 0',
                  borderBottom: i < perfRows.length - 1 ? tokens.innerBorder : 'none',
                }}>
                  <span style={{ fontSize: 13, color: tokens.textMuted }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {icon}
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
                  </div>
                </div>
              ))}
            </Glass>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Achievements grid */}
            {isOwnProfile && (
              <Glass>
                <button
                  onClick={() => navigate('/achievements')}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: tokens.text }}>
                      Achievements · {unlockedCount} / {achievements.achievements.length || '—'} ›
                    </span>
                  </div>
                  {!achievements.loading && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 8 }}>
                      {gridTiles.map((a) => (
                        <AchTile key={a.id} icon_url={a.icon_url} unlocked={a.unlocked} name={a.name} />
                      ))}
                    </div>
                  )}
                </button>
              </Glass>
            )}

            {/* Recent games */}
            <Glass>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Recent Games</div>
              {recentGames.length === 0
                ? <div style={{ color: tokens.textDim, fontSize: 14 }}>No games played yet.</div>
                : recentGames.map((g, i) => (
                  <GameRow key={g.id} game={g} isLast={i === recentGames.length - 1} />
                ))
              }
            </Glass>
          </div>
        </div>
      </div>
    </PageBackground>
  );
};

// ────────── Main component ──────────

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [profile, setProfile]           = useState<ProfileData | null>(null);
  const [recentGames, setRecentGames]   = useState<RecentGame[]>([]);
  const [leaderboardPos, setLeaderboardPos] = useState<number | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!username) return;

    const loadProfile = async () => {
      // Fetch core profile + stats (no FK-join syntax — cosmetic items fetched separately)
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select(`
          id, username, avatar_url,
          active_avatar_id, active_badge_id, active_banner_id,
          player_stats(rank_tier, wins, losses, draws)
        `)
        .eq('username', username)
        .single();

      if (profileErr || !profileData) { setLoading(false); return; }

      const stats = (profileData as any).player_stats;
      const pid   = profileData.id;

      // Fetch progression + cosmetic items in parallel
      const fetchItem = async (id: string | null, fields: string) => {
        if (!id) return null;
        const { data } = await supabase.from('cosmetic_items').select(fields).eq('id', id).single();
        return data as any;
      };

      const [prog, avatarItem, badgeItem, bannerItem] = await Promise.all([
        supabase.from('player_progression').select('level').eq('user_id', pid).single().then(r => r.data),
        fetchItem(profileData.active_avatar_id, 'asset_url'),
        fetchItem(profileData.active_badge_id,  'asset_url, name'),
        fetchItem(profileData.active_banner_id, 'asset_url'),
      ]);

      setProfile({
        player_id:   pid,
        username:    profileData.username,
        avatarUrl:   avatarItem?.asset_url ?? profileData.avatar_url ?? null,
        badgeUrl:    badgeItem?.asset_url ?? null,
        badgeName:   badgeItem?.name ?? null,
        bannerUrl:   bannerItem?.asset_url ?? null,
        level:       (prog as any)?.level ?? 1,
        rank_tier:   stats?.rank_tier ?? 'Challenger',
        wins:        stats?.wins ?? 0,
        losses:      stats?.losses ?? 0,
        draws:       stats?.draws ?? 0,
        best_streak: stats?.best_streak ?? 0,
      });

      const { data: lb } = await supabase
        .from('leaderboard')
        .select('position')
        .eq('player_id', pid)
        .single();
      setLeaderboardPos(lb?.position ?? null);

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

  const isOwnProfile = !!(user && profile && user.id === profile.player_id);
  const progression  = useProgression(isOwnProfile ? user?.id : undefined);
  const achievements = useAchievements(user?.id);

  if (loading) return (
    <PageBackground>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textMuted, fontFamily: tokens.font }}>
        Loading...
      </div>
    </PageBackground>
  );

  if (!profile) return (
    <PageBackground>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: tokens.textMuted, fontFamily: tokens.font, gap: 16 }}>
        <div>Player not found.</div>
        <button onClick={() => navigate('/menu')} style={{ background: 'none', border: `1px solid ${tokens.textDim}`, color: tokens.textMuted, padding: '8px 16px', borderRadius: tokens.rBtn, cursor: 'pointer', fontFamily: tokens.font }}>
          Back to Menu
        </button>
      </div>
    </PageBackground>
  );

  const sharedProps = { profile, recentGames, leaderboardPos, isOwnProfile, progression, achievements, onCustomise: () => navigate('/customise') };

  return isMobile
    ? <MobileProfile {...sharedProps} username={isOwnProfile ? profile.username : undefined} />
    : <DesktopProfile {...sharedProps} />;
};

export default ProfilePage;
