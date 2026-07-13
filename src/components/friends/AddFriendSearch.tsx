import React, { useCallback, useState } from 'react';
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
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearching(true);
    setSearched(true);
    setResults([]);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    const allExcluded = [...new Set([user?.id ?? '', ...excludeIds])];

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', trimmed)
      .not('id', 'in', `(${allExcluded.join(',')})`)
      .limit(1);

    if (fetchError) setError('Search failed. Try again.');
    else setResults(data ?? []);
    setSearching(false);
  }, [excludeIds]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') search(query);
  }

  async function handleSend(addresseeId: string) {
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('send_friend_request', { p_addressee_id: addresseeId });
      if (rpcError) throw new Error(rpcError.message);
      setSentTo(prev => new Set(prev).add(addresseeId));
    } catch (e: any) {
      setError(e.message ?? 'Failed to send request');
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Enter exact username…"
          value={query}
          onChange={e => { setQuery(e.target.value); setSearched(false); setResults([]); }}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1, padding: '8px 12px',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, color: '#fff', fontSize: 14, outline: 'none',
          }}
        />
        <button
          onClick={() => search(query)}
          disabled={!query.trim() || searching}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 13,
            background: query.trim() ? '#6c63ff' : 'rgba(255,255,255,0.1)',
            color: '#fff', border: 'none',
            cursor: query.trim() && !searching ? 'pointer' : 'default',
            whiteSpace: 'nowrap',
          }}
        >
          {searching ? '…' : 'Search'}
        </button>
      </div>

      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{error}</p>}

      {searched && !searching && results.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>No user found.</p>
      )}

      {results.length > 0 && (
        <div style={{
          marginTop: 6, background: 'rgba(255,255,255,0.05)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {results.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
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
    </div>
  );
}
