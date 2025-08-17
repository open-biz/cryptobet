'use client';

import { useState, useEffect } from 'react';
import BetDetailModal from './BetDetailModal';

// CHZ to USDT conversion rate: 25 CHZ = 1 USDT
const CHZ_TO_USDT_RATE = 25;

interface Bet {
  id: string;
  challenger: string;
  challengerHandle: string;
  accepter: string;
  accepterHandle: string;
  prediction: string;
  amount: string;
  sport: string;
  game: string;
  status: 'pending' | 'active' | 'settled';
  createdAt: string;
  tweetUrl?: string;
}

// Mock data for demonstration
const mockBets: Bet[] = [
  {
    id: '1',
    challenger: '0x742d...35d4',
    challengerHandle: '@CryptoSports23',
    accepter: '0x8B3f...7A9e',
    accepterHandle: '@BetKing_NFT',
    prediction: 'Lakers will beat Warriors by 10+ points',
    amount: '0.5 USDT (12.5 CHZ)',
    sport: '🏀',
    game: 'Lakers vs Warriors',
    status: 'active',
    createdAt: '2 minutes ago',
    tweetUrl: 'https://twitter.com/CryptoSports23/status/123456789'
  },
  {
    id: '2',
    challenger: '0x1A2b...93c8',
    challengerHandle: '@SoccerBets_DAO',
    accepter: '0x4D5e...82f1',
    accepterHandle: '@PremierPunter',
    prediction: 'Man City to score first goal',
    amount: '8 USDT (200 CHZ)',
    sport: '⚽',
    game: 'Man City vs Arsenal',
    status: 'pending',
    createdAt: '5 minutes ago',
    tweetUrl: 'https://twitter.com/SoccerBets_DAO/status/123456790'
  },
  {
    id: '3',
    challenger: '0x9F8d...4E2a',
    challengerHandle: '@NFLCrypto',
    accepter: '0x6C7b...91d3',
    accepterHandle: '@TouchdownTokens',
    prediction: 'Chiefs will win by 14+ points',
    amount: '1.2 USDT (30 CHZ)',
    sport: '🏈',
    game: 'Chiefs vs Bills',
    status: 'settled',
    createdAt: '12 minutes ago'
  },
  {
    id: '4',
    challenger: '0x2E5f...7B8c',
    challengerHandle: '@TennisDAO',
    accepter: '0x8A9d...45e6',
    accepterHandle: '@AceTrader',
    prediction: 'Djokovic wins in straight sets',
    amount: '0.8 USDT (20 CHZ)',
    sport: '🎾',
    game: 'Djokovic vs Nadal',
    status: 'active',
    createdAt: '18 minutes ago'
  },
  {
    id: '5',
    challenger: '0x7C1a...39f2',
    challengerHandle: '@BaseballBets',
    accepter: '0x5D8e...62b7',
    accepterHandle: '@DiamondHands_',
    prediction: 'Yankees to hit 3+ home runs',
    amount: '12 USDT (300 CHZ)',
    sport: '⚾',
    game: 'Yankees vs Red Sox',
    status: 'pending',
    createdAt: '25 minutes ago'
  }
];

