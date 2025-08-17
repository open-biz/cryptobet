'use client';

import { useState, useEffect } from 'react';

interface TickerItem {
  id: string;
  type: 'bet_accepted' | 'bet_settled' | 'big_win';
  text: string;
  amount: string;
  sport: string;
  highlight?: boolean;
}

const mockTickerItems: TickerItem[] = [
  {
    id: '1',
    type: 'bet_accepted',
    text: '@CryptoKing accepted Lakers -5.5 vs Warriors',
    amount: '2.5 ETH',
    sport: '🏀'
  },
  {
    id: '2',
    type: 'bet_settled',
    text: '@SportsBetDAO won Chiefs ML vs Bills',
    amount: '1.8 ETH',
    sport: '🏈'
  },
  {
    id: '3',
    type: 'big_win',
    text: '@WhaleWins hit 7-leg parlay!',
    amount: '12.4 ETH',
    sport: '💰',
    highlight: true
  },
  {
    id: '4',
    type: 'bet_accepted',
    text: '@ManCity_Fan backed Liverpool +1.5',
    amount: '0.75 ETH',
    sport: '⚽'
  },
  {
    id: '5',
    type: 'bet_settled',
    text: '@TennisAce won Djokovic straight sets',
    amount: '3.2 ETH',
    sport: '🎾'
  }
];

export default function LiveTicker() {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(mockTickerItems);

  useEffect(() => {
    // Add new ticker items every 3-5 seconds for that live feel
    const interval = setInterval(() => {
      const newItems = [
        {
          id: Date.now().toString(),
          type: 'bet_accepted' as const,
          text: `@User${Math.floor(Math.random() * 1000)} accepted live bet`,
          amount: `${(Math.random() * 3 + 0.1).toFixed(1)} ETH`,
          sport: ['🏀', '⚽', '🏈', '⚾', '🎾'][Math.floor(Math.random() * 5)]
        }
      ];
      
      setTickerItems(prev => [...newItems, ...prev].slice(0, 10)); // Keep only last 10
    }, Math.random() * 2000 + 3000); // Random between 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 text-white py-3 overflow-hidden relative border-b border-gray-300">
      <div className="flex items-center">
        <div className="flex-shrink-0 px-4 py-1 bg-green-600 text-white font-semibold text-sm rounded-r-lg">
          Live
        </div>
        
        <div className="flex-1 overflow-hidden ml-4">
          <div className="animate-scroll-left flex items-center space-x-8 whitespace-nowrap">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className={`flex items-center space-x-2 ${
                  item.highlight ? 'text-green-400 font-semibold' : 'text-gray-100'
                }`}
              >
                <span>{item.sport}</span>
                <span className="text-sm">{item.text}</span>
                <span className={`font-semibold ${
                  item.highlight ? 'text-green-400' : 'text-white'
                }`}>
                  {item.amount}
                </span>
                <span className="text-gray-400">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}