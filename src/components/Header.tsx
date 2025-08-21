'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWagmiReady } from './Providers';
import { useState, useEffect } from 'react';
import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';

function DynamicConnectButton() {
  const isWagmiReady = useWagmiReady();

  if (!isWagmiReady) {
    return <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse" />;
  }

  // Custom styled ConnectButton to ensure proper visibility
  return (
    <div className="connect-button-wrapper" onClick={(e) => e.stopPropagation()}>
      <RainbowConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
              className="z-50"
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-3 rounded-lg flex items-center gap-1 text-sm"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 16,
                            height: 16,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 16, height: 16 }}
                            />
                          )}
                        </div>
                      )}
                      {chain.name}
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-3 rounded-lg flex items-center gap-2 text-sm"
                    >
                      {account.displayName}
                      {account.displayBalance ? ` (${account.displayBalance})` : ''}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </RainbowConnectButton.Custom>
    </div>
  );
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/images/logo.png" alt="SendBet Logo" width={120} height={40} priority className="h-10 w-auto max-w-[100px] sm:max-w-none" />
            </Link>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-6">
              <Link href="/bets" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Live Bets
              </Link>
              <Link href="/wager" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
                Create Bet
              </Link>
            </nav>
            <DynamicConnectButton />
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200">
              <Link 
                href="/bets" 
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Live Bets
              </Link>
              <Link 
                href="/wager" 
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 block px-3 py-2 text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Create Bet
              </Link>
              <div className="px-3 py-2">
                <DynamicConnectButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}