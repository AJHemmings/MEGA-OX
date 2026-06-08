import React, { useState } from 'react';
import { useAdminItems } from '../../hooks/useAdminItems';
import { useAdminTransactions } from '../../hooks/useAdminTransactions';
import { tokens } from '../../styles/tokens';

type MainTab = 'items' | 'transactions';

/* ─── helpers ────────────────────────────────────────────── */

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '6px 16px', borderRadius: tokens.rPill, border: 'none', cursor: 'pointer',
  fontFamily: tokens.font, fontSize: 12, fontWeight: active ? 700 : 500,
  background: active ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
  color: active ? tokens.accent : tokens.textMuted,
  transition: 'background 0.15s',
});

const toggleBtn = (on: boolean, colour: string): React.CSSProperties => ({
  padding: '3px 10px', borderRadius: tokens.rPill, border: `1px solid ${on ? colour : 'rgba(255,255,255,0.12)'}`,
  background: on ? `${colour}22` : 'rgba(255,255,255,0.04)',
  color: on ? colour : tokens.textMuted,
  fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: tokens.font,
  transition: 'all 0.15s',
});

const headerCell: React.CSSProperties = {
  fontSize: 9, color: tokens.textMuted, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: 0.8,
};

/* ─── sub-panels ─────────────────────────────────────────── */

const ItemsPanel: React.FC = () => {
  const { items, loading, error, updateItem } = useAdminItems();
  const shopItems = items.filter(i => i.source === 'shop');

  return (
    <div>
      <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 16 }}>
        {shopItems.length} shop item{shopItems.length !== 1 ? 's' : ''}
      </div>

      {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: 20 }}>Loading…</div>}
      {error   && <div style={{ color: tokens.loss,     fontSize: 13, padding: 20 }}>{error}</div>}

      {!loading && !error && shopItems.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>
          No shop items.
        </div>
      )}

      {!loading && !error && shopItems.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {shopItems.map(item => (
            <div key={item.id} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(255,255,255,${item.archived ? '0.04' : '0.09'})`,
              borderRadius: 10, padding: 14,
              display: 'flex', flexDirection: 'column', gap: 10,
              opacity: item.archived ? 0.45 : 1,
            }}>
              {/* Preview */}
              <div style={{
                width: '100%', aspectRatio: '1 / 1',
                background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {item.asset_url
                  ? <img src={item.asset_url} alt={item.name}
                      style={{ width: '72%', height: '72%', objectFit: 'contain' }} />
                  : <div style={{ fontSize: 22, opacity: 0.2 }}>?</div>
                }
              </div>

              {/* Name + type */}
              <div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: tokens.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.name}</div>
                <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>{item.type}</div>
              </div>

              {/* Price */}
              <div style={{ fontSize: 12, fontWeight: 700, color: tokens.credits }}>
                {item.price != null ? `${item.price} cr` : '—'}
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => updateItem(item.id, { visible: !item.visible })}
                  style={{ ...toggleBtn(item.visible, tokens.accent), flex: 1 }}
                >
                  {item.visible ? 'Visible' : 'Hidden'}
                </button>
                <button
                  onClick={() => updateItem(item.id, { featured: !item.featured })}
                  style={{ ...toggleBtn(item.featured, tokens.credits), flex: 1 }}
                >
                  {item.featured ? 'Featured' : 'Normal'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TransactionsPanel: React.FC = () => {
  const [search, setSearch] = useState('');
  const { rows, loading, error } = useAdminTransactions(search);

  return (
    <div>
      {/* search */}
      <input
        type="text"
        placeholder="Search player or item…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: tokens.innerBg, border: tokens.innerBorder,
          borderRadius: tokens.rInput, padding: '8px 14px',
          fontSize: 12, color: tokens.text, fontFamily: tokens.font,
          outline: 'none', marginBottom: 14,
        }}
      />

      {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: 20 }}>Loading…</div>}
      {error   && <div style={{ color: tokens.loss,     fontSize: 13, padding: 20 }}>{error}</div>}

      {!loading && !error && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          {/* header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 90px 140px',
            gap: 8, padding: '8px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={headerCell}>Player</div>
            <div style={headerCell}>Item</div>
            <div style={headerCell}>Credits</div>
            <div style={headerCell}>Date</div>
          </div>

          {rows.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>
              No transactions found.
            </div>
          )}

          {rows.map(row => (
            <div key={row.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 90px 140px',
              gap: 8, padding: '8px 14px', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: 12, color: tokens.text, fontWeight: 600 }}>{row.player_username}</div>
              <div style={{ fontSize: 12, color: tokens.textMuted }}>{row.item_name}</div>
              <div style={{ fontSize: 12, color: tokens.credits, fontWeight: 700 }}>{row.amount}</div>
              <div style={{ fontSize: 11, color: tokens.textDim }}>
                {new Date(row.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── main component ─────────────────────────────────────── */

const ShopManager: React.FC = () => {
  const [tab, setTab] = useState<MainTab>('items');

  return (
    <div style={{ fontFamily: tokens.font }}>
      {/* page header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>Shop Manager</div>
        <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
          Manage shop items and purchase history
        </div>
      </div>

      {/* tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        <button style={tabBtn(tab === 'items')}        onClick={() => setTab('items')}>Items</button>
        <button style={tabBtn(tab === 'transactions')} onClick={() => setTab('transactions')}>Transactions</button>
      </div>

      {/* panel */}
      <div style={{
        background: tokens.glassBg,
        border: tokens.glassBorder,
        borderRadius: tokens.glassRadius,
        backdropFilter: tokens.glassBlur,
        padding: 20,
        boxShadow: tokens.cardShadow,
      }}>
        {tab === 'items'        && <ItemsPanel />}
        {tab === 'transactions' && <TransactionsPanel />}
      </div>
    </div>
  );
};

export default ShopManager;
