// src/components/ranked/TierBadge.tsx
import React from 'react';
import { tokens } from '../../styles/tokens';
import { tierForRating, progressToNextTier, Tier } from '../../lib/ranked';

// Local tier accents — deliberately distinct from tokens.accent/loss/etc so
// tier chips read as their own semantic category on the dark glass theme.
const TIER_COLORS: Record<Tier, string> = {
  Bronze: '#cd7f32',
  Silver: '#b0b8c1',
  Gold: '#f5c542',
  Platinum: '#7dd3fc',
  Diamond: '#e0aaff',
};

interface TierBadgeProps {
  rating: number | null;
  showProgress?: boolean;
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 12px',
  borderRadius: tokens.rPill,
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: 0.3,
  fontFamily: tokens.font,
  whiteSpace: 'nowrap',
};

const TierBadge: React.FC<TierBadgeProps> = ({ rating, showProgress }) => {
  if (rating === null) {
    return (
      <span style={{
        ...chipStyle,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: tokens.textMuted,
      }}>
        Unranked
      </span>
    );
  }

  const tier = tierForRating(rating);
  const color = TIER_COLORS[tier];
  const { next, pointsNeeded } = progressToNextTier(rating);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, fontFamily: tokens.font }}>
      <span style={{ ...chipStyle, background: `${color}22`, border: `1px solid ${color}55`, color }}>
        {tier}
      </span>
      {showProgress && next && (
        <span style={{ fontSize: 11, color: tokens.textMuted, paddingLeft: 2 }}>
          {pointsNeeded} to {next}
        </span>
      )}
    </div>
  );
};

export default TierBadge;
