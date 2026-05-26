import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useTutorial } from '../../hooks/useTutorial';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import TabBar from '../common/TabBar';
import { ChevronLeft } from '../icons';

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' as const, marginBottom: 14 }}>
    {children}
  </div>
);

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const profile   = usePlayerProfile();
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const { resetTutorial } = useTutorial('home');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername]           = useState('');
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [avatarStatus, setAvatarStatus]   = useState<'idle' | 'uploading' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg]           = useState('');
  const [resetMsg, setResetMsg]           = useState('');
  const [inputFocused, setInputFocused]   = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) { setUsername(data.username ?? ''); setAvatarUrl(data.avatar_url ?? null); }
      });
  }, [user]);

  const saveUsername = async () => {
    if (!user || !username.trim()) return;
    setUsernameStatus('saving'); setErrorMsg('');
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
    setAvatarStatus('uploading'); setErrorMsg('');
    const ext  = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) { setAvatarStatus('error'); setErrorMsg(uploadError.message); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    setAvatarUrl(data.publicUrl);
    setAvatarStatus('saved');
    setTimeout(() => setAvatarStatus('idle'), 2000);
  };

  const statusColour: Record<string, string> = {
    saved: tokens.accent, error: tokens.loss,
    saving: tokens.textMuted, uploading: tokens.textMuted, idle: 'transparent',
  };

  const content = (
    <div style={{ fontFamily: tokens.font, color: tokens.text, maxWidth: 520, margin: '0 auto', padding: '0 16px', paddingBottom: isMobile ? 100 : 60 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 800 }}>Settings</span>
      </div>

      {/* Avatar */}
      <Glass style={{ marginBottom: 12 }}>
        <SectionLabel>Avatar</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.12)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: tokens.textMuted,
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : username[0]?.toUpperCase() || '?'
            }
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: tokens.textMuted, padding: '8px 16px', borderRadius: 10,
                cursor: 'pointer', fontSize: 13, fontFamily: tokens.font, fontWeight: 700,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = tokens.text; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = tokens.textMuted; }}
            >
              {avatarStatus === 'uploading' ? 'Uploading…' : 'Change Photo'}
            </button>
            {avatarStatus !== 'idle' && (
              <div style={{ fontSize: 12, color: statusColour[avatarStatus], marginTop: 6, fontWeight: 600 }}>
                {{ saving: '', saved: 'Saved!', uploading: 'Uploading…', error: errorMsg, idle: '' }[avatarStatus]}
              </div>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
      </Glass>

      {/* Username */}
      <Glass style={{ marginBottom: 12 }}>
        <SectionLabel>Username</SectionLabel>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={username}
            onChange={e => { setUsername(e.target.value); setUsernameStatus('idle'); setErrorMsg(''); }}
            onKeyDown={e => e.key === 'Enter' && saveUsername()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              flex: 1, background: inputFocused ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.06)',
              border: inputFocused ? `1px solid ${tokens.accent}` : usernameStatus === 'error' ? '1px solid #ff6b6b' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: tokens.rInput, padding: '11px 14px',
              color: '#fff', fontFamily: tokens.font, fontWeight: 600, fontSize: 14,
              outline: 'none',
              boxShadow: inputFocused ? '0 0 0 3px rgba(0,212,170,0.15)' : 'none',
              transition: 'border 0.15s, box-shadow 0.15s, background 0.15s',
            }}
          />
          <PrimaryButton onClick={saveUsername} disabled={usernameStatus === 'saving'}>
            {usernameStatus === 'saving' ? 'Saving…' : 'Save'}
          </PrimaryButton>
        </div>
        {(usernameStatus !== 'idle' || errorMsg) && (
          <div style={{ fontSize: 12, color: statusColour[usernameStatus], marginTop: 8, fontWeight: 600 }}>
            {errorMsg || ({ saved: 'Saved!', saving: '', error: '', idle: '' }[usernameStatus])}
          </div>
        )}
      </Glass>

      {/* Tutorial */}
      <Glass style={{ marginBottom: 12 }}>
        <SectionLabel>Tutorial</SectionLabel>
        <button
          onClick={async () => {
            await resetTutorial();
            setResetMsg('Tutorial will show next time you visit the home screen.');
            setTimeout(() => setResetMsg(''), 3000);
          }}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: tokens.textMuted, padding: '10px 20px', borderRadius: tokens.rBtn,
            cursor: 'pointer', fontSize: 14, fontFamily: tokens.font, fontWeight: 700,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = tokens.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = tokens.textMuted; }}
        >
          Replay Home Tutorial
        </button>
        {resetMsg && <div style={{ fontSize: 12, color: tokens.accent, marginTop: 8, fontWeight: 600 }}>{resetMsg}</div>}
      </Glass>

      {/* Account / Sign out */}
      <Glass>
        <SectionLabel>Account</SectionLabel>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
          style={{
            background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)',
            color: tokens.loss, padding: '10px 20px', borderRadius: tokens.rBtn,
            cursor: 'pointer', fontSize: 14, fontFamily: tokens.font, fontWeight: 700,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,107,107,0.08)'; }}
        >
          Sign Out
        </button>
      </Glass>
    </div>
  );

  return (
    <PageBackground>
      {content}
      {isMobile && <TabBar username={profile?.username ?? undefined} />}
    </PageBackground>
  );
};

export default SettingsPage;
