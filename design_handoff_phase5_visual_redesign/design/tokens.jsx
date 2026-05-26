// Mega OX — Phase 5 visual tokens + reusable primitives
// Spec values lifted from phase5-visual-redesign-design.md

const T = {
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
  // Players (chrome only)
  p1: '#00d4aa',
  p2: '#ff6b6b',
  // Glass effect
  glassBg: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
  glassBorder: '1px solid rgba(255,255,255,0.10)',
  // Sub-surfaces (inside glass cards)
  innerBg: 'rgba(255,255,255,0.04)',
  innerBorder: '1px solid rgba(255,255,255,0.06)',
  // Radii
  rCard: 16,
  rBtn: 14,
  rInput: 12,
  rPill: 100,
  // Shadows
  ctaShadow: '0 8px 24px rgba(0,212,170,0.30)',
  ctaShadowHover: '0 12px 32px rgba(0,212,170,0.45)',
};

// The atmospheric background used on every page.
const PageBg = ({ children, style }) => (
  <div style={{
    position: 'relative',
    width: '100%',
    height: '100%',
    background: T.bgBase,
    color: T.text,
    fontFamily: 'Nunito, system-ui, sans-serif',
    overflow: 'hidden',
    ...style,
  }}>
    {/* Indigo glow top-left */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(26,42,108,0.55), transparent 60%)',
    }} />
    {/* Teal glow bottom-right */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 70% 50% at 100% 100%, rgba(0,212,170,0.18), transparent 65%)',
    }} />
    {/* Subtle purple glow center-right for depth */}
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(ellipse 40% 40% at 110% 40%, rgba(124,77,255,0.10), transparent 60%)',
    }} />
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
    </div>
  </div>
);

// Glass card primitive
const Glass = ({ children, style, padding = 20 }) => (
  <div style={{
    background: T.glassBg,
    border: T.glassBorder,
    borderRadius: T.rCard,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding,
    ...style,
  }}>
    {children}
  </div>
);

// Primary CTA — single per screen
const PrimaryButton = ({ children, style, glow = true, size = 'md' }) => {
  const pad = size === 'lg' ? '16px 22px' : size === 'sm' ? '10px 16px' : '14px 20px';
  const fs = size === 'lg' ? 17 : size === 'sm' ? 13 : 15;
  return (
    <button style={{
      background: `linear-gradient(135deg, ${T.accent}, ${T.accentDark})`,
      border: 'none',
      borderRadius: T.rBtn,
      padding: pad,
      fontFamily: 'inherit',
      fontWeight: 800,
      fontSize: fs,
      color: '#051018',
      cursor: 'pointer',
      boxShadow: glow ? T.ctaShadow : 'none',
      letterSpacing: 0.2,
      ...style,
    }}>{children}</button>
  );
};

const SecondaryButton = ({ children, style, size = 'md' }) => {
  const pad = size === 'lg' ? '14px 20px' : size === 'sm' ? '8px 14px' : '12px 18px';
  const fs = size === 'lg' ? 15 : size === 'sm' ? 12 : 14;
  return (
    <button style={{
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: T.rBtn,
      padding: pad,
      fontFamily: 'inherit',
      fontWeight: 700,
      fontSize: fs,
      color: T.textMuted,
      cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
};

// Pill / chip — variant: teal | purple | gold | muted | red
const Pill = ({ children, variant = 'muted', style, icon }) => {
  const variants = {
    teal:   { bg: 'rgba(0,212,170,0.15)',   bd: 'rgba(0,212,170,0.35)',   c: T.accent },
    purple: { bg: 'rgba(124,77,255,0.18)',  bd: 'rgba(124,77,255,0.4)',   c: '#b39dff' },
    gold:   { bg: 'rgba(249,168,37,0.15)',  bd: 'rgba(249,168,37,0.4)',   c: T.credits },
    red:    { bg: 'rgba(255,107,107,0.15)', bd: 'rgba(255,107,107,0.35)', c: T.loss },
    muted:  { bg: 'rgba(255,255,255,0.06)', bd: 'rgba(255,255,255,0.12)', c: T.textMuted },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: variants.bg, border: `1px solid ${variants.bd}`, color: variants.c,
      borderRadius: T.rPill, padding: '5px 12px',
      fontWeight: 700, fontSize: 11, letterSpacing: 0.3,
      ...style,
    }}>
      {icon}{children}
    </span>
  );
};

// Level badge — purple gradient
const LevelBadge = ({ level, size = 'md' }) => {
  const s = size === 'lg' ? { w: 44, fs: 16 } : size === 'sm' ? { w: 26, fs: 11 } : { w: 34, fs: 13 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: s.w, height: s.w, borderRadius: '50%',
      background: `linear-gradient(135deg, ${T.xp}, ${T.xpDark})`,
      color: '#fff', fontWeight: 900, fontSize: s.fs,
      boxShadow: '0 4px 14px rgba(124,77,255,0.4)',
      border: '1.5px solid rgba(255,255,255,0.15)',
    }}>{level}</span>
  );
};

