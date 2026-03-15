import React from 'react';
import { WalletInfo } from '@stellar-wallet-connect/core';

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: WalletInfo[];
  onWalletSelect: (walletType: string) => void;
  className?: string;
}

export function WalletSelectionModal({
  isOpen,
  onClose,
  wallets,
  onWalletSelect,
  className = '',
}: WalletSelectionModalProps) {
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

        <div className="space-y-2">
          {wallets.map((wallet) => (
            <button
              key={wallet.type}
              onClick={() => onWalletSelect(wallet.type)}
              disabled={!wallet.isInstalled}
              className="w-full flex items-center p-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <img
                src={wallet.icon}
                alt={wallet.name}
                className="w-8 h-8 mr-3"
              />
              <div className="flex-1 text-left">
                <div className="font-medium">{wallet.name}</div>
                {!wallet.isInstalled && (
                  <div className="text-sm text-gray-500">Not installed</div>
                )}
              </div>
              {!wallet.isInstalled && (
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
      </div>
    </div>
  );
}
