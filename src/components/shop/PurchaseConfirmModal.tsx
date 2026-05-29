import React from 'react';
import { tokens } from '../../styles/tokens';
import { Coin } from '../icons';
import Glass from '../common/Glass';
import PrimaryButton from '../common/PrimaryButton';
import SecondaryButton from '../common/SecondaryButton';
import { ShopItem } from '../../hooks/useShop';

interface Props {
  item: ShopItem;
  balance: number;
  purchasing: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PurchaseConfirmModal: React.FC<Props> = ({
  item, balance, purchasing, error, onConfirm, onCancel,
}) => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(6,13,31,0.80)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
    onClick={purchasing ? undefined : onCancel}
  >
    <Glass style={{ maxWidth: 340, width: '100%', padding: 0 }}>
      {/* Inner div stops backdrop click closing modal — Glass does not accept onClick */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-modal-title"
        style={{ padding: 24, fontFamily: tokens.font }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div
          id="purchase-modal-title"
          style={{
            fontSize: 12, fontWeight: 700, letterSpacing: 1.2,
            color: tokens.textMuted, textTransform: 'uppercase', marginBottom: 6,
          }}
        >
          Confirm Purchase
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: tokens.text, marginBottom: 20 }}>
          {item.name}
        </div>

        {/* Cost row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          background: tokens.innerBg, borderRadius: 10, border: tokens.innerBorder,
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600 }}>Cost</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, color: tokens.credits, fontSize: 14 }}>
            <Coin size={13} />
            {item.price.toLocaleString()}
          </span>
        </div>

        {/* Balance after */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          background: tokens.innerBg, borderRadius: 10, border: tokens.innerBorder,
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 13, color: tokens.textMuted, fontWeight: 600 }}>Balance after</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, color: tokens.text, fontSize: 14 }}>
            <Coin size={13} />
            {(balance - item.price).toLocaleString()}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '8px 12px', borderRadius: 8, marginBottom: 16,
            background: 'rgba(229,62,62,0.12)', border: '1px solid rgba(229,62,62,0.30)',
            color: tokens.loss, fontSize: 12, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <SecondaryButton onClick={onCancel} disabled={purchasing} style={{ flex: 1 }}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={onConfirm} disabled={purchasing} style={{ flex: 1 }}>
            {purchasing ? 'Buying…' : 'Buy'}
          </PrimaryButton>
        </div>
      </div>
    </Glass>
  </div>
);
