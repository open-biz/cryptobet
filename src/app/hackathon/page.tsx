'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWagmiReady } from '@/components/Providers';
import TwitterMonitorControl from '@/components/TwitterMonitorControl';

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: any[];
}

interface Bet {
  id: string;
  prediction: string;
  challenger: string;
  accepter: string;
  amount: string;
  gameId: string;
  status: 'active' | 'settled' | 'cancelled';
}

// CHZ to USDT conversion rate: 25 CHZ = 1 USDT
const CHZ_TO_USDT_RATE = 25;

export default function HackathonPage() {
  const isWagmiReady = useWagmiReady();
  const { address } = isWagmiReady ? useAccount() : { address: undefined };
  
  const [games, setGames] = useState<Game[]>([]);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveGames();
    fetchActiveBets();
  }, []);

  const fetchActiveGames = async () => {
    try {
      const response = await fetch('/api/odds?action=games');
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const fetchActiveBets = async () => {
    // Mock active bets for demo
    setActiveBets([
      {
        id: 'bet_1',
        prediction: 'Lakers will beat Warriors by 5+ points',
        challenger: '0x1234...5678',
        accepter: '0xabcd...efgh',
        amount: '0.1',
        gameId: 'game_123',
        status: 'active'
      }
    ]);
  };

  const resolveBet = async (betId: string, outcome: boolean) => {
    setLoading(true);
    try {
      // In real implementation, this would call the smart contract
      console.log(`Resolving bet ${betId} with outcome: ${outcome}`);
      
      // Update bet status locally for demo
      setActiveBets(prev => prev.map(bet => 
        bet.id === betId 
          ? { ...bet, status: 'settled' as const }
          : bet
      ));
      
      alert(`Bet ${betId} resolved: ${outcome ? 'Challenger wins' : 'Accepter wins'}`);
    } catch (error) {
      console.error('Error resolving bet:', error);
      alert('Error resolving bet');
    } finally {
      setLoading(false);
    }
  };

  const cancelBet = async (betId: string) => {
    setLoading(true);
    try {
      // In real implementation, this would call the smart contract
      console.log(`Cancelling bet ${betId}`);
      
      setActiveBets(prev => prev.map(bet => 
        bet.id === betId 
          ? { ...bet, status: 'cancelled' as const }
          : bet
      ));
      
      alert(`Bet ${betId} cancelled - funds refunded`);
    } catch (error) {
      console.error('Error cancelling bet:', error);
      alert('Error cancelling bet');
    } finally {
      setLoading(false);
    }
  };

  const resolveGameResult = async (gameId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/odds?action=resolve&gameId=${gameId}`);
      const data = await response.json();
      
      if (data.length > 0) {
        const game = data[0];
        alert(`Game Result: ${game.home_team} ${game.scores?.[0]?.score || 'TBD'} - ${game.away_team} ${game.scores?.[1]?.score || 'TBD'}`);
      } else {
        alert('Game result not available yet');
      }
    } catch (error) {
      console.error('Error resolving game:', error);
      alert('Error fetching game result');
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h1>
          <p className="text-gray-600">Please connect your wallet to access the hackathon admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏆 Hackathon Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manual settlement and game monitoring dashboard</p>
        </div>

        {/* Twitter Bot Control */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">🤖 Twitter Bot Control</h2>
            <p className="text-sm text-gray-600">Manage Twitter bot settings</p>
          </div>
          <div className="p-6">
            <TwitterMonitorControl />
          </div>
        </div>

        {/* Active Games Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">📊 Active Games</h2>
            <p className="text-sm text-gray-600">Top 10 upcoming games from Chainlink Functions</p>
          </div>
          <div className="p-6">
            {games.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Loading games from Chainlink Functions...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game) => (
                  <div key={game.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{game.sport_title}</h3>
                        <p className="text-gray-600">{game.away_team} @ {game.home_team}</p>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {new Date(game.commence_time).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => resolveGameResult(game.id)}
                      disabled={loading}
                      className="w-full mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      Check Result
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Bets Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">🎯 Active Bets</h2>
            <p className="text-sm text-gray-600">Manually settle or cancel bets</p>
          </div>
          <div className="p-6">
            {activeBets.filter(bet => bet.status === 'active').length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No active bets to settle</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBets.filter(bet => bet.status === 'active').map((bet) => (
                  <div key={bet.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{bet.prediction}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Challenger:</span> {bet.challenger}</p>
                          <p><span className="font-medium">Accepter:</span> {bet.accepter}</p>
                          <p><span className="font-medium">Amount:</span> {(parseFloat(bet.amount) / CHZ_TO_USDT_RATE).toFixed(2)} USDT ({bet.amount} CHZ) each</p>
                          <p><span className="font-medium">Bet ID:</span> {bet.id}</p>
                        </div>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                        {bet.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveBet(bet.id, true)}
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        ✅ Challenger Wins
                      </button>
                      <button
                        onClick={() => resolveBet(bet.id, false)}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        ❌ Accepter Wins
                      </button>
                      <button
                        onClick={() => cancelBet(bet.id)}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        🚫 Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settled Bets History */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">📜 Settlement History</h2>
          </div>
          <div className="p-6">
            {activeBets.filter(bet => bet.status !== 'active').length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No settled bets yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeBets.filter(bet => bet.status !== 'active').map((bet) => (
                  <div key={bet.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{bet.prediction}</p>
                      <p className="text-sm text-gray-600">{bet.amount} CHZ - {bet.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      bet.status === 'settled' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {bet.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}