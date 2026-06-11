// src/components/achievements/AchievementsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAchievements, Achievement } from '../../hooks/useAchievements';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import Pill from '../common/Pill';
import TabBar from '../common/TabBar';
import { ChevronLeft } from '../icons';

type AchCategory = 'All' | 'Wins' | 'Streaks' | 'Skill' | 'Social';

const CATEGORY_KEYS: Record<AchCategory, string[]> = {
  All:     [],
  Wins:    ['win'],
  Streaks: ['streak'],
  Skill:   ['skill', 'board', 'draw'],
  Social:  ['social', 'friend', 'game'],
};

const AchCard: React.FC<{ a: Achievement }> = ({ a }) => {
  const rewardLabel = [
    a.reward_xp > 0      ? `+${a.reward_xp} XP`             : '',
    a.reward_credits > 0 ? `+${a.reward_credits} Credits`    : '',
    a.reward_skin_id     ? 'LEGENDARY SKIN'                   : '',
  ].filter(Boolean).join(' · ') || '—';

  const tileBg = a.unlocked
    ? 'linear-gradient(135deg, rgba(0,212,170,0.2), rgba(124,77,255,0.13))'
    : 'rgba(255,255,255,0.04)';
  const tileBorder = a.unlocked
    ? `1.5px solid ${tokens.accent}`
    : '1px solid rgba(255,255,255,0.06)';

  return (
    <Glass padding={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Icon tile */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', background: tileBg, border: tileBorder,
        }}>
          {a.icon_url
            ? <img src={a.icon_url} alt={a.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
            : <span style={{ fontSize: 24, opacity: a.unlocked ? 1 : 0.4 }}>{a.unlocked ? '🏆' : '🔒'}</span>
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: tokens.text }}>{a.name}</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>{a.description}</div>
          {a.unlocked
            ? <div style={{ fontSize: 10, color: tokens.accent, marginTop: 4, fontWeight: 700 }}>Reward claimed: {rewardLabel}</div>
            : <div style={{ fontSize: 10, color: tokens.textDim, marginTop: 4, fontWeight: 600 }}>Reward: {rewardLabel}</div>
          }
        </div>

        {/* UNLOCKED badge */}
        {a.unlocked && (
          <div style={{
            flexShrink: 0, padding: '3px 8px', borderRadius: 6,
            background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.35)',
            fontSize: 9, fontWeight: 800, color: tokens.accent, letterSpacing: 0.8,
          }}>
            UNLOCKED
          </div>
        )}
      </div>
    </Glass>
  );
};

export const AchievementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = usePlayerProfile();
  const isMobile = useIsMobile();
  const { achievements, loading } = useAchievements(user?.id);
  const [category, setCategory] = useState<AchCategory>('All');

  const filtered = category === 'All'
    ? achievements
    : achievements.filter(a =>
        CATEGORY_KEYS[category].some(k => (a.condition_key ?? '').toLowerCase().includes(k))
      );

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount    = achievements.length;
  const progressPct   = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const content = (
    <div style={{
      fontFamily: tokens.font, color: tokens.text,
      maxWidth: 600, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      padding: '0 16px',
    }}>

      {/* Frozen top section */}
      <div style={{ flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Achievements</span>
          {!loading && totalCount > 0 && (
            <Pill variant="teal">{unlockedCount} / {totalCount}</Pill>
          )}
        </div>

        {/* Total progress card */}
        {!loading && totalCount > 0 && (
          <Glass style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.4 }}>Total progress</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: tokens.accent }}>{Math.round(progressPct)}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: tokens.rPill, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: `linear-gradient(90deg, ${tokens.accent}, ${tokens.xp})`,
                borderRadius: tokens.rPill, boxShadow: '0 0 8px rgba(0,212,170,0.45)',
              }} />
            </div>
          </Glass>
        )}

        {/* Category scroll */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12, paddingBottom: 4, scrollbarWidth: 'none' as React.CSSProperties['scrollbarWidth'] }}>
          {(['All', 'Wins', 'Streaks', 'Skill', 'Social'] as AchCategory[]).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: tokens.rPill, border: 'none', cursor: 'pointer',
              background: category === cat ? tokens.accent : 'rgba(255,255,255,0.06)',
              color: category === cat ? '#060d1f' : tokens.textMuted,
              fontWeight: 700, fontSize: 12, fontFamily: tokens.font,
              transition: 'background 0.15s, color 0.15s',
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable achievement list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: isMobile ? 100 : 60 }}>
        {loading ? (
          <div style={{ color: tokens.textMuted, textAlign: 'center', padding: 40 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: tokens.textDim, textAlign: 'center', padding: 40 }}>No achievements in this category.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(a => <AchCard key={a.id} a={a} />)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageBackground>
      {content}
      {isMobile && <TabBar username={profile?.username ?? undefined} />}
    </PageBackground>
  );
};
