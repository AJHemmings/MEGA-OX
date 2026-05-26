// Priority 1 screens — Main Menu, Multiplayer, Matchmaking, Profile
// Mobile (390x844) + Desktop (1280x800) variants where called for

// =====================================================================
// MAIN MENU — Mobile
// =====================================================================
const MainMenuMobile = () => {
  return (
    <Phone screenLabel="P1 Main Menu — Mobile">
      <PageBg style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div style={{ padding: '8px 20px 0' }}>

          {/* Top bar — wordmark + credits */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h1 style={{
              margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: 2,
              background: `linear-gradient(135deg, #fff, ${T.accent})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>MEGA OX</h1>
            <CreditChip amount={1240} />
          </div>

          {/* Hero player card */}
          <Glass padding={18} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <Avatar size={56} initial="K" color={T.accent} ring={T.accent} />
                <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
                  <LevelBadge level={24} size="sm" />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Kestrel</div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 0.4, marginBottom: 8 }}>
                  STRATEGIST · #142 GLOBAL
                </div>
                <XPBar pct={0.62} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 4 }}>
                  <span>LVL 24</span><span>620 / 1000 XP</span>
                </div>
              </div>
            </div>
          </Glass>

          {/* Play Now hero CTA */}
          <Glass padding={0} style={{
            marginBottom: 14, overflow: 'hidden', position: 'relative',
            background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(124,77,255,0.15))',
            border: `1px solid rgba(0,212,170,0.35)`,
          }}>
            <div style={{ position: 'absolute', top: -40, right: -30, opacity: 0.25 }}>
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${T.accent}, transparent 70%)` }} />
            </div>
            <div style={{ padding: '18px 18px 16px', position: 'relative' }}>
              <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 1.2, marginBottom: 4 }}>QUICK PLAY</div>
              <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 12 }}>Ranked Multiplayer</div>
              <PrimaryButton size="lg" style={{ width: '100%' }}>▶  Play Now</PrimaryButton>
            </div>
          </Glass>

          {/* Mode selector grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
            <ModeTile icon="🤖" label="Training" sub="vs AI" tint="rgba(247,147,30,0.18)" border="rgba(247,147,30,0.35)" />
            <ModeTile icon="👥" label="Local" sub="2-player" tint="rgba(66,153,225,0.18)" border="rgba(66,153,225,0.35)" />
            <ModeTile icon="🎓" label="How to" sub="play" tint="rgba(160,174,192,0.10)" border="rgba(255,255,255,0.10)" />
            <ModeTile icon="🏆" label="Season" sub="Apr · Live" tint="rgba(124,77,255,0.18)" border="rgba(124,77,255,0.35)" />
          </div>

          {/* Recent games */}
          <SectionHeader title="Recent games" />
          <Glass padding={4} style={{ marginBottom: 16 }}>
            <RecentRow result="W" opponent="Solenne" mode="ranked" delta="+24" />
            <RecentRow result="L" opponent="HexBolt" mode="ranked" delta="−18" />
            <RecentRow result="W" opponent="AI · Hard" mode="training" delta="+12" />
            <RecentRow result="D" opponent="Ophira" mode="friendly" delta="" />
            <RecentRow result="W" opponent="vexnoir" mode="ranked" delta="+22" last />
          </Glass>

          {/* News */}
          <SectionHeader title="News" pill={<Pill variant="purple">NEW</Pill>} />
          <Glass padding={0} style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{
              height: 110, position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(124,77,255,0.35), rgba(0,212,170,0.25))',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#fff', opacity: 0.85 }}>SEASON 04 · UNDERWORLD</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>New skins, new ranks. Climb the depths.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: 10, justifyContent: 'center' }}>
              <div style={{ width: 18, height: 4, borderRadius: 2, background: T.accent }} />
              <div style={{ width: 6, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
              <div style={{ width: 6, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
            </div>
          </Glass>

        </div>
        <TabBar active="home" />
      </PageBg>
    </Phone>
  );
};

const ModeTile = ({ icon, label, sub, tint, border }) => (
  <div style={{
    padding: 14, borderRadius: 14,
    background: tint, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <div>
      <div style={{ fontWeight: 800, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{sub}</div>
    </div>
  </div>
);

const SectionHeader = ({ title, pill }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 4px 8px' }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>{title}</div>
    {pill}
  </div>
);

const RecentRow = ({ result, opponent, mode, delta, last }) => {
  const color = result === 'W' ? T.win : result === 'L' ? T.loss : T.draw;
  const bg    = result === 'W' ? 'rgba(0,212,170,0.15)' : result === 'L' ? 'rgba(255,107,107,0.15)' : 'rgba(160,174,192,0.12)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
      borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: bg, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12,
      }}>{result}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>vs {opponent}</div>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{mode}</div>
      </div>
      {delta && <div style={{ fontSize: 12, fontWeight: 800, color: delta.startsWith('+') ? T.accent : T.loss }}>{delta} XP</div>}
    </div>
  );
};

// =====================================================================
// MAIN MENU — Desktop
// =====================================================================
const MainMenuDesktop = () => (
  <DesktopFrame screenLabel="P1 Main Menu — Desktop">
    <PageBg style={{ padding: '24px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{
          margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: 2,
          background: `linear-gradient(135deg, #fff, ${T.accent})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>MEGA OX</h1>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 14, fontWeight: 700, color: T.textMuted }}>
          <span style={{ color: '#fff' }}>Home</span>
          <span>Play</span>
          <span>Leaderboard</span>
          <span>Achievements</span>
          <span>Season</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <CreditChip amount={1240} big />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Kestrel</div>
              <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 0.4 }}>STRATEGIST</div>
            </div>
            <div style={{ position: 'relative' }}>
              <Avatar size={40} initial="K" />
              <div style={{ position: 'absolute', bottom: -4, right: -4 }}><LevelBadge level={24} size="sm" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Body — 2 column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, maxWidth: 1100, margin: '0 auto' }}>

        {/* Left column */}
        <div>
          {/* Hero */}
          <Glass padding={0} style={{
            overflow: 'hidden', position: 'relative', marginBottom: 16,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.20), rgba(124,77,255,0.16))',
            border: `1px solid rgba(0,212,170,0.30)`,
            minHeight: 200,
          }}>
            <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${T.accent}, transparent 70%)`, opacity: 0.25 }} />
            <div style={{ position: 'relative', padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 1.4, marginBottom: 6 }}>RANKED MULTIPLAYER</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Find a match</div>
                <div style={{ color: T.textMuted, fontSize: 14, fontWeight: 600, marginBottom: 18, maxWidth: 320 }}>
                  Climb the ladder. Match-time ≈ 20s.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <PrimaryButton size="lg">▶  Play Now</PrimaryButton>
                  <SecondaryButton size="lg">Friendly match</SecondaryButton>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar size={66} initial="K" color={T.accent} ring={T.accent} />
                <div style={{ fontSize: 28, fontWeight: 900, color: T.textMuted }}>vs</div>
                <Avatar size={66} initial="?" color={T.loss} />
              </div>
            </div>
          </Glass>

          {/* Mode tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 18 }}>
            <BigModeTile icon="🤖" label="Training" sub="Easy · Medium · Hard" color="rgba(247,147,30,0.18)" border="rgba(247,147,30,0.30)" />
            <BigModeTile icon="👥" label="Local 2-Player" sub="Same device" color="rgba(66,153,225,0.18)" border="rgba(66,153,225,0.30)" />
            <BigModeTile icon="🎓" label="How to Play" sub="Tutorial" color="rgba(124,77,255,0.18)" border="rgba(124,77,255,0.30)" />
          </div>

          {/* News slideshow */}
          <SectionHeader title="News" pill={<Pill variant="purple">NEW</Pill>} />
          <Glass padding={0} style={{ overflow: 'hidden' }}>
            <div style={{
              height: 160, position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(124,77,255,0.4), rgba(0,212,170,0.25))',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 22 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, opacity: 0.85 }}>SEASON 04 · UNDERWORLD</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>New skins, new ranks. Climb the depths.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: 12, justifyContent: 'center' }}>
              <div style={{ width: 24, height: 4, borderRadius: 2, background: T.accent }} />
              <div style={{ width: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
              <div style={{ width: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
            </div>
          </Glass>
        </div>

        {/* Right column */}
        <div>
          {/* Player card */}
          <Glass padding={20} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <Avatar size={56} initial="K" color={T.accent} />
                <div style={{ position: 'absolute', bottom: -4, right: -4 }}><LevelBadge level={24} size="sm" /></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>Kestrel</div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 0.4 }}>STRATEGIST · #142 GLOBAL</div>
              </div>
            </div>
            <XPBar pct={0.62} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 6, letterSpacing: 0.4 }}>
              <span>LVL 24</span><span>620 / 1000 XP · 380 to LVL 25</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
              <Stat n="148" lbl="Wins" c={T.win} />
              <Stat n="62"  lbl="Losses" c={T.loss} />
              <Stat n="14"  lbl="Draws" c={T.draw} />
            </div>
          </Glass>

          {/* Recent games */}
          <SectionHeader title="Last 5 games" />
          <Glass padding={4}>
            <RecentRow result="W" opponent="Solenne" mode="ranked" delta="+24" />
            <RecentRow result="L" opponent="HexBolt" mode="ranked" delta="−18" />
            <RecentRow result="W" opponent="AI · Hard" mode="training" delta="+12" />
            <RecentRow result="D" opponent="Ophira" mode="friendly" delta="" />
            <RecentRow result="W" opponent="vexnoir" mode="ranked" delta="+22" last />
          </Glass>
        </div>

      </div>
    </PageBg>
  </DesktopFrame>
);

const BigModeTile = ({ icon, label, sub, color, border }) => (
  <div style={{ padding: 18, borderRadius: 14, background: color, border: `1px solid ${border}` }}>
    <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontWeight: 800, fontSize: 15 }}>{label}</div>
    <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginTop: 2 }}>{sub}</div>
  </div>
);

