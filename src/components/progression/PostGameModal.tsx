// src/components/progression/PostGameModal.tsx
import React, { useState, useEffect } from 'react';
import { tokens } from '../../styles/tokens';
import { MAX_LEVEL } from '../../lib/progression';
import { LevelBadge } from './LevelBadge';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';
import { Coin, SparkleIcon } from '../icons';
import { supabase } from '../../lib/supabase';
import { formatRatingDelta } from '../../lib/ranked';
import TierBadge from '../ranked/TierBadge';

export interface PostGameResult {
  xpAwarded: number;
  creditsAwarded: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newAchievements: {
    key: string;
    name: string;
    description: string;
    icon_url: string | null;
    reward_xp: number;
    reward_credits: number;
    reward_skin_id: string | null;
  }[];
  alreadyProcessed?: boolean;
  ratingDeltaX?: number | null;
  ratingDeltaO?: number | null;
}

interface PostGameModalProps {
  result: PostGameResult;
  level: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  xpToNext: number;
  onContinue: () => void;
  gameResult?: 'win' | 'loss' | 'draw';
  opponent?: string;
  matchType?: string;
  onRematch?: () => void;
  opponentId?: string | null;
  /** Local player's ranked rating change for this game, plus rating after applying it.
   *  Omit/null when the game wasn't ranked, rewards are still pending, or the
   *  server didn't return deltas (degraded path) — the row renders nothing. */
  rankedDelta?: { delta: number; ratingAfter: number } | null;
}

type FriendStatus = 'unknown' | 'friends' | 'pending' | 'sent';

const RESULT_CONFIG = {
  win:  { eyebrow: 'VICTORY', headline: 'You Win!',  color: tokens.win,  bg: 'linear-gradient(135deg, rgba(0,212,170,0.25), rgba(124,77,255,0.20))' },
  loss: { eyebrow: 'DEFEAT',  headline: 'You Lose',  color: tokens.loss, bg: 'linear-gradient(135deg, rgba(255,107,107,0.25), rgba(124,77,255,0.20))' },
  draw: { eyebrow: 'DRAW',    headline: 'Draw',      color: tokens.draw, bg: 'linear-gradient(135deg, rgba(160,174,192,0.20), rgba(124,77,255,0.15))' },
} as const;

interface RewardsFallbackModalProps {
  gameResult?: 'win' | 'loss' | 'draw';
  opponent?: string;
  onContinue: () => void;
}

export const RewardsFallbackModal: React.FC<RewardsFallbackModalProps> = ({ gameResult, opponent, onContinue }) => {
  const cfg = gameResult ? RESULT_CONFIG[gameResult] : null;
  const cardWidth = { maxWidth: 440, width: 'calc(100% - 40px)' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: tokens.font }}>
      <Glass padding={0} style={{ ...cardWidth, overflow: 'hidden' }}>
        <div style={{ position: 'relative', padding: '28px 22px', background: cfg?.bg ?? 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${cfg?.color ?? tokens.textMuted}44 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cfg?.color ?? tokens.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>
              {cfg?.eyebrow ?? 'GAME COMPLETE'}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: tokens.text, marginBottom: 6 }}>
              {cfg?.headline ?? 'Game Over'}
            </div>
            {opponent && (
              <div style={{ fontSize: 13, color: tokens.textMuted }}>vs {opponent}</div>
            )}
          </div>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(249,168,37,0.08)', border: '1px solid rgba(249,168,37,0.20)', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: tokens.textMuted, lineHeight: 1.5 }}>
              Rewards couldn't be processed this time. They'll be applied automatically next time you log in.
            </div>
          </div>
          <PrimaryButton onClick={onContinue} fullWidth>Continue</PrimaryButton>
        </div>
      </Glass>
    </div>
  );
};

