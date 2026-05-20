import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface OwnedItem {
  item_id: string;
  name: string;
  type: string;
  asset_url: string | null;
  rarity: string;
  acquired_at: string | null;
}

export function useInventory(playerId: string | undefined, type?: string) {
  const [items, setItems] = useState<OwnedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('player_inventory')
        .select('item_id, acquired_at, cosmetic_items(name, type, asset_url, rarity)')
        .eq('player_id', playerId);

      // Filter by type client-side — PostgREST does not support .eq() on embedded resource columns
      const mapped: OwnedItem[] = (data ?? [])
        .filter((row: any) => row.cosmetic_items !== null)
        .filter((row: any) => !type || row.cosmetic_items.type === type)
        .map((row: any) => ({
          item_id:     row.item_id,
          name:        row.cosmetic_items.name,
          type:        row.cosmetic_items.type,
          asset_url:   row.cosmetic_items.asset_url,
          rarity:      row.cosmetic_items.rarity,
          acquired_at: row.acquired_at,
        }));

      setItems(mapped);
      setLoading(false);
    };

    fetch();
  }, [playerId, type]);

  return { items, loading };
}
