// Game screen chrome + priority 2 screens

// =====================================================================
// GAME SCREEN CHROME — Mobile (online)
// =====================================================================
const GameScreenMobile = () => (
  <Phone screenLabel="Game Screen — Mobile (online)">
    <PageBg style={{ paddingTop: 44 }}>
      {/* Header strip */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
        <Pill variant="red">RANKED</Pill>
        <div style={{ flex: 1 }} />
        <SecondaryButton size="sm" style={{ padding: '8px 10px', fontSize: 16 }}>⋯</SecondaryButton>
      </div>

      {/* VS player strip */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* P1 (You) — active */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(0,212,170,0.20), rgba(0,212,170,0.05))',
          border: `1px solid ${T.accent}`, boxShadow: `0 0 20px rgba(0,212,170,0.3)`,
        }}>
          <Avatar size={36} initial="K" color={T.accent} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              Kestrel
              <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 700 }}>(You)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: T.accent, letterSpacing: 0.3 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: T.accent }} />
              YOUR TURN
            </div>
          </div>
        </div>

        {/* Score chip */}
        <div style={{
          padding: '4px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.06)',
          fontSize: 13, fontWeight: 900, fontFamily: 'ui-monospace, monospace',
        }}>
          <span style={{ color: T.accent }}>2</span>
          <span style={{ color: T.textDim, margin: '0 3px' }}>:</span>
          <span style={{ color: T.loss }}>1</span>
        </div>

        {/* P2 (Opponent) */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <Avatar size={36} initial="S" color={T.loss} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Solenne</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.3 }}>LVL 22 · TACTICIAN</div>
          </div>
        </div>
      </div>

      {/* Turn pill */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 10px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 100,
          background: 'rgba(0,212,170,0.15)', border: `1px solid rgba(0,212,170,0.35)`,
          color: T.accent, fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
          PLAY IN CENTER BOARD · 00:18
        </div>
      </div>

      {/* Board canvas — full viewport width */}
      <div style={{ padding: '0 14px', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <BoardCanvasPlaceholder size={362} label="GAME BOARD — skin-driven" />
      </div>

      {/* Emoji panel */}
      <div style={{ padding: '0 16px', display: 'flex', justifyContent: 'center', gap: 6 }}>
        {['👋','😂','🤯','🔥','💀','🤝'].map((e,i) => (
          <div key={i} style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>{e}</div>
        ))}
      </div>

      {/* Emoji bubble — illustrative */}
      <div style={{
        position: 'absolute', top: 130, right: 26,
        padding: '6px 12px', borderRadius: 16, borderBottomRightRadius: 4,
        background: 'rgba(255,107,107,0.18)', border: '1px solid rgba(255,107,107,0.35)',
        fontSize: 22,
      }}>😂</div>
    </PageBg>
  </Phone>
);

// =====================================================================
// GAME SCREEN CHROME — Desktop (annotated spec)
// =====================================================================
const GameScreenDesktop = () => (
  <DesktopFrame screenLabel="Game Screen — Desktop (annotated)">
    <PageBg style={{ padding: '20px 40px' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <SecondaryButton size="sm"><ChevronLeft size={14} />  Exit match</SecondaryButton>
        <Pill variant="red">RANKED</Pill>
        <Pill variant="muted">SEASON 04</Pill>
        <div style={{ flex: 1 }} />
        <SecondaryButton size="sm">Rules</SecondaryButton>
        <SecondaryButton size="sm">Settings</SecondaryButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 580px 1fr', gap: 22, alignItems: 'flex-start' }}>

        {/* Left — P1 panel */}
        <PlayerPanel side="left" name="Kestrel" tier="STRATEGIST" lvl={24} you score={2} active color={T.accent} />

        {/* Center — board */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '8px 18px', borderRadius: 100,
              background: 'rgba(0,212,170,0.15)', border: `1px solid rgba(0,212,170,0.35)`,
              color: T.accent, fontSize: 13, fontWeight: 800, letterSpacing: 0.4,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent, boxShadow: `0 0 10px ${T.accent}` }} />
              YOUR TURN · CENTER BOARD · 00:18
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <BoardCanvasPlaceholder size={520} label="GAME BOARD — skin-driven" />
          </div>
          <Note style={{ textAlign: 'center', marginTop: 10 }}>
            min(100vw, 520) × min(100vw, 520) — image slots: background, grid, P1 marker, P2 marker, won-board overlay
          </Note>
        </div>

        {/* Right — P2 panel */}
        <PlayerPanel side="right" name="Solenne" tier="TACTICIAN" lvl={22} score={1} color={T.loss} />
      </div>
    </PageBg>
  </DesktopFrame>
);

const PlayerPanel = ({ name, tier, lvl, you, score, active, color, side }) => (
  <Glass padding={18} style={{
    border: active ? `1px solid ${color}` : T.glassBorder,
    boxShadow: active ? `0 0 30px ${color}33` : 'none',
  }}>
    <div style={{ textAlign: side === 'right' ? 'right' : 'left' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <Avatar size={68} initial={name[0]} color={color} ring={active ? color : undefined} />
        <div style={{ position: 'absolute', bottom: -4, right: -4 }}><LevelBadge level={lvl} size="sm" /></div>
      </div>
      <div style={{ marginTop: 10, fontWeight: 900, fontSize: 18, display: 'flex', alignItems: 'center', gap: 6, justifyContent: side === 'right' ? 'flex-end' : 'flex-start' }}>
        {name}
        {you && <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>(You)</span>}
      </div>
      <div style={{ fontSize: 11, color, fontWeight: 700, letterSpacing: 0.4, marginTop: 2 }}>{tier} · LVL {lvl}</div>
    </div>

    {/* Score */}
    <div style={{ marginTop: 16, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>MICRO BOARDS WON</div>
      <div style={{ fontSize: 36, fontWeight: 900, color, fontFamily: 'Nunito, sans-serif' }}>{score}</div>
    </div>

    {/* Emoji rail */}
    {you && (
      <>
        <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Quick chat</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {['👋','😂','🤯','🔥','💀','🤝'].map((e,i) => (
            <div key={i} style={{
              padding: '10px 0', borderRadius: 10, textAlign: 'center',
              background: 'rgba(255,255,255,0.04)', fontSize: 18,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>{e}</div>
          ))}
        </div>
      </>
    )}
  </Glass>
);

// =====================================================================
// POST-GAME MODAL
// =====================================================================
const PostGameModalScreen = () => (
  <Phone screenLabel="Post-Game Modal (level up)">
    <PageBg>
      {/* Dim board behind */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
        <div style={{ paddingTop: 200, display: 'flex', justifyContent: 'center' }}>
          <BoardCanvasPlaceholder size={300} />
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(6px)' }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Glass padding={0} style={{ width: '100%', overflow: 'hidden' }}>
          {/* Banner with confetti accent */}
          <div style={{
            padding: '28px 22px 22px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(0,212,170,0.25), rgba(124,77,255,0.20))',
          }}>
            <div style={{ position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: `radial-gradient(circle, rgba(0,212,170,0.45), transparent 70%)` }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1.5, marginBottom: 6 }}>VICTORY</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 4 }}>You Win!</div>
              <div style={{ color: T.textMuted, fontSize: 13, fontWeight: 600 }}>vs Solenne · Ranked match</div>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            {/* Level up callout */}
            <div style={{
              padding: 14, borderRadius: 14, marginBottom: 14,
              background: 'linear-gradient(135deg, rgba(124,77,255,0.18), rgba(124,77,255,0.05))',
              border: '1px solid rgba(124,77,255,0.35)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <LevelBadge level={25} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#b39dff', letterSpacing: 1, marginBottom: 2 }}>LEVEL UP</div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>LVL 24  →  25</div>
              </div>
              <SparkleIcon size={20} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <XPBar pct={0.18} height={10} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, fontWeight: 700, marginTop: 6 }}>
                <span>LVL 25</span><span>180 / 1100 XP</span>
              </div>
            </div>

            {/* Reward chips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{
                padding: 14, borderRadius: 12, textAlign: 'center',
                background: 'rgba(124,77,255,0.15)', border: '1px solid rgba(124,77,255,0.30)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#b39dff' }}>+184</div>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>XP gained</div>
              </div>
              <div style={{
                padding: 14, borderRadius: 12, textAlign: 'center',
                background: 'rgba(249,168,37,0.12)', border: '1px solid rgba(249,168,37,0.30)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: T.credits, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Coin size={20} /> +60
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 2 }}>Credits</div>
              </div>
            </div>

            {/* Achievement unlocked */}
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>ACHIEVEMENT UNLOCKED</div>
            <div style={{
              padding: 12, borderRadius: 12, marginBottom: 16,
              background: 'rgba(0,212,170,0.10)', border: '1px solid rgba(0,212,170,0.30)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${T.accent}33, ${T.xp}22)`,
                border: `1px solid ${T.accent}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>🏆</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13 }}>Hot Streak</div>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Win 5 ranked games in a row</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.accent }}>+50 XP</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <SecondaryButton size="lg" style={{ flex: 1 }}>Rematch</SecondaryButton>
              <PrimaryButton size="lg" style={{ flex: 1 }}>Continue</PrimaryButton>
            </div>
          </div>
        </Glass>
      </div>
    </PageBg>
  </Phone>
);

// =====================================================================
// LEADERBOARD — Mobile
// =====================================================================
const LeaderboardMobile = () => (
  <Phone screenLabel="Leaderboard — Mobile">
    <PageBg style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, flex: 1 }}>Leaderboard</h1>
          <Pill variant="purple">SEASON 04</Pill>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: 4,
          background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 18,
        }}>
          {['Global', 'Friends', 'Season'].map((t, i) => (
            <div key={t} style={{
              padding: '8px 0', textAlign: 'center', borderRadius: 9,
              background: i === 0 ? 'rgba(0,212,170,0.18)' : 'transparent',
              color: i === 0 ? T.accent : T.textMuted,
              fontSize: 12, fontWeight: 800,
            }}>{t}</div>
          ))}
        </div>

        {/* Podium top 3 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
          {[
            { rank: 2, name: 'HexBolt', score: '2,418', height: 60, color: '#c0c0c0' },
            { rank: 1, name: 'vexnoir', score: '2,612', height: 80, color: T.credits },
            { rank: 3, name: 'Solenne', score: '2,344', height: 48, color: '#cd7f32' },
          ].map(p => (
            <div key={p.rank} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
                <Avatar size={p.rank === 1 ? 56 : 44} initial={p.name[0]} color={p.color} ring={p.color} />
                <div style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: p.color, color: '#000', fontWeight: 900, fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${T.bgBase}`,
                }}>{p.rank}</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: p.color, fontWeight: 800 }}>{p.score}</div>
              <div style={{
                marginTop: 6, height: p.height, borderRadius: '8px 8px 0 0',
                background: `linear-gradient(180deg, ${p.color}55, ${p.color}11)`,
                border: `1px solid ${p.color}33`,
                borderBottom: 'none',
              }} />
            </div>
          ))}
        </div>

        <Glass padding={4}>
          {[
            { r: 4,   n: 'Ophira',   t: 'GM',  s: '2,201', c: T.credits },
            { r: 5,   n: 'Klyne',    t: 'M',   s: '2,180', c: '#c0c0c0' },
            { r: 6,   n: 'aurok',    t: 'M',   s: '2,142', c: '#c0c0c0' },
            { r: 142, n: 'Kestrel',  t: 'S',   s: '1,484', c: T.accent, me: true },
            { r: 143, n: 'narrate',  t: 'S',   s: '1,481', c: T.accent },
          ].map(p => (
            <div key={p.r} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 10,
              background: p.me ? 'rgba(0,212,170,0.10)' : 'transparent',
              border: p.me ? `1px solid rgba(0,212,170,0.25)` : '1px solid transparent',
              marginBottom: 2,
            }}>
              <div style={{ width: 30, fontSize: 13, fontWeight: 900, color: T.textMuted, fontFamily: 'ui-monospace, monospace' }}>#{p.r}</div>
              <Avatar size={32} initial={p.n[0]} color={p.c} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.n}{p.me && <span style={{ marginLeft: 6, fontSize: 10, color: T.accent, fontWeight: 800 }}>(YOU)</span>}</div>
                <div style={{ fontSize: 10, color: p.c, fontWeight: 700, letterSpacing: 0.3 }}>{p.t === 'GM' ? 'GRAND MASTER' : p.t === 'M' ? 'MASTER' : 'STRATEGIST'}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{p.s}</div>
            </div>
          ))}
        </Glass>
      </div>
      <TabBar active="home" />
    </PageBg>
  </Phone>
);

