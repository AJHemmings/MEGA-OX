import React, { useState, useEffect } from 'react';
import { AdminItem, ItemFormData } from '../../../hooks/useAdminItems';
import { tokens } from '../../../styles/tokens';
import Glass from '../../common/Glass';
import PrimaryButton from '../../common/PrimaryButton';
import SecondaryButton from '../../common/SecondaryButton';
import { AssetUpload } from './AssetUpload';

interface Props {
  item: AdminItem | null;
  typeOptions: string[];
  onSave: (form: ItemFormData) => Promise<string | null>;
  onClose: () => void;
}

const RARITY_OPTIONS = ['common', 'rare', 'epic', 'legendary'];

const empty = (): ItemFormData => ({
  name: '', type: '', asset_url: '', price: 0, rarity: 'common', animated: false,
});

export const ItemFormModal: React.FC<Props> = ({ item, typeOptions, onSave, onClose }) => {
  const [form, setForm]       = useState<ItemFormData>(empty());
  const [priceStr, setPriceStr] = useState('0');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setForm({
        name:      item.name,
        type:      item.type,
        asset_url: item.asset_url ?? '',
        price:     item.price ?? 0,
        rarity:    item.rarity,
        animated:  item.animated,
      });
      setPriceStr(String(item.price ?? 0));
    } else {
      setForm({ ...empty(), type: typeOptions[0] ?? '' });
      setPriceStr('0');
    }
    setError(null);
  }, [item, typeOptions]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    const err = await onSave(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, padding: '6px 10px', fontSize: 12, color: tokens.text,
    fontFamily: tokens.font, outline: 'none',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    background: tokens.bgCard,
    colorScheme: 'dark',
  };

  const optionStyle: React.CSSProperties = {
    background: tokens.bgCard,
    color: tokens.text,
  };

  const field = (label: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: tokens.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(6,13,31,0.80)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={saving ? undefined : onClose}
    >
      <Glass style={{ maxWidth: 600, width: '100%', padding: 0 }}>
        <div
          style={{ padding: 24, fontFamily: tokens.font, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: 16, fontWeight: 800, color: tokens.text, marginBottom: 20 }}>
            {item ? `Edit — ${item.name}` : 'Add Item'}
          </div>

          {field('Name',
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle} placeholder="Item name" />
          )}

          {field('Type',
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={selectStyle}>
              {typeOptions.map(t => <option key={t} value={t} style={optionStyle}>{t}</option>)}
            </select>
          )}

          {field('Price (credits)',
            <input
              type="text"
              inputMode="numeric"
              value={priceStr}
              placeholder="0"
              onFocus={e => e.target.select()}
              onChange={e => {
                const digits = e.target.value.replace(/[^0-9]/g, '');
                setPriceStr(digits);
                setForm(f => ({ ...f, price: digits === '' ? 0 : parseInt(digits, 10) }));
              }}
              style={inputStyle}
            />
          )}

          {field('Rarity',
            <select value={form.rarity} onChange={e => setForm(f => ({ ...f, rarity: e.target.value }))}
              style={selectStyle}>
              {RARITY_OPTIONS.map(r => <option key={r} value={r} style={optionStyle}>{r}</option>)}
            </select>
          )}

          {field('Animated',
            <select value={form.animated ? 'yes' : 'no'}
              onChange={e => setForm(f => ({ ...f, animated: e.target.value === 'yes' }))}
              style={selectStyle}>
              <option value="no" style={optionStyle}>No</option>
              <option value="yes" style={optionStyle}>Yes (Lottie JSON)</option>
            </select>
          )}

          <AssetUpload
            value={form.asset_url}
            onChange={url => setForm(f => ({ ...f, asset_url: url }))}
          />

          {error && (
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 6,
              background: 'rgba(229,62,62,0.12)', color: tokens.loss, fontSize: 12,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <SecondaryButton onClick={onClose} disabled={saving} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
          </div>
        </div>
      </Glass>
    </div>
  );
};
