import React from 'react';
import { tokens } from '../../styles/tokens';
import { Coin } from '../icons';
import Pill from '../common/Pill';
import { ShopItem } from '../../hooks/useShop';

interface Props {
  item: ShopItem;
  onBuy: () => void;
  purchasing: boolean;
  balance: number;
}

const ItemPreview: React.FC<{ item: ShopItem }> = ({ item }) => {
  if (item.type === 'banner') {
    return (
      <div style={{ width: '100%', height: 28, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        {item.asset_url && (
          <img src={item.asset_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
    );
  }
  if (item.type === 'avatar') {
    const size = 44;
    return item.asset_url
      ? <img src={item.asset_url} alt={item.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      : <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />;
  }
  // badge, board, marker — square preview
  const size = 36;
  const radius = item.type === 'badge' ? '50%' : '8px';
  return item.asset_url
    ? <img src={item.asset_url} alt={item.name} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }} />
    : <div style={{ width: size, height: size, borderRadius: radius, background: 'rgba(255,255,255,0.08)' }} />;
};

const RarityColor: Record<string, string> = {
  common:    tokens.textDim,
  rare:      tokens.accent,
  epic:      '#9f7aea',
  legendary: tokens.credits,
};

export const ShopItemCard: React.FC<Props> = ({ item, onBuy, purchasing, balance }) => {
  const canAfford = balance >= item.price;
  const isDisabled = item.owned || purchasing || !canAfford;

  return (
    <div style={{
      padding: 10, borderRadius: 14,
      background: item.owned ? 'rgba(0,212,170,0.06)' : 'rgba(255,255,255,0.04)',
      outline: item.owned
        ? `1.5px solid ${tokens.accent}`
        : '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      fontFamily: tokens.font,
      position: 'relative',
    }}>
      {/* Rarity dot for non-common items */}
      {item.rarity !== 'common' && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          width: 6, height: 6, borderRadius: '50%',
          background: RarityColor[item.rarity] ?? tokens.textDim,
        }} />
      )}

      <ItemPreview item={item} />

      <span style={{ fontSize: 10, color: tokens.textMuted, textAlign: 'center', fontWeight: 600, lineHeight: 1.3 }}>
        {item.name}
      </span>

      {item.owned ? (
        <Pill variant="teal" style={{ fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Owned
        </Pill>
      ) : (
        <button
          type="button"
          onClick={onBuy}
          disabled={isDisabled}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: tokens.rPill,
            background: canAfford && !purchasing
              ? 'rgba(0,212,170,0.18)'
              : 'rgba(255,255,255,0.05)',
            border: canAfford && !purchasing
              ? `1px solid ${tokens.accent}`
              : '1px solid rgba(255,255,255,0.10)',
            color: canAfford && !purchasing ? tokens.accent : tokens.textDim,
            fontSize: 10, fontWeight: 800, cursor: isDisabled ? 'not-allowed' : 'pointer',
            fontFamily: tokens.font,
            opacity: isDisabled ? 0.6 : 1,
          }}
        >
          Buy&nbsp;<Coin size={10} />{item.price.toLocaleString()} cr
        </button>
      )}
    </div>
  );
};
