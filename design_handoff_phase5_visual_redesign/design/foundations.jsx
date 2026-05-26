// Foundations: colors, type, component library

const Swatch = ({ name, hex, sub, dark }) => (
  <div style={{
    background: hex, color: dark ? '#fff' : '#051018',
    borderRadius: 12, padding: '14px 16px',
    border: '1px solid rgba(255,255,255,0.06)',
    minWidth: 140,
  }}>
    <div style={{ fontWeight: 800, fontSize: 13 }}>{name}</div>
    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, opacity: 0.85, marginTop: 4 }}>{hex}</div>
    {sub && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
  </div>
);

const TypeRow = ({ size, weight, label, letter = 0, sample }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ width: 130, color: T.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
    <div style={{ flex: 1, fontSize: size, fontWeight: weight, letterSpacing: letter, color: '#fff' }}>{sample}</div>
    <div style={{ color: T.textMuted, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
      {size}px · {weight}{letter ? ` · ${letter}px` : ''}
    </div>
  </div>
);

const FoundationsBoard = () => (
  <div style={{ width: 1080, padding: 40, background: T.bgBase, color: '#fff', fontFamily: 'Nunito, sans-serif', position: 'relative', overflow: 'hidden' }}>
    {/* atmospheric glow */}
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 0% 0%, rgba(26,42,108,0.45), transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(0,212,170,0.12), transparent 60%)', pointerEvents: 'none' }} />
    <div style={{ position: 'relative' }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 2, marginBottom: 6 }}>PHASE 5 · VISUAL FOUNDATIONS</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: 1.2 }}>The Mega OX Visual System</h1>
        <p style={{ color: T.textMuted, marginTop: 8, fontSize: 14, maxWidth: 680 }}>
          Dark glassmorphism. Deep navy base with indigo &amp; teal atmospheric glows. Glass cards layer on top.
          One gradient teal primary per screen — everything else is muted or transparent. Nunito throughout.
        </p>
      </div>

      {/* Color scale */}
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>Colour palette</h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Backgrounds</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Swatch dark name="Base" hex="#060d1f" sub="page" />
          <Swatch dark name="Card" hex="#0d1530" sub="panel base" />
          <Swatch dark name="Surface" hex="#1a2340" sub="elevated / input" />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Brand &amp; semantic</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Swatch name="Accent" hex="#00d4aa" sub="primary CTA" />
          <Swatch name="Accent dark" hex="#00b894" sub="gradient end" />
          <Swatch dark name="Loss / P2" hex="#ff6b6b" />
          <Swatch dark name="XP" hex="#7c4dff" />
          <Swatch name="Credits" hex="#f9a825" />
          <Swatch name="Warning" hex="#f7931e" />
          <Swatch dark name="Draw" hex="#a0aec0" />
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Atmospheric glow (page background)</div>
        <div style={{
          height: 120, borderRadius: 16, position: 'relative', overflow: 'hidden',
          background: T.bgBase, border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 0% 0%, rgba(26,42,108,0.55), transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 100% 100%, rgba(0,212,170,0.18), transparent 65%)' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: T.textMuted }}>
            <span>radial #1a2a6c55 at 0% 0%</span>
            <span>radial #00d4aa22 at 100% 100%</span>
          </div>
        </div>
      </div>

      {/* Type */}
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px' }}>Typography — Nunito</h2>
      <Note style={{ marginBottom: 16 }}>Weights loaded: 400 / 600 / 700 / 800 / 900</Note>
      <div style={{ marginBottom: 32 }}>
        <TypeRow label="Display" size={32} weight={900} letter={1.5} sample="MEGA OX" />
        <TypeRow label="Heading 1" size={22} weight={800} sample="Choose your match" />
        <TypeRow label="Heading 2" size={17} weight={700} sample="Recent games" />
        <TypeRow label="Body" size={15} weight={600} sample="Win a micro board to claim that cell." />
        <TypeRow label="Caption" size={12} weight={600} sample="Last played 2h ago" />
        <TypeRow label="Micro" size={11} weight={700} letter={0.4} sample="GRAND MASTER" />
      </div>

      {/* Components */}
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>Component library</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Glass card */}
        <Glass padding={20}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Glass card</div>
          <Glass padding={16} style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Nested surface</div>
            <Note style={{ marginTop: 6 }}>16px radius · 1px white-10 border · backdrop-blur 12</Note>
          </Glass>
        </Glass>

        {/* Buttons */}
        <Glass padding={20}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>Buttons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PrimaryButton>Play Now</PrimaryButton>
            <SecondaryButton>Cancel</SecondaryButton>
            <Note>Primary: gradient #00d4aa→#00b894 · text #051018 · shadow 0 8px 24px #00d4aa4D</Note>
            <Note>Hover: gradient end #00b894 · shadow 0 12px 32px #00d4aa73 · translateY(-1px)</Note>
          </div>
        </Glass>

        {/* Pills */}
        <Glass padding={20}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>Pills &amp; chips</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Pill variant="teal">ACTIVE</Pill>
            <Pill variant="purple" icon={<Gem size={11} />}>LVL 24</Pill>
            <Pill variant="gold" icon={<Coin size={11} />}>1,240</Pill>
            <Pill variant="red">LOSS</Pill>
            <Pill variant="muted">FRIENDLY</Pill>
          </div>
          <Note style={{ marginTop: 10 }}>radius 100px · padding 5×12 · weight 700 · 11px</Note>
        </Glass>

        {/* Level badge + XP */}
        <Glass padding={20}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>Progression</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <LevelBadge level={7} size="sm" />
            <LevelBadge level={24} size="md" />
            <LevelBadge level={42} size="lg" />
          </div>
          <XPBar pct={0.62} label={<><span>LVL 24</span><span>620 / 1000 XP</span></>} />
        </Glass>

        {/* Input field */}
        <Glass padding={20}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>Input field</div>
          <div style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '12px 14px', fontWeight: 600, fontSize: 14, color: T.textMuted,
          }}>your@email.com</div>
          <div style={{
            marginTop: 8,
            background: 'rgba(0,212,170,0.06)', border: `1px solid ${T.accent}`,
            borderRadius: 12, padding: '12px 14px', fontWeight: 600, fontSize: 14, color: '#fff',
            boxShadow: '0 0 0 3px rgba(0,212,170,0.15)',
          }}>player@megaox.app<span style={{ borderLeft: '1.5px solid '+T.accent, marginLeft: 2, animation: 'blink 1s infinite' }}>&nbsp;</span></div>
          <Note style={{ marginTop: 8 }}>Default → focus: border becomes #00d4aa + 3px ring at 15% opacity</Note>
        </Glass>

        {/* Avatar + level */}
        <Glass padding={20}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>Player chip</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Avatar size={48} initial="K" color={T.accent} />
              <div style={{ position: 'absolute', bottom: -4, right: -4 }}><LevelBadge level={24} size="sm" /></div>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Kestrel</div>
              <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 0.4 }}>GRAND MASTER · #142</div>
            </div>
          </div>
        </Glass>

      </div>

      {/* Tab bar reference */}
      <h3 style={{ fontSize: 14, fontWeight: 800, margin: '28px 0 10px', color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Tab bar (mobile only)</h3>
      <div style={{ position: 'relative', height: 80, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', inset: 0 }}><TabBar active="home" /></div>
      </div>
      <Note style={{ marginTop: 8 }}>4 tabs: Home, Play, Profile, Settings · active = #00d4aa · 22px icon + 10px label · hidden on game/auth screens</Note>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  </div>
);

window.FoundationsBoard = FoundationsBoard;
