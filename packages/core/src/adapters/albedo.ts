/**
 * Albedo wallet adapter implementation
 * @fileoverview Adapter for Albedo wallet
 */

import { WalletAdapter, WalletAccount, WalletError, Network, WalletType } from '../types';

/**
 * Albedo wallet adapter
 * @see https://albedo.link/
 */
export class AlbedoAdapter implements WalletAdapter {
  readonly type: WalletType = 'albedo';
  readonly name = 'Albedo';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY2NjZGRiIvPgo8cGF0aCBkPSJNMjAgOEwzMjAyMEwyMCAzMjhMOiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
  readonly url = 'https://albedo.link';

  isInstalled(): boolean {
    // Albedo is web-based and always available
    return true;
  }

  async connect(): Promise<WalletAccount> {
    try {
      const response = await this.albedoRequest('connect');
      return {
        publicKey: response.pubkey as string,
        network: response.network === 'PUBLIC' ? 'public' : 'testnet',
      };
    } catch (error) {
      throw new WalletError(
        `Failed to connect to Albedo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONNECTION_FAILED',
        'albedo'
      );
    }
  }

  async disconnect(): Promise<void> {
    // Albedo doesn't support explicit disconnect
  }

  async getPublicKey(): Promise<string> {
    try {
      const response = await this.albedoRequest('get_public_key');
      return response.pubkey as string;
    } catch (error) {
      throw new WalletError(
        `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PUBLIC_KEY_FAILED',
        'albedo'
      );
    }
  }

  async signTransaction(xdr: string, network?: Network): Promise<string> {
    try {
      const response = await this.albedoRequest('sign_transaction', {
        xdr,
        network: network === 'testnet' ? 'TESTNET' : 'PUBLIC',
      });
      return response.signed_xdr as string;
    } catch (error) {
      throw new WalletError(
        `Failed to sign transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SIGN_TRANSACTION_FAILED',
        'albedo'
      );
    }
  }

  async getNetwork(): Promise<Network> {
    try {
      const response = await this.albedoRequest('get_network');
      return response.network === 'PUBLIC' ? 'public' : 'testnet';
    } catch (error) {
      throw new WalletError(
        `Failed to get network: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_NETWORK_FAILED',
        'albedo'
      );
    }
  }

  onAccountChanged(): () => void {
    // Albedo doesn't support account change events
    return () => {};
  }

  onNetworkChanged(): () => void {
    // Albedo doesn't support network change events
    return () => {};
  }

  private async albedoRequest(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const url = new URL('https://albedo.link');
    url.searchParams.set('method', method);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Albedo request failed: ${response.statusText}`);
    }

    return response.json();
  }
}
