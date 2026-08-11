import { themeToCssVars } from '../theme/cssVars';
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

  it('does not emit meaningless rgb variants for composites', () => {
    expect(vars['--glass-bg-rgb']).toBeUndefined();
    expect(vars['--font-rgb']).toBeUndefined();
    expect(vars['--card-shadow-rgb']).toBeUndefined();
  });

  it('emits no variables for the four numeric tokens', () => {
    expect(vars['--glass-radius']).toBeUndefined();
    expect(vars['--r-btn']).toBeUndefined();
    expect(vars['--r-input']).toBeUndefined();
    expect(vars['--r-pill']).toBeUndefined();
  });
});
