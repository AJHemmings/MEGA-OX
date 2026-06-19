import React, { useState, useRef, useEffect } from 'react';
import { useBugReport } from '../../hooks/useBugReport';
import { SerializedState } from '../../lib/gameSerializer';
import { tokens } from '../../styles/tokens';
import Glass from './Glass';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

interface Props {
  onClose:     () => void;
  gameId?:     string | null;
  gameState?:  SerializedState | null;
}

const CATEGORIES = [
  { value: 'ui',          label: 'UI / Visual' },
  { value: 'game_logic',  label: 'Game Logic'  },
  { value: 'account',     label: 'Account'      },
  { value: 'other',       label: 'Other'        },
];

type Stage = 'form' | 'submitting' | 'rate_limited' | 'success' | 'error';

const ReportBugModal: React.FC<Props> = ({ onClose, gameId, gameState }) => {
  const { submit } = useBugReport();
  const [stage, setStage]       = useState<Stage>('form');
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState('ui');
  const [description, setDesc]  = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setStage('submitting');
    const result = await submit({ title: title.trim(), description: description.trim(), category, gameId, gameState });
    if (result === 'ok') {
      setStage('success');
      timerRef.current = setTimeout(onClose, 3000);
    } else if (result === 'rate_limited') {
      setStage('rate_limited');
    } else {
      setStage('error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: tokens.innerBg,
    border: tokens.innerBorder,
    borderRadius: tokens.rBtn,
    color: tokens.text,
    fontFamily: tokens.font,
    fontSize: 14,
    padding: '10px 12px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700,
    letterSpacing: 0.5, color: tokens.textMuted,
    textTransform: 'uppercase', marginBottom: 6,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(6,13,31,0.80)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <Glass style={{ maxWidth: 440, width: '100%', padding: 0 }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text }}>Report a Bug</div>
            <SecondaryButton size="sm" onClick={onClose}>✕</SecondaryButton>
          </div>

          {stage === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: tokens.accent }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Thanks! Your report has been submitted.</div>
              <div style={{ fontSize: 12, color: tokens.textMuted, marginTop: 8 }}>Closing in 3 seconds…</div>
            </div>
          )}

          {stage === 'rate_limited' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 14, color: tokens.loss, fontWeight: 700, marginBottom: 16 }}>
                You've submitted 3 reports in the last hour. Try again later.
              </div>
              <SecondaryButton onClick={onClose}>Close</SecondaryButton>
            </div>
          )}

          {stage === 'error' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 14, color: tokens.loss, fontWeight: 700, marginBottom: 16 }}>
                Something went wrong. Please try again.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <SecondaryButton onClick={() => setStage('form')}>Back</SecondaryButton>
                <SecondaryButton onClick={onClose}>Close</SecondaryButton>
              </div>
            </div>
          )}

          {(stage === 'form' || stage === 'submitting') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  style={inputStyle}
                  placeholder="Short description of the issue"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={stage === 'submitting'}
                />
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer', colorScheme: 'dark' }}
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  disabled={stage === 'submitting'}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  placeholder="What happened? What did you expect?"
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  disabled={stage === 'submitting'}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
                <SecondaryButton onClick={onClose} disabled={stage === 'submitting'}>Cancel</SecondaryButton>
                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={stage === 'submitting' || !title.trim() || !description.trim()}
                >
                  {stage === 'submitting' ? 'Submitting…' : 'Submit Report'}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </Glass>
    </div>
  );
};

export default ReportBugModal;
