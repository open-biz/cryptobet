'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useWagmiReady } from './Providers';
import { useState, useEffect } from 'react';

function DynamicConnectButton() {
  const [ConnectButton, setConnectButton] = useState<any>(null);
  const isWagmiReady = useWagmiReady();

  useEffect(() => {
    if (!isWagmiReady) return;

    // Dynamically import ConnectButton only when wagmi is ready
    import('@rainbow-me/rainbowkit').then(({ ConnectButton: CB }) => {
      setConnectButton(() => CB);
    }).catch(error => {
      console.error('Failed to load ConnectButton:', error);
    });
  }, [isWagmiReady]);

  if (!isWagmiReady || !ConnectButton) {
    return <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse" />;
  }

  return <ConnectButton />;
}

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/images/logo.png" alt="SendBet Logo" width={120} height={40} priority className="h-10 w-auto" />
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <DynamicConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}