const Stat = ({ n, lbl, c }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{n}</div>
    <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase' }}>{lbl}</div>
  </div>
);

// =====================================================================
// LOGIN STREAK MODAL
// =====================================================================
const StreakModal = () => (
  <Phone screenLabel="P1 Login Streak Modal">
    <PageBg>
      {/* Dim main menu behind */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
        <div style={{ padding: '56px 20px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>MEGA OX</div>
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,13,31,0.75)', backdropFilter: 'blur(4px)' }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Glass padding={28} style={{ width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Radial glow */}
          <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 180, height: 180, background: 'radial-gradient(circle, rgba(249,168,37,0.4), transparent 70%)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ width: 80, height: 80, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={64} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.credits, letterSpacing: 1.5, marginBottom: 6 }}>DAILY LOGIN</div>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Day 3 Streak</div>
            <div style={{ color: T.textMuted, fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Keep the fire alive — log in tomorrow for more.</div>

            {/* 7-day strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 20 }}>
              {[1,2,3,4,5,6,7].map(d => {
                const done = d <= 3, today = d === 3;
                return (
                  <div key={d} style={{
                    padding: '8px 0', borderRadius: 10,
                    background: today ? `linear-gradient(135deg, ${T.credits}, #d97706)` : done ? 'rgba(249,168,37,0.18)' : 'rgba(255,255,255,0.04)',
                    border: today ? 'none' : `1px solid ${done ? 'rgba(249,168,37,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: today ? '#fff' : T.textMuted, opacity: today ? 0.85 : 1 }}>DAY {d}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: today ? '#fff' : done ? T.credits : T.textMuted, marginTop: 2 }}>
                      {done ? '✓' : d * 10}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reward chip */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <CreditChip amount={30} big />
            </div>

            <PrimaryButton size="lg" style={{ width: '100%' }}>Claim Reward</PrimaryButton>
          </div>
        </Glass>
      </div>
    </PageBg>
  </Phone>
);

// =====================================================================
// MULTIPLAYER MENU — Mobile
// =====================================================================
const MultiplayerMenuMobile = () => (
  <Phone screenLabel="P1 Multiplayer Menu — Mobile">
    <PageBg style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Multiplayer</h1>
        </div>

        {/* Quick match */}
        <Glass padding={0} style={{
          overflow: 'hidden', position: 'relative', marginBottom: 16,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.20), rgba(124,77,255,0.15))',
          border: `1px solid rgba(0,212,170,0.30)`,
        }}>
          <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${T.accent}, transparent 70%)`, opacity: 0.25 }} />
          <div style={{ padding: 18, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 1.2, marginBottom: 2 }}>QUICK MATCH</div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Find an opponent</div>
              </div>
              <Pill variant="teal">~20s</Pill>
            </div>
            <PrimaryButton size="lg" style={{ width: '100%' }}>▶  Find Match</PrimaryButton>
          </div>
        </Glass>

        <SectionHeader title="Friendly games" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FriendlyCard icon="🌐" tint="rgba(66,153,225,0.16)" border="rgba(66,153,225,0.30)" title="Host a game" sub="Get a 6-letter code to share" />
          <FriendlyCard icon="🔍" tint="rgba(124,77,255,0.18)" border="rgba(124,77,255,0.30)" title="Join with code" sub="Enter your friend's code" />
          <FriendlyCard icon="👥" tint="rgba(247,147,30,0.16)" border="rgba(247,147,30,0.30)" title="Local 2-player" sub="Pass and play on this device" />
        </div>

        <div style={{ marginTop: 22 }}>
          <SectionHeader title="Online now" />
          <Glass padding={14}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent, boxShadow: `0 0 12px ${T.accent}` }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>1,284 players</span>
              </div>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>ETA 18s</span>
            </div>
          </Glass>
        </div>
      </div>
      <TabBar active="play" />
    </PageBg>
  </Phone>
);

const FriendlyCard = ({ icon, tint, border, title, sub }) => (
  <div style={{
    padding: 16, borderRadius: 14, background: tint, border: `1px solid ${border}`,
    display: 'flex', alignItems: 'center', gap: 14,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
    }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 600 }}>{sub}</div>
    </div>
    <span style={{ color: T.textMuted, fontSize: 18 }}>›</span>
  </div>
);

// =====================================================================
// MATCHMAKING — Searching / Waiting for code
// =====================================================================
const MatchmakingSearching = () => (
  <Phone screenLabel="P1 Matchmaking — Searching">
    <PageBg style={{ paddingTop: 56 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Searching…</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 60, marginBottom: 40 }}>
          {/* Concentric pulse rings */}
          <div style={{ position: 'relative', width: 220, height: 220 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: `2px solid ${T.accent}`,
                opacity: 0.18 + i * 0.12,
                transform: `scale(${1 - i*0.18})`,
              }} />
            ))}
            <div style={{
              position: 'absolute', inset: '30%', borderRadius: '50%',
              background: `linear-gradient(135deg, ${T.accent}, ${T.accentDark})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 60px ${T.accent}`,
            }}>
              <SearchIcon size={32} />
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Finding opponent</div>
          <div style={{ color: T.textMuted, fontSize: 14, fontWeight: 600 }}>Searching for a ranked match in your tier</div>
        </div>

        {/* Match info card */}
        <Glass padding={16} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar size={42} initial="K" color={T.accent} ring={T.accent} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>Kestrel</div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700 }}>STRATEGIST · LVL 24</div>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: T.textMuted }}>VS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: T.textMuted }}>Searching</div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>· · ·</div>
              </div>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(255,107,107,0.12)',
                border: `2px dashed rgba(255,107,107,0.4)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: T.loss,
              }}>?</div>
            </div>
          </div>
        </Glass>

        <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 12, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4 }}>
          ELAPSED · 00:18
        </div>

        <SecondaryButton size="lg" style={{ width: '100%' }}>Cancel</SecondaryButton>
      </div>
    </PageBg>
  </Phone>
);

