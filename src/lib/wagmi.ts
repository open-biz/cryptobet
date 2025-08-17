import { http, createConfig } from 'wagmi';

// IMPORTANT: SSR safety check
// This prevents the code from trying to access browser APIs during SSR
const isBrowser = typeof window !== 'undefined';

// We'll dynamically import RainbowKit on the client side only
// This avoids SSR issues with indexedDB and other browser APIs
let getDefaultConfig: any;
let getDefaultWallets: any;

// Placeholder config for SSR that will be replaced on client
let tempConfig: any = {};


// Chiliz Chain configuration
const chilizMainnet = {
  id: 88888,
  name: 'Chiliz Chain',
  network: 'chiliz',
  nativeCurrency: {
    decimals: 18,
    name: 'CHZ',
    symbol: 'CHZ',
  },
  rpcUrls: {
    public: { http: ['https://rpc.chiliz.com'] },
    default: { http: ['https://rpc.chiliz.com'] },
  },
  blockExplorers: {
    default: { name: 'ChilizScan', url: 'https://chiliscan.com' },
  },
} as const;

const chilizTestnet = {
  id: 88882,
  name: 'Chiliz Spicy Testnet',
  network: 'chiliz-spicy',
  nativeCurrency: {
    decimals: 18,
    name: 'CHZ',
    symbol: 'CHZ',
  },
  rpcUrls: {
    public: { http: ['https://spicy-rpc.chiliz.com'] },
    default: { http: ['https://spicy-rpc.chiliz.com'] },
  },
  blockExplorers: {
    default: { name: 'Spicy Explorer', url: 'https://spicy-explorer.chiliz.com' },
  },
  testnet: true,
} as const;

// Create HTTP transports with custom configs to avoid ENS lookups
const chilizTestnetTransport = http('https://spicy-rpc.chiliz.com', {
  // Disable ENS resolution attempts entirely
  batch: { batchSize: 10 },
  fetchOptions: {
    headers: { 'x-disable-ens': 'true' }
  },
  // Only send supported methods
  key: 'chilizTestnet',
});

const chilizMainnetTransport = http('https://rpc.chiliz.com', {
  // Disable ENS resolution attempts entirely
  batch: { batchSize: 10 },
  fetchOptions: {
    headers: { 'x-disable-ens': 'true' }
  },
  // Only send supported methods
  key: 'chilizMainnet',
});

// Create a function to initialize config on client-side only
const createClientConfig = async () => {
  if (!isBrowser) {
    return tempConfig;
  }
  
  try {
    // Dynamically import RainbowKit modules only on client-side
    const rainbowKit = await import('@rainbow-me/rainbowkit');
    getDefaultConfig = rainbowKit.getDefaultConfig;
    getDefaultWallets = rainbowKit.getDefaultWallets;
    
    // Now create the config
    return getDefaultConfig({
      appName: 'SendBet',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
      chains: [chilizTestnet, chilizMainnet],
      transports: {
        [chilizTestnet.id]: chilizTestnetTransport,
        [chilizMainnet.id]: chilizMainnetTransport,
      },
    });
  } catch (error) {
    console.error('Failed to initialize wallet config:', error);
    return tempConfig;
  }
};

// Export a placeholder config for SSR
export let config = tempConfig;

// Initialize the real config on the client side
if (isBrowser) {
  // Create a minimal initial config to prevent SSR errors
  config = createConfig({
    chains: [chilizTestnet, chilizMainnet],
    transports: {
      [chilizTestnet.id]: chilizTestnetTransport,
      [chilizMainnet.id]: chilizMainnetTransport,
    },
  });
  
  // Then asynchronously update it with the full config
  createClientConfig().then(newConfig => {
    config = newConfig;
  }).catch(console.error);
}

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
export const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;
// USDT on Chiliz Chain (acts as USD-pegged stablecoin)
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x02A6EA3B9632db2a5c5C6CFfa68FA03B64d24AB1';
// CHZ to USDT conversion rate: 25 CHZ = 1 USDT
export const CHZ_TO_USDT_RATE = 25;