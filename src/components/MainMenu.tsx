import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { useRecentGames, RecentGame } from '../hooks/useRecentGames';
import { useProgressionContext } from '../contexts/ProgressionContext';
import { ProgressionState } from '../hooks/useProgression';
import { useLoginStreak } from '../hooks/useLoginStreak';
import { useAdminRole } from '../hooks/useAdminRole';
import { useTutorial } from '../hooks/useTutorial';
import { useIsMobile } from '../hooks/useIsMobile';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import { tokens } from '../styles/tokens';
import PageBackground from './common/PageBackground';
import Glass from './common/Glass';
import PrimaryButton from './common/PrimaryButton';
import SecondaryButton from './common/SecondaryButton';
import { Coin, Flame } from './icons';
import TabBar from './common/TabBar';
import { LevelBadge } from './progression/LevelBadge';
import { XPProgressBar } from './progression/XPProgressBar';
import NewsSlideshow from './layout/NewsSlideshow';
import { Modal } from './modal';
import ReportBugModal from './common/ReportBugModal';
import { callPostGameHandler, fetchPendingRewardGameIds } from '../lib/postGame';
import { PostGameModal, PostGameResult } from './progression/PostGameModal';
import { useRanked } from '../hooks/useRanked';
import TierBadge from './ranked/TierBadge';
import { supabase } from '../lib/supabase';

// ── helpers ───────────────────────────────────────────────────

const RESULT_CONFIG = {
  Win:  { label: 'W', color: tokens.win,  bg: 'rgba(0,212,170,0.18)',   border: 'rgba(0,212,170,0.35)' },
  Loss: { label: 'L', color: tokens.loss, bg: 'rgba(255,107,107,0.18)', border: 'rgba(255,107,107,0.35)' },
  Draw: { label: 'D', color: tokens.draw, bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.18)' },
} as const;

const MODE_TILES_MOBILE = [
  { emoji: '🤖', label: 'Training', sub: 'vs AI', bg: 'rgba(247,147,30,0.14)', border: 'rgba(247,147,30,0.30)', action: 'difficulty' },
  { emoji: '🌐', label: 'Multiplayer', sub: 'Online & local', bg: 'rgba(66,153,225,0.14)', border: 'rgba(66,153,225,0.30)', action: '/multiplayer' },
  { emoji: '📖', label: 'Tutorial', sub: 'How to play', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)', action: '/how-to-play' },
  { emoji: '🏆', label: 'Season',   sub: 'Ranked ladder', bg: 'rgba(124,77,255,0.14)', border: 'rgba(124,77,255,0.30)', action: '/season' },
] as const;

const MODE_TILES_DESKTOP = MODE_TILES_MOBILE.slice(0, 3);

const DESKTOP_NAV = [
  { label: 'Home',         path: '/menu' },
  { label: 'Leaderboard',  path: '/leaderboard' },
  { label: 'Achievements', path: '/achievements' },
  { label: 'Shop',         path: '/shop' },
  { label: 'Season',       path: '/season' },
];

// ── sub-components ────────────────────────────────────────────

