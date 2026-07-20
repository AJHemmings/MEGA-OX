import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '../../hooks/useAdminRole';
import { tokens } from '../../styles/tokens';

const NAV_EDITOR = [
  { label: 'Skins',        path: '/admin/skins'        },
  { label: 'Achievements', path: '/admin/achievements'  },
  { label: 'Emojis',       path: '/admin/emojis'        },
  { label: 'News',         path: '/admin/news'         },
  { label: 'Bug Reports',  path: '/admin/bugs'         },
];

const NAV_SUPER = [
  { label: 'Shop',     path: '/admin/shop'      },
  { label: 'Seasons',  path: '/admin/seasons'   },
  { label: 'AI Tuner', path: '/admin/ai-tuner'  },
];

interface Props { children: React.ReactNode }

export const AdminLayout: React.FC<Props> = ({ children }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { role }  = useAdminRole();

  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: 'block', padding: '6px 8px', borderRadius: 5,
    fontSize: 12, fontWeight: active ? 700 : 500,
    color:      active ? tokens.accent : tokens.textMuted,
    background: active ? 'rgba(0,212,170,0.12)' : 'transparent',
    borderLeft: active ? `2px solid ${tokens.accent}` : '2px solid transparent',
    cursor: 'pointer', fontFamily: tokens.font,
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: tokens.bgBase }}>
      <div style={{
        width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.03)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        padding: '20px 12px',
      }}>
        {/* Back to game */}
        <div
          style={{ ...linkStyle(false), marginBottom: 12 }}
          onClick={() => navigate('/menu')}
        >
          ← Menu
        </div>

        <div style={{
          color: tokens.accent, fontWeight: 800, fontSize: 10,
          letterSpacing: 1.5, marginBottom: 16, fontFamily: tokens.font,
        }}>
          ADMIN
        </div>

        {NAV_EDITOR.map(({ label, path }) => (
          <div key={path} style={linkStyle(isActive(path))} onClick={() => navigate(path)}>
            {label}
          </div>
        ))}

        {role === 'super_admin' && (
          <>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '10px 0' }} />
            {NAV_SUPER.map(({ label, path }) => (
              <div key={path} style={linkStyle(isActive(path))} onClick={() => navigate(path)}>
                {label}
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ flex: 1, padding: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
};
