// src/lib/postGame.ts
import { supabase } from './supabase';
import type { PostGameResult } from '../components/progression/PostGameModal';

// Completed games where this player's rewards are still pending/processing
// (and haven't exhausted retries) — used to drive the "Request recovery" button.
export async function fetchPendingRewardGameIds(userId: string): Promise<string[]> {
  const [{ data: asX }, { data: asO }] = await Promise.all([
    supabase.from('games').select('id')
      .eq('status', 'complete').eq('player_x_id', userId)
      .in('player_x_rewards_status', ['pending', 'processing'])
      .lt('player_x_rewards_retry_count', 3),
    supabase.from('games').select('id')
      .eq('status', 'complete').eq('player_o_id', userId)
      .in('player_o_rewards_status', ['pending', 'processing'])
      .lt('player_o_rewards_retry_count', 3),
  ]);
  return [...(asX ?? []), ...(asO ?? [])].map(g => g.id);
}

export async function callPostGameHandler(gameId: string): Promise<PostGameResult | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  try {
    const res = await supabase.functions.invoke('post-game-handler', {
      body: { gameId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (res.error) {
      console.error('post-game-handler error:', res.error);
      return null;
    }

    return res.data as PostGameResult;
  } catch (err) {
    console.error('post-game-handler exception:', err);
    return null;
  }
}
