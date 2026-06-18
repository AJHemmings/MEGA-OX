import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { captureContext } from '../lib/errorCapture';
import { SerializedState } from '../lib/gameSerializer';

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('submit_bug_report', {
        p_title:       args.title,
        p_description: args.description,
        p_category:    args.category,
        p_context:     context,
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
