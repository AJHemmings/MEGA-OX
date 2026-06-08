import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AiConfigValues {
  medium: { win_rule_strength: number; poison_filter_strength: number };
  hard:   { win_rule_strength: number; poison_filter_strength: number; minimax_depth: number };
}

export const AI_CONFIG_DEFAULTS: AiConfigValues = {
  medium: { win_rule_strength: 80, poison_filter_strength: 70 },
  hard:   { win_rule_strength: 95, poison_filter_strength: 90, minimax_depth: 3 },
};

export function useAiConfig() {
  const [config, setConfig]   = useState<AiConfigValues>(AI_CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await (supabase as any).from('ai_config').select('difficulty,rule_name,strength');
    if (!data) { setLoading(false); return; }

    const next: AiConfigValues = {
      medium: { ...AI_CONFIG_DEFAULTS.medium },
      hard:   { ...AI_CONFIG_DEFAULTS.hard },
    };
    for (const row of (data as { difficulty: string; rule_name: string; strength: number }[])) {
      if (row.difficulty === 'medium') {
        if (row.rule_name === 'win_rule_strength')      next.medium.win_rule_strength      = row.strength;
        if (row.rule_name === 'poison_filter_strength') next.medium.poison_filter_strength = row.strength;
      }
      if (row.difficulty === 'hard') {
        if (row.rule_name === 'win_rule_strength')      next.hard.win_rule_strength      = row.strength;
        if (row.rule_name === 'poison_filter_strength') next.hard.poison_filter_strength = row.strength;
        if (row.rule_name === 'minimax_depth')          next.hard.minimax_depth          = row.strength;
      }
    }
    setConfig(next);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { config, loading, refetch: fetch };
}
