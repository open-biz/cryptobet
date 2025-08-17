'use client';

// Only import styles on the client side
import { useState, useEffect, createContext, useContext, Suspense } from 'react';
import dynamic from 'next/dynamic';

// SSR safety - prevent indexedDB access on server
const isBrowser = typeof window !== 'undefined';

// Dynamic imports to prevent SSR issues with browser-only APIs
let QueryClient: any;
let QueryClientProvider: any;
let WagmiProvider: any;
let RainbowKitProvider: any;

// We'll load styles later during library initialization
// This avoids the type error with direct CSS imports

// Create context without any dependencies that might cause SSR issues
const WagmiReadyContext = createContext(false);

// Only initialize QueryClient on the client side
let queryClient: any = null;

export const useWagmiReady = () => useContext(WagmiReadyContext);

function WagmiWrapper({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);

  // First load the libraries
  useEffect(() => {
    async function loadLibraries() {
      if (!isBrowser) return;

      try {
        // Load all required libraries
        const wagmiImport = await import('wagmi');
        WagmiProvider = wagmiImport.WagmiProvider;
        
        const tanstackQuery = await import('@tanstack/react-query');
        QueryClient = tanstackQuery.QueryClient;
        QueryClientProvider = tanstackQuery.QueryClientProvider;
        
        const rainbowkitImport = await import('@rainbow-me/rainbowkit');
        RainbowKitProvider = rainbowkitImport.RainbowKitProvider;
        
        // Create query client
        if (!queryClient) {
          queryClient = new QueryClient();
        }
        
        setLibrariesLoaded(true);
      } catch (error) {
        console.error('Failed to load web3 libraries:', error);
      }
    }
    
    loadLibraries();
  }, []);

  // Then load the config
  useEffect(() => {
    if (!librariesLoaded) return;
    
    // Import wagmi config only on client side
    import('@/lib/wagmi').then(({ config }) => {
      setConfig(config);
      setIsReady(true);
    }).catch(error => {
      console.error('Failed to load wagmi config:', error);
    });
  }, [librariesLoaded]);

  // Fallback when not ready
  if (!config || !librariesLoaded) {
    return (
      <WagmiReadyContext.Provider value={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            {children}
          </div>
        </div>
      </WagmiReadyContext.Provider>
    );
  }

  // Actual provider when everything is loaded
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