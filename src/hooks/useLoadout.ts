import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Loadout {
  active_avatar_id: string | null;
  active_badge_id:  string | null;
  active_banner_id: string | null;
}

export function useLoadout(playerId: string | undefined) {
  const [loadout, setLoadout] = useState<Loadout>({
    active_avatar_id: null,
    active_badge_id:  null,
    active_banner_id: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) { setLoading(false); return; }

    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('active_avatar_id, active_badge_id, active_banner_id')
          .eq('id', playerId)
          .single();
        if (data) setLoadout(data);
      } catch (err) {
        console.error('useLoadout fetch failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerId]);

  const equip = useCallback(async (
    slot: 'active_avatar_id' | 'active_badge_id' | 'active_banner_id',
    itemId: string
  ) => {
    if (!playerId) return;
    const prev = loadout[slot];
    setLoadout(l => ({ ...l, [slot]: itemId })); // optimistic
    const { error } = await supabase
      .from('profiles')
      .update({ [slot]: itemId })
      .eq('id', playerId);
    if (error) {
      setLoadout(l => ({ ...l, [slot]: prev })); // roll back on failure
      console.error('equip failed:', error.message);
    }
  }, [playerId, loadout]);

  return { loadout, loading, equip };
}