// XP progress bar
const XPBar = ({ pct = 0.5, label, height = 8 }) => (
  <div>
    {label && (
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6,
                    fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4 }}>
        {label}
      </div>
    )}
    <div style={{
      height, background: 'rgba(255,255,255,0.08)', borderRadius: T.rPill, overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct * 100}%`, height: '100%',
        background: `linear-gradient(90deg, ${T.accent}, ${T.xp})`,
        borderRadius: T.rPill,
        boxShadow: '0 0 8px rgba(0,212,170,0.45)',
      }} />
    </div>
  </div>
);

// Credit chip with coin
const CreditChip = ({ amount, big = false }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: big ? '8px 14px' : '5px 12px',
    background: 'rgba(249,168,37,0.12)',
    border: '1px solid rgba(249,168,37,0.35)',
    borderRadius: T.rPill,
    color: T.credits, fontWeight: 800, fontSize: big ? 14 : 12,
  }}>
    <Coin size={big ? 16 : 13} />
    {amount.toLocaleString()}
  </span>
);

// Tiny coin SVG (allowed: simple circles)
const Coin = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
    <defs>
      <linearGradient id={`coin-${size}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffd56b" />
        <stop offset="100%" stopColor="#f9a825" />
      </linearGradient>
    </defs>
    <circle cx="8" cy="8" r="7" fill={`url(#coin-${size})`} stroke="#b87600" strokeWidth="0.8" />
    <circle cx="8" cy="8" r="4.5" fill="none" stroke="#b87600" strokeWidth="0.8" opacity="0.5" />
  </svg>
);

// Gem icon (simple diamond)
const Gem = ({ size = 14, color = T.xp }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
    <polygon points="8,1.5 14.5,7 8,14.5 1.5,7" fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" />
    <polygon points="8,1.5 8,14.5 14.5,7" fill="rgba(0,0,0,0.15)" />
  </svg>
);

// Streak flame (simple)
const Flame = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 2c1 3 5 5 5 10a5 5 0 1 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-6 1-9z"
          fill="url(#flame-grad)" stroke="#ff6b6b" strokeWidth="0.5" />
    <defs>
      <linearGradient id="flame-grad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="60%" stopColor="#f9a825" />
        <stop offset="100%" stopColor="#fff7a8" />
      </linearGradient>
    </defs>
  </svg>
);

// Skinnable-canvas placeholder: shows that this region is image-driven
const BoardCanvasPlaceholder = ({ size = 320, label = 'BOARD CANVAS — skinnable region' }) => (
  <div style={{
    width: size, height: size, position: 'relative', borderRadius: 18,
    overflow: 'hidden',
    background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 10px, rgba(255,255,255,0.015) 10px 20px)',
    border: '1px dashed rgba(255,255,255,0.18)',
  }}>
    {/* 3×3 macro grid hint */}
    <svg viewBox="0 0 3 3" preserveAspectRatio="none"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}>
      <line x1="1" y1="0" x2="1" y2="3" stroke="#fff" strokeWidth="0.02" />
      <line x1="2" y1="0" x2="2" y2="3" stroke="#fff" strokeWidth="0.02" />
      <line x1="0" y1="1" x2="3" y2="1" stroke="#fff" strokeWidth="0.02" />
      <line x1="0" y1="2" x2="3" y2="2" stroke="#fff" strokeWidth="0.02" />
    </svg>
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 8,
      fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
      color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1.5, textAlign: 'center', padding: 24,
    }}>
      <div>{label}</div>
      <div style={{ fontSize: 9, opacity: 0.6 }}>{size}×{size}px · img slots: bg, grid, markers, won-overlay</div>
    </div>
  </div>
);

