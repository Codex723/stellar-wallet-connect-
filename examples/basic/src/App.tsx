import React, { useState } from 'react';
import { WalletProvider, useWallet, useBalance, useSignTransaction } from '@stellar-wallet-connect/react';
import { WalletModal, WalletButton } from '@stellar-wallet-connect/ui';

function WalletConnectExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { state, disconnect, getAccountDetails } = useWallet();
  const { balance, isLoading: balanceLoading, error: balanceError, refresh: refreshBalance } = useBalance();
  const { signTransaction, isLoading: signingLoading, error: signingError, clearError } = useSignTransaction();

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleSignTransaction = async () => {
    try {
      clearError();
      // Example transaction XDR (this would be a real transaction in practice)
      const exampleXdr = 'AAAAAgAAAABgAAAAAAAAAIAAAADAAAAAgAAAAAAAAAAAAAAAABAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAEAAAABAAAAAc3VwcG9ydEBleGFtcGxlLmNvbQAAAAABAAAAA2h0dHA6Ly9leGFtcGxlLmNvbQAAAAAAAQAAAAABAAAAAAAAAAEAAAABAAAAAc3VwcG9ydEBleGFtcGxlLmNvbQAAAAABAAAAA2h0dHA6Ly9leGFtcGxlLmNvbQAAAAAAAQAAAAAAAAABAAAAAgAAAABAAAAAAAAAAA=';
      
      const signedXdr = await signTransaction(exampleXdr);
      alert('Transaction signed successfully!');
      console.log('Signed XDR:', signedXdr);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
    }
  };

  const handleGetAccountDetails = async () => {
    try {
      const details = await getAccountDetails();
      console.log('Account details:', details);
      alert(`Account details fetched! Check console for details.`);
    } catch (error) {
      console.error('Failed to get account details:', error);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Stellar Wallet Connect</h1>
        <p>Basic example demonstrating wallet connectivity</p>
      </div>

      <div className="card">
        <h2>Wallet Connection</h2>
        
        {state.isConnected ? (
          <div className="wallet-info">
            <h3>Connected Wallet</h3>
            <p><strong>Wallet:</strong> {state.wallet?.name}</p>
            <p><strong>Public Key:</strong></p>
            <div className="public-key">{state.account?.publicKey}</div>
            <p>
              <strong>Network:</strong>{' '}
              <span className={`network-badge ${state.account?.network === 'public' ? 'network-mainnet' : 'network-testnet'}`}>
                {state.account?.network}
              </span>
            </p>
            
            <div className="actions">
              <button className="btn btn-danger" onClick={handleDisconnect}>
                Disconnect
              </button>
              <button className="btn btn-secondary" onClick={refreshBalance}>
                Refresh Balance
              </button>
            </div>
          </div>
        ) : (
          <div className="wallet-info">
            <p>No wallet connected</p>
            <WalletButton onOpen={() => setIsModalOpen(true)} />
          </div>
        )}

        {state.error && (
          <div className="error-display">
            <strong>Error:</strong> {state.error}
          </div>
        )}

        {state.isConnecting && (
          <div className="loading-display">
            Connecting to wallet...
          </div>
        )}
      </div>

      {state.isConnected && (
        <>
          <div className="card">
            <h2>Balance</h2>
            {balanceLoading ? (
              <div className="loading-display">Loading balance...</div>
            ) : balanceError ? (
              <div className="error-display">Error: {balanceError}</div>
            ) : (
              <div className="balance-display">
                <strong>XLM Balance:</strong> {balance || '0'}
              </div>
            )}
          </div>

          <div className="card">
            <h2>Transaction Signing</h2>
            <div className="actions">
              <button 
                className="btn btn-primary" 
                onClick={handleSignTransaction}
                disabled={signingLoading}
              >
                {signingLoading ? 'Signing...' : 'Sign Example Transaction'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleGetAccountDetails}
              >
                Get Account Details
              </button>
            </div>
            
            {signingError && (
              <div className="error-display">
                <strong>Signing Error:</strong> {signingError}
              </div>
            )}
          </div>
        </>
      )}

      <WalletModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <WalletConnectExample />
    </WalletProvider>
  );
}

export default App;
