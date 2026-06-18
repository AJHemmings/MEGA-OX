import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { captureContext } from '../lib/errorCapture';
import { SerializedState } from '../lib/gameSerializer';
import { Json } from '../lib/database.types';

type SubmitResult = 'ok' | 'rate_limited' | 'error';

interface SubmitArgs {
  title:       string;
  description: string;
  category:    string;
  gameId?:     string | null;
  gameState?:  SerializedState | null;
}

export function useBugReport() {
  const [submitting, setSubmitting] = useState(false);

  const submit = useCallback(async (args: SubmitArgs): Promise<SubmitResult> => {
    setSubmitting(true);
    try {
      const context = captureContext({ gameId: args.gameId, gameState: args.gameState });
      const { error } = await supabase.rpc('submit_bug_report', {
        p_title:       args.title,
        p_description: args.description,
        p_category:    args.category,
        p_context:     context as unknown as Json,
      });

      if (error) {
        if (error.message.includes('rate_limit_exceeded')) return 'rate_limited';
        return 'error';
      }
      return 'ok';
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting };
}
