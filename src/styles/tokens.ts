// Values now resolve from CSS custom properties written by ThemeProvider.
// See src/theme/defaults.ts for the actual values and spec §7 for the rule:
// every string entry is a variable; the four numerics stay literals.
//
// Because these are `var()` strings and not colours, they only work where the
// browser resolves CSS. They CANNOT be concatenated with a hex alpha
// (`${tokens.accent}55`), string-manipulated, or used in SVG presentation
// attributes or a Canvas 2D context. Compose an alpha with the paired channel
// variable instead: `rgba(var(--accent-rgb), 0.33)`.
export const tokens = {
  // Brand
  accent: 'var(--accent)',
  accentDark: 'var(--accent-dark)',

  // Backgrounds
  bgBase: 'var(--bg-base)',
  bgCard: 'var(--bg-card)',
  bgSurface: 'var(--bg-surface)',

  // Text
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  textDim: 'var(--text-dim)',

  // Semantic
  win: 'var(--win)',
  loss: 'var(--loss)',
  draw: 'var(--draw)',
  xp: 'var(--xp)',
  xpDark: 'var(--xp-dark)',
  credits: 'var(--credits)',
  warn: 'var(--warn)',

  // Player chrome (not markers/board — those are skins)
  p1: 'var(--p1)',
  p2: 'var(--p2)',

  // Glass card
  glassBg: 'var(--glass-bg)',
  glassBorder: 'var(--glass-border)',
  glassRadius: 16,
  glassBlur: 'var(--glass-blur)',

  // Inner surfaces (inside a glass card)
  innerBg: 'var(--inner-bg)',
  innerBorder: 'var(--inner-border)',

  // Radii
  rBtn: 14,
  rInput: 12,
  rPill: 100,

  // Shadows
  ctaShadow: 'var(--cta-shadow)',
  ctaShadowHover: 'var(--cta-shadow-hover)',
  cardShadow: 'var(--card-shadow)',

  // Font
  font: 'var(--font)',
} as const;

// Rank identity, not look-and-feel — deliberately NOT themed. See spec §7.
export const tierColour: Record<string, string> = {
  'Grand Master': '#f9a825', 'Master': '#c0c0c0', 'Expert': '#cd7f32',
  'Strategist': '#00d4aa', 'Tactician': '#4299e1', 'Challenger': '#a0aec0', 'Novice': '#4a5568',
};
