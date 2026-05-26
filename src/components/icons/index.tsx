import React from 'react';
import { tokens } from '../../styles/tokens';

// ── Tab bar icons ──────────────────────────────────────────────

export const HomeIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />
  </svg>
);

export const PlayIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden>
    <polygon points="6,4 20,12 6,20" />
  </svg>
);

export const UserIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const GearIcon: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ── Utility icons ──────────────────────────────────────────────

export const ChevronLeft: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const TrophyIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z M4 5h3v3a3 3 0 0 1-3-3zM20 5h-3v3a3 3 0 0 0 3-3z" />
  </svg>
);

export const SparkleIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
  </svg>
);

export const SearchIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// ── Reward / currency icons ────────────────────────────────────

export const Coin: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
    <defs>
      <linearGradient id={`coin-grad-${size}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffd56b" />
        <stop offset="100%" stopColor="#f9a825" />
      </linearGradient>
    </defs>
    <circle cx="8" cy="8" r="7" fill={`url(#coin-grad-${size})`} stroke="#b87600" strokeWidth="0.8" />
    <circle cx="8" cy="8" r="4.5" fill="none" stroke="#b87600" strokeWidth="0.8" opacity="0.5" />
  </svg>
);

export const Gem: React.FC<{ size?: number; color?: string }> = ({ size = 14, color = tokens.xp }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
    <polygon points="8,1.5 14.5,7 8,14.5 1.5,7" fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
    <polygon points="8,1.5 8,14.5 14.5,7" fill="rgba(0,0,0,0.15)" />
  </svg>
);

export const Flame: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <defs>
      <linearGradient id="flame-grad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="60%" stopColor="#f9a825" />
        <stop offset="100%" stopColor="#fff7a8" />
      </linearGradient>
    </defs>
    <path
      d="M12 2c1 3 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-6 1-9z"
      fill="url(#flame-grad)"
      stroke="#ff6b6b"
      strokeWidth="0.5"
    />
  </svg>
);
