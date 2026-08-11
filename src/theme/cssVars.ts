// src/theme/cssVars.ts
import { Theme, RGB_CHANNEL_KEYS, ThemePalette } from './types';

/** accentDark -> --accent-dark */
const toVarName = (key: string): string =>
  '--' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase());

/** '#00d4aa' -> '0,212,170'. Returns null for non-hex (gradients, shadows).
 *  Exported for direct unit testing of the bit-shift math. */
export const hexToRgbChannels = (hex: string): string | null => {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

/**
 * Flattens a theme's palette into CSS custom properties.
 * Every palette entry becomes a variable. Only RGB_CHANNEL_KEYS additionally
 * get a `--x-rgb` channel variant, for call sites that compose an alpha.
 */
export const themeToCssVars = (theme: Theme): Record<string, string> => {
  const vars: Record<string, string> = {};

  (Object.keys(theme.palette) as (keyof ThemePalette)[]).forEach(key => {
    vars[toVarName(key)] = theme.palette[key];
  });

  RGB_CHANNEL_KEYS.forEach(key => {
    const channels = hexToRgbChannels(theme.palette[key]);
    if (channels) {
      vars[`${toVarName(key)}-rgb`] = channels;
    } else if (process.env.NODE_ENV !== 'production') {
      console.error(
        `themeToCssVars: "${key}" is in RGB_CHANNEL_KEYS but its value ` +
        `"${theme.palette[key]}" is not a 6-digit hex — ${toVarName(key)}-rgb omitted, ` +
        `and any rgba(var(${toVarName(key)}-rgb), a) will render as nothing.`
      );
    }
  });

  return vars;
};
