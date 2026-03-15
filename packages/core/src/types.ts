export type WalletType = 'freighter' | 'xbull' | 'lobstr' | 'albedo' | 'rabet';

export type Network = 'public' | 'testnet';

export interface WalletInfo {
  type: WalletType;
  name: string;
  icon: string;
  url: string;
  isInstalled: boolean;
}

export interface WalletAccount {
  publicKey: string;
  network: Network;
}

export interface WalletAdapter {
  type: WalletType;
  name: string;
  icon: string;
  url: string;
  
  isInstalled(): boolean;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, network?: Network): Promise<string>;
  getNetwork(): Promise<Network>;
  
  onAccountChanged?(callback: (account: WalletAccount | null) => void): () => void;
  onNetworkChanged?(callback: (network: Network) => void): () => void;
}

export interface StellarWalletConnectOptions {
  network?: Network;
  autoConnect?: boolean;
}

export interface WalletState {
  isConnected: boolean;
  wallet: WalletAdapter | null;
  account: WalletAccount | null;
  isConnecting: boolean;
  error: string | null;
}

export interface SignTransactionOptions {
  xdr: string;
  network?: Network;
  submit?: boolean;
}

export class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public walletType?: WalletType
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export interface Balance {
  balance: string;
  asset_code: string;
  asset_issuer?: string;
  asset_type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
}

export interface AccountDetails {
  accountId: string;
  sequence: string;
  balances: Balance[];
  thresholds: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  signers: Array<{
    key: string;
    weight: number;
    type: string;
  }>;
}
