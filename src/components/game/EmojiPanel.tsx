// src/components/game/EmojiPanel.tsx
import React, { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onSend: (emoji: string) => void;
}

const EmojiPanel: React.FC<Props> = ({ onSend }) => {
  const { user } = useAuth();
  const { items } = useInventory(user?.id, 'emoji');
  const [open, setOpen] = useState(false);

  const handleSend = (assetUrl: string | null) => {
    if (!assetUrl) return;
    onSend(assetUrl);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Send emoji"
        style={{
          background: '#2a3441', border: '1px solid #4a5568',
          borderRadius: '8px', padding: '8px 12px',
          color: '#a0aec0', cursor: 'pointer', fontSize: '18px',
        }}
      >
        😊
      </button>

      {open && items.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '44px', left: 0,
          background: '#2a3441', border: '1px solid #4a5568',
          borderRadius: '10px', padding: '8px',
          display: 'flex', gap: '6px', zIndex: 20,
        }}>
          {items.map(item => (
            // asset_url for emoji items stores the raw unicode glyph (e.g. '👍'), not a URL
            <button
              key={item.item_id}
              onClick={() => handleSend(item.asset_url)}
              aria-label={item.name}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '24px', padding: '4px', borderRadius: '6px',
              }}
            >
              {item.asset_url}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiPanel;
