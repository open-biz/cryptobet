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
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-xl border border-white/20 transition-all text-sm"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium py-2 px-3 rounded-xl flex items-center gap-1 text-xs border border-white/20 transition-all"
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 14, height: 14 }}
                            />
                          )}
                        </div>
                      )}
                      <span className="hidden sm:inline">{chain.name}</span>
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium py-2 px-3 rounded-xl flex items-center gap-1 text-xs border border-white/20 transition-all"
                    >
                      <span className="truncate max-w-[80px] sm:max-w-none">{account.displayName}</span>
                      {account.displayBalance && (
                        <span className="hidden sm:inline">({account.displayBalance})</span>
                      )}
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
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-white font-bold text-lg sm:text-xl">SendBet</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation - Mobile First */}
            <div className="hidden sm:flex items-center gap-1">
              <Link 
                href="/bets" 
                className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Live Bets
              </Link>
              <Link 
                href="/wager" 
                className="text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Create Bet
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="sm:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
            
            {/* Wallet - Always visible, mobile optimized */}
            <div className="scale-90 sm:scale-100">
              <DynamicConnectButton />
            </div>
          </div>
        </div>

        {/* Mobile menu - Improved design */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-white/20">
            <div className="py-3 space-y-1">
              <Link 
                href="/bets" 
                className="text-white/90 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-xl text-sm font-medium transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🔥 Live Bets
              </Link>
              <Link 
                href="/wager" 
                className="text-white/90 hover:text-white hover:bg-white/10 block px-3 py-2 rounded-xl text-sm font-medium transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🎯 Create Bet
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}