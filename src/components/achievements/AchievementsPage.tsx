// src/components/achievements/AchievementsPage.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAchievements } from '../../hooks/useAchievements';

export const AchievementsPage: React.FC = () => {
  const { user } = useAuth();
  const { achievements, loading } = useAchievements(user?.id);

  if (loading) return <div style={{ color: '#fff', padding: 32 }}>Loading...</div>;

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  const AchievementCard = ({ a, dim }: { a: typeof achievements[0]; dim?: boolean }) => (
    <div style={{
      background: '#1a1a2e', border: '1px solid #2a2a4e', borderRadius: 10,
      padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start',
      opacity: dim ? 0.5 : 1
    }}>
      <span style={{ fontSize: 28, lineHeight: 1 }}>🏆</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>{a.name}</div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>{a.description}</div>
        <div style={{ fontSize: 12, color: '#7c7cff', marginTop: 4 }}>
          {a.reward_xp > 0 && `+${a.reward_xp} XP  `}
          {a.reward_credits > 0 && `+${a.reward_credits} Credits`}
        </div>
        {a.unlocked && a.unlocked_at && (
          <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
            Unlocked {new Date(a.unlocked_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', color: '#fff' }}>
      <h1 style={{ marginBottom: 24 }}>Achievements</h1>

      {unlocked.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, color: '#aaa', marginBottom: 12 }}>
            Unlocked ({unlocked.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
            {unlocked.map(a => <AchievementCard key={a.id} a={a} />)}
          </div>
        </>
      )}

      {locked.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, color: '#aaa', marginBottom: 12 }}>
            Locked ({locked.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {locked.map(a => <AchievementCard key={a.id} a={a} dim />)}
          </div>
        </>
      )}
    </div>
  );
};
