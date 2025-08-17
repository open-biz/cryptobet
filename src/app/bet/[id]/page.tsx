'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContractService } from '@/lib/contract';
import { mockContract, CHZ_TO_USDT_RATE, MockBet } from '@/lib/mock-contract';
import { useAccount } from 'wagmi';
import { useWagmiReady } from '@/components/Providers';
import Link from 'next/link';
// Import client component wrapper
import ClientOnly from '@/components/ClientOnly';

interface BetData {
  challenger: string;
  accepter: string;
  tweetId: string;
  prediction: string;
  amount: bigint;
  gameId: string;
  settled: boolean;
  winner: string;
  createdAt: bigint;
  challengerDeposited: boolean;
  accepterDeposited: boolean;
  challengerTwitterHandle: string;
  accepterTwitterHandle: string;
  challengerTwitterId: string;
  accepterTwitterId: string;
}

// Create a client-side-only component for Wagmi hooks
function BetPageContent() {
  const params = useParams();
  const betId = params?.id as string || '';
  const isWagmiReady = useWagmiReady();
  const { address } = useAccount();
  
  const [bet, setBet] = useState<MockBet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true); // Always use mock for now

  // Use lazy initialization to prevent ENS lookup errors
  const [contractService] = useState(() => {
    // Only create ContractService instance on the client side
    if (typeof window !== 'undefined') {
      try {
        return new ContractService();
      } catch (error) {
        console.warn('Failed to initialize ContractService:', error);
        // Return a minimal implementation to prevent runtime errors
        return {} as ContractService;
      }
    }
    return {} as ContractService;
  });
  
  // Suppress all ENS-related errors
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Intercept console.error
    console.error = (...args) => {
      // Filter out ENS-related errors and other web3 network errors
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        (args[0].includes('ENS') || 
         args[0].includes('UNSUPPORTED_OPERATION') ||
         args[0].includes('network does not support') ||
         args[0].includes('getEnsAddress') ||
         args[0].includes('WagmiProvider'))
      ) {
        // Quietly suppress these errors
        return;
      }
      // Let other errors pass through
      originalError.apply(console, args);
    };
    
    // Also intercept console.warn for similar messages
    console.warn = (...args) => {
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        (args[0].includes('ENS') || 
         args[0].includes('network') ||
         args[0].includes('WagmiProvider'))
      ) {
        // Suppress warnings about ENS
        return;
      }
      originalWarn.apply(console, args);
    };

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  useEffect(() => {
    loadBet();
  }, [betId]);

  const loadBet = async () => {
    try {
      setLoading(true);
      
      // Always use mock contract for now
      let betData: MockBet | null = null;
      
      if (betId.startsWith('twitter_')) {
        betData = await mockContract.getBetByTweetId(betId);
      } else {
        betData = await mockContract.getBetById(betId);
      }
      
      if (betData) {
        setBet(betData);
      } else {
        setError('Bet not found');
      }
    } catch (err) {
      console.error('Error loading bet:', err);
      setError('Error loading bet data');
    } finally {
      setLoading(false);
    }
  };


  const handleDeposit = async () => {
    if (!bet || !address) return;
    
    setIsDepositing(true);
    try {
      // Use mock contract
      await mockContract.depositForBet(bet.tweetId, address);
      await loadBet(); // Refresh bet data
      alert(`Successfully deposited ${bet.amountUSDT} USDT (${bet.amountCHZ} CHZ)!`);
    } catch (err) {
      console.error('Error depositing:', err);
      alert('Error depositing funds: ' + (err as Error).message);
    } finally {
      setIsDepositing(false);
    }
  };

  const isTwitterBet = bet?.tweetId && bet.tweetId !== '';
  const isBetCreator = address && (address === bet?.challenger || address === bet?.accepter);
  const userDeposited = address === bet?.challenger ? bet?.challengerDeposited : bet?.accepterDeposited;
  const canDeposit = isBetCreator && !userDeposited && !bet?.settled;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bet...</p>
        </div>
      </div>
    );
  }

  if (error || !bet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bet Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This bet does not exist or has been removed.'}</p>
          <Link 
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { amountUSDT, amountCHZ } = bet;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Mock Mode Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
          <div className="text-blue-800">
            <h3 className="font-semibold mb-1">🧪 Development Mode</h3>
            <p className="text-sm">
              Using mock smart contract data. All transactions are simulated locally.
            </p>
          </div>
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 font-medium">Live Bet</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sports Bet Challenge
          </h1>
          <p className="text-gray-600">
            {isTwitterBet ? 'Created from Twitter' : 'Created on SendBet'}
          </p>
        </div>

        {/* Bet Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="p-6">
            
            {/* Prediction */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                "{bet.prediction}"
              </h2>
              <p className="text-gray-600">Game: {bet.gameId}</p>
            </div>

            {/* Players */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Challenger</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    C
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">
                      {bet.challengerTwitterHandle || 'Challenger'}
                    </p>
                    <p className="text-sm text-blue-600 font-mono">
                      {bet.challenger.slice(0, 6)}...{bet.challenger.slice(-4)}
                    </p>
                    <p className={`text-xs font-semibold ${
                      bet.challengerDeposited ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {bet.challengerDeposited ? '✅ Deposited' : '⏳ Pending deposit'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-2">Accepter</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">
                      {bet.accepterTwitterHandle || 'Accepter'}
                    </p>
                    <p className="text-sm text-orange-600 font-mono">
                      {bet.accepter.slice(0, 6)}...{bet.accepter.slice(-4)}
                    </p>
                    <p className={`text-xs font-semibold ${
                      bet.accepterDeposited ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {bet.accepterDeposited ? '✅ Deposited' : '⏳ Pending deposit'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bet Amount */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Bet Amount</h3>
                  <p className="text-sm text-green-700">Each player deposits</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">
                    ${amountUSDT} USDT
                  </p>
                  <p className="text-sm text-green-700">
                    ({amountCHZ} CHZ)
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Winner takes ${amountUSDT * 2} USDT ({amountCHZ * 2} CHZ)
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {canDeposit && (
              <div className="text-center">
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isDepositing ? 'Depositing...' : `Deposit $${amountUSDT} USDT (${amountCHZ} CHZ)`}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Connect your wallet and deposit to participate
                </p>
              </div>
            )}

            {bet.settled && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="font-semibold text-purple-900">Bet Settled!</h3>
                <p className="text-purple-700">
                  Winner: {bet.winner === bet.challenger ? bet.challengerTwitterHandle : bet.accepterTwitterHandle}
                </p>
              </div>
            )}

            {/* Original Tweet Link */}
            {isTwitterBet && (
              <div className="text-center mt-6">
                <a
                  href={`https://twitter.com/i/status/${bet.tweetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  View Original Tweet
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link 
            href="/"
            className="text-gray-600 hover:text-gray-800 font-semibold"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the client component
export default function BetPage() {
  return (
    <ClientOnly>
      <BetPageContent />
    </ClientOnly>
  );
}