import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ShopItem {
  id: string;
  name: string;
  type: string;
  asset_url: string | null;
  price: number;
  rarity: string;
  owned: boolean;
}

export function useShop(userId: string | undefined) {
  const [catalogue, setCatalogue] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShop = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [{ data: items, error: itemErr }, { data: inventory, error: invErr }] = await Promise.all([
        supabase
          .from('cosmetic_items')
          .select('id, name, type, asset_url, price, rarity')
          .gt('price', 0),
        supabase
          .from('player_inventory')
          .select('item_id')
          .eq('player_id', userId),
      ]);

      if (itemErr) throw itemErr;
      if (invErr)  throw invErr;

      const ownedIds = new Set((inventory ?? []).map((r: any) => r.item_id as string));
      setCatalogue(
        (items ?? []).map((item: any): ShopItem => ({
          id:        item.id,
          name:      item.name,
          type:      item.type,
          asset_url: item.asset_url,
          price:     item.price as number, // .gt('price', 0) filter excludes nulls
          rarity:    item.rarity,
          owned:     ownedIds.has(item.id),
        }))
      );
      setError(null);
    } catch (err) {
      console.error('useShop fetch failed:', err);
      setError('Failed to load shop.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  return { catalogue, loading, error, refetch: fetchShop };
}
