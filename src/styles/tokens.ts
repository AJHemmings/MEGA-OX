export const tokens = {
  // Brand
  accent: '#00d4aa',
  accentDark: '#00b894',

  // Backgrounds
  bgBase: '#060d1f',
  bgCard: '#0d1530',
  bgSurface: '#1a2340',

  // Text
  text: '#ffffff',
  textMuted: '#a0aec0',
  textDim: '#4a5568',

  // Semantic
  win: '#00d4aa',
  loss: '#ff6b6b',
  draw: '#a0aec0',
  xp: '#7c4dff',
  xpDark: '#4a1fa0',
  credits: '#f9a825',
  warn: '#f7931e',

  // Player chrome (not markers/board — those are skins)
  p1: '#00d4aa',
  p2: '#ff6b6b',

  // Glass card
  glassBg: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
  glassBorder: '1px solid rgba(255,255,255,0.10)',
  glassRadius: 16,
  glassBlur: 'blur(12px)',

  // Inner surfaces (inside a glass card)
  innerBg: 'rgba(255,255,255,0.04)',
  innerBorder: '1px solid rgba(255,255,255,0.06)',

  // Radii
  rBtn: 14,
  rInput: 12,
  rPill: 100,

  // Shadows
  ctaShadow:      '0 8px 24px rgba(0,212,170,0.30)',
  ctaShadowHover: '0 12px 32px rgba(0,212,170,0.45)',
  cardShadow:     '0 8px 25px rgba(0,0,0,0.30)',

  // Font
  font: "'Nunito', system-ui, sans-serif",
} as const;