const Avatar: React.FC<{ initial: string; size: number }> = ({ initial, size }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `linear-gradient(135deg, ${tokens.accent}, ${tokens.xp})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 900, fontSize: size * 0.38,
    border: '2px solid rgba(255,255,255,0.15)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
  }}>
    {initial}
  </div>
);

// Equipped profile banner, condensed to whatever height its container is —
// clipped behind the avatar/name/tier row only, never behind XP (see callers).
// No-op (no image, no scrim) when the player has no banner equipped, so the
// card looks exactly as it did before for anyone without one.
const PlayerCardBanner: React.FC<{ url: string | null }> = ({ url }) => (
  <div style={{
    position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
    borderRadius: `${tokens.glassRadius}px ${tokens.glassRadius}px 0 0`,
  }}>
    {url && <img src={url} alt="" aria-hidden style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    {url && (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(115deg, rgba(6,13,31,0.80) 15%, rgba(6,13,31,0.40) 65%, rgba(6,13,31,0.20) 100%)',
      }} />
    )}
  </div>
);

const CreditChip: React.FC<{ amount: number }> = ({ amount }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '5px 12px',
    background: 'rgba(249,168,37,0.12)',
    border: '1px solid rgba(249,168,37,0.35)',
    borderRadius: tokens.rPill,
    color: tokens.credits, fontWeight: 800, fontSize: 13,
    fontFamily: tokens.font,
  }}>
    <Coin size={13} />
    {amount.toLocaleString()}
  </span>
);

const RecentGameRow: React.FC<{ game: RecentGame }> = ({ game }) => {
  const cfg = RESULT_CONFIG[game.result];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 0',
      borderBottom: `1px solid ${tokens.innerBorder.replace('1px solid ', '')}`,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: cfg.color, fontWeight: 900, fontSize: 12,
      }}>
        {cfg.label}
      </div>
      <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: tokens.text }}>
        vs {game.opponentUsername}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
        color: tokens.textDim, textTransform: 'uppercase',
      }}>
        {game.match_type}
      </span>
    </div>
  );
};

const QuickPlayCard: React.FC<{ onPlay: () => void }> = ({ onPlay }) => (
  <Glass style={{ position: 'relative', overflow: 'hidden', padding: 20 }} padding={0}>
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(124,77,255,0.12))',
      borderRadius: tokens.glassRadius,
    }} />
    {/* corner glow */}
    <div style={{
      position: 'absolute', top: -30, right: -30,
      width: 140, height: 140, borderRadius: '50%',
      background: 'rgba(0,212,170,0.22)',
      filter: 'blur(40px)', pointerEvents: 'none',
    }} />
    <div style={{ position: 'relative', padding: 20 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
        color: tokens.accent, textTransform: 'uppercase', marginBottom: 6,
      }}>
        Quick Play
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: tokens.text, marginBottom: 16 }}>
        Multiplayer
      </div>
      <PrimaryButton fullWidth onClick={onPlay} style={{ fontSize: 15 }}>
        ▶&nbsp;&nbsp;Play Now
      </PrimaryButton>
    </div>
  </Glass>
);

const RankedPlayCard: React.FC<{ onRanked: () => void }> = ({ onRanked }) => {
  const { rankedEnabled, season, upcomingSeason, daysLeft, daysUntilStart } = useRanked();
  const countdownText = season && daysLeft !== null
    ? (daysLeft <= 0 ? 'Season ends today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`)
    : upcomingSeason && daysUntilStart !== null
    ? (daysUntilStart <= 0 ? 'Season starts today' : `Starts in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}`)
    : null;

  return (
    <Glass style={{ position: 'relative', overflow: 'hidden', padding: 20 }} padding={0}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(249,168,37,0.16), rgba(124,77,255,0.18))',
        borderRadius: tokens.glassRadius,
      }} />
      {/* corner glow */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 140, height: 140, borderRadius: '50%',
        background: 'rgba(124,77,255,0.24)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', padding: 20 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          color: tokens.credits, textTransform: 'uppercase', marginBottom: 6,
        }}>
          Ranked
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: tokens.text, marginBottom: 16 }}>
          Ranked Ladder
        </div>
        <PrimaryButton fullWidth onClick={onRanked} disabled={!rankedEnabled} style={{ fontSize: 15 }}>
          🏆&nbsp;&nbsp;Ranked
        </PrimaryButton>
        {/* Independent lines: the season countdown is true regardless of the
            kill switch, and the kill switch is true regardless of the season —
            showing only one used to hide the countdown whenever ranked was
            paused, which is wrong (players should still see it coming). */}
        {countdownText && (
          <div style={{ fontSize: 12, color: tokens.textMuted, textAlign: 'center', marginTop: 8 }}>
            {countdownText}
          </div>
        )}
        {!rankedEnabled && (
          <div style={{ fontSize: 12, color: tokens.textMuted, textAlign: 'center', marginTop: countdownText ? 2 : 8 }}>
            Ranked temporarily disabled
          </div>
        )}
      </div>
    </Glass>
  );
};

interface StreakModalProps {
  current: number;
  rewardText: string;
  onClaim: () => void;
}

