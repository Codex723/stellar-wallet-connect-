/**
 * Lobstr wallet adapter implementation
 * @fileoverview Adapter for Lobstr wallet
 */

import { WalletAdapter, WalletAccount, WalletError, Network, WalletType } from '../types';

declare global {
  interface Window {
    lobstr?: {
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
 * Lobstr wallet adapter
 * @see https://lobstr.co/
 */
export class LobstrAdapter implements WalletAdapter {
  readonly type: WalletType = 'lobstr';
  readonly name = 'Lobstr';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwQjQ1QiIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
  readonly url = 'https://lobstr.co';

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.lobstr;
  }

  async connect(): Promise<WalletAccount> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Lobstr is not installed', 'WALLET_NOT_INSTALLED', 'lobstr');
      }

      const account = await window.lobstr!.connect();
      return {
        publicKey: account.publicKey,
        network: account.network,
      };
    } catch (error) {
      throw new WalletError(
        `Failed to connect to Lobstr: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        'lobstr'
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isInstalled()) {
        await window.lobstr!.disconnect();
      }
    } catch (error) {
      throw new WalletError(
        `Failed to disconnect from Lobstr: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCONNECT_FAILED',
        'lobstr'
      );
    }
  }

  async getPublicKey(): Promise<string> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Lobstr is not installed', 'WALLET_NOT_INSTALLED', 'lobstr');
      }

      return await window.lobstr!.getPublicKey();
    } catch (error) {
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PUBLIC_KEY_FAILED',
        'lobstr'
      );
    }
  }

  async signTransaction(xdr: string, network?: Network): Promise<string> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Lobstr is not installed', 'WALLET_NOT_INSTALLED', 'lobstr');
      }

      return await window.lobstr!.signTransaction(xdr, network);
    } catch (error) {
      throw new WalletError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGN_TRANSACTION_FAILED',
        'lobstr'
      );
    }
  }

  async getNetwork(): Promise<Network> {
    try {
      if (!this.isInstalled()) {
        throw new WalletError('Lobstr is not installed', 'WALLET_NOT_INSTALLED', 'lobstr');
      }

      return await window.lobstr!.getNetwork();
    } catch (error) {
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_NETWORK_FAILED',
        'lobstr'
      );
    }
  }

  onAccountChanged(callback: (account: WalletAccount | null) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    return window.lobstr!.onAccountChanged((account: { publicKey: string; network: Network } | null) => {
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

  onNetworkChanged(callback: (network: Network) => void): () => void {
    if (!this.isInstalled()) {
      return () => {};
    }

    return window.lobstr!.onNetworkChanged(callback);
  }
}
