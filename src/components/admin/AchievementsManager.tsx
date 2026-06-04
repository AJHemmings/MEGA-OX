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

// ─── Inline modal ─────────────────────────────────────────────────────────────

interface ModalProps {
  achievement: AdminAchievement | null; // null = add mode
  onSave: (form: AchievementFormData) => Promise<string | null>;
  onClose: () => void;
}

const emptyForm = (): AchievementFormData => ({
  key: '',
  name: '',
  description: '',
  condition_key: CONDITION_TYPES[0],
  threshold: 1,
  reward_xp: 0,
  reward_credits: 0,
});

const AchievementModal: React.FC<ModalProps> = ({ achievement, onSave, onClose }) => {
  const [form, setForm]     = useState<AchievementFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (achievement) {
      setForm({
        key:           achievement.key,
        name:          achievement.name,
        description:   achievement.description,
        condition_key: achievement.condition_key,
        threshold:     achievement.threshold,
        reward_xp:     achievement.reward_xp,
        reward_credits: achievement.reward_credits,
      });
    } else {
      setForm(emptyForm());
    }
    setError(null);
  }, [achievement]);

  const handleSave = async () => {
    if (!form.key.trim())  { setError('Key is required.'); return; }
    if (!form.name.trim()) { setError('Name is required.'); return; }
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
    borderRadius: 6, padding: '6px 10px', fontSize: 12, color: tokens.text,
    fontFamily: tokens.font, outline: 'none',
  };

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 9, color: tokens.textMuted, marginBottom: 4,
        textTransform: 'uppercase', letterSpacing: 0.8,
      }}>
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
      <Glass style={{ maxWidth: 440, width: '100%', padding: 0 }}>
        <div
          style={{ padding: 24, fontFamily: tokens.font }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 20 }}>
            {achievement ? `Edit — ${achievement.name}` : 'Add Achievement'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('Key (unique slug)',
              <input
                value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                style={inputStyle}
                placeholder="e.g. first_win"
              />
            )}
            {field('Name',
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputStyle}
                placeholder="Achievement name"
              />
            )}
          </div>

          {field('Description',
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={inputStyle}
              placeholder="Short description shown to players"
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('Condition',
              <select
                value={form.condition_key}
                onChange={e => setForm(f => ({ ...f, condition_key: e.target.value }))}
                style={inputStyle}
              >
                {CONDITION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            {field('Threshold',
              <input
                type="number" min={1}
                value={form.threshold}
                onChange={e => setForm(f => ({ ...f, threshold: Number(e.target.value) }))}
                style={inputStyle}
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('XP reward',
              <input
                type="number" min={0}
                value={form.reward_xp}
                onChange={e => setForm(f => ({ ...f, reward_xp: Number(e.target.value) }))}
                style={{ ...inputStyle, color: tokens.xp }}
              />
            )}
            {field('Credit reward',
              <input
                type="number" min={0}
                value={form.reward_credits}
                onChange={e => setForm(f => ({ ...f, reward_credits: Number(e.target.value) }))}
                style={{ ...inputStyle, color: tokens.credits }}
              />
            )}
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6,
              background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 12,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <SecondaryButton onClick={onClose} disabled={saving} style={{ flex: 1 }}>
              Cancel
            </SecondaryButton>
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

  // undefined = closed, null = add mode, AdminAchievement = edit mode
  const [modalTarget, setModalTarget] = useState<AdminAchievement | null | undefined>(undefined);

  const handleSave = async (form: AchievementFormData): Promise<string | null> => {
    if (modalTarget === null) return add(form);
    if (modalTarget)          return update(modalTarget.id, form);
    return null;
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '8px 12px',
    fontSize: 9, color: tokens.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', fontSize: 13, color: tokens.text,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ fontFamily: tokens.font }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: tokens.text }}>Achievements</div>
        <PrimaryButton size="sm" onClick={() => setModalTarget(null)}>
          + Add Achievement
        </PrimaryButton>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
          Loading…
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && achievements.length === 0 && (
        <div style={{ color: tokens.textMuted, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
          No achievements yet. Add one above.
        </div>
      )}

      {/* Table */}
      {!loading && !error && achievements.length > 0 && (
        <Glass style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Condition</th>
                <th style={{ ...thStyle, color: tokens.xp }}>XP</th>
                <th style={{ ...thStyle, color: tokens.credits }}>Credits</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {achievements.map(a => (
                <tr key={a.id}>
                  <td style={{ ...tdStyle, fontWeight: 700 }}>{a.name}</td>
                  <td style={{ ...tdStyle, color: tokens.textMuted, maxWidth: 220 }}>
                    {a.description}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 100,
                      background: tokens.innerBg, border: tokens.innerBorder,
                      fontSize: 11, color: tokens.textMuted,
                    }}>
                      {a.condition_key} ≥ {a.threshold}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, color: tokens.xp, fontWeight: 700 }}>
                    +{a.reward_xp}
                  </td>
                  <td style={{ ...tdStyle, color: tokens.credits, fontWeight: 700 }}>
                    +{a.reward_credits}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <SecondaryButton size="sm" onClick={() => setModalTarget(a)}>
                      Edit
                    </SecondaryButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Glass>
      )}

      {/* Modal */}
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
