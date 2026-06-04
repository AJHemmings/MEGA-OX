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
      <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 12 }}>
        {shopItems.length} shop item{shopItems.length !== 1 ? 's' : ''}
      </div>

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
            gridTemplateColumns: '36px 1fr 80px 90px 90px 60px',
            gap: 8, padding: '8px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={headerCell} />
            <div style={headerCell}>Name</div>
            <div style={headerCell}>Price</div>
            <div style={headerCell}>Visible</div>
            <div style={headerCell}>Featured</div>
            <div style={headerCell}>Type</div>
          </div>

          {shopItems.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>
              No shop items.
            </div>
          )}

          {shopItems.map(item => (
            <div key={item.id} style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 80px 90px 90px 60px',
              gap: 8, padding: '8px 14px', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              opacity: item.archived ? 0.4 : 1,
            }}>
              {/* preview */}
              <div style={{
                width: 28, height: 28, borderRadius: 4, overflow: 'hidden',
                background: 'rgba(255,255,255,0.06)',
              }}>
                {item.asset_url && (
                  <img src={item.asset_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>

              {/* name */}
              <div style={{ fontSize: 12, color: tokens.text, fontWeight: 600 }}>{item.name}</div>

              {/* price */}
              <div style={{ fontSize: 11, color: tokens.credits }}>
                {item.price != null ? `${item.price} cr` : '—'}
              </div>

              {/* visible toggle */}
              <div>
                <button
                  onClick={() => updateItem(item.id, { visible: !item.visible })}
                  style={toggleBtn(item.visible, tokens.accent)}
                >
                  {item.visible ? 'Visible' : 'Hidden'}
                </button>
              </div>

              {/* featured toggle */}
              <div>
                <button
                  onClick={() => updateItem(item.id, { featured: !item.featured })}
                  style={toggleBtn(item.featured, tokens.credits)}
                >
                  {item.featured ? 'Featured' : 'Normal'}
                </button>
              </div>

              {/* type */}
              <div style={{ fontSize: 11, color: tokens.textMuted }}>{item.type}</div>
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
