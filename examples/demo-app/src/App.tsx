import React, { useState } from 'react';
import { WalletProvider, useWallet } from '@stellar-wallet-connect/react';
import { WalletSelectionModal } from '@stellar-wallet-connect/ui';
import { WalletInfo } from '@stellar-wallet-connect/core';

function DemoApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { state, connect, disconnect } = useWallet();

  // TODO: Replace with actual wallet detection
  const mockWallets: WalletInfo[] = [
    {
      type: 'freighter',
      name: 'Freighter',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY3NjJEMCIvPgo8cGF0aCBkPSJNMjAgMTJMMjYgMjBIMjBMMjAgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
      url: 'https://www.freighter.app',
      isInstalled: true,
    },
    {
      type: 'albedo',
      name: 'Albedo',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY2NjZGRiIvPgo8cGF0aCBkPSJNMjAgOEwzMjAyMEwyMCAzMjhMOiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
      url: 'https://albedo.link',
      isInstalled: true,
    },
  ];

  const handleWalletSelect = async (walletType: string) => {
    try {
      await connect(walletType as any);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Stellar Wallet Connect Demo</h1>
        <p>Basic demonstration of wallet connectivity</p>
      </header>

      <main>
        <section style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h2>Wallet Connection</h2>
          
          {state.isConnected ? (
            <div>
              <h3>Connected Wallet</h3>
              <p><strong>Wallet:</strong> {state.wallet?.name}</p>
              <p><strong>Public Key:</strong></p>
              <code style={{ background: '#f0f0f0', padding: '0.5rem', display: 'block', borderRadius: '4px' }}>
                {state.account?.publicKey}
              </code>
              <p><strong>Network:</strong> {state.account?.network}</p>
              
              <button 
                onClick={handleDisconnect}
                style={{ 
                  marginTop: '1rem', 
                  padding: '0.5rem 1rem', 
                  background: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <p>No wallet connected</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ 
                  padding: '0.5rem 1rem', 
                  background: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Connect Wallet
              </button>
            </div>
          )}

          {state.error && (
            <div style={{ 
              background: '#f8d7da', 
              color: '#721c24', 
              padding: '1rem', 
              borderRadius: '4px', 
              marginTop: '1rem' 
            }}>
              <strong>Error:</strong> {state.error}
            </div>
          )}

          {state.isConnecting && (
            <div style={{ 
              background: '#fff3cd', 
              color: '#856404', 
              padding: '1rem', 
              borderRadius: '4px', 
              marginTop: '1rem' 
            }}>
              Connecting to wallet...
            </div>
          )}
        </section>

        <section style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>
          <h2>Features</h2>
          <ul>
            <li>✅ Multi-wallet support (Freighter, xBull, Lobstr, Albedo, Rabet)</li>
            <li>✅ TypeScript with strict types</li>
            <li>✅ React hooks for easy integration</li>
            <li>✅ Wallet selection modal component</li>
            <li>✅ Auto-detection of installed wallets</li>
            <li>✅ Event listeners for account/network changes</li>
            <li>✅ Comprehensive error handling</li>
          </ul>
        </section>
      </main>

      <WalletSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallets={mockWallets}
        onWalletSelect={handleWalletSelect}
      />
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <DemoApp />
    </WalletProvider>
  );
}

export default App;
