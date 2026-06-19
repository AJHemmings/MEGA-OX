import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import Field from '../common/Field';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase JS exchanges the #access_token in the URL and fires PASSWORD_RECOVERY.
    // We listen here rather than in AuthContext so the page controls its own ready state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => navigate('/menu'), 2000);
  };

  if (!ready) {
    return (
      <PageBackground>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: '100vh', color: tokens.textMuted, fontFamily: tokens.font, fontSize: 14,
        }}>
          Validating reset link…
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '80px 24px 0',
      }}>
        <div style={{ width: '100%', maxWidth: 390 }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 26, fontWeight: 900, letterSpacing: 2, marginBottom: 6,
              background: 'linear-gradient(135deg, #fff 30%, #00d4aa 70%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}>
              MEGA OX
            </div>
            <div style={{ fontSize: 14, color: tokens.textMuted, fontWeight: 600 }}>
              Choose a new password.
            </div>
          </div>

          <Glass>
            {done ? (
              <div style={{ textAlign: 'center', padding: '8px 0', color: tokens.accent, fontWeight: 700, fontSize: 15 }}>
                Password updated! Redirecting…
              </div>
            ) : (
              <>
                <Field label="New password" type="password" value={password} onChange={setPassword} hasError={!!error} />
                <Field label="Confirm password" type="password" value={confirm} onChange={setConfirm} hasError={!!error} />
                {error && (
                  <div style={{ fontSize: 13, color: tokens.loss, marginBottom: 12, fontWeight: 600 }}>{error}</div>
                )}
                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={loading || !password || !confirm}
                  fullWidth
                >
                  {loading ? 'Saving…' : 'Set New Password'}
                </PrimaryButton>
              </>
            )}
          </Glass>
        </div>
      </div>
    </PageBackground>
  );
};

export default ResetPasswordPage;
