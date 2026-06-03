import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import Field from '../common/Field';
import { ChevronLeft } from '../icons';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

const SignUpPage: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername]     = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      setUsernameStatus(data ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (usernameStatus === 'taken') { setError('That username is already taken'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/menu');
  };

  const usernameIcon = (() => {
    if (usernameStatus === 'checking') return <span style={{ fontSize: 14, color: tokens.textMuted }}>…</span>;
    if (usernameStatus === 'available') return <span style={{ fontSize: 16, color: tokens.accent }}>✓</span>;
    if (usernameStatus === 'taken') return <span style={{ fontSize: 16, color: tokens.loss }}>✗</span>;
    return null;
  })();

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '24px 24px 0',
      }}>
        <div style={{ width: '100%' }}>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: '4px 0', lineHeight: 0, marginBottom: 20 }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Title block */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontSize: 26, fontWeight: 900, letterSpacing: 2, marginBottom: 6,
              background: 'linear-gradient(135deg, #fff 30%, #00d4aa 70%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}>
              MEGA OX
            </div>
            <div style={{ fontSize: 14, color: tokens.textMuted, fontWeight: 600 }}>Create your account and start climbing.</div>
          </div>

          {/* Form card */}
          <Glass style={{ marginBottom: 16 }}>
            <form onSubmit={handleSubmit}>
              <div>
                <Field
                  label="Username"
                  type="text"
                  value={username}
                  onChange={setUsername}
                  hasError={usernameStatus === 'taken'}
                  right={usernameIcon}
                />
                {usernameStatus === 'taken' && (
                  <div style={{ fontSize: 11, color: tokens.loss, marginTop: -10, marginBottom: 12, fontWeight: 600 }}>Username taken</div>
                )}
              </div>
              <Field label="Email" type="email" value={email} onChange={setEmail} hasError={!!error} />
              <Field label="Password" type="password" value={password} onChange={setPassword} hasError={!!error} />
              {error && (
                <div style={{ fontSize: 13, color: tokens.loss, marginBottom: 12, fontWeight: 600 }}>{error}</div>
              )}
              <PrimaryButton type="submit" disabled={loading || usernameStatus === 'taken'} fullWidth>
                {loading ? 'Creating account…' : 'Sign Up'}
              </PrimaryButton>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 12, color: tokens.textDim, fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              style={{
                width: '100%', padding: '12px', borderRadius: tokens.rBtn,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)',
                color: tokens.text, fontFamily: tokens.font, fontSize: 14, fontWeight: 700,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              Continue with Google
            </button>
          </Glass>

          {/* Switch link */}
          <div style={{ textAlign: 'center', fontSize: 13, color: tokens.textMuted }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.accent, fontWeight: 700, fontSize: 13, fontFamily: tokens.font, padding: 0 }}
            >
              Log in
            </button>
          </div>

        </div>
      </div>
    </PageBackground>
  );
};

export default SignUpPage;
