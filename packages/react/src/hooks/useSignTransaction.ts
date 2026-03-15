import { useState, useCallback } from 'react';
import { useWallet } from '../context';
import { Network } from '@stellar-wallet-connect/core';

interface UseSignTransactionOptions {
  network?: Network;
  submit?: boolean;
}

interface UseSignTransactionResult {
  signTransaction: (xdr: string, options?: UseSignTransactionOptions) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSignTransaction(): UseSignTransactionResult {
  const { state, signTransaction: signTx } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signTransaction = useCallback(
    async (xdr: string, options: UseSignTransactionOptions = {}): Promise<string> => {
      if (!state.isConnected || !state.wallet) {
        const errorMessage = 'No wallet connected';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await signTx(xdr, options.network);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign transaction';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [state.isConnected, state.wallet, signTx]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signTransaction,
    isLoading,
    error,
    clearError,
  };
}