const MatchmakingHostCode = () => (
  <Phone screenLabel="P1 Matchmaking — Waiting (host code)">
    <PageBg style={{ paddingTop: 56 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Friendly game</h1>
        </div>

        <Glass padding={28} style={{ textAlign: 'center', marginTop: 40, marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>SHARE THIS CODE</div>
          <div style={{
            display: 'inline-flex', gap: 6, marginBottom: 14,
          }}>
            {'4XQ7M2'.split('').map((c, i) => (
              <div key={i} style={{
                width: 38, height: 50, borderRadius: 10,
                background: 'rgba(0,212,170,0.10)',
                border: `1px solid rgba(0,212,170,0.30)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, color: T.accent,
                fontFamily: 'ui-monospace, monospace',
              }}>{c}</div>
            ))}
          </div>
          <SecondaryButton size="sm" style={{ marginBottom: 18 }}>📋 Copy code</SecondaryButton>

          {/* Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: T.accent, animation: 'pulse 1.5s infinite' }} />
            <div style={{ fontSize: 14, fontWeight: 700 }}>Waiting for opponent</div>
          </div>
          <div style={{ color: T.textMuted, fontSize: 12, fontWeight: 600 }}>Game starts automatically when they join</div>
        </Glass>

        {/* Or share */}
        <Glass padding={14} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Or share via</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {['Link', 'iMessage', 'WhatsApp', 'More'].map(s => (
              <div key={s} style={{
                padding: '10px 4px', borderRadius: 10, textAlign: 'center',
                background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 700, color: T.textMuted,
              }}>{s}</div>
            ))}
          </div>
        </Glass>

        <SecondaryButton size="lg" style={{ width: '100%' }}>Cancel</SecondaryButton>
      </div>
      <style>{`@keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.3; } }`}</style>
    </PageBg>
  </Phone>
);

const MatchmakingJoin = () => (
  <Phone screenLabel="P1 Matchmaking — Join with code">
    <PageBg style={{ paddingTop: 56 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Join a game</h1>
        </div>

        <div style={{ marginTop: 30, textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>ENTER CODE</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Got a code from a friend?</div>
          <div style={{ color: T.textMuted, fontSize: 13, fontWeight: 600 }}>Enter the 6-letter code below to join</div>
        </div>

        {/* Code input */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {'4XQ7M'.split('').map((c, i) => (
            <div key={i} style={{
              width: 42, height: 56, borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(255,255,255,0.12)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: '#fff',
              fontFamily: 'ui-monospace, monospace',
            }}>{c}</div>
          ))}
          {/* Active cursor cell */}
          <div style={{
            width: 42, height: 56, borderRadius: 12,
            background: 'rgba(0,212,170,0.08)',
            border: `1.5px solid ${T.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: T.accent,
            boxShadow: '0 0 0 3px rgba(0,212,170,0.15)',
          }}>|</div>
        </div>

        <PrimaryButton size="lg" style={{ width: '100%', marginBottom: 12 }}>Join Game</PrimaryButton>
        <SecondaryButton size="lg" style={{ width: '100%' }}>Paste from clipboard</SecondaryButton>
      </div>
    </PageBg>
  </Phone>
);

// =====================================================================
// PROFILE — Mobile (own)
// =====================================================================
const ProfileMobile = () => (
  <Phone screenLabel="P1 Profile — Mobile (own)">
    <PageBg style={{ paddingTop: 44, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, flex: 1 }}>Profile</h1>
        <SecondaryButton size="sm">Customise</SecondaryButton>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Banner / avatar */}
        <Glass padding={0} style={{ overflow: 'hidden', marginBottom: 14, position: 'relative' }}>
          {/* Banner image slot */}
          <div style={{
            height: 110, position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(124,77,255,0.45), rgba(0,212,170,0.25))',
          }}>
            <Note style={{ position: 'absolute', top: 8, right: 10 }}>banner img slot</Note>
          </div>
          <div style={{ padding: '0 18px 18px', marginTop: -36, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ padding: 4, borderRadius: '50%', background: T.bgBase }}>
                  <Avatar size={80} initial="K" color={T.accent} ring="rgba(255,255,255,0.20)" />
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                  <LevelBadge level={24} size="md" />
                </div>
              </div>
              <div style={{ flex: 1, paddingBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 900, fontSize: 19 }}>Kestrel</div>
                  <Pill variant="purple" icon={<SparkleIcon size={10} />} style={{ fontSize: 9 }}>VERIFIED</Pill>
                </div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, letterSpacing: 0.4, marginTop: 4 }}>
                  STRATEGIST · #142 GLOBAL
                </div>
              </div>
            </div>
          </div>
        </Glass>

        {/* XP card */}
        <Glass padding={16} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Level progress</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>380 XP to LVL 25</div>
          </div>
          <XPBar pct={0.62} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 4 }}>
            <span>LVL 24</span><span>620 / 1000 XP</span>
          </div>
        </Glass>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 }}>
          <BigStat n="148" lbl="Wins" c={T.win} />
          <BigStat n="62"  lbl="Losses" c={T.loss} />
          <BigStat n="14"  lbl="Draws" c={T.draw} />
        </div>

        {/* Win rate ring + streak */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <Glass padding={14}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>Win rate</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: T.accent }}>66%</div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 2 }}>last 30 games</div>
          </Glass>
          <Glass padding={14}>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>Best streak</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={20} />
              <div style={{ fontSize: 26, fontWeight: 900, color: T.credits }}>8</div>
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 2 }}>consecutive wins</div>
          </Glass>
        </div>

        {/* Achievements row */}
        <Glass padding={14} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Achievements</div>
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 700 }}>12 / 48 ›</div>
          </div>
          <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
            {[{i:'🏆',c:T.credits},{i:'🔥',c:T.loss},{i:'⚡',c:T.accent},{i:'🎯',c:T.xp},{i:'🛡️',c:T.textMuted,locked:true}].map((b,i)=>(
              <div key={i} style={{
                width: 48, height: 48, borderRadius: 12,
                background: b.locked ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${b.c}33, ${b.c}11)`,
                border: `1px solid ${b.locked ? 'rgba(255,255,255,0.06)' : b.c+'55'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                opacity: b.locked ? 0.4 : 1,
              }}>{b.locked ? '🔒' : b.i}</div>
            ))}
          </div>
        </Glass>

        {/* Recent games */}
        <SectionHeader title="Recent games" />
        <Glass padding={4}>
          <RecentRow result="W" opponent="Solenne" mode="ranked" delta="+24" />
          <RecentRow result="L" opponent="HexBolt" mode="ranked" delta="−18" />
          <RecentRow result="W" opponent="Ophira" mode="friendly" delta="" last />
        </Glass>
      </div>
      <TabBar active="profile" />
    </PageBg>
  </Phone>
);

