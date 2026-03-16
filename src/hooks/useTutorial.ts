import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useTutorial = (pageKey: string) => {
  const { user } = useAuth();
  const [shouldAutoStart, setShouldAutoStart] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('tutorial_progress')
      .select('page_key')
      .eq('player_id', user.id)
      .eq('page_key', pageKey)
      .single()
      .then(({ data }) => {
        if (!data) setShouldAutoStart(true);
      });
  }, [user, pageKey]);

  // Call when the user finishes or skips the tutorial.
  // Upserts so duplicate calls are safe.
  const markComplete = async () => {
    if (!user) return;
    await supabase
      .from('tutorial_progress')
      .upsert({ player_id: user.id, page_key: pageKey });
    setShouldAutoStart(false);
  };

  // Call from Settings "Replay Tutorial" button.
  // Deletes the completion row so the tour auto-fires on next visit.
  const resetTutorial = async () => {
    if (!user) return;
    await supabase
      .from('tutorial_progress')
      .delete()
      .eq('player_id', user.id)
      .eq('page_key', pageKey);
  };

  return { shouldAutoStart, markComplete, resetTutorial };
};
