import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tokens } from '../../styles/tokens';
import { HomeIcon, PlayIcon, UserIcon, GearIcon } from '../icons';

type TabId = 'home' | 'play' | 'profile' | 'settings';

interface TabBarProps {
  username?: string;
}

const TABS: { id: TabId; label: string; Icon: React.FC<{ size?: number }>; path: (u?: string) => string }[] = [
  { id: 'home',     label: 'Home',     Icon: HomeIcon, path: () => '/menu' },
  { id: 'play',     label: 'Play',     Icon: PlayIcon, path: () => '/multiplayer' },
  { id: 'profile',  label: 'Profile',  Icon: UserIcon, path: (u) => u ? `/profile/${u}` : '/menu' },
  { id: 'settings', label: 'Settings', Icon: GearIcon, path: () => '/settings' },
];

const pathToTab: Record<string, TabId> = {
  '/menu': 'home',
  '/multiplayer': 'play',
  '/settings': 'settings',
  '/leaderboard': 'home',
  '/achievements': 'home',
  '/customise': 'profile',
};

const TabBar: React.FC<TabBarProps> = ({ username }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const active: TabId = pathname.startsWith('/profile/')
    ? 'profile'
    : pathToTab[pathname] ?? 'home';

  return (
    <div style={{
      position: 'fixed',
      left: 0, right: 0, bottom: 0,
      height: 68,
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      background: 'rgba(13,21,48,0.85)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      paddingTop: 10,
      paddingBottom: 'env(safe-area-inset-bottom, 16px)' as React.CSSProperties['paddingBottom'],
      zIndex: 100,
    }}>
      {TABS.map(({ id, label, Icon, path }) => {
        const on = id === active;
        return (
          <button
            key={id}
            onClick={() => navigate(path(username))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: on ? tokens.accent : tokens.textMuted,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: tokens.font,
              padding: 0,
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
