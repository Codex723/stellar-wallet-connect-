import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type WalletType = 'freighter' | 'xbull' | 'lobstr' | 'albedo' | 'rabet';
export type Network = 'public' | 'testnet';
export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnecting';

export interface WalletAccount {
  publicKey: string;
  network: Network;
}

export interface WalletState {
  status: ConnectionStatus;
  walletId: WalletType | null;
  account: WalletAccount | null;
  error: string | null;
}

export interface WalletContextValue {
  state: WalletState;
  connect: (walletId: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  resetError: () => void;
}

// ─────────────────────────────────────────────
// Wallet Adapter Interface
// ─────────────────────────────────────────────

export interface WalletAdapter {
  /** Optional metadata fields for display */
  type?: WalletType;
  name?: string;
  icon?: string;
  url?: string;

  isInstalled(): boolean;
  /**
   * Initiate connection and return the connected account.
   */
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getPublicKey(): Promise<string>;
  signTransaction(xdr: string, network?: Network): Promise<string>;
  getNetwork(): Promise<Network>;

  /**
   * Register an account-change listener.
   * The callback receives the new public key, or null when the wallet is locked.
   * Must return an unsubscribe function.
   */
  onAccountChange?: (cb: (publicKey: string | null) => void) => () => void;

  /**
   * Register a network-change listener.
   * Must return an unsubscribe function.
   */
  onNetworkChange?: (cb: (network: Network) => void) => () => void;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const LS_KEY = 'stellar-wallet-connect';
const DEBOUNCE_MS = 300;

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

type Action =
  | { type: 'CONNECT_START'; walletId: WalletType }
  | { type: 'CONNECT_SUCCESS'; account: WalletAccount; walletId: WalletType }
  | { type: 'CONNECT_FAILURE'; error: string }
  | { type: 'DISCONNECT_START' }
  | { type: 'DISCONNECT_SUCCESS' }
  | { type: 'ACCOUNT_CHANGED'; publicKey: string }
  | { type: 'NETWORK_CHANGED'; network: Network }
  | { type: 'RESET_ERROR' };

const initialState: WalletState = {
  status: 'idle',
  walletId: null,
  account: null,
  error: null,
};

function reducer(state: WalletState, action: Action): WalletState {
  switch (action.type) {
    case 'CONNECT_START':
      return { ...state, status: 'connecting', walletId: action.walletId, error: null };
    case 'CONNECT_SUCCESS':
      return { status: 'connected', walletId: action.walletId, account: action.account, error: null };
    case 'CONNECT_FAILURE':
      return { ...state, status: 'error', error: action.error };
    case 'DISCONNECT_START':
      return { ...state, status: 'disconnecting' };
    case 'DISCONNECT_SUCCESS':
      return { ...initialState };
    case 'ACCOUNT_CHANGED':
      if (!state.account) return state;
      return { ...state, account: { ...state.account, publicKey: action.publicKey } };
    case 'NETWORK_CHANGED':
      if (!state.account) return state;
      return { ...state, account: { ...state.account, network: action.network } };
    case 'RESET_ERROR':
      return { ...state, status: 'idle', error: null };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────

interface PersistedData {
  walletId: WalletType;
  publicKey: string;
  network: Network;
}

function persist(data: PersistedData): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { }
}

function clearPersisted(): void {
  try { localStorage.removeItem(LS_KEY); } catch { }
}

function getPersistedData(): PersistedData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedData;
  } catch { return null; }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

export const WalletContext = createContext<WalletContextValue | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface WalletProviderProps {
  children: ReactNode;
  /**
   * Map of wallet adapters to make available.
   */
  adapters: Record<WalletType, WalletAdapter>;
  /**
   * Whether to attempt auto-reconnect from localStorage on mount.
   * @default false
   */
  autoReconnect?: boolean;
}

export function WalletProvider({ children, adapters, autoReconnect = false }: WalletProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const getAdapter = useCallback(
    (id: WalletType): WalletAdapter => adapters[id],
    // adapters reference is stable per render; use object identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [adapters]
  );

  const adapterRef = useRef<WalletAdapter | null>(null);
  // Store unsubscribe functions returned by event listeners
  const unsubAccountRef = useRef<(() => void) | null>(null);
  const unsubNetworkRef = useRef<(() => void) | null>(null);
  const accountDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAccountChange = useCallback((publicKey: string | null) => {
    if (accountDebounceTimer.current) clearTimeout(accountDebounceTimer.current);
    accountDebounceTimer.current = setTimeout(() => {
      if (publicKey === null) {
        // Wallet locked — treat as disconnect
        clearPersisted();
        dispatch({ type: 'DISCONNECT_SUCCESS' });
      } else {
        dispatch({ type: 'ACCOUNT_CHANGED', publicKey });
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleNetworkChange = useCallback((network: Network) => {
    if (networkDebounceTimer.current) clearTimeout(networkDebounceTimer.current);
    networkDebounceTimer.current = setTimeout(() => {
      dispatch({ type: 'NETWORK_CHANGED', network });
    }, DEBOUNCE_MS);
  }, []);

  const attachListeners = useCallback(
    (adapter: WalletAdapter) => {
      if (adapter.onAccountChange) {
        unsubAccountRef.current = adapter.onAccountChange(handleAccountChange);
      }
      if (adapter.onNetworkChange) {
        unsubNetworkRef.current = adapter.onNetworkChange(handleNetworkChange);
      }
    },
    [handleAccountChange, handleNetworkChange]
  );

  const detachListeners = useCallback(() => {
    if (unsubAccountRef.current) {
      unsubAccountRef.current();
      unsubAccountRef.current = null;
    }
    if (unsubNetworkRef.current) {
      unsubNetworkRef.current();
      unsubNetworkRef.current = null;
    }
  }, []);

  // ── Auto-reconnect on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!autoReconnect) return;

    const saved = getPersistedData();
    if (!saved) return;

    let cancelled = false;

    (async () => {
      const adapter = getAdapter(saved.walletId);
      if (!adapter || !adapter.isInstalled()) {
        clearPersisted();
        return;
      }
      try {
        const publicKey = await adapter.getPublicKey();
        const network = await adapter.getNetwork();
        if (cancelled) return;
        adapterRef.current = adapter;
        attachListeners(adapter);
        dispatch({
          type: 'CONNECT_SUCCESS',
          walletId: saved.walletId,
          account: { publicKey, network },
        });
      } catch {
        if (!cancelled) clearPersisted();
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── connect ───────────────────────────────────────────────────────────
  const connect = useCallback(
    async (walletId: WalletType) => {
      dispatch({ type: 'CONNECT_START', walletId });
      const adapter = getAdapter(walletId);

      if (!adapter || !adapter.isInstalled()) {
        dispatch({ type: 'CONNECT_FAILURE', error: `${walletId} wallet extension is not installed.` });
        return;
      }

      try {
        const account = await adapter.connect();
        // Detach previous listeners if switching wallets
        detachListeners();
        adapterRef.current = adapter;
        attachListeners(adapter);
        persist({ walletId, publicKey: account.publicKey, network: account.network });
        dispatch({ type: 'CONNECT_SUCCESS', walletId, account });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Connection failed';
        dispatch({ type: 'CONNECT_FAILURE', error: message });
      }
    },
    [getAdapter, attachListeners, detachListeners]
  );

  // ── disconnect ────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (!state.walletId) return;
    dispatch({ type: 'DISCONNECT_START' });
    detachListeners();
    if (adapterRef.current) {
      try { await adapterRef.current.disconnect(); } catch { }
      adapterRef.current = null;
    }
    clearPersisted();
    dispatch({ type: 'DISCONNECT_SUCCESS' });
  }, [state.walletId, detachListeners]);

  // ── signTransaction ───────────────────────────────────────────────────
  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!adapterRef.current) throw new Error('No wallet connected');
    const network = state.account?.network ?? 'testnet';
    return adapterRef.current.signTransaction(xdr, network);
  }, [state.account?.network]);

  // ── resetError ────────────────────────────────────────────────────────
  const resetError = useCallback(() => {
    dispatch({ type: 'RESET_ERROR' });
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (accountDebounceTimer.current) clearTimeout(accountDebounceTimer.current);
      if (networkDebounceTimer.current) clearTimeout(networkDebounceTimer.current);
      detachListeners();
    };
  }, [detachListeners]);

  const value = useMemo<WalletContextValue>(
    () => ({ state, connect, disconnect, signTransaction, resetError }),
    [state, connect, disconnect, signTransaction, resetError]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}