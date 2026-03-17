import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTutorial } from '../../hooks/useTutorial';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [avatarStatus, setAvatarStatus] = useState<'idle' | 'uploading' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { resetTutorial } = useTutorial('home');
  const [resetMsg, setResetMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setUsername(data.username ?? '');
          setAvatarUrl(data.avatar_url ?? null);
        }
      });
  }, [user]);

  const saveUsername = async () => {
    if (!user || !username.trim()) return;
    setUsernameStatus('saving');
    setErrorMsg('');
    const { error } = await supabase.from('profiles').update({ username: username.trim() }).eq('id', user.id);
    if (error) {
      setUsernameStatus('error');
      setErrorMsg(error.message.includes('unique') ? 'That username is already taken.' : error.message);
    } else {
      setUsernameStatus('saved');
      setTimeout(() => setUsernameStatus('idle'), 2000);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setAvatarStatus('uploading');
    setErrorMsg('');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      setAvatarStatus('error');
      setErrorMsg(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    setAvatarUrl(data.publicUrl);
    setAvatarStatus('saved');
    setTimeout(() => setAvatarStatus('idle'), 2000);
  };

  const statusLabel: Record<string, string> = {
    saving: 'Saving...', saved: 'Saved!', uploading: 'Uploading...', error: 'Error', idle: ''
  };
  const statusColour: Record<string, string> = {
    saved: '#00d4aa', error: '#ff6b35', saving: '#a0aec0', uploading: '#a0aec0', idle: 'transparent'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <h1 style={{ margin: 0, color: '#fff' }}>Settings</h1>
        </div>

        {/* Avatar */}
        <div style={{ background: '#2a3441', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '16px', color: '#a0aec0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avatar</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#1a2332', overflow: 'hidden', border: '2px solid #4a5568', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#a0aec0' }}>
                    {username[0]?.toUpperCase() || '?'}
                  </div>
              }
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()}
                style={{ background: '#1a2332', border: '1px solid #4a5568', color: '#a0aec0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                {avatarStatus === 'uploading' ? 'Uploading...' : 'Change Photo'}
              </button>
              {avatarStatus !== 'idle' && (
                <div style={{ fontSize: '12px', color: statusColour[avatarStatus], marginTop: '6px' }}>
                  {statusLabel[avatarStatus]}
                </div>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
        </div>

        {/* Username */}
        <div style={{ background: '#2a3441', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '16px', color: '#a0aec0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameStatus('idle'); setErrorMsg(''); }}
              onKeyDown={(e) => e.key === 'Enter' && saveUsername()}
              style={{ flex: 1, background: '#1a2332', border: '1px solid #4a5568', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '15px' }}
            />
            <button onClick={saveUsername} disabled={usernameStatus === 'saving'}
              style={{ background: '#00d4aa', border: 'none', color: '#1a2332', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', opacity: usernameStatus === 'saving' ? 0.6 : 1 }}>
              Save
            </button>
          </div>
          {(usernameStatus !== 'idle' || errorMsg) && (
            <div style={{ fontSize: '12px', color: statusColour[usernameStatus], marginTop: '8px' }}>
              {errorMsg || statusLabel[usernameStatus]}
            </div>
          )}
        </div>

        {/* Danger zone: sign out */}
        <div style={{ background: '#2a3441', borderRadius: '12px', padding: '24px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '16px', color: '#a0aec0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</div>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
            style={{ background: 'none', border: '1px solid #ff6b35', color: '#ff6b35', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
            Sign Out
          </button>
        </div>

        {/* Tutorial */}
        <div style={{ background: '#2a3441', borderRadius: '12px', padding: '24px', marginTop: '16px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '16px', color: '#a0aec0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tutorial</div>
          <button
            onClick={async () => {
              await resetTutorial();
              setResetMsg('Tutorial will show next time you visit the home screen.');
              setTimeout(() => setResetMsg(''), 3000);
            }}
            style={{ background: 'none', border: '1px solid #4a5568', color: '#a0aec0', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
          >
            Replay Home Tutorial
          </button>
          {resetMsg && <div style={{ fontSize: '12px', color: '#00d4aa', marginTop: '8px' }}>{resetMsg}</div>}
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;
