// src/theme/defaults.ts
import { Theme } from './types';

export const CLASSIC_THEME: Theme = {
  id: 'classic',
  name: 'Classic',

  palette: {
    accent: '#00d4aa', accentDark: '#00b894',
    bgBase: '#060d1f', bgCard: '#0d1530', bgSurface: '#1a2340',
    text: '#ffffff', textMuted: '#a0aec0', textDim: '#4a5568',
    win: '#00d4aa', loss: '#ff6b6b', draw: '#a0aec0',
    xp: '#7c4dff', xpDark: '#4a1fa0', credits: '#f9a825', warn: '#f7931e',
    p1: '#00d4aa', p2: '#ff6b6b',
    glassBg: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
    glassBorder: '1px solid rgba(255,255,255,0.10)',
    glassBlur: 'blur(12px)',
    innerBg: 'rgba(255,255,255,0.04)',
    innerBorder: '1px solid rgba(255,255,255,0.06)',
    ctaShadow: '0 8px 24px rgba(0,212,170,0.30)',
    ctaShadowHover: '0 12px 32px rgba(0,212,170,0.45)',
    cardShadow: '0 8px 25px rgba(0,0,0,0.30)',
    font: "'Nunito', system-ui, sans-serif",
  },

  // From PageBackground.tsx — three fixed radial-gradient overlays.
  background: {
    base: '#060d1f',
    layers: [
      { shape: 'ellipse 80% 60%', at: '0% 0%',     color: 'rgba(26,42,108,0.55)',  stop: '60%' },
      { shape: 'ellipse 70% 50%', at: '100% 100%', color: 'rgba(0,212,170,0.18)',  stop: '65%' },
      { shape: 'ellipse 40% 40%', at: '110% 40%',  color: 'rgba(124,77,255,0.10)', stop: '60%' },
    ],
  },

  // From Pill.tsx variantStyles. Colours that referenced tokens are written as
  // var() here so pills follow the palette; the rgba literals are preserved exactly.
  pills: {
    teal:   { background: 'rgba(0,212,170,0.15)',   border: '1px solid rgba(0,212,170,0.35)',   color: 'var(--accent)' },
    purple: { background: 'rgba(124,77,255,0.18)',  border: '1px solid rgba(124,77,255,0.40)',  color: '#b39dff' },
    gold:   { background: 'rgba(249,168,37,0.15)',  border: '1px solid rgba(249,168,37,0.40)',  color: 'var(--credits)' },
    red:    { background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.35)', color: 'var(--loss)' },
    muted:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)' },
  },

  // From sounds.ts — each entry is one playTone(freq, dur, wave, gain, delay).
  sounds: {
    marker_placed:   [{ freq: 440, dur: 0.08, wave: 'square', gain: 0.15, delay: 0 }],
    your_turn:       [{ freq: 523, dur: 0.15, wave: 'sine', gain: 0.25, delay: 0 },
                      { freq: 659, dur: 0.2,  wave: 'sine', gain: 0.25, delay: 0.15 }],
    micro_board_won: [{ freq: 523, dur: 0.12, wave: 'sine', gain: 0.3, delay: 0 },
                      { freq: 659, dur: 0.12, wave: 'sine', gain: 0.3, delay: 0.13 },
                      { freq: 784, dur: 0.2,  wave: 'sine', gain: 0.3, delay: 0.26 }],
    game_won:        [{ freq: 523,  dur: 0.18, wave: 'sine', gain: 0.3, delay: 0 },
                      { freq: 659,  dur: 0.18, wave: 'sine', gain: 0.3, delay: 0.12 },
                      { freq: 784,  dur: 0.18, wave: 'sine', gain: 0.3, delay: 0.24 },
                      { freq: 1047, dur: 0.18, wave: 'sine', gain: 0.3, delay: 0.36 }],
    game_lost:       [{ freq: 392, dur: 0.2, wave: 'sine', gain: 0.25, delay: 0 },
                      { freq: 330, dur: 0.3, wave: 'sine', gain: 0.25, delay: 0.22 }],
  },
};
