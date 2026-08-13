import React from 'react';
import { tokens } from '../../styles/tokens';
import { CLASSIC_THEME } from '../../theme/defaults';

interface PageBackgroundProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

// Was three hand-written radial-gradient overlays: indigo top-left, teal
// bottom-right, purple centre-right. Now driven by the theme's layer list.
const { base, layers } = CLASSIC_THEME.background;

const PageBackground: React.FC<PageBackgroundProps> = ({ children, style }) => (
  <div style={{
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    background: base,
    color: tokens.text,
    fontFamily: tokens.font,
    overflowX: 'hidden',
    ...style,
  }}>
    {layers.map((l, i) => (
      <div key={i} style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(${l.shape} at ${l.at}, ${l.color}, transparent ${l.stop})`,
      }} />
    ))}
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      {children}
    </div>
  </div>
);

export default PageBackground;
