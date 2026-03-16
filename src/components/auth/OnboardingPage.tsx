import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const OnboardingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If profile already exists, skip onboarding
    if (!user) return;
    supabase.from('profiles').select('id').eq('id', user.id).single().then(({ data }) => {
      if (data) navigate('/');
    });
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
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#2a3441', borderRadius: '12px', padding: '40px', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ color: '#fff', marginBottom: '8px' }}>Pick your username</h2>
        <p style={{ color: '#a0aec0', marginBottom: '24px' }}>This is how other players will know you.</p>
        {error && <div style={{ color: '#ff6b35', marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3a4a5a', background: '#1a2332', color: '#fff', fontSize: '16px', boxSizing: 'border-box', marginBottom: '16px' }} />
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#00d4aa', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>
            {loading ? 'Saving...' : "Let's play"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
