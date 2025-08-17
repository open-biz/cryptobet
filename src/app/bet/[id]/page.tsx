'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ContractService } from '@/lib/contract';
import { useAccount } from 'wagmi';
import { useWagmiReady } from '@/components/Providers';
import Link from 'next/link';

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

export default function BetPage() {
  const params = useParams();
  const betId = params.id as string;
  const isWagmiReady = useWagmiReady();
  const { address } = useAccount();
  
  const [bet, setBet] = useState<BetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const contractService = new ContractService();

  useEffect(() => {
    if (isWagmiReady) {
      loadBet();
    }
  }, [betId, isWagmiReady]);

  const loadBet = async () => {
    try {
      setLoading(true);
      
      // Check if we have a deployed contract address
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress || contractAddress === 'deployed_contract_address') {
        // Demo mode - show mock data
        setDemoMode(betId);
        setIsDemoMode(true);
        return;
      }
      
      const betData = await contractService.getBet(betId);
      
      if (betData && betData.challenger !== '0x0000000000000000000000000000000000000000') {
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

  const setDemoMode = (betId: string) => {
    // Create mock bet data for demo
    const mockBet: BetData = {
      challenger: '0x742d35d4B9B30F6d03F8e5D9E5B7F8A1234567890',
      accepter: '0x8B3f7A9e123456789012345678901234567890AB',
      tweetId: betId.startsWith('twitter_') ? betId.replace('twitter_', '') : '',
      prediction: betId.startsWith('twitter_') 
        ? 'Lakers will beat Warriors by 10+ points' 
        : 'Real Madrid will score first against Barcelona',
      amount: BigInt('100000000000000000'), // 0.1 ETH
      gameId: betId.startsWith('twitter_') 
        ? 'Lakers vs Warriors - Dec 25' 
        : 'El Clasico - Real Madrid vs Barcelona',
      settled: false,
      winner: '0x0000000000000000000000000000000000000000',
      createdAt: BigInt(Date.now() / 1000),
      challengerDeposited: false,
      accepterDeposited: false,
      challengerTwitterHandle: '@CryptoSports23',
      accepterTwitterHandle: '@BetKing_NFT',
      challengerTwitterId: '1234567890',
      accepterTwitterId: '0987654321'
    };
    
    setBet(mockBet);
  };

  const handleDeposit = async () => {
    if (!bet || !address) return;
    
    setIsDepositing(true);
    try {
      if (isDemoMode) {
        // Demo mode - simulate deposit
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('Demo Mode: Deposit simulated successfully! In production, this would deposit real funds to the smart contract.');
      } else {
        await contractService.depositForBet(betId, bet.amount);
        await loadBet(); // Refresh bet data
      }
    } catch (err) {
      console.error('Error depositing:', err);
      alert('Error depositing funds');
    } finally {
      setIsDepositing(false);
    }
  };

  const isTwitterBet = bet?.tweetId && bet.tweetId !== '';
  const isBetCreator = address && (address === bet?.challenger || address === bet?.accepter);
  const userDeposited = address === bet?.challenger ? bet?.challengerDeposited : bet?.accepterDeposited;
  const canDeposit = isBetCreator && !userDeposited && !bet?.settled;

  if (!isWagmiReady || loading) {
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

  const amountInEth = Number(bet.amount) / 1e18;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <div className="text-yellow-800">
              <h3 className="font-semibold mb-1">🚧 Demo Mode</h3>
              <p className="text-sm">
                Smart contract not deployed yet. This is a preview of the betting interface.
              </p>
            </div>
          </div>
        )}
        
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
                  <p className="text-3xl font-bold text-green-600">{amountInEth} ETH</p>
                  <p className="text-sm text-green-700">Winner takes {amountInEth * 2} ETH</p>
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
                  {isDepositing ? 'Depositing...' : `Deposit ${amountInEth} ETH`}
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