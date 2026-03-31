// src/components/progression/PostGameModal.tsx
import React from 'react';
import { XPProgressBar } from './XPProgressBar';

export interface PostGameResult {
  xpAwarded: number;
  creditsAwarded: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newAchievements: {
    key: string;
    name: string;
    description: string;
    icon_url: string | null;
    reward_xp: number;
    reward_credits: number;
    reward_skin_id: string | null;
  }[];
  /** True when the game was already processed — returned by the early-exit path */
  alreadyProcessed?: boolean;
}

interface PostGameModalProps {
  result: PostGameResult;
  level: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  xpToNext: number;
  onContinue: () => void;
}

export const PostGameModal: React.FC<PostGameModalProps> = ({
  result, level, xpIntoLevel, xpNeededForLevel, xpToNext, onContinue
}) => {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#1a1a2e', border: '1px solid #333', borderRadius: 12,
        padding: 32, minWidth: 320, maxWidth: 440, width: '90%', color: '#fff'
      }}>
        {result.leveledUp && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⬆️</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Level Up!</h2>
            <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: 14 }}>
              {result.previousLevel} → {result.newLevel}
            </p>
          </div>
        )}

        {!result.leveledUp && (
          <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>Game Complete</h2>
        )}

        <div style={{ marginBottom: 20 }}>
          <XPProgressBar
            level={level}
            xpIntoLevel={xpIntoLevel}
            xpNeededForLevel={xpNeededForLevel}
            xpToNext={xpToNext}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: '#222', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c7cff' }}>+{result.xpAwarded}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>XP</div>
          </div>
          <div style={{ flex: 1, background: '#222', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ffcc00' }}>+{result.creditsAwarded}</div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>Credits</div>
          </div>
        </div>

        {result.newAchievements.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#aaa' }}>Achievements Unlocked</h3>
            {result.newAchievements.map(a => (
              <div key={a.key} style={{
                background: '#222', borderRadius: 8, padding: '10px 12px',
                marginBottom: 6, display: 'flex', gap: 10, alignItems: 'center'
              }}>
                <span style={{ fontSize: 20 }}>🏆</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>{a.description}</div>
                  {(a.reward_xp > 0 || a.reward_credits > 0) && (
                    <div style={{ fontSize: 12, color: '#7c7cff', marginTop: 2 }}>
                      {a.reward_xp > 0 && `+${a.reward_xp} XP`}
                      {a.reward_xp > 0 && a.reward_credits > 0 && '  '}
                      {a.reward_credits > 0 && `+${a.reward_credits} Credits`}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: '12px', background: '#4a4af4',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 16, fontWeight: 600, cursor: 'pointer'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};
