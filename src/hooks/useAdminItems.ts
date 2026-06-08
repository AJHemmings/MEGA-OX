import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminItem {
  id: string;
  name: string;
  type: string;
  asset_url: string | null;
  price: number | null;
  rarity: string;
  source: string;
  animated: boolean;
  visible: boolean;
  featured: boolean;
  archived: boolean;
}

export interface ItemFormData {
  name: string;
  type: string;
  asset_url: string;
  price: number;
  rarity: string;
  animated: boolean;
  source?: string;
}

export function useAdminItems(typeFilter?: string | string[]) {
  const [items, setItems]     = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const typeFilterKey = Array.isArray(typeFilter) ? typeFilter.join(',') : (typeFilter ?? '');

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('cosmetic_items')
      .select('*')
      .order('type').order('name');

    if (typeFilterKey) {
      query = query.in('type', typeFilterKey.split(','));
    }

    const { data, error: err } = await query;
    if (err) { setError('Failed to load items.'); setLoading(false); return; }
    setItems((data ?? []) as unknown as AdminItem[]);
    setError(null);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilterKey]);

  useEffect(() => { fetch(); }, [fetch]);

  const addItem = useCallback(async (form: ItemFormData): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').insert({
      name:      form.name,
      type:      form.type,
      asset_url: form.asset_url || null,
      price:     form.price,
      rarity:    form.rarity,
      animated:  form.animated,
      source:    form.source ?? 'shop',
    });
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  const updateItem = useCallback(async (id: string, form: Partial<ItemFormData> & { visible?: boolean; featured?: boolean }): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').update(form).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  const archiveItem = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').update({ archived: true } as any).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  const restoreItem = useCallback(async (id: string): Promise<string | null> => {
    const { error: err } = await supabase.from('cosmetic_items').update({ archived: false } as any).eq('id', id);
    if (err) return err.message;
    await fetch();
    return null;
  }, [fetch]);

  return { items, loading, error, refetch: fetch, addItem, updateItem, archiveItem, restoreItem };
}
