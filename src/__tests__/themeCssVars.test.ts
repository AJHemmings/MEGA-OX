import { themeToCssVars, hexToRgbChannels } from '../theme/cssVars';
import { CLASSIC_THEME } from '../theme/defaults';

describe('themeToCssVars', () => {
  const vars = themeToCssVars(CLASSIC_THEME);

  it('emits the exact palette literals the app shipped with', () => {
    expect(vars['--accent']).toBe('#00d4aa');
    expect(vars['--accent-dark']).toBe('#00b894');
    expect(vars['--bg-base']).toBe('#060d1f');
    expect(vars['--bg-card']).toBe('#0d1530');
    expect(vars['--bg-surface']).toBe('#1a2340');
    expect(vars['--text']).toBe('#ffffff');
    expect(vars['--text-muted']).toBe('#a0aec0');
    expect(vars['--text-dim']).toBe('#4a5568');
    expect(vars['--win']).toBe('#00d4aa');
    expect(vars['--loss']).toBe('#ff6b6b');
    expect(vars['--draw']).toBe('#a0aec0');
    expect(vars['--xp']).toBe('#7c4dff');
    expect(vars['--xp-dark']).toBe('#4a1fa0');
    expect(vars['--credits']).toBe('#f9a825');
    expect(vars['--warn']).toBe('#f7931e');
    expect(vars['--p1']).toBe('#00d4aa');
    expect(vars['--p2']).toBe('#ff6b6b');
  });

  it('emits the exact composite literals', () => {
    expect(vars['--glass-bg']).toBe('linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))');
    expect(vars['--glass-border']).toBe('1px solid rgba(255,255,255,0.10)');
    expect(vars['--glass-blur']).toBe('blur(12px)');
    expect(vars['--inner-bg']).toBe('rgba(255,255,255,0.04)');
    expect(vars['--inner-border']).toBe('1px solid rgba(255,255,255,0.06)');
    expect(vars['--cta-shadow']).toBe('0 8px 24px rgba(0,212,170,0.30)');
    expect(vars['--cta-shadow-hover']).toBe('0 12px 32px rgba(0,212,170,0.45)');
    expect(vars['--card-shadow']).toBe('0 8px 25px rgba(0,0,0,0.30)');
    expect(vars['--font']).toBe("'Nunito', system-ui, sans-serif");
  });

  it('emits rgb channel variants only for tokens used in alpha composition', () => {
    expect(vars['--accent-rgb']).toBe('0,212,170');
    expect(vars['--loss-rgb']).toBe('255,107,107');
    expect(vars['--warn-rgb']).toBe('247,147,30');
    expect(vars['--win-rgb']).toBe('0,212,170');
    expect(vars['--draw-rgb']).toBe('160,174,192');
    expect(vars['--text-muted-rgb']).toBe('160,174,192');
    expect(vars['--credits-rgb']).toBe('249,168,37');
  });

  it('emits rgb variants for exactly the alpha-composed tokens', () => {
    expect(Object.keys(vars).filter(k => k.endsWith('-rgb')).sort()).toEqual([
      '--accent-rgb', '--credits-rgb', '--draw-rgb',
      '--loss-rgb', '--text-muted-rgb', '--warn-rgb', '--win-rgb',
    ].sort());
  });

  it('emits no variables for the four numeric tokens', () => {
    expect(vars['--glass-radius']).toBeUndefined();
    expect(vars['--r-btn']).toBeUndefined();
    expect(vars['--r-input']).toBeUndefined();
    expect(vars['--r-pill']).toBeUndefined();
  });
});

describe('hexToRgbChannels', () => {
  it('converts a valid 6-digit hex to comma-separated channels', () => {
    expect(hexToRgbChannels('#00d4aa')).toBe('0,212,170');
  });

  it('handles the top bit-shift boundary', () => {
    expect(hexToRgbChannels('#ffffff')).toBe('255,255,255');
  });

  it('handles the bottom bit-shift boundary', () => {
    expect(hexToRgbChannels('#000000')).toBe('0,0,0');
  });

  it('returns null for a gradient string', () => {
    expect(hexToRgbChannels('linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))')).toBeNull();
  });

  it('returns null for a border shorthand', () => {
    expect(hexToRgbChannels('1px solid rgba(255,255,255,0.10)')).toBeNull();
  });

  it('returns null for the font stack', () => {
    expect(hexToRgbChannels("'Nunito', system-ui, sans-serif")).toBeNull();
  });
});