export default function LiveBettingFeed() {
  const [bets, setBets] = useState<Bet[]>(mockBets);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'settled'>('all');
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'settled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'active': return '🔥';
      case 'settled': return '✅';
      default: return '📝';
    }
  };

  const filteredBets = bets.filter(bet => filter === 'all' || bet.status === filter);

  // Simulate real-time updates - much more frequent for casino feel
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new bets more frequently for live feel
      if (Math.random() > 0.6) {
        const predictions = [
          'Lakers to win by 10+ points',
          'Over 3.5 goals scored',
          'First touchdown in Q1',
          'Djokovic straight sets win',
          'Yankees 5+ runs scored',
          'City to score first',
          'Under 45.5 total points',
          'Player to hit 2+ HRs'
        ];
        
        const games = [
          'Lakers vs Warriors',
          'Real Madrid vs Barcelona', 
          'Chiefs vs Bills',
          'Wimbledon Final',
          'Yankees vs Red Sox',
          'Man City vs Arsenal',
          'Cowboys vs Eagles',
          'Dodgers vs Giants'
        ];

        const usdtAmount = (Math.random() * 3 + 0.1).toFixed(1);
        const chzAmount = (parseFloat(usdtAmount) * CHZ_TO_USDT_RATE).toFixed(1);

        const newBet: Bet = {
          id: Math.random().toString(36).substring(2, 9),
          challenger: '0x' + Math.random().toString(16).substr(2, 4) + '...' + Math.random().toString(16).substr(2, 4),
          challengerHandle: '@CryptoUser' + Math.floor(Math.random() * 1000),
          accepter: '0x' + Math.random().toString(16).substr(2, 4) + '...' + Math.random().toString(16).substr(2, 4),
          accepterHandle: '@Player' + Math.floor(Math.random() * 1000),
          prediction: predictions[Math.floor(Math.random() * predictions.length)],
          amount: `${usdtAmount} USDT (${chzAmount} CHZ)`,
          sport: ['⚽', '🏀', '🏈', '⚾', '🎾'][Math.floor(Math.random() * 5)],
          game: games[Math.floor(Math.random() * games.length)],
          status: Math.random() > 0.7 ? 'active' : 'pending',
          createdAt: 'just now'
        };
        setBets(prev => [newBet, ...prev.slice(0, 9)]); // Keep only last 10 bets
      }
    }, 3000); // Update every 3 seconds for live casino feel

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white">
      {/* Filter Tabs - Clean Style */}
      <div className="flex border-b border-gray-200">
        {(['all', 'pending', 'active', 'settled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-3 text-sm font-semibold capitalize transition-all duration-200 ${
              filter === tab
                ? 'border-b-2 border-black text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} {tab !== 'all' && `(${bets.filter(b => b.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Betting Feed - Clean Style */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {filteredBets.map((bet) => (
          <div key={bet.id} className="p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
               onClick={() => {
                 setSelectedBet(bet);
                 setIsModalOpen(true);
               }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="text-2xl">{bet.sport}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{bet.game}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{bet.createdAt}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bet.status)}`}>
                    {getStatusIcon(bet.status)} {bet.status}
                  </span>
                </div>
                
                <p className="text-gray-900 mb-3 font-medium text-sm sm:text-base">"{bet.prediction}"</p>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        C
                      </div>
                      <span className="text-blue-600 font-semibold">{bet.challengerHandle}</span>
                    </div>
                    <span className="text-gray-400">vs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        A
                      </div>
                      <span className="text-orange-600 font-semibold">{bet.accepterHandle}</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg sm:text-xl">{bet.amount}</p>
                    {bet.tweetUrl && (
                      <a 
                        href={bet.tweetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        View Tweet
                      </a>
                    )}
                  </div>
                </div>
                
                {bet.status === 'pending' && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBet(bet);
                        setIsModalOpen(true);
                      }}
                      className="bg-black text-white px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
                    >
                      Accept Bet
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBet(bet);
                        setIsModalOpen(true);
                      }}
                      className="border border-gray-300 text-gray-700 px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
                    >
                      View Details
                    </button>
                  </div>
                )}
                
                {bet.status === 'active' && (
                  <div className="mt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 text-xs font-semibold">Live bet - awaiting settlement</p>
                    </div>
                  </div>
                )}
                
                {bet.status === 'settled' && (
                  <div className="mt-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-gray-700 text-xs font-semibold">Settled - winner paid out</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <span className="text-4xl mb-4 block">⚡</span>
          <p className="font-semibold">No {filter !== 'all' ? filter : ''} bets found</p>
          <p className="text-sm">New bets appear every few seconds</p>
        </div>
      )}

      <BetDetailModal
        bet={selectedBet}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBet(null);
        }}
      />
    </div>
  );
}