import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface Loadout {
  active_avatar_id:   string | null;
  active_badge_id:    string | null;
  active_banner_id:   string | null;
  active_board_id:    string | null;
  active_marker_id:   string | null; // X marker
  active_marker_o_id: string | null; // O marker
}

const EMPTY_LOADOUT: Loadout = {
  active_avatar_id:   null,
  active_badge_id:    null,
  active_banner_id:   null,
  active_board_id:    null,
  active_marker_id:   null,
  active_marker_o_id: null,
};

export function useLoadout(playerId: string | undefined) {
  const [loadout, setLoadout] = useState<Loadout>(EMPTY_LOADOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!playerId) { setLoading(false); return; }

    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('active_avatar_id, active_badge_id, active_banner_id, active_board_id, active_marker_id, active_marker_o_id')
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
    slot: keyof Loadout,
    itemId: string
  ) => {
    if (!playerId) return;
    let prev: string | null = null;
    setLoadout(l => { prev = l[slot]; return { ...l, [slot]: itemId }; });
    const { error } = await supabase
      .from('profiles')
      .update({ [slot]: itemId } as Partial<Loadout>)
      .eq('id', playerId);
    if (error) {
      setLoadout(l => ({ ...l, [slot]: prev }));
      console.error('equip failed:', error.message);
    }
  }, [playerId]);

  // Save all slots in one DB write. Returns true on success.
  const prevRef = useRef<Loadout | null>(null);
  const save = useCallback(async (newLoadout: Loadout): Promise<boolean> => {
    if (!playerId) return false;
    setLoadout(l => { prevRef.current = l; return newLoadout; });
    const { error } = await supabase
      .from('profiles')
      .update({
        active_avatar_id:   newLoadout.active_avatar_id,
        active_badge_id:    newLoadout.active_badge_id,
        active_banner_id:   newLoadout.active_banner_id,
        active_board_id:    newLoadout.active_board_id,
        active_marker_id:   newLoadout.active_marker_id,
        active_marker_o_id: newLoadout.active_marker_o_id,
      })
      .eq('id', playerId);
    if (error) {
      if (prevRef.current) setLoadout(prevRef.current);
      console.error('save loadout failed:', error.message);
      return false;
    }
    return true;
  }, [playerId]);

  return { loadout, loading, equip, save };
}