describe('CLASSIC_THEME data fidelity', () => {
  it('emits the exact background layers', () => {
    expect(CLASSIC_THEME.background.layers).toEqual([
      { shape: 'ellipse 80% 60%', at: '0% 0%', color: 'rgba(26,42,108,0.55)', stop: '60%' },
      { shape: 'ellipse 70% 50%', at: '100% 100%', color: 'rgba(0,212,170,0.18)', stop: '65%' },
      { shape: 'ellipse 40% 40%', at: '110% 40%', color: 'rgba(124,77,255,0.10)', stop: '60%' },
    ]);
  });

  it('emits the exact pill variants', () => {
    expect(CLASSIC_THEME.pills).toEqual({
      teal:   { background: 'rgba(0,212,170,0.15)',   border: '1px solid rgba(0,212,170,0.35)',   color: 'var(--accent)' },
      purple: { background: 'rgba(124,77,255,0.18)',  border: '1px solid rgba(124,77,255,0.40)',  color: '#b39dff' },
      gold:   { background: 'rgba(249,168,37,0.15)',  border: '1px solid rgba(249,168,37,0.40)',  color: 'var(--credits)' },
      red:    { background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.35)', color: 'var(--loss)' },
      muted:  { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-muted)' },
    });
  });

  it('emits the exact sound events', () => {
    expect(CLASSIC_THEME.sounds).toEqual({
      marker_placed: [
        { freq: 440, dur: 0.08, wave: 'square', gain: 0.15, delay: 0 },
      ],
      your_turn: [
        { freq: 523, dur: 0.15, wave: 'sine', gain: 0.25, delay: 0 },
        { freq: 659, dur: 0.2, wave: 'sine', gain: 0.25, delay: 0.15 },
      ],
      micro_board_won: [
        { freq: 523, dur: 0.12, wave: 'sine', gain: 0.3, delay: 0 },
        { freq: 659, dur: 0.12, wave: 'sine', gain: 0.3, delay: 0.13 },
        { freq: 784, dur: 0.2, wave: 'sine', gain: 0.3, delay: 0.26 },
      ],
      game_won: [
        { freq: 523, dur: 0.18, wave: 'sine', gain: 0.3, delay: 0 },
        { freq: 659, dur: 0.18, wave: 'sine', gain: 0.3, delay: 0.12 },
        { freq: 784, dur: 0.18, wave: 'sine', gain: 0.3, delay: 0.24 },
        { freq: 1047, dur: 0.18, wave: 'sine', gain: 0.3, delay: 0.36 },
      ],
      game_lost: [
        { freq: 392, dur: 0.2, wave: 'sine', gain: 0.25, delay: 0 },
        { freq: 330, dur: 0.3, wave: 'sine', gain: 0.25, delay: 0.22 },
      ],
    });
  });
});

// The tests above restate the data, so they cannot catch a theme referencing a
// variable that no longer exists. Variable NAMES are derived at runtime from the
// palette's keys (cssVars.ts toVarName), but the var() strings in `background`
// and `pills` are hand-written — nothing ties the two together.
//
// Rename palette key `credits` to `currency` and: themeToCssVars starts emitting
// --currency, tokens.credits fails to compile so that half gets fixed, but
// pills.gold.color is the plain string 'var(--credits)' and raises no error. The
// variable is now undefined, so gold pill text silently falls back to inherit.
// This closes that loop.
describe('theme var() references resolve to published variables', () => {
  it('every var() the theme references is a variable the theme publishes', () => {
    const declared = new Set(Object.keys(themeToCssVars(CLASSIC_THEME)));
    const referenced = [
      ...JSON.stringify(CLASSIC_THEME).matchAll(/var\((--[a-z0-9-]+)\)/g),
    ].map(m => m[1]);

    // Guards the guard: if a refactor stops using var() strings entirely, this
    // test must fail loudly rather than silently pass over an empty list.
    expect(referenced.length).toBeGreaterThan(0);
    referenced.forEach(name => expect(declared).toContain(name));
  });
});
