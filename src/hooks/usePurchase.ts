import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const RPC_ERRORS: Record<string, string> = {
  not_authenticated:    'You must be logged in to purchase.',
  item_not_found:       'Item no longer available.',
  item_not_purchasable: 'This item cannot be purchased.',
  already_owned:        'You already own this item.',
  insufficient_credits: 'Not enough credits.',
};

export function usePurchase(onSuccess: () => void) {
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchase = useCallback(async (itemId: string) => {
    setPurchasing(true);
    setError(null);
    try {
      const { data: raw, error: rpcError } = await (supabase.rpc as any)('purchase_item', { p_item_id: itemId });
      const data = raw as { success: boolean; error?: string; new_balance?: number } | null;
      if (rpcError) throw new Error('Purchase failed. Please try again.');
      if (!data?.success) {
        throw new Error(RPC_ERRORS[data?.error ?? ''] ?? 'Purchase failed. Please try again.');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [onSuccess]);

  const clearError = useCallback(() => setError(null), []);

  return { purchase, purchasing, error, clearError };
}
