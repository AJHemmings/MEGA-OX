import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useTutorial = (pageKey: string) => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('tutorial_progress').select('page_key').eq('player_id', user.id).eq('page_key', pageKey).single()
      .then(({ data }) => { if (!data) setShowTutorial(true); });
  }, [user, pageKey]);

  const completeTutorial = async () => {
    if (!user) return;
    await supabase.from('tutorial_progress').insert({ player_id: user.id, page_key: pageKey });
    setShowTutorial(false);
  };

  return { showTutorial, completeTutorial };
};
