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

const RARITY_COLOURS: Record<string, string> = {
  common:    'rgba(180,180,200,0.18)',
  rare:      'rgba(80,140,255,0.22)',
  epic:      'rgba(160,80,255,0.22)',
  legendary: 'rgba(255,180,0,0.22)',
};

const RARITY_TEXT: Record<string, string> = {
  common:    '#a0a0b8',
  rare:      '#6eb0ff',
  epic:      '#b07aff',
  legendary: '#ffb700',
};

export const ContentTable: React.FC<Props> = ({
  items, loading, error, tabs, activeTab, onTabChange,
  onAdd, onEdit, onArchive, onRestore, sectionTitle,
}) => {
  const filtered = tabs && activeTab
    ? items.filter(i => tabs.find(t => t.key === activeTab)?.types.includes(i.type))
    : items;

  return (
    <div style={{ fontFamily: tokens.font }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tokens.text }}>{sectionTitle}</div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button onClick={onAdd} style={{
          background: 'rgba(0,212,170,0.18)', border: `1px solid ${tokens.accent}`,
          borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 800,
          color: tokens.accent, cursor: 'pointer', fontFamily: tokens.font,
        }}>
          + Add
        </button>
      </div>

      {/* Tabs */}
      {tabs && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => onTabChange?.(tab.key)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.05)',
              color: activeTab === tab.key ? tokens.accent : tokens.textMuted,
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 12, fontFamily: tokens.font,
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      {loading && <div style={{ color: tokens.textMuted, fontSize: 13, padding: 20 }}>Loading…</div>}
      {error   && <div style={{ color: tokens.loss,     fontSize: 13, padding: 20 }}>{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: tokens.textMuted, fontSize: 13 }}>
          No items.
        </div>
      )}

      {/* Card grid */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}>
          {filtered.map(item => (
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

              {/* Name */}
              <div style={{
                fontSize: 13, fontWeight: 700, color: tokens.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textDecoration: item.archived ? 'line-through' : 'none',
              }}>
                {item.name}
              </div>

              {/* Price + Rarity row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: tokens.credits }}>
                  {item.source === 'shop' && item.price != null ? `${item.price} cr` : '—'}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                  padding: '2px 7px', borderRadius: 20,
                  background: RARITY_COLOURS[item.rarity] ?? RARITY_COLOURS.common,
                  color: RARITY_TEXT[item.rarity] ?? RARITY_TEXT.common,
                  textTransform: 'capitalize',
                }}>
                  {item.rarity}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                {!item.archived ? (
                  <>
                    <button onClick={() => onEdit(item)} style={{
                      flex: 1, fontSize: 11, fontWeight: 700, color: tokens.accent,
                      background: 'rgba(0,212,170,0.1)', border: 'none',
                      padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontFamily: tokens.font,
                    }}>Edit</button>
                    <button onClick={() => onArchive(item.id)} style={{
                      flex: 1, fontSize: 11, color: tokens.textMuted,
                      background: 'rgba(255,255,255,0.05)', border: 'none',
                      padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontFamily: tokens.font,
                    }}>Archive</button>
                  </>
                ) : (
                  <button onClick={() => onRestore(item.id)} style={{
                    flex: 1, fontSize: 11, color: tokens.textMuted,
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    padding: '5px 0', borderRadius: 5, cursor: 'pointer', fontFamily: tokens.font,
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
