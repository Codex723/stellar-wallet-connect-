import { Horizon, Server } from '@stellar/stellar-sdk';
import { Network, Balance, AccountDetails } from './types';

export class StellarClient {
  private server: Server;
  private network: Network;

  constructor(network: Network = 'public') {
    this.network = network;
    this.server = new Server(this.getHorizonUrl(network));
  }

  private getHorizonUrl(network: Network): string {
    switch (network) {
      case 'public':
        return 'https://horizon.stellar.org';
      case 'testnet':
        return 'https://horizon-testnet.stellar.org';
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  async getAccountDetails(publicKey: string): Promise<AccountDetails> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const balances: Balance[] = account.balances.map((balance: any) => ({
        balance: balance.balance,
        asset_code: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
        asset_issuer: balance.asset_issuer,
        asset_type: balance.asset_type,
      }));

      return {
        accountId: account.accountId(),
        sequence: account.sequenceNumber(),
        balances,
        thresholds: {
          low_threshold: account.thresholds.lowThreshold,
          med_threshold: account.thresholds.medThreshold,
          high_threshold: account.thresholds.highThreshold,
        },
        signers: account.signers.map((signer: any) => ({
          key: signer.key,
          weight: signer.weight,
          type: signer.type,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to fetch account details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBalance(publicKey: string, assetCode: string = 'XLM', assetIssuer?: string): Promise<string> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const balance = account.balances.find((b: any) => {
        if (assetCode === 'XLM') {
          return b.asset_type === 'native';
        }
        return b.asset_code === assetCode && b.asset_issuer === assetIssuer;
      });

      return balance?.balance || '0';
    } catch (error) {
      throw new Error(`Failed to fetch balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTransactions(publicKey: string, limit: number = 10, cursor?: string): Promise<Horizon.ServerApi.TransactionRecord[]> {
    try {
      const transactions = await this.server
        .transactions()
        .forAccount(publicKey)
        .limit(limit)
        .order('desc')
        .cursor(cursor || '')
        .call();

      return transactions.records;
    } catch (error) {
      throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitTransaction(transactionXdr: string): Promise<Horizon.ServerApi.TransactionRecord> {
    try {
      const transaction = await this.server.submitTransaction(transactionXdr);
      return transaction;
    } catch (error) {
      throw new Error(`Failed to submit transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAccountInfo(publicKey: string): Promise<{ exists: boolean; sequence?: string }> {
    try {
      const account = await this.server.loadAccount(publicKey);
      return {
        exists: true,
        sequence: account.sequenceNumber(),
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return { exists: false };
      }
      throw new Error(`Failed to check account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getNetwork(): Network {
    return this.network;
  }

  getNetworkPassphrase(): string {
    switch (this.network) {
      case 'public':
        return 'Public Global Stellar Network ; September 2015';
      case 'testnet':
        return 'Test SDF Network ; September 2015';
      default:
        throw new Error(`Unsupported network: ${this.network}`);
    }
  }

  switchNetwork(network: Network): void {
    this.network = network;
    this.server = new Server(this.getHorizonUrl(network));
  }
}