export const PostGameModal: React.FC<PostGameModalProps> = ({
  result, level, xpIntoLevel, xpNeededForLevel, xpToNext,
  onContinue, gameResult, opponent, matchType, onRematch, opponentId, rankedDelta,
}) => {
  // Animate XP bar fill from 0 → actual on mount
  const [animatedXp, setAnimatedXp] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedXp(xpIntoLevel), 120);
    return () => clearTimeout(t);
  }, [xpIntoLevel]);

  const [friendStatus, setFriendStatus] = useState<FriendStatus>('unknown');

  // Check friendship status on mount (only for online games with a known opponent)
  useEffect(() => {
    if (!opponentId) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data, error } = await supabase
        .from('friendships')
        .select('status, requester_id')
        .or(
          `and(requester_id.eq.${user.id},addressee_id.eq.${opponentId}),` +
          `and(requester_id.eq.${opponentId},addressee_id.eq.${user.id})`
        )
        .maybeSingle();
      if (cancelled) return;
      if (error) { console.error('PostGameModal friendship check error:', error); return; }
      if (!data) { setFriendStatus('unknown'); return; }
      if (data.status === 'accepted') { setFriendStatus('friends'); return; }
      if (data.status === 'pending') {
        // 'pending' from our side = we sent it; from their side = they sent, we haven't accepted
        setFriendStatus(data.requester_id === user.id ? 'pending' : 'pending');
        return;
      }
    })();
    return () => { cancelled = true; };
  }, [opponentId]);

  const handleAddFriend = async () => {
    if (!opponentId) return;
    try {
      const { error } = await supabase.rpc('send_friend_request', { p_addressee_id: opponentId });
      if (error) { console.error('send_friend_request error:', error); return; }
      setFriendStatus('sent');
    } catch (err) {
      console.error('handleAddFriend error:', err);
    }
  };

  const fillPct = level >= MAX_LEVEL ? 100 : Math.min(100, (animatedXp / xpNeededForLevel) * 100);
  const cfg = gameResult ? RESULT_CONFIG[gameResult] : null;

  const cardWidth = { maxWidth: 440, width: 'calc(100% - 40px)' };

  // ── alreadyProcessed fallback ──────────────────────────────────
  if (result.alreadyProcessed) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: tokens.font }}>
        <Glass padding={0} style={{ ...cardWidth, overflow: 'hidden' }}>
          <div style={{ padding: '28px 22px', background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 1.5, marginBottom: 8 }}>GAME COMPLETE</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>All done!</div>
          </div>
          <div style={{ padding: 20 }}>
            <PrimaryButton onClick={onContinue} fullWidth>Continue</PrimaryButton>
          </div>
        </Glass>
      </div>
    );
  }

  // ── Main modal ─────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: tokens.font, padding: '20px 0' }}>
      <Glass padding={0} style={{ ...cardWidth, overflow: 'hidden', overflowY: 'auto', maxHeight: 'calc(100vh - 40px)' }}>

        {/* ── Banner header ── */}
        <div style={{ position: 'relative', padding: '28px 22px', background: cfg?.bg ?? 'linear-gradient(135deg, rgba(0,212,170,0.25), rgba(124,77,255,0.20))', textAlign: 'center', overflow: 'hidden' }}>
          {/* Radial glow */}
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${cfg?.color ?? tokens.accent}44 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: cfg?.color ?? tokens.accent, letterSpacing: 1.5, marginBottom: 8 }}>
              {cfg?.eyebrow ?? 'GAME COMPLETE'}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: tokens.text, marginBottom: 6 }}>
              {cfg?.headline ?? 'Game Over'}
            </div>
            {(opponent || matchType) && (
              <div style={{ fontSize: 13, color: tokens.textMuted }}>
                {opponent ? `vs ${opponent}` : ''}
                {opponent && matchType ? ' · ' : ''}
                {matchType ?? ''}
              </div>
            )}
            {rankedDelta && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: rankedDelta.delta > 0 ? tokens.win : rankedDelta.delta < 0 ? tokens.loss : tokens.draw }}>
                  {formatRatingDelta(rankedDelta.delta)}
                </span>
                <TierBadge rating={rankedDelta.ratingAfter} showProgress />
              </div>
            )}
          </div>
        </div>

        {/* ── Card body ── */}
        <div style={{ padding: 20 }}>

          {/* Level-up callout */}
          {result.leveledUp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 14, background: 'rgba(124,77,255,0.12)', border: '1px solid rgba(124,77,255,0.25)', marginBottom: 16 }}>
              <LevelBadge level={result.newLevel} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: tokens.xp, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>Level Up</div>
                <div style={{ fontSize: 15, fontWeight: 900 }}>LVL {result.previousLevel} → {result.newLevel}</div>
              </div>
              <SparkleIcon size={22} />
            </div>
          )}

          {/* XP bar (animated 0 → current) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4 }}>
              <span>LVL {level} · {xpIntoLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP</span>
              {level < MAX_LEVEL && <span>{xpToNext.toLocaleString()} to go</span>}
              {level >= MAX_LEVEL && <span>Max Level</span>}
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: tokens.rPill, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${fillPct}%`,
                background: `linear-gradient(90deg, ${tokens.accent}, ${tokens.xp})`,
                borderRadius: tokens.rPill,
                boxShadow: '0 0 8px rgba(0,212,170,0.45)',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
          </div>

          {/* Reward chips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: result.newAchievements.length > 0 ? 16 : 20 }}>
            {/* XP chip */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(124,77,255,0.10)', border: '1px solid rgba(124,77,255,0.20)', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 900, background: `linear-gradient(135deg, ${tokens.xp}, #a855f7)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                +{result.xpAwarded}
              </div>
              <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2, fontWeight: 700 }}>XP</div>
            </div>
            {/* Credits chip */}
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(249,168,37,0.10)', border: '1px solid rgba(249,168,37,0.20)', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Coin size={16} />
                <span style={{ fontSize: 20, fontWeight: 900, color: tokens.credits }}>+{result.creditsAwarded}</span>
              </div>
              <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2, fontWeight: 700 }}>Credits</div>
            </div>
          </div>

          {/* Achievements unlocked */}
          {result.newAchievements.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Achievements Unlocked</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.newAchievements.map((a) => (
                  <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Trophy tile */}
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(124,77,255,0.15))', border: `1.5px solid ${tokens.accent}`, overflow: 'hidden' }}>
                      {a.icon_url
                        ? <img src={a.icon_url} alt={a.name} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                        : <span style={{ fontSize: 22 }}>🏆</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: tokens.text }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 1 }}>{a.description}</div>
                    </div>
                    {a.reward_xp > 0 && (
                      <div style={{ fontSize: 12, fontWeight: 800, color: tokens.accent, flexShrink: 0 }}>+{a.reward_xp} XP</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Friend row — only for online games with a known opponent */}
          {opponentId && friendStatus === 'unknown' && (
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={handleAddFriend}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(108,99,255,0.45)',
                  background: 'rgba(108,99,255,0.15)',
                  color: '#6c63ff',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: tokens.font,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.28)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.15)'; }}
              >
                ➕ Add Friend
              </button>
            </div>
          )}
          {opponentId && (friendStatus === 'sent' || friendStatus === 'pending') && (
            <div style={{ marginBottom: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#00c48c' }}>
              Request sent ✓
            </div>
          )}

          {/* Buttons row */}
          <div style={{ display: 'flex', gap: 10 }}>
            {onRematch && (
              <SecondaryButton onClick={onRematch} fullWidth>Rematch</SecondaryButton>
            )}
            <PrimaryButton onClick={onContinue} fullWidth>Continue</PrimaryButton>
          </div>

        </div>
      </Glass>
    </div>
  );
};