const StreakModal: React.FC<StreakModalProps> = ({ current, rewardText, onClaim }) => {
  const today = Math.min(current, 7);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(6,13,31,0.80)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <Glass style={{ maxWidth: 380, width: '100%', overflow: 'hidden', padding: 0 }}>
        {/* gold radial glow */}
        <div style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(249,168,37,0.20)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', padding: 28, textAlign: 'center' }}>
          <Flame size={52} />
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: tokens.credits,
            textTransform: 'uppercase', marginTop: 12, marginBottom: 6,
          }}>
            Daily Login
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: tokens.text, marginBottom: 20 }}>
            Day {current} Streak!
          </div>

          {/* 7-day strip */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
            {Array.from({ length: 7 }, (_, i) => i + 1).map(day => {
              const isPast   = day < today;
              const isToday  = day === today;
              return (
                <div key={day} style={{
                  flex: 1, height: 48, borderRadius: 8,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2,
                  background: isToday
                    ? 'linear-gradient(135deg, #f9a825, #f57c00)'
                    : isPast
                    ? 'rgba(249,168,37,0.18)'
                    : tokens.innerBg,
                  border: isToday ? 'none' : isPast
                    ? '1px solid rgba(249,168,37,0.35)'
                    : tokens.innerBorder,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    color: isToday ? '#fff' : isPast ? tokens.credits : tokens.textDim,
                  }}>
                    {isPast ? '✓' : day}
                  </span>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: 0.3,
                    color: isToday ? 'rgba(255,255,255,0.75)' : tokens.textDim,
                    textTransform: 'uppercase',
                  }}>
                    Day {day}
                  </span>
                </div>
              );
            })}
          </div>

          {/* reward chip */}
          <div style={{ marginBottom: 20 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px',
              background: 'rgba(249,168,37,0.15)',
              border: '1px solid rgba(249,168,37,0.40)',
              borderRadius: tokens.rPill,
              color: tokens.credits, fontWeight: 800, fontSize: 14,
            }}>
              <Coin size={16} />
              {rewardText}
            </span>
          </div>

          <PrimaryButton fullWidth onClick={onClaim}>
            Claim Reward
          </PrimaryButton>
        </div>
      </Glass>
    </div>
  );
};

// ── mobile layout ─────────────────────────────────────────────

interface LayoutProps {
  profile: ReturnType<typeof usePlayerProfile>;
  progression: ProgressionState & { refresh: () => void };
  recentGames: RecentGame[];
  initial: string;
  rating: number | null;
  bannerUrl: string | null;
  onPlay: () => void;
  onRanked: () => void;
  onMode: (action: string) => void;
  onSignOut: () => void;
  navigate: ReturnType<typeof useNavigate>;
  adminRole: string | null;
  user: { id: string } | null;
  hasPendingRewards: boolean;
  recoveryLoading: boolean;
  onRecover: () => void;
}

const MOBILE_NAV = [
  { label: 'Leaderboard',  path: '/leaderboard' },
  { label: 'Achievements', path: '/achievements' },
  { label: 'Shop',         path: '/shop' },
  { label: 'Season',       path: '/season' },
];

