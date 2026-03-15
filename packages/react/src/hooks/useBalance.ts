import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context';
import { Network } from '@stellar-wallet-connect/core';

interface UseBalanceOptions {
  assetCode?: string;
  assetIssuer?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
}

interface UseBalanceResult {
  balance: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBalance(options: UseBalanceOptions = {}): UseBalanceResult {
  const { state, getBalance } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    assetCode = 'XLM',
    assetIssuer,
    refreshInterval = 30000, // 30 seconds
    autoRefresh = true,
  } = options;

  const refresh = useCallback(async () => {
    if (!state.isConnected || !state.account) {
      setBalance(null);
      setError('No wallet connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getBalance(assetCode, assetIssuer);
      setBalance(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMessage);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [state.isConnected, state.account, getBalance, assetCode, assetIssuer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh || !state.isConnected) {
      return;
    }

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh, state.isConnected]);

  return {
    balance,
    isLoading,
    error,
    refresh,
  };
}
