import { useContext, useCallback } from 'react';
import { WalletContext } from './WalletProvider';
import type { WalletContextValue } from './WalletProvider';

/**
 * useWallet – consumes WalletContext.
 * Must be used inside <WalletProvider>.
 */
export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}

// Re-export types so consumers can import from one place
export type { WalletContextValue };