const MobileLayout: React.FC<LayoutProps> = ({
  profile, progression, recentGames, initial, rating, bannerUrl, onPlay, onRanked, onMode, navigate, adminRole, user, hasPendingRewards, recoveryLoading, onRecover,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);

  return (
  <div style={{
    minHeight: '100vh',
    padding: '0 16px',
    paddingBottom: 88, // tab bar clearance
    fontFamily: tokens.font,
  }}>
    {/* Backdrop */}
    {menuOpen && (
      <div
        onClick={() => setMenuOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.5)' }}
      />
    )}

    {/* Slide-in drawer */}
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
      width: 220,
      background: tokens.bgCard,
      borderRight: '1px solid rgba(255,255,255,0.10)',
      backdropFilter: tokens.glassBlur,
      WebkitBackdropFilter: tokens.glassBlur,
      padding: '64px 0 24px',
      display: 'flex', flexDirection: 'column', gap: 2,
      transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.22s ease',
    }}>
      {MOBILE_NAV.map(({ label, path }) => (
        <button
          key={path}
          onClick={() => { navigate(path); setMenuOpen(false); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', padding: '13px 24px',
            fontFamily: tokens.font, fontSize: 15, fontWeight: 700,
            color: tokens.textMuted,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = tokens.text; e.currentTarget.style.background = tokens.innerBg; }}
          onMouseLeave={e => { e.currentTarget.style.color = tokens.textMuted; e.currentTarget.style.background = 'none'; }}
        >
          {label}
        </button>
      ))}
      {adminRole !== null && (
        <button
          onClick={() => { navigate('/admin/skins'); setMenuOpen(false); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', padding: '13px 24px',
            fontFamily: tokens.font, fontSize: 15, fontWeight: 700,
            color: tokens.accent,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = tokens.text; e.currentTarget.style.background = tokens.innerBg; }}
          onMouseLeave={e => { e.currentTarget.style.color = tokens.accent; e.currentTarget.style.background = 'none'; }}
        >
          Admin
        </button>
      )}
    </div>

    {/* Top bar */}
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '52px 0 16px',
    }}>
      {/* Hamburger */}
      <button
        onClick={() => setMenuOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0, flexShrink: 0 }}
        aria-label="Menu"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ width: 20, height: 2, background: tokens.textMuted, borderRadius: 2 }} />
          <div style={{ width: 20, height: 2, background: tokens.textMuted, borderRadius: 2 }} />
          <div style={{ width: 14, height: 2, background: tokens.textMuted, borderRadius: 2 }} />
        </div>
      </button>

      <span style={{
        fontSize: 22, fontWeight: 900, letterSpacing: 2,
        background: `linear-gradient(90deg, ${tokens.text} 30%, ${tokens.accent} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        MEGA OX
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasPendingRewards && (
          <button
            onClick={onRecover}
            disabled={recoveryLoading}
            style={{
              fontSize: 10, fontWeight: 700, color: '#f9a825',
              padding: '3px 8px', borderRadius: 20,
              background: 'rgba(249,168,37,0.12)',
              border: '1px solid rgba(249,168,37,0.30)',
              whiteSpace: 'nowrap' as const,
              cursor: recoveryLoading ? 'default' : 'pointer',
              fontFamily: tokens.font,
              opacity: recoveryLoading ? 0.6 : 1,
            }}
          >
            {recoveryLoading ? 'Recovering…' : 'Request recovery'}
          </button>
        )}
        <CreditChip amount={progression.credits} />
      </div>
    </div>

    {/* Player card */}
    <Glass style={{ marginBottom: 12, overflow: 'hidden' }} padding={0}>
      <div style={{ position: 'relative', padding: 16 }}>
        <PlayerCardBanner url={bannerUrl} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar initial={initial} size={56} />
            <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
              <LevelBadge level={profile?.level ?? 1} size="sm" />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id="menu-profile" style={{
              fontSize: 17, fontWeight: 800, color: tokens.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {profile?.username ?? '—'}
            </div>
            <TierBadge rating={rating} />
          </div>
        </div>
      </div>
      {!progression.loading && (
        <div style={{ padding: '0 16px 16px' }}>
          <XPProgressBar
            level={progression.level}
            xpIntoLevel={progression.xpIntoLevel}
            xpNeededForLevel={progression.xpNeededForLevel}
            xpToNext={progression.xpToNext}
            height={6}
          />
        </div>
      )}
    </Glass>

    {/* Hero CTAs */}
    <div id="menu-play" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
      <QuickPlayCard onPlay={onPlay} />
      <RankedPlayCard onRanked={onRanked} />
    </div>

    {/* Mode tiles 2×2 */}
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 8, marginBottom: 12,
    }}>
      {MODE_TILES_MOBILE.map(t => (
        <button
          key={t.label}
          onClick={() => onMode(t.action)}
          style={{
            background: t.bg, border: `1px solid ${t.border}`,
            borderRadius: 14, padding: 14,
            textAlign: 'left', cursor: 'pointer', fontFamily: tokens.font,
          }}
          onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <div style={{ fontSize: 22, marginBottom: 6 }}>{t.emoji}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: tokens.text }}>{t.label}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: tokens.textMuted }}>{t.sub}</div>
        </button>
      ))}
    </div>

    {/* Recent games */}
    <Glass id="menu-recent-games" style={{ marginBottom: 12 }} padding={16}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 1, color: tokens.textMuted,
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        Last 5 Games
      </div>
      {recentGames.length === 0 ? (
        <div style={{ fontSize: 13, color: tokens.textMuted }}>No games yet — play your first!</div>
      ) : (
        recentGames.map(g => <RecentGameRow key={g.id} game={g} />)
      )}
    </Glass>

    {/* News */}
    <Glass id="menu-news" padding={16}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 1, color: tokens.textMuted,
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        News
      </div>
      <NewsSlideshow />
    </Glass>

    {/* Bug report link — authenticated users only */}
    {user && (
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          onClick={() => setBugModalOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: tokens.font, fontSize: 12, fontWeight: 600,
            color: tokens.textDim, padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = tokens.textMuted; }}
          onMouseLeave={e => { e.currentTarget.style.color = tokens.textDim; }}
        >
          Report a Bug
        </button>
      </div>
    )}
    {bugModalOpen && <ReportBugModal onClose={() => setBugModalOpen(false)} />}
  </div>
  );
};

// ── desktop layout ────────────────────────────────────────────

const DesktopLayout: React.FC<LayoutProps & { onSignOut: () => void }> = ({
  profile, progression, recentGames, initial, rating, bannerUrl, onPlay, onRanked, onMode, onSignOut, navigate, adminRole, user, hasPendingRewards, recoveryLoading, onRecover,
}) => {
  const [bugModalOpen, setBugModalOpen] = useState(false);
  return (
  <div style={{ minHeight: '100vh', fontFamily: tokens.font }}>
    {/* Header */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 60px',
      borderBottom: `1px solid ${tokens.innerBorder.replace('1px solid ', '')}`,
    }}>
      <span style={{
        fontSize: 22, fontWeight: 900, letterSpacing: 2, flexShrink: 0,
        background: `linear-gradient(90deg, ${tokens.text} 30%, ${tokens.accent} 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        MEGA OX
      </span>

      {/* Nav */}
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {DESKTOP_NAV.map(n => (
          <button
            key={n.path}
            onClick={() => navigate(n.path)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: tokens.font, fontWeight: 700, fontSize: 14,
              color: n.path === '/menu' ? tokens.text : tokens.textMuted,
              padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = tokens.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = n.path === '/menu' ? tokens.text : tokens.textMuted; }}
          >
            {n.label}
          </button>
        ))}
        {adminRole !== null && (
          <button
            onClick={() => navigate('/admin/skins')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: tokens.font, fontWeight: 700, fontSize: 14,
              color: tokens.accent, padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = tokens.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = tokens.accent; }}
          >
            Admin
          </button>
        )}
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {hasPendingRewards && (
          <button
            onClick={onRecover}
            disabled={recoveryLoading}
            style={{
              fontSize: 11, fontWeight: 700, color: '#f9a825',
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(249,168,37,0.12)',
              border: '1px solid rgba(249,168,37,0.30)',
              whiteSpace: 'nowrap' as const,
              cursor: recoveryLoading ? 'default' : 'pointer',
              fontFamily: tokens.font,
              opacity: recoveryLoading ? 0.6 : 1,
            }}
          >
            {recoveryLoading ? 'Recovering…' : 'Request recovery'}
          </button>
        )}
        <CreditChip amount={progression.credits} />
        <SecondaryButton size="sm" onClick={onSignOut}>Sign out</SecondaryButton>
      </div>
    </div>

    {/* Body */}
    <div style={{
      display: 'grid', gridTemplateColumns: '1.4fr 1fr',
      gap: 28, maxWidth: 1100, margin: '0 auto',
      padding: '28px 60px',
    }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div id="menu-play" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <QuickPlayCard onPlay={onPlay} />
          <RankedPlayCard onRanked={onRanked} />
        </div>

        {/* 3-col mode tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {MODE_TILES_DESKTOP.map(t => (
            <button
              key={t.label}
              onClick={() => onMode(t.action)}
              style={{
                background: t.bg, border: `1px solid ${t.border}`,
                borderRadius: 14, padding: '14px 12px',
                textAlign: 'left', cursor: 'pointer', fontFamily: tokens.font,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{t.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 800, color: tokens.text }}>{t.label}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: tokens.textMuted }}>{t.sub}</div>
            </button>
          ))}
        </div>

        {/* News */}
        <Glass id="menu-news" padding={16}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1, color: tokens.textMuted,
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            News
          </div>
          <NewsSlideshow />
        </Glass>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Player card */}
        <Glass id="menu-profile" padding={0} style={{ overflow: 'hidden' }}>
          <button
            onClick={() => profile && navigate(`/profile/${profile.username}`)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0, margin: 0,
              font: 'inherit', color: 'inherit',
            }}
          >
            <div style={{ position: 'relative', padding: 20 }}>
              <PlayerCardBanner url={bannerUrl} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar initial={initial} size={52} />
                  <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
                    <LevelBadge level={profile?.level ?? 1} size="sm" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 4 }}>
                    {profile?.username ?? '—'}
                  </div>
                  <TierBadge rating={rating} />
                </div>
              </div>
            </div>
          </button>
          <div style={{ padding: '0 20px 20px' }}>
            {!progression.loading && (
              <XPProgressBar
                level={progression.level}
                xpIntoLevel={progression.xpIntoLevel}
                xpNeededForLevel={progression.xpNeededForLevel}
                xpToNext={progression.xpToNext}
              />
            )}
            {/* W / L / D stat trio */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16 }}>
              {([
                { label: 'Wins',   value: profile?.wins ?? 0,   color: tokens.win },
                { label: 'Losses', value: profile?.losses ?? 0, color: tokens.loss },
                { label: 'Draws',  value: profile?.draws ?? 0,  color: tokens.draw },
              ] as const).map(s => (
                <div key={s.label} style={{
                  background: tokens.innerBg, border: tokens.innerBorder,
                  borderRadius: 10, padding: '10px 0', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    color: tokens.textMuted, textTransform: 'uppercase', marginTop: 2,
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Glass>

        {/* Last 5 games */}
        <Glass id="menu-recent-games" padding={16}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1,
              color: tokens.textMuted, textTransform: 'uppercase',
            }}>
              Last 5 Games
            </div>
            <button
              id="menu-leaderboard-btn"
              onClick={() => navigate('/leaderboard')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: tokens.font, fontSize: 11, fontWeight: 700,
                color: tokens.accent,
              }}
            >
              Leaderboard →
            </button>
          </div>
          {recentGames.length === 0 ? (
            <div style={{ fontSize: 13, color: tokens.textMuted }}>No games yet!</div>
          ) : (
            recentGames.map(g => <RecentGameRow key={g.id} game={g} />)
          )}
        </Glass>
      </div>
    </div>

    {/* Bug report link — authenticated users only */}
    {user && (
      <div style={{ textAlign: 'center', padding: '12px 60px 24px' }}>
        <button
          onClick={() => setBugModalOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: tokens.font, fontSize: 12, fontWeight: 600,
            color: tokens.textDim, padding: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = tokens.textMuted; }}
          onMouseLeave={e => { e.currentTarget.style.color = tokens.textDim; }}
        >
          Report a Bug
        </button>
      </div>
    )}
    {bugModalOpen && <ReportBugModal onClose={() => setBugModalOpen(false)} />}
  </div>
  );
};

