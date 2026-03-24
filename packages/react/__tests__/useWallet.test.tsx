/**
 * useWallet hook – full test suite (Vitest + React Testing Library)
 *
 * Run with:  pnpm --filter @stellar-wallet-connect/react test
 */

import React from 'react';
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';

import { WalletProvider } from '../src/WalletProvider';
import { useWallet } from '../src/useWallet';
import type {
  WalletAdapter,
  WalletType,
  WalletAccount,
  Network,
} from '../src/WalletProvider';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'stellar-wallet-connect';

function makeMockAdapter(overrides: Partial<WalletAdapter> = {}): WalletAdapter {
  return {
    type: 'freighter' as WalletType,
    name: 'Freighter',
    icon: 'freighter.svg',
    url: 'https://freighter.app',
    isInstalled: vi.fn(() => true),
    connect: vi.fn(async (): Promise<WalletAccount> => ({
      publicKey: 'GABC1234',
      network: 'testnet' as Network,
    })),
    disconnect: vi.fn(async () => { }),
    getPublicKey: vi.fn(async () => 'GABC1234'),
    signTransaction: vi.fn(async (xdr: string) => `signed:${xdr}`),
    getNetwork: vi.fn(async () => 'testnet' as Network),
    ...overrides,
  };
}

function makeAdapters(overrides: Partial<WalletAdapter> = {}) {
  const adapter = makeMockAdapter(overrides);
  return { freighter: adapter } as unknown as Record<WalletType, WalletAdapter>;
}

function WalletConsumer() {
  const { state, connect, disconnect, signTransaction, resetError } = useWallet();

  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="walletId">{state.walletId ?? 'none'}</span>
      <span data-testid="publicKey">{state.account?.publicKey ?? 'none'}</span>
      <span data-testid="network">{state.account?.network ?? 'none'}</span>
      <span data-testid="error">{state.error ?? 'none'}</span>

      <button onClick={() => connect('freighter')}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={() => signTransaction('raw-xdr').catch(() => { })}>Sign</button>
      <button onClick={resetError}>Reset Error</button>
    </div>
  );
}

function renderWithProvider(
  adapters: Record<WalletType, WalletAdapter>,
  autoReconnect = false
) {
  return render(
    <WalletProvider adapters={adapters} autoReconnect={autoReconnect}>
      <WalletConsumer />
    </WalletProvider>
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Initial state', () => {
  it('starts in idle status with no wallet or account', () => {
    renderWithProvider(makeAdapters());

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('walletId')).toHaveTextContent('none');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('none');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });
});

describe('connect()', () => {
  it('transitions idle → connecting → connected', async () => {
    renderWithProvider(makeAdapters());

    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );
    expect(screen.getByTestId('walletId')).toHaveTextContent('freighter');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('GABC1234');
    expect(screen.getByTestId('network')).toHaveTextContent('testnet');
  });

  it('persists wallet info to localStorage on successful connect', async () => {
    renderWithProvider(makeAdapters());

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) as string);
    expect(stored).toEqual({
      walletId: 'freighter',
      publicKey: 'GABC1234',
      network: 'testnet',
    });
  });

  it('transitions to error when wallet is not installed', async () => {
    renderWithProvider(makeAdapters({ isInstalled: () => false }));

    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('error')
    );
    expect(screen.getByTestId('error').textContent).toMatch(/not installed/i);
  });

  it('transitions to error when connect() rejects', async () => {
    renderWithProvider(
      makeAdapters({
        connect: vi.fn(async () => { throw new Error('User rejected'); }),
      })
    );

    fireEvent.click(screen.getByText('Connect'));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('error')
    );
    expect(screen.getByTestId('error')).toHaveTextContent('User rejected');
  });
});

