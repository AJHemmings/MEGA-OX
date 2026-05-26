import React from 'react';
import { tokens } from '../../styles/tokens';

interface PageBackgroundProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const PageBackground: React.FC<PageBackgroundProps> = ({ children, style }) => (
  <div style={{
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    background: tokens.bgBase,
    color: tokens.text,
    fontFamily: tokens.font,
    overflowX: 'hidden',
    ...style,
  }}>
    {/* Indigo glow — top-left */}
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(26,42,108,0.55), transparent 60%)',
    }} />
    {/* Teal glow — bottom-right */}
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(ellipse 70% 50% at 100% 100%, rgba(0,212,170,0.18), transparent 65%)',
    }} />
    {/* Purple glow — center-right depth */}
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: 'radial-gradient(ellipse 40% 40% at 110% 40%, rgba(124,77,255,0.10), transparent 60%)',
    }} />
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      {children}
    </div>
  </div>
);

export default PageBackground;
