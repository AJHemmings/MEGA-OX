import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens, tierColour } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import BackButton from '../common/BackButton';
import TabBar from '../common/TabBar';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { FriendsLeaderboard } from '../friends/FriendsLeaderboard';
import TierBadge from '../ranked/TierBadge';
import type { Database } from '../../lib/database.types';

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

type SeasonRow = Database['public']['Tables']['seasons']['Row'];

interface SeasonEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

const MEDAL = { 1: '#f9a825', 2: '#c0c0c0', 3: '#cd7f32' } as Record<number, string>;
const STAND_H = { 1: 80, 2: 64, 3: 48 } as Record<number, number>;

type LBTab = 'Global' | 'Friends' | 'Season';

const Switcher: React.FC<{ active: LBTab; onChange: (t: LBTab) => void }> = ({ active, onChange }) => (
  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: tokens.glassRadius, padding: 4, marginBottom: 16 }}>
    {(['Global', 'Friends', 'Season'] as LBTab[]).map((t) => (
      <button key={t} onClick={() => onChange(t)} style={{
        flex: 1, padding: '8px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
        background: active === t ? 'rgba(0,212,170,0.18)' : 'transparent',
        color: active === t ? tokens.accent : tokens.textMuted,
        fontWeight: active === t ? 800 : 600, fontSize: 13, fontFamily: tokens.font,
        transition: 'background 0.15s, color 0.15s',
      }}>{t}</button>
    ))}
  </div>
);

const PlayerAvatar: React.FC<{ entry: { username: string; avatar_url: string | null }; size: number }> = ({ entry, size }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', flexShrink: 0, border: '2px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 900, color: tokens.textMuted }}>
    {entry.avatar_url
      ? <img src={entry.avatar_url} alt={entry.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : entry.username[0]?.toUpperCase()
    }
  </div>
);

const seasonSelectStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', marginBottom: 16,
  background: tokens.bgCard, border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: tokens.rInput, padding: '10px 12px', fontSize: 13, fontWeight: 700,
  color: tokens.text, fontFamily: tokens.font, outline: 'none', colorScheme: 'dark',
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = usePlayerProfile();
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LBTab>('Global');

  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [seasonEntries, setSeasonEntries] = useState<SeasonEntry[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [seasonError, setSeasonError] = useState<string | null>(null);
  const loadSeasonRef = useRef<() => void>(() => {});

  useEffect(() => {
    supabase.from('leaderboard').select('*').order('position').then(({ data }) => {
      setEntries((data as LeaderboardEntry[]) ?? []);
      setLoading(false);
    });
  }, []);

  // Season list — used to populate the past-seasons select. Default selection
  // is the active season (falls back to the most recent one if none active).
  useEffect(() => {
    supabase.from('seasons').select('*').order('number', { ascending: false }).then(({ data, error }) => {
      if (error) { console.error('LeaderboardPage: failed to fetch seasons:', error); return; }
      const list = data ?? [];
      setSeasons(list);
      const active = list.find((s) => s.status === 'active');
      setSelectedSeasonId((active ?? list[0])?.id ?? null);
    });
  }, []);

  // Season ratings — re-fetched whenever the selected season changes.
  // `player_ratings` is publicly readable by RLS design; the rating number
  // is intentionally public (spec decision).
  useEffect(() => {
    if (!selectedSeasonId) {
      setSeasonEntries([]);
      setSeasonLoading(false);
      return;
    }

    let cancelled = false;

    const load = () => {
      setSeasonLoading(true);
      setSeasonError(null);
      supabase
        .from('player_ratings')
        .select('user_id, rating, wins, losses, draws, profiles!player_ratings_user_id_fkey(username, avatar_url)')
        .eq('season_id', selectedSeasonId)
        .order('rating', { ascending: false })
        .limit(1000)
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) {
            console.error('LeaderboardPage: failed to fetch season ratings:', error);
            setSeasonError("Couldn't load season leaderboard.");
            setSeasonEntries([]);
            setSeasonLoading(false);
            return;
          }
          const rows: SeasonEntry[] = (data ?? []).map((row) => ({
            user_id: row.user_id,
            username: row.profiles?.username ?? 'Unknown',
            avatar_url: row.profiles?.avatar_url ?? null,
            rating: row.rating,
            wins: row.wins,
            losses: row.losses,
            draws: row.draws,
          }));
          setSeasonEntries(rows);
          setSeasonLoading(false);
        });
    };

    loadSeasonRef.current = load;
    load();

    return () => { cancelled = true; };
  }, [selectedSeasonId]);

  const top3   = entries.filter(e => e.position <= 3);
  const rest   = entries.filter(e => e.position > 3);
  // Podium order: 2nd, 1st, 3rd
  const podium = [
    top3.find(e => e.position === 2),
    top3.find(e => e.position === 1),
    top3.find(e => e.position === 3),
  ].filter(Boolean) as LeaderboardEntry[];

  const content = (
    <div style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 600, margin: '0 auto', padding: `0 16px`, paddingBottom: isMobile ? 100 : 60 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
        <BackButton onClick={() => navigate(-1)} />
        <span style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Leaderboard</span>
      </div>

      <Switcher active={tab} onChange={setTab} />

      {tab === 'Friends' ? (
        user
          ? <FriendsLeaderboard />
          : <div style={{ color: tokens.textDim, textAlign: 'center', padding: 40 }}>Log in to see your friends leaderboard.</div>
      ) : tab === 'Season' ? (
        <div>
          <select
            value={selectedSeasonId ?? ''}
            onChange={(e) => setSelectedSeasonId(e.target.value)}
            disabled={seasons.length === 0}
            style={seasonSelectStyle}
          >
            {seasons.length === 0 && <option value="">No seasons</option>}
            {seasons.map((s) => (
              <option key={s.id} value={s.id} style={{ background: tokens.bgCard, color: tokens.text }}>
                Season {s.number ?? '?'}
              </option>
            ))}
          </select>

          {seasonLoading ? (
            <div style={{ color: tokens.textMuted, textAlign: 'center', padding: 40 }}>Loading…</div>
          ) : seasonError ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ color: tokens.loss, fontSize: 13, marginBottom: 12 }}>{seasonError}</div>
              <button
                onClick={() => loadSeasonRef.current()}
                style={{ padding: '8px 16px', borderRadius: 8, background: tokens.accent, color: '#04140f', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 800, fontFamily: tokens.font }}
              >Retry</button>
            </div>
          ) : seasonEntries.length === 0 ? (
            <div style={{ color: tokens.textDim, textAlign: 'center', padding: 40 }}>No ranked games yet this season.</div>
          ) : (
            <Glass>
              {seasonEntries.map((entry, i) => {
                const isYou = entry.user_id === user?.id;
                return (
                  <div key={entry.user_id}
                    onClick={() => navigate(`/profile/${entry.username}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: isYou ? 'rgba(0,212,170,0.10)' : 'transparent',
                      border: isYou ? '1px solid rgba(0,212,170,0.25)' : '1px solid transparent',
                      marginBottom: i < seasonEntries.length - 1 ? 4 : 0,
                    }}
                  >
                    <div style={{ width: 30, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: tokens.textDim, flexShrink: 0, textAlign: 'right' }}>
                      #{i + 1}
                    </div>
                    <PlayerAvatar entry={entry} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.username}</span>
                        {isYou && <span style={{ fontSize: 10, fontWeight: 800, color: tokens.accent, flexShrink: 0 }}>(YOU)</span>}
                      </div>
                      <TierBadge rating={entry.rating} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: tokens.text, marginBottom: 2 }}>{entry.rating}</div>
                      <span style={{ color: tokens.win }}>{entry.wins}W </span>
                      <span style={{ color: tokens.loss }}>{entry.losses}L </span>
                      <span style={{ color: tokens.textDim }}>{entry.draws}D</span>
                    </div>
                  </div>
                );
              })}
            </Glass>
          )}
        </div>
      ) : loading ? (
        <div style={{ color: tokens.textMuted, textAlign: 'center', padding: 40 }}>Loading…</div>
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
              {podium.map((entry) => {
                const rank  = entry.position as 1 | 2 | 3;
                const color = MEDAL[rank];
                const avatarSize = rank === 1 ? 56 : 44;
                const standH    = STAND_H[rank];
                const isYou = entry.player_id === user?.id;
                return (
                  <div key={entry.player_id} onClick={() => navigate(`/profile/${entry.username}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flex: rank === 1 ? '0 0 120px' : '0 0 96px' }}>
                    <div style={{ position: 'relative' }}>
                      <PlayerAvatar entry={entry} size={avatarSize} />
                      <div style={{ position: 'absolute', bottom: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000', border: '2px solid #060d1f' }}>
                        {rank}
                      </div>
                    </div>
                    <div style={{ fontSize: rank === 1 ? 13 : 12, fontWeight: 800, textAlign: 'center', maxWidth: rank === 1 ? 110 : 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.username}{isYou ? ' (You)' : ''}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: tokens.accent }}>{entry.wins}W</div>
                    {/* Stand */}
                    <div style={{ width: '100%', height: standH, borderRadius: '8px 8px 0 0', background: `linear-gradient(180deg, ${color}AA, ${color}11)` }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Rank list */}
          {rest.length > 0 && (
            <Glass>
              {rest.map((entry, i) => {
                const isYou = entry.player_id === user?.id;
                return (
                  <div key={entry.player_id}
                    onClick={() => navigate(`/profile/${entry.username}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: isYou ? 'rgba(0,212,170,0.10)' : 'transparent',
                      border: isYou ? '1px solid rgba(0,212,170,0.25)' : '1px solid transparent',
                      marginBottom: i < rest.length - 1 ? 4 : 0,
                    }}
                  >
                    <div style={{ width: 30, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: tokens.textDim, flexShrink: 0, textAlign: 'right' }}>
                      #{entry.position}
                    </div>
                    <PlayerAvatar entry={entry} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.username}</span>
                        {isYou && <span style={{ fontSize: 10, fontWeight: 800, color: tokens.accent, flexShrink: 0 }}>(YOU)</span>}
                      </div>
                      <div style={{ fontSize: 10, color: tierColour[entry.rank_tier] ?? tokens.textMuted, fontWeight: 700 }}>{entry.rank_tier}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, flexShrink: 0, textAlign: 'right' }}>
                      <span style={{ color: tokens.win }}>{entry.wins}W </span>
                      <span style={{ color: tokens.loss }}>{entry.losses}L </span>
                      <span style={{ color: tokens.textDim }}>{entry.draws}D</span>
                    </div>
                  </div>
                );
              })}
            </Glass>
          )}

          {entries.length === 0 && (
            <div style={{ color: tokens.textDim, textAlign: 'center', padding: 40 }}>No rankings yet.</div>
          )}
        </>
      )}
    </div>
  );

  return (
    <PageBackground>
      {content}
      {isMobile && <TabBar username={profile?.username ?? undefined} />}
    </PageBackground>
  );
};

export default LeaderboardPage;
