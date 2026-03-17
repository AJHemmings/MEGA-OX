import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px',
  border: '1px solid #3a4a5a', background: '#1a2332', color: '#fff', fontSize: '16px',
  boxSizing: 'border-box'
};
const btnStyle = (color: string): React.CSSProperties => ({
  width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
  background: color, color: '#fff', fontSize: '16px', cursor: 'pointer', marginBottom: '8px'
});

const SignUpPage: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/menu');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#2a3441', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color: '#00d4aa', textAlign: 'center', marginBottom: '32px' }}>MEGA OX</h1>
        <h2 style={{ color: '#fff', marginBottom: '24px' }}>Create Account</h2>
        {error && <div style={{ color: '#ff6b35', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            required style={inputStyle} />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            required style={inputStyle} />
          <input type="password" placeholder="Password (min 6 chars)" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
          <button type="submit" disabled={loading} style={btnStyle('#00d4aa')}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div style={{ textAlign: 'center', margin: '16px 0', color: '#a0aec0' }}>or</div>
        <button onClick={signInWithGoogle} style={btnStyle('#4299e1')}>Continue with Google</button>
        <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
          Already have an account? <Link to="/login" style={{ color: '#00d4aa' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