// =====================================================================
// ACHIEVEMENTS — Mobile
// =====================================================================
const AchievementsMobile = () => (
  <Phone screenLabel="Achievements — Mobile">
    <PageBg style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, flex: 1 }}>Achievements</h1>
          <Pill variant="teal">12 / 48</Pill>
        </div>

        {/* Progress card */}
        <Glass padding={16} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Total progress</div>
            <div style={{ fontSize: 11, color: T.accent, fontWeight: 800 }}>25%</div>
          </div>
          <XPBar pct={0.25} />
        </Glass>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflow: 'auto' }}>
          {['All', 'Wins', 'Streaks', 'Skill', 'Social'].map((t, i) => (
            <Pill key={t} variant={i === 0 ? 'teal' : 'muted'}>{t}</Pill>
          ))}
        </div>

        {/* Achievement list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AchievementRow
            icon="🏆" name="First Victory" desc="Win your first game" unlocked progress={1} total={1} reward="+50 XP"
          />
          <AchievementRow
            icon="🔥" name="Hot Streak" desc="Win 5 ranked games in a row" unlocked progress={5} total={5} reward="+50 XP · 100"
          />
          <AchievementRow
            icon="⚡" name="Quick Thinker" desc="Win in under 90 seconds" unlocked progress={3} total={1} reward="+30 XP"
          />
          <AchievementRow
            icon="🎯" name="Sharpshooter" desc="Win 50 micro boards" progress={42} total={50} reward="+100 XP"
          />
          <AchievementRow
            icon="🛡️" name="Comeback Kid" desc="Win after losing 2 micro boards first" progress={3} total={5} reward="+75 XP"
          />
          <AchievementRow
            icon="👑" name="Grand Master" desc="Reach the Grand Master tier" locked reward="LEGENDARY SKIN"
          />
        </div>
      </div>
      <TabBar active="home" />
    </PageBg>
  </Phone>
);

const AchievementRow = ({ icon, name, desc, unlocked, locked, progress = 0, total = 1, reward }) => {
  const pct = Math.min(progress / total, 1);
  return (
    <Glass padding={14}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: unlocked
            ? `linear-gradient(135deg, ${T.accent}33, ${T.xp}22)`
            : locked ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${unlocked ? T.accent + '55' : 'rgba(255,255,255,0.08)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          opacity: locked ? 0.4 : 1,
        }}>{locked ? '🔒' : icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ fontWeight: 800, fontSize: 13, opacity: locked ? 0.6 : 1 }}>{name}</div>
            {unlocked && <Pill variant="teal" style={{ fontSize: 9, padding: '3px 8px' }}>UNLOCKED</Pill>}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginBottom: 6, opacity: locked ? 0.6 : 1 }}>{desc}</div>
          {!locked && !unlocked && (
            <>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ width: `${pct*100}%`, height: '100%', background: `linear-gradient(90deg, ${T.accent}, ${T.xp})`, borderRadius: 100 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700 }}>{progress} / {total}</div>
                <div style={{ fontSize: 10, color: T.credits, fontWeight: 800 }}>{reward}</div>
              </div>
            </>
          )}
          {unlocked && <div style={{ fontSize: 10, color: T.accent, fontWeight: 800 }}>Reward claimed: {reward}</div>}
          {locked && <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 800 }}>Reward: {reward}</div>}
        </div>
      </div>
    </Glass>
  );
};

// =====================================================================
// GUEST LANDING
// =====================================================================
const GuestLanding = () => (
  <Phone screenLabel="Guest Landing — Mobile">
    <PageBg style={{ paddingTop: 60 }}>
      <div style={{ padding: '40px 24px 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Logo / hero */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{
            margin: 0, fontSize: 44, fontWeight: 900, letterSpacing: 4, lineHeight: 1,
            background: `linear-gradient(135deg, #fff 30%, ${T.accent} 70%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>MEGA<br />OX</h1>
          <div style={{ color: T.textMuted, fontSize: 14, fontWeight: 600, marginTop: 12, letterSpacing: 0.3 }}>
            Ultimate Noughts &amp; Crosses.<br />Every move matters.
          </div>
        </div>

        {/* Visual board preview placeholder */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <div style={{
            position: 'relative', width: 240, height: 240,
            borderRadius: 22, padding: 8,
            background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(124,77,255,0.14))',
            border: '1px solid rgba(0,212,170,0.30)',
          }}>
            <BoardCanvasPlaceholder size={224} label="" />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 22, boxShadow: 'inset 0 0 40px rgba(0,212,170,0.25)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Primary CTA */}
        <PrimaryButton size="lg" style={{ marginBottom: 14 }}>▶  Play Demo</PrimaryButton>

        {/* Unlock list */}
        <Glass padding={16} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: T.accent, fontWeight: 800, letterSpacing: 1.2, marginBottom: 10 }}>CREATE AN ACCOUNT TO UNLOCK</div>
          {[
            { icon: '🏆', label: 'Ranked multiplayer & leaderboards' },
            { icon: '⭐', label: 'XP, levels & achievements' },
            { icon: '🎨', label: 'Skins, avatars & banners' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: 'rgba(0,212,170,0.12)',
                border: `1px solid rgba(0,212,170,0.30)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{f.label}</div>
            </div>
          ))}
        </Glass>

        {/* Auth */}
        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryButton size="lg" style={{ flex: 1 }}>Log In</SecondaryButton>
          <button style={{
            flex: 1,
            background: 'transparent', border: `1.5px solid ${T.accent}`,
            color: T.accent, borderRadius: T.rBtn, padding: '14px 18px',
            fontFamily: 'inherit', fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}>Sign Up</button>
        </div>
      </div>
    </PageBg>
  </Phone>
);

