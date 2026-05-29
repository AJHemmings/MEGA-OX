import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useShop, ShopItem } from '../../hooks/useShop';
import { usePurchase } from '../../hooks/usePurchase';
import { useProgression } from '../../hooks/useProgression';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import TabBar from '../common/TabBar';
import { ChevronLeft, Coin } from '../icons';
import { ShopItemCard } from './ShopItemCard';
import { PurchaseConfirmModal } from './PurchaseConfirmModal';

type STab = 'avatar' | 'badge' | 'banner' | 'skins';

const TABS: { key: STab; label: string }[] = [
  { key: 'avatar', label: 'Avatar' },
  { key: 'badge',  label: 'Badge'  },
  { key: 'banner', label: 'Banner' },
  { key: 'skins',  label: 'Skins'  },
];

const TAB_TYPES: Record<STab, string[]> = {
  avatar: ['avatar'],
  badge:  ['badge'],
  banner: ['banner'],
  skins:  ['board', 'marker'],
};

const ShopPage: React.FC = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const profile   = usePlayerProfile();
  const isMobile  = useIsMobile();

  const [tab, setTab]                 = useState<STab>('avatar');
  const [pendingItem, setPendingItem] = useState<ShopItem | null>(null);

  const { catalogue, loading, error: shopError, refetch }           = useShop(user?.id);
  const { credits, refresh: refreshProgression, loading: progressionLoading } = useProgression(user?.id);

  const handleSuccess = useCallback(() => {
    refetch();
    refreshProgression();
    setPendingItem(null);
  }, [refetch, refreshProgression]);

  const { purchase, purchasing, error: purchaseError, clearError } = usePurchase(handleSuccess);

  const tabItems = catalogue.filter(item => TAB_TYPES[tab].includes(item.type));

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        maxWidth: 600, margin: '0 auto',
        padding: '0 16px', paddingBottom: isMobile ? 100 : 60,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}
          >
            <ChevronLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Shop</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: tokens.rPill,
            background: 'rgba(249,168,37,0.12)', border: '1px solid rgba(249,168,37,0.25)',
          }}>
            <Coin size={14} />
            <span style={{ fontSize: 13, fontWeight: 800, color: tokens.credits }}>
              {progressionLoading ? '–' : credits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: tokens.glassRadius, padding: 4, marginBottom: 16,
        }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: tab === key ? 'rgba(0,212,170,0.18)' : 'transparent',
                color: tab === key ? tokens.accent : tokens.textMuted,
                fontWeight: tab === key ? 800 : 600, fontSize: 12, fontFamily: tokens.font,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Skins inventory-only notice */}
        {tab === 'skins' && (
          <Glass style={{ marginBottom: 12, padding: '10px 14px' }}>
            <span style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 600 }}>
              Board and marker skins go into your inventory. In-game visual unlocks coming soon.
            </span>
          </Glass>
        )}

        {/* Error state */}
        {shopError && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(229,62,62,0.10)', border: '1px solid rgba(229,62,62,0.25)',
            color: tokens.loss, fontSize: 13,
          }}>
            {shopError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.textMuted, fontSize: 14 }}>
            Loading…
          </div>
        )}

        {/* Empty state */}
        {!loading && tabItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: tokens.textDim, fontSize: 14 }}>
            No items available in this category yet.
          </div>
        )}

        {/* Item grid */}
        {!loading && tabItems.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {tabItems.map(item => (
              <ShopItemCard
                key={item.id}
                item={item}
                balance={credits}
                purchasing={purchasing}
                onBuy={() => { clearError(); setPendingItem(item); }}
              />
            ))}
          </div>
        )}
      </div>

      {isMobile && <TabBar username={profile?.username} />}

      {/* Confirm modal */}
      {pendingItem && (
        <PurchaseConfirmModal
          item={pendingItem}
          balance={credits}
          purchasing={purchasing}
          error={purchaseError}
          onConfirm={() => purchase(pendingItem.id)}
          onCancel={() => { if (!purchasing) setPendingItem(null); }}
        />
      )}
    </PageBackground>
  );
};

export default ShopPage;
