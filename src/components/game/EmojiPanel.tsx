// src/components/game/EmojiPanel.tsx
// asset_url for emoji items stores the raw unicode glyph (e.g. '👍'), not a URL
import React from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onSend: (emoji: string) => void;
}

const EmojiPanel: React.FC<Props> = ({ onSend }) => {
  const { user } = useAuth();
  const { items } = useInventory(user?.id, 'emoji');

  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' as const }}>
      {items.slice(0, 6).map((item) => (
        <button
          key={item.item_id}
          onClick={() => item.asset_url && onSend(item.asset_url)}
          aria-label={item.name}
          style={{
            width: 38, height: 38, borderRadius: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, padding: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {item.asset_url}
        </button>
      ))}
    </div>
  );
};

export default EmojiPanel;
