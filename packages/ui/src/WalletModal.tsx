import React, { useState, useEffect } from 'react';
import { useWallet } from '@stellar-wallet-connect/react';
import { WalletInfo } from '@stellar-wallet-connect/core';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function WalletModal({ isOpen, onClose, className = '' }: WalletModalProps) {
  const { state, connect } = useWallet();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // This would typically come from the wallet manager
    // For now, we'll use a static list
    const availableWallets: WalletInfo[] = [
      {
        type: 'freighter',
        name: 'Freighter',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY3NjJEMCIvPgo8cGF0aCBkPSJNMjAgMTJMMjYgMjBIMjBMMjAgMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        url: 'https://www.freighter.app',
        isInstalled: true, // This would be detected dynamically
      },
      {
        type: 'xbull',
        name: 'xBull',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMTAgMjBMMjAgMTBMMzAgMjBMMjAgMzBMMTAgMjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        url: 'https://xbull.app',
        isInstalled: false,
      },
      {
        type: 'lobstr',
        name: 'Lobstr',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwQjQ1QiIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        url: 'https://lobstr.co',
        isInstalled: false,
      },
      {
        type: 'albedo',
        name: 'Albedo',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzY2NjZGRiIvPgo8cGF0aCBkPSJNMjAgOEwzMjAyMEwyMCAzMjhMOiA4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
        url: 'https://albedo.link',
        isInstalled: true, // Albedo is web-based
      },
      {
        type: 'rabet',
        name: 'Rabet',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0Y1OTUwQiIvPgo8cGF0aCBkPSJNMTAgMTBIMzBWMzBIMTBWMTBaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
        url: 'https://rabet.io',
        isInstalled: false,
      },
    ];

    setWallets(availableWallets);
  }, []);

  const handleConnect = async (walletType: string) => {
    setIsConnecting(true);
    try {
      await connect(walletType);
      onClose();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {state.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          {wallets.map((wallet) => (
            <button
              key={wallet.type}
              onClick={() => handleConnect(wallet.type)}
              disabled={!wallet.isInstalled && wallet.type !== 'albedo'}
              className="w-full flex items-center p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <img
                src={wallet.icon}
                alt={wallet.name}
                className="w-8 h-8 mr-3"
              />
              <div className="flex-1 text-left">
                <div className="font-medium">{wallet.name}</div>
                {!wallet.isInstalled && wallet.type !== 'albedo' && (
                  <div className="text-sm text-gray-500">Not installed</div>
                )}
              </div>
              {!wallet.isInstalled && wallet.type !== 'albedo' && (
                <a
                  href={wallet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  Install
                </a>
              )}
            </button>
          ))}
        </div>

        {isConnecting && (
          <div className="mt-4 text-center text-gray-600">
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
}

interface WalletButtonProps {
  onOpen: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function WalletButton({ onOpen, className = '', children }: WalletButtonProps) {
  const { state } = useWallet();

  if (state.isConnected && state.account) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="text-sm">
          <div className="font-medium">Connected</div>
          <div className="text-gray-500">
            {state.account.publicKey.slice(0, 4)}...{state.account.publicKey.slice(-4)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${className}`}
    >
      {children || 'Connect Wallet'}
    </button>
  );
}
