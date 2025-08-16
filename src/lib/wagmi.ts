import { http, createConfig } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

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
    public: { http: ['https://chiliz-rpc.com'] },
    default: { http: ['https://chiliz-rpc.com'] },
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

export const config = getDefaultConfig({
  appName: 'SendBet',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [chilizTestnet, chilizMainnet],
  transports: {
    [chilizTestnet.id]: http('https://spicy-rpc.chiliz.com'),
    [chilizMainnet.id]: http('https://chiliz-rpc.com'),
  },
});

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
export const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;
// USDT on Chiliz Chain (acts as USD-pegged stablecoin)
export const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x02A6EA3B9632db2a5c5C6CFfa68FA03B64d24AB1';