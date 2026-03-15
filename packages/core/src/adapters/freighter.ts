/**
 * Freighter wallet adapter implementation
 * @fileoverview Adapter for Fre Stellar wallet
 */

import { WalletAdapter, WalletAccount, WalletError, Network, WalletType } from '../types';

declare global {
  interface Window {
    freighterApi?: {
      isConnected(): Promise<boolean>;
      getPublicKey(): Promise<string>;
      signTransaction(xdr: string, network?: Network): Promise<string>;
      getNetwork(): Promise<{ network: string }>;
      connect(): Promise<{ publicKey: string; network: string }>;
      disconnect(): Promise<void>;
      onAccountChanged(callback: (publicKey: string | null) => void): () => void;
      onNetworkChanged(callback: (network: string) => void): () => void;
    };
  }
}

/**
 * Freighter wallet adapter
 * @see https://www.freighter.app/
 */
export class FreighterAdapter implements WalletAdapter {
  readonly type: WalletType = 'freighter';
  readonly name = 'Freighter';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY3NjJEMCIvPgo8cGF0aCBkPSJNMjAgMTJMMjYgMjBIMjBMMjAgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  readonly url = 'https://www.freighter.app';

  /**
   * Check if Freighter is installed
   * @returns True if Freighter API is available
   */
  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.freighterApi;
  }

  /**
   * Connect to Freighter wallet
   * @returns Promise resolving to account information
   * @throws WalletError if connection fails
   */
  async connect(): Promise<WalletAccount> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Freighter is not installed', 'WALLET_NOT_INSTALLED', 'freighter');
      }

      const publicKey = await window.freighterApi!.getPublicKey();
      const networkDetails = await window.freighterApi!.getNetwork();
      const network = this.mapNetwork(networkDetails.network);

      return {
        publicKey,
        network,
      };
    } catch (error) {
      throw new WalletError(
        `Failed to connect to Freighter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        'freighter'
      );
    }
  }

  /**
   * Disconnect from Freighter
   * @returns Promise resolving when disconnected
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isInstalled()) {
        await window.freighterApi!.disconnect();
      }
    } catch (error) {
      throw new WalletError(
        `Failed to disconnect from Freighter: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCONNECT_FAILED',
        'freighter'
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
        throw new WalletError('Freighter is not installed', 'WALLET_NOT_INSTALLED', 'freighter');
      }

      return await window.freighterApi!.getPublicKey();
    } catch (error) {
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PUBLIC_KEY_FAILED',
        'freighter'
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
        throw new WalletError('Freighter is not installed', 'WALLET_NOT_INSTALLED', 'freighter');
      }

      return await window.freighterApi!.signTransaction(xdr, network);
    } catch (error) {
      throw new WalletError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGN_TRANSACTION_FAILED',
        'freighter'
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
        throw new WalletError('Freighter is not installed', 'WALLET_NOT_INSTALLED', 'freighter');
      }

      const networkDetails = await window.freighterApi!.getNetwork();
      return this.mapNetwork(networkDetails.network);
    } catch (error) {
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_NETWORK_FAILED',
        'freighter'
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

    return window.freighterApi!.onAccountChanged(async (publicKey: string | null) => {
      if (publicKey) {
        try {
          const network = await this.getNetwork();
          callback({
            publicKey,
            network,
          });
        } catch (error) {
          callback(null);
        }
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

    return window.freighterApi!.onNetworkChanged((networkString: string) => {
      const network = this.mapNetwork(networkString);
      callback(network);
    });
  }

  /**
   * Map network string to Network type
   * @param networkString - Network string from wallet
   * @returns Network type
   */
  private mapNetwork(networkString: string): Network {
    switch (networkString.toUpperCase()) {
      case 'PUBLIC':
        return 'public';
      case 'TESTNET':
        return 'testnet';
      default:
        return 'public';
    }
  }
}
