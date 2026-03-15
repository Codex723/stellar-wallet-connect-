import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { WalletManager, WalletAdapter, WalletAccount, WalletState, StellarClient, Network, WalletError } from '@stellar-wallet-connect/core';

interface WalletContextValue {
  state: WalletState;
  connect: (walletType: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string, network?: Network) => Promise<string>;
  getBalance: (assetCode?: string, assetIssuer?: string) => Promise<string>;
  getAccountDetails: () => Promise<any>;
  switchNetwork: (network: Network) => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

type WalletAction =
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_WALLET'; payload: WalletAdapter }
  | { type: 'SET_ACCOUNT'; payload: WalletAccount }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'DISCONNECT' }
  | { type: 'SET_NETWORK'; payload: Network };

const initialState: WalletState = {
  isConnected: false,
  wallet: null,
  account: null,
  isConnecting: false,
  error: null,
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload, error: null };
    case 'SET_WALLET':
      return { ...state, wallet: action.payload };
    case 'SET_ACCOUNT':
      return {
        ...state,
        account: action.payload,
        isConnected: !!action.payload,
        isConnecting: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isConnecting: false,
        isConnected: false,
        wallet: null,
        account: null,
      };
    case 'DISCONNECT':
      return {
        ...state,
        isConnected: false,
        wallet: null,
        account: null,
        isConnecting: false,
        error: null,
      };
    case 'SET_NETWORK':
      return state.account
        ? { ...state, account: { ...state.account, network: action.payload } }
        : state;
    default:
      return state;
  }
}

interface WalletProviderProps {
  children: ReactNode;
  network?: Network;
  autoConnect?: boolean;
}

export function WalletProvider({ children, network = 'public', autoConnect = false }: WalletProviderProps) {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const [walletManager] = React.useState(() => new WalletManager());
  const [stellarClient] = React.useState(() => new StellarClient(network));

  useEffect(() => {
    // Set up event listeners
    const unsubscribeAccountChanged = walletManager.on('accountChanged', ({ account }) => {
      if (account) {
        dispatch({ type: 'SET_ACCOUNT', payload: account });
        stellarClient.switchNetwork(account.network);
      } else {
        dispatch({ type: 'DISCONNECT' });
      }
    });

    const unsubscribeNetworkChanged = walletManager.on('networkChanged', ({ network: newNetwork }) => {
      dispatch({ type: 'SET_NETWORK', payload: newNetwork });
      stellarClient.switchNetwork(newNetwork);
    });

    const unsubscribeWalletDisconnected = walletManager.on('walletDisconnected', () => {
      dispatch({ type: 'DISCONNECT' });
    });

    return () => {
      unsubscribeAccountChanged();
      unsubscribeNetworkChanged();
      unsubscribeWalletDisconnected();
      walletManager.destroy();
    };
  }, [walletManager, stellarClient]);

  useEffect(() => {
    if (autoConnect && !state.isConnected && !state.isConnecting) {
      // Try to auto-connect with the first available installed wallet
      const installedWallets = walletManager.getInstalledWallets();
      if (installedWallets.length > 0) {
        connect(installedWallets[0].type).catch(console.error);
      }
    }
  }, [autoConnect]);

  const connect = async (walletType: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      const adapter = await walletManager.connectWallet(walletType as any);
      dispatch({ type: 'SET_WALLET', payload: adapter });
    } catch (error) {
      const errorMessage = error instanceof WalletError ? error.message : 'Failed to connect wallet';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const disconnect = async (): Promise<void> => {
    try {
      if (state.wallet) {
        await walletManager.disconnectWallet(state.wallet.type);
      }
      dispatch({ type: 'DISCONNECT' });
    } catch (error) {
      const errorMessage = error instanceof WalletError ? error.message : 'Failed to disconnect wallet';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const signTransaction = async (xdr: string, networkOverride?: Network): Promise<string> => {
    if (!state.wallet) {
      throw new WalletError('No wallet connected', 'NO_WALLET_CONNECTED');
    }

    try {
      const network = networkOverride || state.account?.network || network;
      return await state.wallet.signTransaction(xdr, network);
    } catch (error) {
      const errorMessage = error instanceof WalletError ? error.message : 'Failed to sign transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const getBalance = async (assetCode?: string, assetIssuer?: string): Promise<string> => {
    if (!state.account) {
      throw new WalletError('No account connected', 'NO_ACCOUNT_CONNECTED');
    }

    try {
      return await stellarClient.getBalance(state.account.publicKey, assetCode, assetIssuer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get balance';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const getAccountDetails = async () => {
    if (!state.account) {
      throw new WalletError('No account connected', 'NO_ACCOUNT_CONNECTED');
    }

    try {
      return await stellarClient.getAccountDetails(state.account.publicKey);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get account details';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const switchNetwork = (newNetwork: Network): void => {
    stellarClient.switchNetwork(newNetwork);
    if (state.account) {
      dispatch({ type: 'SET_NETWORK', payload: newNetwork });
    }
  };

  const refreshBalance = async (): Promise<void> => {
    // This would trigger a balance refresh in a real implementation
    // For now, we rely on the consumer to call getBalance again
  };

  const value: WalletContextValue = {
    state,
    connect,
    disconnect,
    signTransaction,
    getBalance,
    getAccountDetails,
    switchNetwork,
    refreshBalance,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
