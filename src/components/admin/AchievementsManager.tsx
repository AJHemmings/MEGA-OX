import React, { useState, useEffect } from 'react';
import {
  useAdminAchievements,
  AdminAchievement,
  AchievementFormData,
  CONDITION_TYPES,
} from '../../hooks/useAdminAchievements';
import { tokens } from '../../styles/tokens';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  achievement: AdminAchievement | null;
  onSave: (form: AchievementFormData) => Promise<string | null>;
  onClose: () => void;
}

const emptyForm = (): AchievementFormData => ({
  key: '', name: '', description: '',
  condition_key: CONDITION_TYPES[0],
  threshold: 1, reward_xp: 0, reward_credits: 0,
});

const AchievementModal: React.FC<ModalProps> = ({ achievement, onSave, onClose }) => {
  const [form, setForm]               = useState<AchievementFormData>(emptyForm());
  const [thresholdStr, setThresholdStr] = useState('1');
  const [xpStr, setXpStr]             = useState('0');
  const [credStr, setCredStr]         = useState('0');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    if (achievement) {
      setForm({
        key:            achievement.key,
        name:           achievement.name,
        description:    achievement.description,
        condition_key:  achievement.condition_key,
        threshold:      achievement.threshold,
        reward_xp:      achievement.reward_xp,
        reward_credits: achievement.reward_credits,
      });
      setThresholdStr(String(achievement.threshold));
      setXpStr(String(achievement.reward_xp));
      setCredStr(String(achievement.reward_credits));
    } else {
      setForm(emptyForm());
      setThresholdStr('1');
      setXpStr('0');
      setCredStr('0');
    }
    setError(null);
  }, [achievement]);

  const handleSave = async () => {
    if (!form.key.trim())         { setError('Key is required.'); return; }
    if (!form.name.trim())        { setError('Name is required.'); return; }
    if (!form.description.trim()) { setError('Description is required.'); return; }
    setSaving(true);
    const err = await onSave(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '8px 10px', fontSize: 13, color: tokens.text,
    fontFamily: tokens.font, outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle, colorScheme: 'dark', background: tokens.bgCard,
  };

  const numInput = (
    val: string,
    setStr: (s: string) => void,
    setField: (n: number) => void,
    colour?: string,
  ) => (
    <input
      type="text" inputMode="numeric"
      value={val} placeholder="0"
      onFocus={e => e.target.select()}
      onChange={e => {
        const d = e.target.value.replace(/[^0-9]/g, '');
        setStr(d);
        setField(d === '' ? 0 : parseInt(d, 10));
      }}
      style={{ ...inputStyle, color: colour ?? tokens.text }}
    />
  );

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(6,13,31,0.80)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={saving ? undefined : onClose}
    >
      <Glass style={{ maxWidth: 560, width: '100%', padding: 0 }}>
        <div
          style={{ padding: 24, fontFamily: tokens.font, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 20 }}>
            {achievement ? `Edit — ${achievement.name}` : 'Add Achievement'}
          </div>

          {field('Key (unique slug)',
            <input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
              style={inputStyle} placeholder="e.g. first_win" />
          )}
          {field('Name',
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle} placeholder="Achievement name" />
          )}
          {field('Description',
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={inputStyle} placeholder="Short description shown to players" />
          )}
          {field('Condition',
            <select value={form.condition_key} onChange={e => setForm(f => ({ ...f, condition_key: e.target.value }))}
              style={selectStyle}>
              {CONDITION_TYPES.map(t => (
                <option key={t} value={t} style={{ background: tokens.bgCard, color: tokens.text }}>{t}</option>
              ))}
            </select>
          )}
          {field('Threshold', numInput(thresholdStr, setThresholdStr, n => setForm(f => ({ ...f, threshold: Math.max(1, n) }))))}
          {field('XP Reward',      numInput(xpStr,   setXpStr,   n => setForm(f => ({ ...f, reward_xp: n })),      tokens.xp))}
          {field('Credit Reward',  numInput(credStr, setCredStr, n => setForm(f => ({ ...f, reward_credits: n })), tokens.credits))}

          {error && (
            <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6, background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 12 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <SecondaryButton onClick={onClose} disabled={saving} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
          </div>
        </div>
      </Glass>
    </div>
  );
};

// ─── Main manager ─────────────────────────────────────────────────────────────

const AchievementsManager: React.FC = () => {
  const { achievements, loading, error, add, update } = useAdminAchievements();
  const [modalTarget, setModalTarget] = useState<AdminAchievement | null | undefined>(undefined);

  const handleSave = async (form: AchievementFormData): Promise<string | null> => {
    if (modalTarget === null) return add(form);
    if (modalTarget)          return update(modalTarget.id, form);
    return null;
  };

  return (
    <div style={{ fontFamily: tokens.font, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Frozen header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>Achievements</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
            {achievements.length} achievement{achievements.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={() => setModalTarget(null)} style={{
          background: 'rgba(0,212,170,0.18)', border: `1px solid ${tokens.accent}`,
          borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 800,
          color: tokens.accent, cursor: 'pointer', fontFamily: tokens.font,
        }}>
          + Add
        </button>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</div>}
        {!loading && error && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 13 }}>
            {error}
          </div>
        )}
        {!loading && !error && achievements.length === 0 && (
          <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
            No achievements yet.
          </div>
        )}

        {!loading && !error && achievements.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {achievements.map(a => (
            <div key={a.id} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, padding: 16,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: tokens.text }}>{a.name}</div>
              <div style={{ fontSize: 12, color: tokens.textMuted, lineHeight: 1.4, flex: 1 }}>{a.description}</div>

              {/* Condition pill */}
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 11, color: tokens.textMuted, fontWeight: 600,
              }}>
                {a.condition_key} ≥ {a.threshold}
              </div>

              {/* Rewards row */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.xp }}>+{a.reward_xp} XP</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.credits }}>+{a.reward_credits} cr</div>
              </div>

              <button onClick={() => setModalTarget(a)} style={{
                width: '100%', fontSize: 11, fontWeight: 700, color: tokens.accent,
                background: 'rgba(0,212,170,0.1)', border: 'none',
                padding: '6px 0', borderRadius: 5, cursor: 'pointer', fontFamily: tokens.font,
              }}>
                Edit
              </button>
            </div>
            ))}
          </div>
        )}
      </div>

      {modalTarget !== undefined && (
        <AchievementModal
          achievement={modalTarget}
          onSave={handleSave}
          onClose={() => setModalTarget(undefined)}
        />
      )}
    </div>
  );
};

export default AchievementsManager;
