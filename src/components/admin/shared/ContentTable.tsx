import React from 'react';
import { AdminItem } from '../../../hooks/useAdminItems';
import { tokens } from '../../../styles/tokens';

interface Tab { key: string; label: string; types: string[] }

interface Props {
  items: AdminItem[];
  loading: boolean;
  error: string | null;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAdd: () => void;
  onEdit: (item: AdminItem) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  sectionTitle: string;
}

export const ContentTable: React.FC<Props> = ({
  items, loading, error, tabs, activeTab, onTabChange,
  onAdd, onEdit, onArchive, onRestore, sectionTitle,
}) => {
  const filtered = tabs && activeTab
    ? items.filter(i => tabs.find(t => t.key === activeTab)?.types.includes(i.type))
    : items;

  return (
    <div style={{ fontFamily: tokens.font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>{sectionTitle}</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
            {items.length} item{items.length !== 1 ? 's' : ''} · cosmetic_items
          </div>
        </div>
        <button onClick={onAdd} style={{
          background: 'rgba(0,212,170,0.18)', border: `1px solid ${tokens.accent}`,
          borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 800,
          color: tokens.accent, cursor: 'pointer', fontFamily: tokens.font,
        }}>
          + Add Item
        </button>
      </div>

      {tabs && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => onTabChange?.(tab.key)} style={{
              padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? tokens.accent : tokens.textMuted,
              fontWeight: activeTab === tab.key ? 700 : 500, fontSize: 11, fontFamily: tokens.font,
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: 20 }}>Loading…</div>}
      {error   && <div style={{ color: tokens.loss,     fontSize: 13, padding: 20 }}>{error}</div>}

      {!loading && !error && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 80px 70px 80px 110px',
            gap: 8, padding: '8px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 9, color: tokens.textMuted, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.8,
          }}>
            <div /><div>Name</div><div>Type</div><div>Price</div><div>Rarity</div><div />
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>
              No items.
            </div>
          )}

          {filtered.map(item => (
            <div key={item.id} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 80px 70px 80px 110px',
              gap: 8, padding: '8px 14px', alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              opacity: item.archived ? 0.4 : 1,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
                {item.asset_url && (
                  <img src={item.asset_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )}
              </div>
              <div style={{
                fontSize: 12, color: tokens.text, fontWeight: 600,
                textDecoration: item.archived ? 'line-through' : 'none',
              }}>{item.name}</div>
              <div style={{ fontSize: 11, color: tokens.textMuted }}>{item.type}</div>
              <div style={{ fontSize: 11, color: tokens.credits }}>{item.price != null ? `${item.price} cr` : '—'}</div>
              <div style={{ fontSize: 11, color: tokens.textMuted }}>{item.rarity}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!item.archived ? (
                  <>
                    <button onClick={() => onEdit(item)} style={{
                      fontSize: 10, color: tokens.accent, cursor: 'pointer',
                      background: 'rgba(0,212,170,0.1)', border: 'none',
                      padding: '3px 8px', borderRadius: 4, fontFamily: tokens.font, fontWeight: 700,
                    }}>Edit</button>
                    <button onClick={() => onArchive(item.id)} style={{
                      fontSize: 10, color: tokens.textMuted, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.05)', border: 'none',
                      padding: '3px 8px', borderRadius: 4, fontFamily: tokens.font,
                    }}>Archive</button>
                  </>
                ) : (
                  <button onClick={() => onRestore(item.id)} style={{
                    fontSize: 10, color: tokens.textMuted, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    padding: '3px 8px', borderRadius: 4, fontFamily: tokens.font,
                  }}>Restore</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
