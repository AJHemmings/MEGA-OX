// src/components/admin/AdminDebugFAB.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminRole } from '../../hooks/useAdminRole';
import { useProgressionContext } from '../../contexts/ProgressionContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens } from '../../styles/tokens';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';

const QUICK_NAV = [
  { label: 'Customise',    path: '/customise' },
  { label: 'Shop',         path: '/shop' },
  { label: 'Achievements', path: '/achievements' },
  { label: 'Admin',        path: '/admin/skins' },
] as const;

const Divider: React.FC = () => (
  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' }} />
);

const SectionLabel: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
    color: tokens.textMuted, textTransform: 'uppercase', marginBottom: 10,
  }}>
    {text}
  </div>
);

export const AdminDebugFAB: React.FC = () => {
  const { role }  = useAdminRole();
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const { refresh: refreshProgression } = useProgressionContext();

  const [open, setOpen]           = useState(false);
  const [xpAmount, setXpAmount]   = useState('');
  const [crAmount, setCrAmount]   = useState('');
  const [xpMsg, setXpMsg]         = useState('');
  const [crMsg, setCrMsg]         = useState('');
  const [launching, setLaunching] = useState(false);

  // Render nothing for non-admins (useAdminRole returns null while loading too,
  // but the brief loading flash is acceptable — this is an internal-only tool)
  if (!role) return null;

  const bottom = isMobile ? 88 : 24;
  const close = () => setOpen(false);

  const startTestGame = async () => {
    if (!user) return;
    setLaunching(true);
    const { data, error } = await supabase
      .from('games')
      .insert({
        player_x_id: user.id,
        player_o_id: user.id,
        status: 'active',
        next_player: 'X',
        match_type: 'friendly',
      })
      .select('id')
      .single();
    setLaunching(false);
    if (error || !data) {
      console.error('Test game creation failed:', error?.message);
      return;
    }
    close();
    navigate(`/game/${data.id}?debug=both`);
  };

  const grantXp = async () => {
    const n = parseInt(xpAmount, 10);
    if (!n || n <= 0) return;
    const { error } = await supabase.rpc('admin_grant_xp', { amount: n });
    if (error) { setXpMsg(`Error: ${error.message}`); return; }
    setXpAmount('');
    setXpMsg('✓ Granted');
    refreshProgression();
    setTimeout(() => setXpMsg(''), 2000);
  };

  const grantCredits = async () => {
    const n = parseInt(crAmount, 10);
    if (!n || n <= 0) return;
    const { error } = await supabase.rpc('admin_grant_credits', { amount: n });
    if (error) { setCrMsg(`Error: ${error.message}`); return; }
    setCrAmount('');
    setCrMsg('✓ Granted');
    refreshProgression();
    setTimeout(() => setCrMsg(''), 2000);
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '8px 10px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: tokens.text, fontFamily: tokens.font,
    fontSize: 13, outline: 'none',
  };

  return (
    <>
      {/* Slide-up panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: bottom + 52,
          right: 24,
          width: 320,
          maxHeight: '80vh',
          overflowY: 'auto',
          zIndex: 9998,
        }}>
          <Glass padding={16} style={{ position: 'relative' }}>
            {/* Close */}
            <button
              onClick={close}
              style={{
                position: 'absolute', top: 10, right: 12,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tokens.textMuted, fontSize: 18, lineHeight: 1,
                fontFamily: tokens.font,
              }}
            >
              ×
            </button>

            <div style={{ fontSize: 13, fontWeight: 800, color: tokens.accent, marginBottom: 14 }}>
              🛠 Debug Panel
            </div>

            {/* ── Test Game ── */}
            <SectionLabel text="Test Game" />
            <PrimaryButton fullWidth onClick={startTestGame} disabled={launching}>
              {launching ? 'Creating…' : '▶ Start Test Game'}
            </PrimaryButton>

            <Divider />

            {/* ── Reward Cheats ── */}
            <SectionLabel text="Reward Cheats" />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <input
                type="number" min="1" placeholder="XP amount"
                value={xpAmount} onChange={e => setXpAmount(e.target.value)}
                style={inputStyle}
              />
              <SecondaryButton size="sm" onClick={grantXp}>Grant XP</SecondaryButton>
            </div>
            {xpMsg && <div style={{ fontSize: 11, color: tokens.win, marginBottom: 8 }}>{xpMsg}</div>}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <input
                type="number" min="1" placeholder="Credits amount"
                value={crAmount} onChange={e => setCrAmount(e.target.value)}
                style={inputStyle}
              />
              <SecondaryButton size="sm" onClick={grantCredits}>Grant Credits</SecondaryButton>
            </div>
            {crMsg && <div style={{ fontSize: 11, color: tokens.win, marginBottom: 8 }}>{crMsg}</div>}

            <Divider />

            {/* ── Toasts ── */}
            <SectionLabel text="Toasts" />
            <SecondaryButton fullWidth onClick={() => {
              window.dispatchEvent(new CustomEvent('debug:show-forfeit-toast'));
              close();
            }}>
              Trigger Forfeit Toast
            </SecondaryButton>

            <Divider />

            {/* ── Quick Nav ── */}
            <SectionLabel text="Quick Nav" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {QUICK_NAV.map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => { close(); navigate(path); }}
                  style={{
                    padding: '9px 8px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: tokens.textMuted, fontSize: 12, fontWeight: 700,
                    fontFamily: tokens.font, textAlign: 'center',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = tokens.text;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = tokens.textMuted;
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </Glass>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom,
          right: 24,
          zIndex: 9999,
          width: isMobile ? 44 : 'auto',
          height: 44,
          padding: isMobile ? 0 : '0 16px',
          borderRadius: isMobile ? '50%' : 22,
          border: `1px solid ${tokens.accent}55`,
          background: tokens.bgCard,
          backdropFilter: tokens.glassBlur,
          WebkitBackdropFilter: tokens.glassBlur,
          color: tokens.accent,
          fontSize: isMobile ? 18 : 13,
          fontWeight: 800,
          fontFamily: tokens.font,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {isMobile ? '🛠' : '🛠 Debug'}
      </button>
    </>
  );
};