describe('disconnect()', () => {
  it('transitions connected → idle and clears storage', async () => {
    renderWithProvider(makeAdapters());

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    fireEvent.click(screen.getByText('Disconnect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('idle')
    );

    expect(screen.getByTestId('walletId')).toHaveTextContent('none');
    expect(screen.getByTestId('publicKey')).toHaveTextContent('none');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('still clears state when adapter.disconnect() rejects', async () => {
    renderWithProvider(
      makeAdapters({
        disconnect: vi.fn(async () => { throw new Error('Wallet error'); }),
      })
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    fireEvent.click(screen.getByText('Disconnect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('idle')
    );

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('is a no-op when called without a connected wallet', async () => {
    renderWithProvider(makeAdapters());

    await act(async () => {
      fireEvent.click(screen.getByText('Disconnect'));
    });

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });
});

describe('signTransaction()', () => {
  it('calls adapter and returns signed XDR', async () => {
    const onSign = vi.fn();
    renderWithProvider(
      makeAdapters({
        signTransaction: vi.fn(async (xdr) => {
          const result = `signed:${xdr}`;
          onSign(result);
          return result;
        }),
      })
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    fireEvent.click(screen.getByText('Sign'));
    await waitFor(() => expect(onSign).toHaveBeenCalledWith('signed:raw-xdr'));
  });

  it('throws when no wallet is connected', async () => {
    let caughtError: unknown;

    function ErrorConsumer() {
      const { signTransaction } = useWallet();
      return (
        <button
          onClick={async () => {
            try {
              await signTransaction('xdr');
            } catch (e) {
              caughtError = e;
            }
          }}
        >
          TrySign
        </button>
      );
    }

    render(
      <WalletProvider adapters={makeAdapters()} autoReconnect={false}>
        <ErrorConsumer />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('TrySign'));
    await waitFor(() =>
      expect((caughtError as Error).message).toMatch(/no wallet connected/i)
    );
  });
});

describe('resetError()', () => {
  it('resets status from error back to idle', async () => {
    renderWithProvider(makeAdapters({ isInstalled: () => false }));

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('error')
    );

    fireEvent.click(screen.getByText('Reset Error'));

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });
});

describe('Auto-reconnect', () => {
  it('restores connected state from localStorage on mount', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletId: 'freighter', publicKey: 'GABC1234', network: 'testnet' })
    );

    renderWithProvider(makeAdapters(), true);

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );
    expect(screen.getByTestId('publicKey')).toHaveTextContent('GABC1234');
    expect(screen.getByTestId('network')).toHaveTextContent('testnet');
  });

  it('clears storage and stays idle when adapter not installed', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletId: 'freighter', publicKey: 'GABC1234', network: 'testnet' })
    );

    renderWithProvider(makeAdapters({ isInstalled: () => false }), true);

    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('clears storage when getPublicKey() rejects during auto-reconnect', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletId: 'freighter', publicKey: 'GABC1234', network: 'testnet' })
    );

    renderWithProvider(
      makeAdapters({
        getPublicKey: vi.fn(async () => { throw new Error('Wallet locked'); }),
      }),
      true
    );

    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('uses live key from wallet if it differs from stored key', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletId: 'freighter', publicKey: 'OLD_KEY', network: 'testnet' })
    );

    renderWithProvider(makeAdapters({ getPublicKey: vi.fn(async () => 'NEW_KEY') }), true);

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );
    expect(screen.getByTestId('publicKey')).toHaveTextContent('NEW_KEY');
  });

  it('does not auto-reconnect when autoReconnect=false', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ walletId: 'freighter', publicKey: 'GABC1234', network: 'testnet' })
    );

    renderWithProvider(makeAdapters(), false);

    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });
});

describe('Account change events', () => {
  it('updates publicKey when wallet fires account change', async () => {
    let accountChangeCb: ((pk: string | null) => void) | null = null;

    renderWithProvider(
      makeAdapters({
        onAccountChange: vi.fn((cb) => {
          accountChangeCb = cb;
          return () => { accountChangeCb = null; };
        }),
      })
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    act(() => { accountChangeCb?.('GNEW5678'); });

    await waitFor(
      () => expect(screen.getByTestId('publicKey')).toHaveTextContent('GNEW5678'),
      { timeout: 1000 }
    );
  });

  it('disconnects when account change fires null (wallet locked)', async () => {
    let accountChangeCb: ((pk: string | null) => void) | null = null;

    renderWithProvider(
      makeAdapters({
        onAccountChange: vi.fn((cb) => {
          accountChangeCb = cb;
          return () => { accountChangeCb = null; };
        }),
      })
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    act(() => { accountChangeCb?.(null); });

    await waitFor(
      () => expect(screen.getByTestId('status')).toHaveTextContent('idle'),
      { timeout: 1000 }
    );
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('Network change events', () => {
  it('updates network when wallet fires network change', async () => {
    let networkChangeCb: ((n: Network) => void) | null = null;

    renderWithProvider(
      makeAdapters({
        onNetworkChange: vi.fn((cb) => {
          networkChangeCb = cb;
          return () => { networkChangeCb = null; };
        }),
      })
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    act(() => { networkChangeCb?.('public'); });

    await waitFor(
      () => expect(screen.getByTestId('network')).toHaveTextContent('public'),
      { timeout: 1000 }
    );
  });
});

describe('Memory leak prevention', () => {
  it('calls unsub functions on unmount', async () => {
    const unsubAccount = vi.fn();
    const unsubNetwork = vi.fn();

    const { unmount } = renderWithProvider(
      makeAdapters({
        onAccountChange: vi.fn(() => unsubAccount),
        onNetworkChange: vi.fn(() => unsubNetwork),
      })
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('connected')
    );

    unmount();

    expect(unsubAccount).toHaveBeenCalledTimes(1);
    expect(unsubNetwork).toHaveBeenCalledTimes(1);
  });
});

describe('useWallet outside provider', () => {
  it('throws a descriptive error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => render(<WalletConsumer />)).toThrow(
      /useWallet must be used within a WalletProvider/i
    );

    spy.mockRestore();
  });
});