// Section label for design canvas notes
const Note = ({ children, style }) => (
  <div style={{
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
    fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
    letterSpacing: 0.4, ...style,
  }}>{children}</div>
);

// Avatar with optional ring
const Avatar = ({ size = 48, initial = 'A', color = T.accent, ring }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg, ${color}, ${T.xp})`,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 900, fontSize: size * 0.4,
    border: ring ? `2.5px solid ${ring}` : '2px solid rgba(255,255,255,0.15)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
    flexShrink: 0,
  }}>{initial}</div>
);

// Tab bar (mobile)
const TabBar = ({ active = 'home' }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'play', label: 'Play', icon: PlayIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: GearIcon },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
      background: 'rgba(13,21,48,0.85)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      backdropFilter: 'blur(16px)',
      paddingBottom: 16, paddingTop: 10,
    }}>
      {tabs.map(t => {
        const Icon = t.icon;
        const on = t.id === active;
        return (
          <div key={t.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? T.accent : T.textMuted,
          }}>
            <Icon size={22} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Icon set — minimal line icons (no drawn imagery)
const HomeIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/></svg>
);
const PlayIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6,4 20,12 6,20" /></svg>
);
const UserIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>
);
const GearIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);
const ChevronLeft = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const TrophyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z M4 5h3v3a3 3 0 0 1-3-3zM20 5h-3v3a3 3 0 0 0 3-3z"/></svg>
);
const SparkleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></svg>
);
const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
);

// Phone frame for mobile mockups
const Phone = ({ children, screenLabel }) => (
  <div data-screen-label={screenLabel} style={{
    width: 390, height: 844, borderRadius: 44,
    background: '#000',
    padding: 8,
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
    position: 'relative',
  }}>
    <div style={{
      width: '100%', height: '100%', borderRadius: 36,
      overflow: 'hidden', position: 'relative',
      background: T.bgBase,
    }}>
      {/* Status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44,
        zIndex: 10, color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '12px 28px',
        fontSize: 14, fontWeight: 700,
      }}>
        <span>9:41</span>
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', opacity: 0.9 }}>
          <span style={{ fontSize: 11 }}>●●●●</span>
          <span style={{ fontSize: 11 }}>●●</span>
          <span style={{ fontSize: 11 }}>100%</span>
        </span>
      </div>
      {/* Dynamic Island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 32, borderRadius: 20, background: '#000', zIndex: 11,
      }} />
      {children}
    </div>
  </div>
);

// Desktop browser frame
const DesktopFrame = ({ children, screenLabel, width = 1280, height = 800 }) => (
  <div data-screen-label={screenLabel} style={{
    width, height, borderRadius: 14, overflow: 'hidden',
    background: '#000',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
    position: 'relative',
  }}>
    {/* Window chrome */}
    <div style={{
      height: 36, background: '#0a1124',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8,
    }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
      <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: T.textMuted, fontFamily: 'ui-monospace, monospace' }}>
        megaox.app
      </div>
    </div>
    <div style={{ width: '100%', height: height - 36, position: 'relative' }}>
      {children}
    </div>
  </div>
);

Object.assign(window, {
  T, PageBg, Glass, PrimaryButton, SecondaryButton, Pill, LevelBadge, XPBar,
  CreditChip, Coin, Gem, Flame, BoardCanvasPlaceholder, Note, Avatar, TabBar,
  HomeIcon, PlayIcon, UserIcon, GearIcon, ChevronLeft, TrophyIcon, SparkleIcon, SearchIcon,
  Phone, DesktopFrame,
});