// ── main component ────────────────────────────────────────────

const MainMenu: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const profile = usePlayerProfile();
  const recentGames = useRecentGames();
  const progression = useProgressionContext();
  const streakData = useLoginStreak();
  const { role: adminRole } = useAdminRole();
  const { shouldAutoStart, markComplete } = useTutorial('home');
  const isMobile = useIsMobile();
  const { rating } = useRanked();

  const [showDifficulty, setShowDifficulty] = useState(false);
  const [streakDismissed, setStreakDismissed] = useState(false);

  const [hasPendingRewards, setHasPendingRewards] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<PostGameResult | null>(null);

  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.id) { setBannerUrl(null); return; }
    let cancelled = false;
    (async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('active_banner_id')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled || !p?.active_banner_id) return;
      const { data: item } = await supabase
        .from('cosmetic_items')
        .select('asset_url')
        .eq('id', p.active_banner_id)
        .maybeSingle();
      if (!cancelled) setBannerUrl(item?.asset_url ?? null);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const checkPendingRewards = useCallback(async () => {
    if (!user?.id) return;
    try {
      const gameIds = await fetchPendingRewardGameIds(user.id);
      setHasPendingRewards(gameIds.length > 0);
    } catch (err) {
      // Transient query failure — keep the button's current state rather than
      // hiding genuinely pending rewards.
      console.error('checkPendingRewards failed:', err);
    }
  }, [user?.id]);

  const handleRecover = useCallback(async () => {
    if (!user?.id || recoveryLoading) return;
    setRecoveryLoading(true);
    try {
      const gameIds = await fetchPendingRewardGameIds(user.id);
      let firstResult: PostGameResult | null = null;
      for (const gameId of gameIds) {
        const result = await callPostGameHandler(gameId).catch(() => null);
        if (result && !result.alreadyProcessed && !firstResult) firstResult = result;
      }
      if (firstResult) {
        setRecoveryResult(firstResult);
        progression.refresh();
      }
      // Always re-check — clears the button if everything came back alreadyProcessed
      await checkPendingRewards();
    } catch (err) {
      console.error('Reward recovery failed:', err);
    } finally {
      setRecoveryLoading(false);
    }
  }, [user?.id, recoveryLoading, progression, checkPendingRewards]);

  useEffect(() => { checkPendingRewards(); }, [checkPendingRewards]);

  const startIntro = useCallback(() => {
    introJs()
      .setOptions({
        steps: [
          { element: document.querySelector('#menu-play') as Element,         title: 'Play',          intro: 'Your main play area — ranked multiplayer, training, local and more.' },
          { element: document.querySelector('#menu-recent-games') as Element, title: 'Recent Games',  intro: 'Your <b>last 5 games</b> — win/loss/draw and opponent.' },
          { element: document.querySelector('#menu-news') as Element,         title: 'News',          intro: 'Updates, events and announcements.' },
          { element: document.querySelector('#menu-leaderboard-btn') as Element, title: 'Leaderboard', intro: 'Check the top-ranked players.' },
          { element: document.querySelector('#menu-profile') as Element,      title: 'Your Profile',  intro: 'Your profile, rank tier and settings.' },
        ],
        nextLabel: 'Next →', prevLabel: '← Back', doneLabel: 'Got it!',
        showBullets: false, exitOnOverlayClick: false,
      })
      .oncomplete(markComplete)
      .onexit(markComplete)
      .start();
  }, [markComplete]);

  useEffect(() => {
    if (!shouldAutoStart) return;
    const t = setTimeout(startIntro, 500);
    return () => clearTimeout(t);
  }, [shouldAutoStart, startIntro]);

  const initial = profile?.username?.[0]?.toUpperCase() ?? '?';

  const handleMode = (action: string) => {
    if (action === 'difficulty') { setShowDifficulty(true); return; }
    navigate(action);
  };

  const layoutProps = {
    profile, progression, recentGames, initial,
    rating: rating?.rating ?? null,
    bannerUrl,
    onPlay: () => navigate('/multiplayer'),
    onRanked: () => navigate('/matchmaking?mode=ranked&view=searching'),
    onMode: handleMode,
    onSignOut: signOut,
    navigate,
    adminRole,
    user: user ?? null,
    hasPendingRewards,
    recoveryLoading,
    onRecover: handleRecover,
  };

  return (
    <PageBackground>
      {isMobile
        ? <MobileLayout {...layoutProps} />
        : <DesktopLayout {...layoutProps} />
      }

      {isMobile && <TabBar username={profile?.username} />}

      {/* Recovery rewards modal */}
      {recoveryResult && (
        <PostGameModal
          result={recoveryResult}
          level={progression.level}
          xpIntoLevel={progression.xpIntoLevel}
          xpNeededForLevel={progression.xpNeededForLevel}
          xpToNext={progression.xpToNext}
          onContinue={() => setRecoveryResult(null)}
        />
      )}

      {/* Login streak modal */}
      {streakData?.reward && !streakDismissed && (
        <StreakModal
          current={streakData.current}
          rewardText={streakData.reward.reward_description ?? streakData.reward.reward_type}
          onClaim={() => setStreakDismissed(true)}
        />
      )}

      {/* Difficulty picker (keep existing pattern) */}
      <Modal isOpen={showDifficulty} onClose={() => setShowDifficulty(false)} title="Select Difficulty">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(['Easy', 'Medium', 'Hard'] as const).map((level) => {
            const colors = { Easy: tokens.win, Medium: tokens.warn, Hard: tokens.loss };
            return (
              <button
                key={level}
                onClick={() => { setShowDifficulty(false); navigate(`/training?difficulty=${level.toLowerCase()}`); }}
                style={{
                  padding: 14, borderRadius: tokens.rBtn, border: 'none',
                  background: colors[level], color: '#fff',
                  fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  fontFamily: tokens.font,
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
      </Modal>
    </PageBackground>
  );
};

export default MainMenu;
