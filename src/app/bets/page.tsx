'use client';

import { useState, useEffect } from 'react';
import { useWagmiReady } from '@/components/Providers';
import { mockContract, MockBet } from '@/lib/mock-contract';
import Link from 'next/link';
import ClientOnly from '@/components/ClientOnly';

function BetsPageContent() {
  const isWagmiReady = useWagmiReady();
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [userBets, setUserBets] = useState<MockBet[]>([]);
  const [recentBets, setRecentBets] = useState<MockBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-bets' | 'all-bets'>('my-bets');

  // Get wagmi state when ready
  useEffect(() => {
    if (!isWagmiReady) return;
    
    const checkWalletState = async () => {
      try {
        const { getAccount } = await import('wagmi/actions');
        const { config } = await import('@/lib/wagmi');
        
        const account = getAccount(config);
        setAddress(account.address || '');
        setIsConnected(account.isConnected);
      } catch (error) {
        console.error('Error getting wallet state:', error);
      }
    };
    
    checkWalletState();
    
    const interval = setInterval(checkWalletState, 1000);
    return () => clearInterval(interval);
  }, [isWagmiReady]);

  // Load bets data
  useEffect(() => {
    loadBetsData();
  }, [address]);

  const loadBetsData = async () => {
    try {
      setLoading(true);
      
      // Load user's bets if connected
      const userBetsData = address ? await mockContract.getUserBets(address) : [];
      setUserBets(userBetsData);
      
      // Load recent bets for all users
      const recentBetsData = await mockContract.getRecentBets(20);
      setRecentBets(recentBetsData);
    } catch (error) {
      console.error('Error loading bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (bet: MockBet) => {
    switch (bet.status) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'active': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'settled': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (bet: MockBet) => {
    switch (bet.status) {
      case 'pending': return '⏳';
      case 'active': return '🔥';
      case 'settled': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const BetCard = ({ bet, showUserRole = false }: { bet: MockBet; showUserRole?: boolean }) => {
    const isUserChallenger = address === bet.challenger;
    const isUserAccepter = address === bet.accepter;
    const userRole = isUserChallenger ? 'Challenger' : isUserAccepter ? 'Accepter' : null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getStatusIcon(bet)}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bet)}`}>
              {bet.status.toUpperCase()}
            </span>
            {showUserRole && userRole && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                {userRole}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-500">{formatTimeAgo(bet.createdAt)}</span>
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          "{bet.prediction}"
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          Game: {bet.gameId}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {bet.challengerTwitterHandle ? bet.challengerTwitterHandle.charAt(1) : 'C'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {bet.challengerTwitterHandle || 'Challenger'}
              </p>
              <p className={`text-xs ${bet.challengerDeposited ? 'text-green-600' : 'text-orange-600'}`}>
                {bet.challengerDeposited ? '✅' : '⏳'}
              </p>
            </div>
            
            <div className="text-center">
              <span className="text-xs text-gray-500">VS</span>
            </div>
            
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {bet.accepterTwitterHandle ? bet.accepterTwitterHandle.charAt(1) : 'A'}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {bet.accepterTwitterHandle || 'Accepter'}
              </p>
              <p className={`text-xs ${bet.accepterDeposited ? 'text-green-600' : 'text-orange-600'}`}>
                {bet.accepterDeposited ? '✅' : '⏳'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-green-600">${bet.amountUSDT} USDT</p>
            <p className="text-xs text-gray-500">({bet.amountCHZ} CHZ)</p>
            {bet.settled && bet.winner && (
              <p className="text-xs text-purple-600 font-semibold">
                Winner: {bet.winner === bet.challenger ? bet.challengerTwitterHandle : bet.accepterTwitterHandle}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <Link
            href={`/bet/${bet.id}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
          >
            View Details →
          </Link>
          
          {bet.tweetId && bet.tweetId.startsWith('twitter_') && (
            <a
              href={`https://twitter.com/i/status/${bet.tweetId.replace('twitter_', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-700 text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    );
  };

  if (!isWagmiReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading wallet connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Betting Activity
          </h1>
          <p className="text-gray-600">
            Track your bets and discover active wagers from the community
          </p>
        </div>


        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('my-bets')}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                activeTab === 'my-bets'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Bets {isConnected && userBets.length > 0 && `(${userBets.length})`}
            </button>
            <button
              onClick={() => setActiveTab('all-bets')}
              className={`px-4 py-2 rounded-md font-semibold text-sm transition-colors ${
                activeTab === 'all-bets'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Recent Activity {recentBets.length > 0 && `(${recentBets.length})`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bets...</p>
          </div>
        ) : (
          <>
            {/* My Bets Tab */}
            {activeTab === 'my-bets' && (
              <div>
                {!isConnected ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔗</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Connect your wallet to view your active bets and betting history
                    </p>
                  </div>
                ) : userBets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Bets Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      You haven't created or participated in any bets yet
                    </p>
                    <Link
                      href="/wager"
                      className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Create Your First Bet
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userBets.map((bet) => (
                      <BetCard key={bet.id} bet={bet} showUserRole={true} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Bets Tab */}
            {activeTab === 'all-bets' && (
              <div>
                {recentBets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Recent Activity
                    </h3>
                    <p className="text-gray-600">
                      No bets have been created recently
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Recent Community Bets
                      </h2>
                      <span className="text-sm text-gray-600">
                        {recentBets.length} bet{recentBets.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {recentBets.map((bet) => (
                        <BetCard key={bet.id} bet={bet} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* Create New Bet CTA */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Make a Bet?
            </h3>
            <p className="text-gray-600 mb-6">
              Challenge someone to a sports prediction and put your money where your mouth is
            </p>
            <Link
              href="/wager"
              className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Create New Wager
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
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

export default function BetsPage() {
  return (
    <ClientOnly>
      <BetsPageContent />
    </ClientOnly>
  );
}