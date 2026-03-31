import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { callPostGameHandler } from '../lib/postGame';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function processMissedRewards(userId: string) {
    // Query games where THIS player's per-player rewards column is still pending/processing.
    // Two passes: once as player_x, once as player_o.
    const [{ data: asX }, { data: asO }] = await Promise.all([
      supabase.from('games').select('id')
        .eq('status', 'complete')
        .eq('player_x_id', userId)
        .in('player_x_rewards_status', ['pending', 'processing'])
        .lt('player_x_rewards_retry_count', 3),
      supabase.from('games').select('id')
        .eq('status', 'complete')
        .eq('player_o_id', userId)
        .in('player_o_rewards_status', ['pending', 'processing'])
        .lt('player_o_rewards_retry_count', 3),
    ]);

    const missed = [...(asX ?? []), ...(asO ?? [])];
    if (missed.length === 0) return;

    for (const game of missed) {
      await callPostGameHandler(game.id).catch(() => {
        // Silent failure — will retry next login
      });
    }
  }

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        processMissedRewards(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    // Create profile (triggers auto-create of stats, balance, streak)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, username });
      if (profileError) return { error: profileError };
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
