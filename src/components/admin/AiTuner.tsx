import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAiConfig, AiConfigValues } from '../../hooks/useAiConfig';
import { useAuth } from '../../contexts/AuthContext';
import { tokens } from '../../styles/tokens';
import PrimaryButton from '../common/PrimaryButton';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'medium' | 'hard';

interface SliderConfig {
  key: string;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

// ─── Slider configs ───────────────────────────────────────────────────────────

const MEDIUM_SLIDERS: SliderConfig[] = [
  {
    key: 'win_rule_strength',
    label: 'Win Rule Strength',
    description: 'How often the AI takes an immediate winning move in a micro board (0 = never, 100 = always).',
    min: 0, max: 100, step: 1,
  },
  {
    key: 'poison_filter_strength',
    label: 'Poison Filter Strength',
    description: 'How often the AI avoids sending the opponent to a board where they can win immediately (0 = never, 100 = always).',
    min: 0, max: 100, step: 1,
  },
];

const HARD_SLIDERS: SliderConfig[] = [
  {
    key: 'win_rule_strength',
    label: 'Win Rule Strength',
    description: 'How often the AI takes an immediate winning move in a micro board (0 = never, 100 = always).',
    min: 0, max: 100, step: 1,
  },
  {
    key: 'poison_filter_strength',
    label: 'Poison Filter Strength',
    description: 'How often the AI avoids sending the opponent to a board where they can win immediately (0 = never, 100 = always).',
    min: 0, max: 100, step: 1,
  },
  {
    key: 'minimax_depth',
    label: 'Minimax Depth',
    description: 'How many moves ahead the AI looks using minimax search. Higher = stronger but slower (1 = shallow, 5 = deep).',
    min: 1, max: 5, step: 1,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AiTuner: React.FC = () => {
  const { config, loading, refetch } = useAiConfig();
  const { user } = useAuth();

  const [tab, setTab]           = useState<Tab>('medium');
  const [draft, setDraft]       = useState<AiConfigValues | null>(null);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState<{ text: string; ok: boolean } | null>(null);

  // Work from draft when available, fall back to fetched config
  const current = draft ?? config;

  function getValue(difficulty: Tab, key: string): number {
    if (difficulty === 'medium') {
      return (current.medium as any)[key] as number;
    }
    return (current.hard as any)[key] as number;
  }

  function handleChange(difficulty: Tab, key: string, value: number) {
    const base = draft ?? { medium: { ...config.medium }, hard: { ...config.hard } };
    if (difficulty === 'medium') {
      setDraft({ ...base, medium: { ...base.medium, [key]: value } });
    } else {
      setDraft({ ...base, hard: { ...base.hard, [key]: value } });
    }
    setMessage(null);
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    setMessage(null);

    const rows = [
      { difficulty: 'medium', rule_name: 'win_rule_strength',      strength: draft.medium.win_rule_strength,      updated_by: user?.id ?? null },
      { difficulty: 'medium', rule_name: 'poison_filter_strength',  strength: draft.medium.poison_filter_strength, updated_by: user?.id ?? null },
      { difficulty: 'hard',   rule_name: 'win_rule_strength',      strength: draft.hard.win_rule_strength,        updated_by: user?.id ?? null },
      { difficulty: 'hard',   rule_name: 'poison_filter_strength',  strength: draft.hard.poison_filter_strength,   updated_by: user?.id ?? null },
      { difficulty: 'hard',   rule_name: 'minimax_depth',          strength: draft.hard.minimax_depth,            updated_by: user?.id ?? null },
    ];

    const { error } = await supabase
      .from('ai_config')
      .upsert(rows, { onConflict: 'difficulty,rule_name' });

    if (error) {
      setMessage({ text: `Save failed: ${error.message}`, ok: false });
    } else {
      setMessage({ text: 'Changes saved successfully.', ok: true });
      setDraft(null);
      await refetch();
    }
    setSaving(false);
  }

  const isDirty = draft !== null;

  if (loading) {
    return (
      <div style={{ color: tokens.textMuted, padding: 24, fontFamily: tokens.font }}>
        Loading AI config…
      </div>
    );
  }

  const sliders = tab === 'medium' ? MEDIUM_SLIDERS : HARD_SLIDERS;

  return (
    <div style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 540, padding: '24px 0' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900 }}>AI Difficulty Tuner</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: tokens.textMuted }}>
        Adjust how the AI behaves at each difficulty level. Changes take effect after saving.
      </p>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['medium', 'hard'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px',
              borderRadius: tokens.rPill,
              border: tab === t
                ? `1.5px solid ${tokens.accent}`
                : `1.5px solid rgba(255,255,255,0.12)`,
              background: tab === t
                ? `${tokens.accent}22`
                : 'rgba(255,255,255,0.04)',
              color: tab === t ? tokens.accent : tokens.textMuted,
              fontFamily: 'inherit',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s ease',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Slider cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sliders.map(({ key, label, description, min, max, step }) => {
          const value = getValue(tab, key);
          return (
            <div
              key={key}
              style={{
                maxWidth: 340,
                padding: '16px 18px',
                borderRadius: tokens.glassRadius,
                background: tokens.innerBg,
                border: tokens.innerBorder,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{label}</span>
                <span style={{
                  fontWeight: 900, fontSize: 16,
                  color: tokens.accent,
                  minWidth: 28,
                  textAlign: 'right',
                }}>
                  {value}
                </span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: tokens.textMuted, lineHeight: 1.5 }}>
                {description}
              </p>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => handleChange(tab, key, Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: tokens.accent,
                  cursor: 'pointer',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: tokens.textDim }}>
                <span>{min}</span>
                <span>{max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      <div style={{ marginTop: 24, maxWidth: 340 }}>
        <PrimaryButton
          onClick={handleSave}
          disabled={!isDirty || saving}
          fullWidth
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </PrimaryButton>
      </div>

      {/* Feedback message */}
      {message && (
        <div style={{
          marginTop: 12,
          fontSize: 13,
          fontWeight: 700,
          color: message.ok ? tokens.win : tokens.loss,
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AiTuner;
