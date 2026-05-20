// src/components/profile/CustomisePage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory, OwnedItem } from '../../hooks/useInventory';
import { useLoadout } from '../../hooks/useLoadout';

type Tab = 'avatar' | 'badge' | 'banner' | 'emoji';

const TABS: { key: Tab; label: string }[] = [
  { key: 'avatar', label: 'Avatar' },
  { key: 'badge',  label: 'Badge'  },
  { key: 'banner', label: 'Banner' },
  { key: 'emoji',  label: 'Emoji'  },
];

const SLOT_MAP: Record<Exclude<Tab, 'emoji'>, 'active_avatar_id' | 'active_badge_id' | 'active_banner_id'> = {
  avatar: 'active_avatar_id',
  badge:  'active_badge_id',
  banner: 'active_banner_id',
};

const CustomisePage: React.FC = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [tab, setTab] = useState<Tab>('avatar');

  const { items, loading } = useInventory(user?.id);
  const { loadout, equip } = useLoadout(user?.id);

  const tabItems = items.filter(i => i.type === tab);

  const isEquipped = (item: OwnedItem): boolean => {
    if (tab === 'emoji') return false;
    return loadout[SLOT_MAP[tab]] === item.item_id;
  };

  const handleSelect = (item: OwnedItem) => {
    if (tab === 'emoji') return; // emojis have no loadout slot
    equip(SLOT_MAP[tab], item.item_id);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a2332', color: '#fff', padding: '24px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: '20px' }}>←</button>
          <h1 style={{ margin: 0, fontSize: '22px' }}>Customise</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: tab === t.key ? 700 : 400,
                background: tab === t.key ? '#00d4aa' : '#2a3441',
                color: tab === t.key ? '#1a2332' : '#a0aec0',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Item grid */}
        {loading ? (
          <div style={{ color: '#a0aec0', textAlign: 'center', padding: '40px 0' }}>Loading...</div>
        ) : tabItems.length === 0 ? (
          <div style={{ color: '#4a5568', textAlign: 'center', padding: '40px 0' }}>No items yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {tabItems.map(item => (
              <button key={item.item_id} onClick={() => handleSelect(item)}
                style={{
                  background: isEquipped(item) ? '#1a3a3a' : '#2a3441',
                  border: `2px solid ${isEquipped(item) ? '#00d4aa' : '#4a5568'}`,
                  borderRadius: '10px', padding: '12px 8px', cursor: tab === 'emoji' ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                }}>
                <ItemPreview item={item} />
                <span style={{ fontSize: '11px', color: '#a0aec0', textAlign: 'center' }}>{item.name}</span>
                {isEquipped(item) && (
                  <span style={{ fontSize: '10px', color: '#00d4aa', fontWeight: 700 }}>Equipped</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ItemPreview: React.FC<{ item: OwnedItem }> = ({ item }) => {
  if (item.type === 'emoji') {
    return <span style={{ fontSize: '28px' }}>{item.asset_url}</span>;
  }
  if (item.type === 'banner') {
    return (
      <div style={{ width: '100%', height: '30px', borderRadius: '4px', overflow: 'hidden' }}>
        <img src={item.asset_url ?? ''} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  // avatar, badge
  const size = item.type === 'avatar' ? 48 : 32;
  return (
    <img src={item.asset_url ?? ''} alt={item.name}
      style={{ width: size, height: size, borderRadius: item.type === 'avatar' ? '50%' : '4px' }} />
  );
};

export default CustomisePage;
