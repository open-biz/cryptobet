'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { useState, useEffect, createContext, useContext } from 'react';

const queryClient = new QueryClient();
const WagmiReadyContext = createContext(false);

export const useWagmiReady = () => useContext(WagmiReadyContext);

function WagmiWrapper({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Import wagmi config only on client side
    import('@/lib/wagmi').then(({ config }) => {
      setConfig(config);
      setIsReady(true);
    });
  }, []);

  if (!config) {
    return (
      <WagmiReadyContext.Provider value={false}>
        {children}
      </WagmiReadyContext.Provider>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WagmiReadyContext.Provider value={true}>
            {children}
          </WagmiReadyContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <WagmiWrapper>{children}</WagmiWrapper>;
}