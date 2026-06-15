import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import Field from '../common/Field';
import BackButton from '../common/BackButton';

const LoginPage: React.FC = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/menu');
  };

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '24px 24px 0',
      }}>
        <div style={{ width: '100%', maxWidth: 390 }}>

          {/* Back button */}
          <div style={{ marginBottom: 12 }}>
            <BackButton onClick={() => navigate(-1)} />
          </div>

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
            <div style={{ fontSize: 14, color: tokens.textMuted, fontWeight: 600 }}>Welcome back — sign in to continue.</div>
          </div>

          {/* Form card */}
          <Glass style={{ marginBottom: 16 }}>
            <form onSubmit={handleSubmit}>
              <Field label="Email" type="email" value={email} onChange={setEmail} hasError={!!error} />
              <div style={{ position: 'relative' }}>
                <Field label="Password" type="password" value={password} onChange={setPassword} hasError={!!error} />
                <button
                  type="button"
                  onClick={() => {/* TODO: forgot password */}}
                  style={{
                    position: 'absolute', top: 0, right: 0,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: tokens.accent, fontSize: 12, fontWeight: 700, fontFamily: tokens.font,
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              {error && (
                <div style={{ fontSize: 13, color: tokens.loss, marginBottom: 12, fontWeight: 600 }}>{error}</div>
              )}
              <PrimaryButton type="submit" disabled={loading} fullWidth>
                {loading ? 'Signing in…' : 'Log In'}
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
            New here?{' '}
            <button
              onClick={() => navigate('/signup')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.accent, fontWeight: 700, fontSize: 13, fontFamily: tokens.font, padding: 0 }}
            >
              Sign up
            </button>
          </div>

        </div>
      </div>
    </PageBackground>
  );
};

export default LoginPage;
