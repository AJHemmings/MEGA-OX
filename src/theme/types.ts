// src/theme/types.ts

/** Every non-numeric entry of tokens.ts, including composites (gradients,
 *  borders, shadows, font stack). The four numeric tokens (glassRadius,
 *  rBtn, rInput, rPill) are deliberately excluded — they are not themeable
 *  and would need unit suffixes as CSS variables. */
export interface ThemePalette {
  accent: string; accentDark: string;
  bgBase: string; bgCard: string; bgSurface: string;
  text: string; textMuted: string; textDim: string;
  win: string; loss: string; draw: string;
  xp: string; xpDark: string; credits: string; warn: string;
  p1: string; p2: string;
  glassBg: string; glassBorder: string; glassBlur: string;
  innerBg: string; innerBorder: string;
  ctaShadow: string; ctaShadowHover: string; cardShadow: string;
  font: string;
}

/** Palette keys that get a `--x-rgb` channel variant, because some call site
 *  composes them with an alpha. Adding a key here is cheap; adding one for a
 *  gradient or shadow is meaningless. See spec §3. */
export const RGB_CHANNEL_KEYS = [
  'accent', 'loss', 'warn', 'win', 'draw', 'textMuted', 'credits',
] as const satisfies readonly (keyof ThemePalette)[];

export interface ThemeBackgroundLayer {
  /** e.g. 'ellipse 80% 60%' */ shape: string;
  /** e.g. '0% 0%' */          at: string;
  /** full rgba() string */    color: string;
  /** e.g. '60%' */            stop: string;
}

export interface ThemeBackground {
  base: string;
  layers: ThemeBackgroundLayer[];
}

export interface ThemePillVariant { background: string; border: string; color: string }

export interface ThemePillStyles {
  teal: ThemePillVariant; purple: ThemePillVariant; gold: ThemePillVariant;
  red: ThemePillVariant;  muted: ThemePillVariant;
}

/** One `playTone(frequency, duration, type, gainValue, delay)` invocation. */
export interface ThemeTone {
  freq: number; dur: number;
  wave: OscillatorType; gain: number; delay: number;
}

/** The five sound EVENTS. `resumeAudio` is not an event — it plays nothing. */
export interface ThemeSounds {
  marker_placed: ThemeTone[];
  your_turn: ThemeTone[];
  micro_board_won: ThemeTone[];
  game_won: ThemeTone[];
  game_lost: ThemeTone[];
}

export interface Theme {
  id: string;
  name: string;
  palette: ThemePalette;
  background: ThemeBackground;
  pills: ThemePillStyles;
  sounds: ThemeSounds;
}
