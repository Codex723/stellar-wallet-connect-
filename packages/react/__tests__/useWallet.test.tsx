import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { WalletProvider, WalletAdapter, Network, WalletType } from '../src/WalletProvider';
import { useWallet } from '../src/useWallet';

const LS_KEY = 'stellar-wallet-connect';

// FIX 1: Explicitly cast the return and network types
function makeMockAdapter(overrides: Partial<WalletAdapter> = {}): WalletAdapter {
  return {
    isInstalled: vi.fn(() => true),
    connect: vi.fn(async () => ({ publicKey: 'G123', network: 'testnet' as Network })),
    disconnect: vi.fn(async () => { }),
    getPublicKey: vi.fn(async () => 'G123'),
    getNetwork: vi.fn(async () => 'testnet' as Network),
    signTransaction: vi.fn(async (x) => `signed:${x}`),
    onAccountChange: vi.fn(() => () => { }),
    onNetworkChange: vi.fn(() => () => { }),
    ...overrides
  } as WalletAdapter; // <--- This removes errors inside the mock
}

function TestComp() {
  const { state, connect, disconnect } = useWallet();
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="pk">{state.account?.publicKey ?? 'none'}</span>
      <button onClick={() => connect('freighter')}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}

describe('Stellar Wallet Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Requirement: Full state machine transitions', async () => {
    const adp = makeMockAdapter();
    // FIX 2: Use 'as any' for partial adapter records
    render(
      <WalletProvider adapters={{ freighter: adp } as any}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));
  });

  it('Requirement: Auto-reconnect on mount', async () => {
    localStorage.setItem(LS_KEY, 'freighter');
    const adp = makeMockAdapter();
    // FIX 3: Apply 'as any' here as well
    render(
      <WalletProvider adapters={{ freighter: adp } as any} autoReconnect={true}>
        <TestComp />
      </WalletProvider>
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));
  });

  it('Requirement: Debounce account changes', async () => {
    let triggerAccountChange: any;
    const adp = makeMockAdapter({
      onAccountChange: vi.fn((cb) => {
        triggerAccountChange = cb;
        return () => { };
      })
    });

    render(
      <WalletProvider adapters={{ freighter: adp } as any} autoReconnect={false}>
        <TestComp />
      </WalletProvider>
    );

    fireEvent.click(screen.getByText('Connect'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('connected'));

    vi.useFakeTimers();

    act(() => {
      triggerAccountChange('G_NEW');
    });

    expect(screen.getByTestId('pk')).toHaveTextContent('G123');

    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(screen.getByTestId('pk')).toHaveTextContent('G_NEW');

    vi.useRealTimers();
  });
});