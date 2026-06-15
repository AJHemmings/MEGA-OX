import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useShop, ShopItem } from '../../hooks/useShop';
import { usePurchase } from '../../hooks/usePurchase';
import { useProgressionContext } from '../../contexts/ProgressionContext';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import TabBar from '../common/TabBar';
import { Coin } from '../icons';
import BackButton from '../common/BackButton';
import { ShopItemCard } from './ShopItemCard';
import { PurchaseConfirmModal } from './PurchaseConfirmModal';

type STab = 'avatar' | 'banner' | 'skins';
type SkinsSubTab = 'markers' | 'board' | 'theme';

const TABS: { key: STab; label: string }[] = [
  { key: 'avatar', label: 'Avatar' },
  { key: 'banner', label: 'Banner' },
  { key: 'skins',  label: 'Skins'  },
];

const SKINS_SUB_TABS: { key: SkinsSubTab; label: string }[] = [
  { key: 'markers', label: 'Markers' },
  { key: 'board',   label: 'Board'   },
  { key: 'theme',   label: 'Theme'   },
];

const SKINS_TYPE_MAP: Record<SkinsSubTab, string[]> = {
  markers: ['marker'],
  board:   ['board'],
  theme:   ['theme'],
};

const SKINS_NOTICE: Record<SkinsSubTab, string> = {
  markers: 'Marker skins go into your inventory. In-game visual unlocks coming soon.',
  board:   'Board skins go into your inventory. In-game visual unlocks coming soon.',
  theme:   'Themes go into your inventory. In-game visual unlocks coming soon.',
};

const ShopPage: React.FC = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const profile   = usePlayerProfile();
  const isMobile  = useIsMobile();

  const [tab, setTab]                   = useState<STab>('avatar');
  const [skinsSubTab, setSkinsSubTab]   = useState<SkinsSubTab>('markers');
  const [pendingItem, setPendingItem]   = useState<ShopItem | null>(null);

  const { catalogue, loading, error: shopError, refetch }                        = useShop(user?.id);
  const { credits, refresh: refreshProgression, loading: progressionLoading }    = useProgressionContext();

  const handleSuccess = useCallback(() => {
    refetch();
    refreshProgression();
    setPendingItem(null);
  }, [refetch, refreshProgression]);

  const { purchase, purchasing, error: purchaseError, clearError } = usePurchase(handleSuccess);

  const tabItems = tab === 'skins'
    ? catalogue.filter(item => SKINS_TYPE_MAP[skinsSubTab].includes(item.type))
    : catalogue.filter(item => item.type === tab);

  return (
    <PageBackground>
      <div style={{
        fontFamily: tokens.font, color: tokens.text,
        maxWidth: 600, margin: '0 auto',
        padding: '0 16px', paddingBottom: isMobile ? 100 : 60,
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
          <BackButton onClick={() => navigate(-1)} />
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

        {/* Main tab switcher */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: tokens.glassRadius, padding: 4, marginBottom: tab === 'skins' ? 8 : 16,
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

        {/* Skins sub-tab switcher */}
        {tab === 'skins' && (
          <div style={{
            display: 'flex', gap: 6, marginBottom: 12,
          }}>
            {SKINS_SUB_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSkinsSubTab(key)}
                style={{
                  padding: '5px 14px', borderRadius: tokens.rPill, border: 'none', cursor: 'pointer',
                  background: skinsSubTab === key ? 'rgba(0,212,170,0.18)' : 'rgba(255,255,255,0.04)',
                  color: skinsSubTab === key ? tokens.accent : tokens.textMuted,
                  fontWeight: skinsSubTab === key ? 800 : 600, fontSize: 11, fontFamily: tokens.font,
                  outline: skinsSubTab === key ? `1px solid ${tokens.accent}` : '1px solid rgba(255,255,255,0.06)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Skins inventory-only notice */}
        {tab === 'skins' && (
          <Glass style={{ marginBottom: 12, padding: '10px 14px' }}>
            <span style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 600 }}>
              {SKINS_NOTICE[skinsSubTab]}
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
        {!loading && !shopError && tabItems.length === 0 && (
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
