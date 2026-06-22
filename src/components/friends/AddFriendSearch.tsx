import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface SearchResult {
  id: string;
  username: string;
}

interface AddFriendSearchProps {
  excludeIds: string[];
}

export function AddFriendSearch({ excludeIds }: AddFriendSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const { data: { user } } = await supabase.auth.getUser();
    const allExcluded = [...new Set([user?.id ?? '', ...excludeIds])];
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${q}%`)
      .not('id', 'in', `(${allExcluded.join(',')})`)
      .limit(8);
    setResults(data ?? []);
    setSearching(false);
  }, [excludeIds]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  async function handleSend(addresseeId: string) {
    setError(null);
    try {
      const { error: rpcError } = await (supabase as any).rpc('send_friend_request', { p_addressee_id: addresseeId });
      if (rpcError) throw new Error(rpcError.message);
      setSentTo(prev => new Set(prev).add(addresseeId));
    } catch (e: any) {
      setError(e.message ?? 'Failed to send request');
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <input
        type="text"
        placeholder="Search by username…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', padding: '8px 12px', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
        }}
      />
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{error}</p>}
      {searching && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Searching…</p>}
      {results.length > 0 && (
        <div style={{
          marginTop: 4, background: 'rgba(255,255,255,0.05)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {results.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ color: '#fff', fontSize: 14 }}>{r.username}</span>
              <button
                onClick={() => handleSend(r.id)}
                disabled={sentTo.has(r.id)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12,
                  background: sentTo.has(r.id) ? 'rgba(255,255,255,0.1)' : '#6c63ff',
                  color: '#fff', border: 'none', cursor: sentTo.has(r.id) ? 'default' : 'pointer',
                }}
              >
                {sentTo.has(r.id) ? 'Sent ✓' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      )}
      {!searching && query.trim().length >= 2 && results.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>No users found.</p>
      )}
    </div>
  );
}
