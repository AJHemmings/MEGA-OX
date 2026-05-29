// src/components/profile/CustomisePage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInventory, OwnedItem } from '../../hooks/useInventory';
import { useLoadout } from '../../hooks/useLoadout';
import { useProgression } from '../../hooks/useProgression';
import { usePlayerProfile } from '../../hooks/usePlayerProfile';
import { useIsMobile } from '../../hooks/useIsMobile';
import { tokens } from '../../styles/tokens';
import PageBackground from '../common/PageBackground';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import TabBar from '../common/TabBar';
import { ChevronLeft, Coin } from '../icons';
import { Loadout } from '../../hooks/useLoadout';

type CTab = 'avatar' | 'banner' | 'badge' | 'emoji';

const SLOT_MAP: Record<Exclude<CTab, 'emoji'>, 'active_avatar_id' | 'active_badge_id' | 'active_banner_id'> = {
  avatar: 'active_avatar_id',
  badge:  'active_badge_id',
  banner: 'active_banner_id',
};

const ItemPreview: React.FC<{ item: OwnedItem }> = ({ item }) => {
  if (item.type === 'emoji') {
    return <span style={{ fontSize: 28 }}>{item.asset_url}</span>;
  }
  if (item.type === 'banner') {
    return (
      <div style={{ width: '100%', height: 32, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        {item.asset_url && (
          <img src={item.asset_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
    );
  }
  const size   = item.type === 'avatar' ? 52 : 36;
  const radius = item.type === 'avatar' ? '50%' : '8px';
  if (!item.asset_url) {
    return <div style={{ width: size, height: size, borderRadius: radius, background: 'rgba(255,255,255,0.08)' }} />;
  }
  return (
    <img src={item.asset_url} alt={item.name} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }} />
  );
};

const CustomisePage: React.FC = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const profile   = usePlayerProfile();
  const isMobile  = useIsMobile();
  const [tab, setTab] = useState<CTab>('avatar');

  const { items }              = useInventory(user?.id);
  const { loadout, loading: loadoutLoading, save } = useLoadout(user?.id);
  const { credits }            = useProgression(user?.id);

  // Draft: local copy of loadout. Only synced from DB on first load, not on every change.
  const [draft, setDraft]     = useState<Loadout>({ active_avatar_id: null, active_badge_id: null, active_banner_id: null });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const initializedRef         = useRef(false);

  useEffect(() => {
    if (!loadoutLoading && !initializedRef.current) {
      setDraft(loadout);
      initializedRef.current = true;
    }
  }, [loadoutLoading, loadout]);

  const isDirty =
    draft.active_avatar_id !== loadout.active_avatar_id ||
    draft.active_badge_id  !== loadout.active_badge_id  ||
    draft.active_banner_id !== loadout.active_banner_id;

  const tabItems = items.filter(i => i.type === tab);

  const isEquipped = (item: OwnedItem): boolean => {
    if (tab === 'emoji') return false;
    return draft[SLOT_MAP[tab]] === item.item_id;
  };

  const handleSelect = (item: OwnedItem) => {
    if (tab === 'emoji') return;
    setDraft(d => ({ ...d, [SLOT_MAP[tab]]: item.item_id }));
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await save(draft);
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  const equippedBanner = items.find(i => i.item_id === draft.active_banner_id);
  const equippedAvatar = items.find(i => i.item_id === draft.active_avatar_id);
  const equippedBadge  = items.find(i => i.item_id === draft.active_badge_id);

  const content = (
    <div style={{
      fontFamily: tokens.font, color: tokens.text,
      maxWidth: 600, margin: '0 auto',
      padding: '0 16px', paddingBottom: isMobile ? 100 : 60,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 12px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: tokens.textMuted, padding: 4, lineHeight: 0 }}
        >
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 800, flex: 1 }}>Customise</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', borderRadius: tokens.rPill,
          background: 'rgba(249,168,37,0.12)', border: '1px solid rgba(249,168,37,0.25)',
        }}>
          <Coin size={14} />
          <span style={{ fontSize: 13, fontWeight: 800, color: tokens.credits }}>{credits}</span>
        </div>
      </div>

      {/* Preview card */}
      <Glass padding={0} style={{ marginBottom: 16, overflow: 'hidden' }}>
        {/* Banner strip */}
        <div style={{
          height: 64, overflow: 'hidden',
          background: equippedBanner?.asset_url
            ? undefined
            : 'linear-gradient(135deg, rgba(0,212,170,0.25), rgba(124,77,255,0.2))',
        }}>
          {equippedBanner?.asset_url && (
            <img src={equippedBanner.asset_url} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        {/* Avatar + name */}
        <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: -28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            border: '3px solid rgba(6,13,31,0.9)',
            background: 'rgba(255,255,255,0.08)', overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: tokens.textMuted,
          }}>
            {equippedAvatar?.asset_url
              ? <img src={equippedAvatar.asset_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : profile?.username?.[0]?.toUpperCase() ?? '?'
            }
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800 }}>{profile?.username ?? '—'}</span>
              {equippedBadge?.asset_url && (
                <img src={equippedBadge.asset_url} alt={equippedBadge.name} title={equippedBadge.name} style={{ width: 16, height: 16 }} />
              )}
            </div>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>Your current loadout</div>
          </div>
        </div>
      </Glass>

      {/* Segmented switcher */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.04)',
        borderRadius: tokens.glassRadius, padding: 4, marginBottom: 16,
      }}>
        {(['avatar', 'banner', 'badge', 'emoji'] as CTab[]).map(t => {
          const label = t === 'avatar' ? 'Avatar' : t === 'banner' ? 'Banner' : t === 'badge' ? 'Badge' : 'Emoji';
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: tab === t ? 'rgba(0,212,170,0.18)' : 'transparent',
              color: tab === t ? tokens.accent : tokens.textMuted,
              fontWeight: tab === t ? 800 : 600, fontSize: 12, fontFamily: tokens.font,
              transition: 'background 0.15s, color 0.15s',
            }}>
              {label}
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <div style={{ marginBottom: 16 }}>
        <PrimaryButton
          onClick={handleSave}
          disabled={(!isDirty && !saved) || saving}
          fullWidth
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </PrimaryButton>
      </div>

      {/* Item grid */}
      {tabItems.length === 0 ? (
        <div style={{ color: tokens.textDim, textAlign: 'center', padding: 40, fontSize: 14 }}>
          {tab === 'emoji' ? 'No emoji unlocked yet.' : `No ${tab}s in your collection yet.`}
          {tab !== 'emoji' && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: tokens.accent, fontFamily: tokens.font,
                  fontSize: 13, fontWeight: 700,
                }}
              >
                Get more items →
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {tabItems.map(item => {
              const equipped = isEquipped(item);
              return (
                <button
                  key={item.item_id}
                  onClick={() => handleSelect(item)}
                  aria-pressed={equipped}
                  style={{
                    padding: 10, borderRadius: 14,
                    cursor: tab === 'emoji' ? 'default' : 'pointer',
                    border: 'none',
                    background: equipped ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                    outline: equipped
                      ? `1.5px solid ${tokens.accent}`
                      : '1px solid rgba(255,255,255,0.06)',
                    position: 'relative',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    fontFamily: tokens.font,
                  }}
                >
                  {equipped && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6,
                      padding: '2px 6px', borderRadius: 4,
                      background: 'rgba(0,212,170,0.2)', fontSize: 8, fontWeight: 800,
                      color: tokens.accent, letterSpacing: 0.6,
                    }}>
                      EQUIPPED
                    </div>
                  )}
                  <ItemPreview item={item} />
                  <span style={{ fontSize: 10, color: tokens.textMuted, textAlign: 'center', fontWeight: 600, lineHeight: 1.3 }}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
          {tab !== 'emoji' && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => navigate('/shop')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: tokens.accent, fontFamily: tokens.font,
                  fontSize: 13, fontWeight: 700,
                }}
              >
                Get more items →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <PageBackground>
      {content}
      {isMobile && <TabBar username={profile?.username ?? undefined} />}
    </PageBackground>
  );
};

export default CustomisePage;