const BigStat = ({ n, lbl, c }) => (
  <Glass padding={14} style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 26, fontWeight: 900, color: c }}>{n}</div>
    <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>{lbl}</div>
  </Glass>
);

// =====================================================================
// PROFILE — Desktop
// =====================================================================
const ProfileDesktop = () => (
  <DesktopFrame screenLabel="P1 Profile — Desktop">
    <PageBg style={{ padding: '24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
        <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Profile</h1>
        <div style={{ flex: 1 }} />
        <SecondaryButton>Share</SecondaryButton>
        <PrimaryButton size="md">Customise</PrimaryButton>
      </div>

      {/* Banner card */}
      <Glass padding={0} style={{ overflow: 'hidden', marginBottom: 20, position: 'relative' }}>
        <div style={{
          height: 160, position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(124,77,255,0.45), rgba(0,212,170,0.25))',
        }}>
          <Note style={{ position: 'absolute', top: 12, right: 14 }}>banner img slot — 920×160</Note>
        </div>
        <div style={{ padding: '0 28px 22px', marginTop: -52, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 22 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ padding: 5, borderRadius: '50%', background: T.bgBase }}>
              <Avatar size={110} initial="K" color={T.accent} ring="rgba(255,255,255,0.20)" />
            </div>
            <div style={{ position: 'absolute', bottom: 4, right: 4 }}><LevelBadge level={24} size="lg" /></div>
          </div>
          <div style={{ flex: 1, paddingBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>Kestrel</div>
              <Pill variant="purple" icon={<SparkleIcon size={11} />}>VERIFIED</Pill>
              <Pill variant="gold" icon={<TrophyIcon size={11} />}>SEASON 03 FINALIST</Pill>
            </div>
            <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, letterSpacing: 0.4 }}>STRATEGIST · #142 GLOBAL</div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingBottom: 14 }}>
            <Pill variant="muted">JOINED MAR 2025</Pill>
            <Pill variant="muted">224 GAMES</Pill>
          </div>
        </div>
      </Glass>

      {/* Two column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18 }}>

        <div>
          <Glass padding={20} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Level progress</div>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>380 XP to LVL 25</div>
            </div>
            <XPBar pct={0.62} height={10} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.textMuted, fontWeight: 700, marginTop: 6 }}>
              <span>LVL 24</span><span>620 / 1000 XP</span>
            </div>
          </Glass>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            <BigStat n="148" lbl="Wins" c={T.win} />
            <BigStat n="62"  lbl="Losses" c={T.loss} />
            <BigStat n="14"  lbl="Draws" c={T.draw} />
          </div>

          <Glass padding={18}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>Performance</div>
            <PerformanceRow label="Win rate" v="66%" c={T.win} />
            <PerformanceRow label="Best streak" v={<span><Flame size={14} /> 8</span>} c={T.credits} />
            <PerformanceRow label="Avg. match" v="3m 12s" c={T.textMuted} />
            <PerformanceRow label="Favourite mode" v="Ranked" c={T.accent} last />
          </Glass>
        </div>

        <div>
          <SectionHeader title="Achievements" pill={<Pill variant="muted">12 / 48</Pill>} />
          <Glass padding={16} style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 8 }}>
              {Array.from({length: 16}).map((_,i)=>{
                const unlocked = i < 12;
                const icons = ['🏆','🔥','⚡','🎯','🛡️','💎','🚀','⭐','🎖️','🥇','👑','🪐'];
                return (
                  <div key={i} style={{
                    aspectRatio: '1/1', borderRadius: 12,
                    background: unlocked ? `linear-gradient(135deg, rgba(0,212,170,0.18), rgba(124,77,255,0.10))` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${unlocked ? 'rgba(0,212,170,0.30)' : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    opacity: unlocked ? 1 : 0.35,
                  }}>{unlocked ? icons[i % icons.length] : '🔒'}</div>
                );
              })}
            </div>
          </Glass>

          <SectionHeader title="Recent games" />
          <Glass padding={4}>
            <RecentRow result="W" opponent="Solenne"  mode="ranked"   delta="+24" />
            <RecentRow result="L" opponent="HexBolt"  mode="ranked"   delta="−18" />
            <RecentRow result="W" opponent="AI · Hard"  mode="training" delta="+12" />
            <RecentRow result="D" opponent="Ophira"   mode="friendly" delta="" />
            <RecentRow result="W" opponent="vexnoir" mode="ranked"   delta="+22" last />
          </Glass>
        </div>
      </div>
    </PageBg>
  </DesktopFrame>
);

const PerformanceRow = ({ label, v, c, last }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)',
    fontSize: 13,
  }}>
    <span style={{ color: T.textMuted, fontWeight: 700 }}>{label}</span>
    <span style={{ color: c, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{v}</span>
  </div>
);

Object.assign(window, {
  MainMenuMobile, MainMenuDesktop, StreakModal,
  MultiplayerMenuMobile, MatchmakingSearching, MatchmakingHostCode, MatchmakingJoin,
  ProfileMobile, ProfileDesktop,
});
