import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('id').eq('id', user.id).single()
      .then(({ data }) => { if (data) navigate('/menu'); });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    setLoading(true);
    const { error } = await supabase.from('profiles').insert({ id: user.id, username });
    setLoading(false);
    if (error) {
      setError(error.message.includes('unique') ? 'Username taken — try another' : error.message);
    } else {
      navigate('/menu');
    }
  };

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Wordmark */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              fontSize: 28, fontWeight: 900, letterSpacing: 2,
              background: 'linear-gradient(135deg, #fff 30%, #00d4aa 70%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'inline-block', marginBottom: 8,
            }}>
              MEGA OX
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Pick your username</div>
            <div style={{ fontSize: 14, color: tokens.textMuted, fontWeight: 600 }}>
              This is how other players will know you.
            </div>
          </div>

          <Glass>
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 6 }}>
                Username
              </div>
              <input
                type="text"
                placeholder="e.g. MegaChamp99"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                style={{
                  width: '100%', boxSizing: 'border-box' as const,
                  background: focused ? 'rgba(0,212,170,0.06)' : error ? 'rgba(255,107,107,0.06)' : 'rgba(255,255,255,0.06)',
                  border: focused ? `1px solid ${tokens.accent}` : error ? '1px solid #ff6b6b' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: tokens.rInput, padding: '12px 14px', marginBottom: 12,
                  color: '#fff', fontFamily: tokens.font, fontWeight: 600, fontSize: 14,
                  outline: 'none',
                  boxShadow: focused ? '0 0 0 3px rgba(0,212,170,0.15)' : error ? '0 0 0 3px rgba(255,107,107,0.15)' : 'none',
                  transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
                }}
              />
              {error && (
                <div style={{ fontSize: 13, color: tokens.loss, marginBottom: 12, fontWeight: 600 }}>{error}</div>
              )}
              <PrimaryButton type="submit" disabled={loading} fullWidth>
                {loading ? 'Saving…' : "Let's play"}
              </PrimaryButton>
            </form>
          </Glass>

        </div>
      </div>
    </PageBackground>
  );
};

export default OnboardingPage;
