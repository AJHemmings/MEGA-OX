// src/lib/postGame.ts
import { supabase } from './supabase';
import type { PostGameResult } from '../components/progression/PostGameModal';

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
