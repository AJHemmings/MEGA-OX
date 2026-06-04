import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminTransaction {
  id: string;
  created_at: string;
  amount: number;
  player_username: string;
  item_name: string;
}

export function useAdminTransactions(search: string) {
  const [rows, setRows]       = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('transactions')
      .select('id, created_at, amount, profiles(username), cosmetic_items(name)')
      .eq('type', 'purchase')
      .order('created_at', { ascending: false })
      .limit(200);

    if (err) { setError('Failed to load transactions.'); setLoading(false); return; }

    const mapped: AdminTransaction[] = (data ?? []).map((r: any) => ({
      id:              r.id,
      created_at:      r.created_at,
      amount:          r.amount,
      player_username: r.profiles?.username ?? '—',
      item_name:       r.cosmetic_items?.name ?? '—',
    }));

    setRows(mapped);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = rows.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return r.player_username.toLowerCase().includes(q) || r.item_name.toLowerCase().includes(q);
  });

  return { rows: filtered, loading, error };
}
