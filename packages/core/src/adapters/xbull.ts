/**
 * xBull wallet adapter implementation
 * @fileoverview Adapter for xBull wallet
 */

import { WalletAdapter, WalletAccount, WalletError, Network, WalletType } from '../types';

declare global {
  interface Window {
    xBull?: {
      isConnected(): Promise<boolean>;
      getPublicKey(): Promise<string>;
      signTransaction(xdr: string, network?: Network): Promise<string>;
      getNetwork(): Promise<Network>;
      connect(): Promise<{ publicKey: string; network: Network }>;
      disconnect(): Promise<void>;
      onAccountChanged(callback: (account: { publicKey: string; network: Network } | null) => void): () => void;
      onNetworkChanged(callback: (network: Network) => void): () => void;
    };
  }
}

/**
 * xBull wallet adapter
 * @see https://xbull.app/
 */
export class XbullAdapter implements WalletAdapter {
  readonly type: WalletType = 'xbull';
  readonly name = 'xBull';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTAgMjBMMjAgMTBMMzAgMjBMMjAgMzBMMTAgMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  readonly url = 'https://xbull.app';

  /**
   * Check if xBull is installed
   * @returns True if xBull API is available
   */
  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.xBull;
  }

  /**
   * Connect to xBull wallet
   * @returns Promise resolving to account information
   * @throws WalletError if connection fails
   */
  async connect(): Promise<WalletAccount> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('xBull is not installed', 'WALLET_NOT_INSTALLED', 'xbull');
      }

      const account = await window.xBull!.connect();
      return {
        publicKey: account.publicKey,
        network: account.network,
      };
    } catch (error) {
      throw new WalletError(
        `Failed to connect to xBull: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Disconnect from xBull
   * @returns Promise resolving when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isInstalled()) {
        await window.xBull!.disconnect();
      }
    } catch (error) {
      throw new WalletError(
        `Failed to disconnect from xBull: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCONNECT_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Get public key from connected wallet
   * @returns Promise resolving to public key
   * @throws WalletError if retrieval fails
   */
  async getPublicKey(): Promise<string> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('xBull is not installed', 'WALLET_NOT_INSTALLED', 'xbull');
      }

      return await window.xBull!.getPublicKey();
    } catch (error) {
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PUBLIC_KEY_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Sign a Stellar transaction
   * @param xdr - Transaction XDR to sign
   * @param network - Target network
   * @returns Promise resolving to signed transaction XDR
   * @throws WalletError if signing fails
   */
  async signTransaction(xdr: string, network?: Network): Promise<string> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('xBull is not installed', 'WALLET_NOT_INSTALLED', 'xbull');
      }

      return await window.xBull!.signTransaction(xdr, network);
    } catch (error) {
      throw new WalletError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGN_TRANSACTION_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Get current network from wallet
   * @returns Promise resolving to network type
   * @throws WalletError if retrieval fails
   */
  async getNetwork(): Promise<Network> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('xBull is not installed', 'WALLET_NOT_INSTALLED', 'xbull');
      }

      return await window.xBull!.getNetwork();
    } catch (error) {
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_NETWORK_FAILED',
        'xbull'
      );
    }
  }

  /**
   * Listen for account changes
   * @param callback - Function called when account changes
   * @returns Cleanup function to remove listener
   */
  onAccountChanged(callback: (account: WalletAccount | null) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    return window.xBull!.onAccountChanged((account: { publicKey: string; network: Network } | null) => {
      if (account) {
        callback({
          publicKey: account.publicKey,
          network: account.network,
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Listen for network changes
   * @param callback - Function called when network changes
   * @returns Cleanup function to remove listener
   */
  onNetworkChanged(callback: (network: Network) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    return window.xBull!.onNetworkChanged(callback);
  }
}
