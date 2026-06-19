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
  sendPasswordReset: (email: string) => Promise<void>;
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

      // Create profile on first sign-in after email confirmation.
      // username is stored in user_metadata during signUp; only email-signup
      // users have it. If no profile row exists yet, create it now.
      if ((_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') && session?.user?.user_metadata?.username) {
        const u = session.user;
        supabase.from('profiles').select('id').eq('id', u.id).maybeSingle()
          .then(({ data: existing }) => {
            if (!existing) {
              supabase.from('profiles').insert({ id: u.id, username: u.user_metadata.username });
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const sendPasswordReset = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
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
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, sendPasswordReset, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
