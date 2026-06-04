import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type AdminRole = 'super_admin' | 'editor';

export function useAdminRole(): { role: AdminRole | null; loading: boolean } {
  const { user } = useAuth();
  const [role, setRole]       = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return; }

    (supabase
      .from('admin_roles' as any)
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle() as any)
      .then(({ data }: any) => {
        setRole((data?.role as AdminRole) ?? null);
        setLoading(false);
      });
  }, [user]);

  return { role, loading };
}