// =====================================================================
// CUSTOMISE
// =====================================================================
const CustomiseMobile = () => (
  <Phone screenLabel="Customise — Mobile">
    <PageBg style={{ paddingTop: 56, paddingBottom: 80 }}>
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, flex: 1 }}>Customise</h1>
          <CreditChip amount={1240} />
        </div>

        {/* Preview */}
        <Glass padding={0} style={{ overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: 96, background: 'linear-gradient(135deg, rgba(124,77,255,0.45), rgba(0,212,170,0.25))' }} />
          <div style={{ padding: '0 18px 18px', marginTop: -36, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
            <div style={{ padding: 3, borderRadius: '50%', background: T.bgBase }}>
              <Avatar size={68} initial="K" color={T.accent} />
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontWeight: 900, fontSize: 17, display: 'flex', alignItems: 'center', gap: 6 }}>
                Kestrel <Pill variant="purple" style={{ fontSize: 9, padding: '2px 8px' }}>VERIFIED</Pill>
              </div>
              <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, letterSpacing: 0.4 }}>STRATEGIST · LVL 24</div>
            </div>
          </div>
        </Glass>

        {/* Category tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4, padding: 4,
          background: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 16,
        }}>
          {['Avatar', 'Banner', 'Badge', 'Skin'].map((t, i) => (
            <div key={t} style={{
              padding: '8px 0', textAlign: 'center', borderRadius: 9,
              background: i === 0 ? 'rgba(0,212,170,0.18)' : 'transparent',
              color: i === 0 ? T.accent : T.textMuted,
              fontSize: 11, fontWeight: 800,
            }}>{t}</div>
          ))}
        </div>

        {/* Item grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { initial: 'K', color: T.accent, equipped: true, name: 'Mint' },
            { initial: 'A', color: T.xp, name: 'Royal' },
            { initial: 'B', color: T.loss, name: 'Crimson' },
            { initial: 'C', color: T.credits, name: 'Gold', locked: true, cost: 200 },
            { initial: 'D', color: '#4299e1', name: 'Tidal' },
            { initial: 'E', color: '#f7931e', name: 'Ember', locked: true, cost: 500 },
          ].map((it, i) => (
            <div key={i} style={{
              padding: 10, borderRadius: 14, textAlign: 'center',
              background: it.equipped ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
              border: it.equipped ? `1.5px solid ${T.accent}` : '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}>
              {it.equipped && (
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  fontSize: 9, fontWeight: 800, color: T.accent,
                  background: 'rgba(0,212,170,0.20)', border: `1px solid ${T.accent}55`,
                  padding: '2px 6px', borderRadius: 100, letterSpacing: 0.4,
                }}>EQUIPPED</div>
              )}
              <div style={{ opacity: it.locked ? 0.4 : 1, marginBottom: 6 }}>
                <Avatar size={52} initial={it.initial} color={it.color} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 800 }}>{it.name}</div>
              {it.locked && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                  <Coin size={11} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: T.credits }}>{it.cost}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <TabBar active="profile" />
    </PageBg>
  </Phone>
);

// =====================================================================
// LOGIN
// =====================================================================
const LoginMobile = () => (
  <Phone screenLabel="Login — Mobile">
    <PageBg style={{ paddingTop: 56 }}>
      <div style={{ padding: '24px 24px 0', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <SecondaryButton size="sm" style={{ padding: '8px 10px' }}><ChevronLeft size={16} /></SecondaryButton>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: 3,
            background: `linear-gradient(135deg, #fff, ${T.accent})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>MEGA OX</h1>
          <div style={{ color: T.textMuted, fontSize: 14, fontWeight: 600, marginTop: 8 }}>Welcome back</div>
        </div>

        <Glass padding={20} style={{ marginBottom: 16 }}>
          <Label>Email</Label>
          <Field placeholder="you@megaox.app" value="kestrel@megaox.app" />

          <Label>Password</Label>
          <Field placeholder="••••••••" type="password" focused />

          <div style={{ textAlign: 'right', marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>Forgot password?</span>
          </div>

          <PrimaryButton size="lg" style={{ width: '100%' }}>Log In</PrimaryButton>
        </Glass>

        <div style={{ textAlign: 'center', color: T.textMuted, fontSize: 13, fontWeight: 600 }}>
          New here? <span style={{ color: T.accent, fontWeight: 800 }}>Sign up</span>
        </div>
      </div>
    </PageBg>
  </Phone>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>{children}</div>
);

const Field = ({ placeholder, value, type, focused }) => (
  <div style={{
    padding: '12px 14px', borderRadius: 12, marginBottom: 14,
    background: focused ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${focused ? T.accent : 'rgba(255,255,255,0.12)'}`,
    boxShadow: focused ? '0 0 0 3px rgba(0,212,170,0.15)' : 'none',
    fontSize: 14, fontWeight: 600, color: value ? '#fff' : T.textMuted,
    fontFamily: 'inherit',
  }}>
    {value ? (type === 'password' ? '••••••••••' : value) : placeholder}
  </div>
);

// =====================================================================
// DEMO GAME — shows game chrome without auth chrome
// =====================================================================
const DemoGameMobile = () => (
  <Phone screenLabel="Demo Game — Mobile (no auth)">
    <PageBg style={{ paddingTop: 44 }}>
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <SecondaryButton size="sm" style={{ padding: '8px 12px' }}>← Exit demo</SecondaryButton>
        <div style={{ flex: 1 }} />
        <Pill variant="purple">DEMO MODE</Pill>
      </div>

      <div style={{ padding: '16px 16px 0', textAlign: 'center' }}>
        <div style={{
          fontSize: 22, fontWeight: 900, marginBottom: 4,
          background: `linear-gradient(135deg, #fff, ${T.accent})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 1.5,
        }}>MEGA OX</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>Get a feel for the game — no account needed</div>
      </div>

      {/* Turn pill */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 16px 10px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 100,
          background: 'rgba(0,212,170,0.15)', border: `1px solid rgba(0,212,170,0.35)`,
          color: T.accent, fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.accent }} />
          YOUR TURN · ANY BOARD
        </div>
      </div>

      <div style={{ padding: '0 14px', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <BoardCanvasPlaceholder size={362} label="DEMO BOARD" />
      </div>

      {/* Sign-up nudge */}
      <div style={{ padding: '0 16px' }}>
        <Glass padding={14} style={{
          background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(124,77,255,0.10))',
          border: `1px solid rgba(0,212,170,0.30)`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 22 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Enjoying the game?</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Sign up to save progress and rank up</div>
          </div>
          <PrimaryButton size="sm">Sign Up</PrimaryButton>
        </Glass>
      </div>
    </PageBg>
  </Phone>
);

Object.assign(window, {
  GameScreenMobile, GameScreenDesktop, PostGameModalScreen,
  LeaderboardMobile, AchievementsMobile, GuestLanding, CustomiseMobile, LoginMobile, DemoGameMobile,
});
