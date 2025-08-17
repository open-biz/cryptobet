'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

// CHZ to USDT conversion rate
const CHZ_TO_USDT_RATE = 25;

// Types for our odds data
interface Match {
  id: string;
  league: string;
  teams: {
    home: string;
    away: string;
  };
  startTime: string;
  sport: string;
  sportEmoji: string;
  odds: {
    homeWin: number;
    draw?: number;
    awayWin: number;
    overUnder?: number;
    overUnderLine?: number;
  };
}

export default function ChainlinkOddsWidget() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  
  // Mock data simulating Chainlink oracle feed
  const mockMatches: Match[] = [
    {
      id: '1',
      league: 'Premier League',
      teams: {
        home: 'Arsenal',
        away: 'Manchester United'
      },
      startTime: '2025-08-18T15:00:00Z',
      sport: 'soccer',
      sportEmoji: '⚽',
      odds: {
        homeWin: 2.1,
        draw: 3.4,
        awayWin: 3.2,
        overUnder: 2.5,
        overUnderLine: 1.9
      }
    },
    {
      id: '2',
      league: 'NBA',
      teams: {
        home: 'Los Angeles Lakers',
        away: 'Golden State Warriors'
      },
      startTime: '2025-08-18T23:00:00Z',
      sport: 'basketball',
      sportEmoji: '🏀',
      odds: {
        homeWin: 1.8,
        awayWin: 2.1,
        overUnder: 220.5,
        overUnderLine: 1.95
      }
    },
    {
      id: '3',
      league: 'MLB',
      teams: {
        home: 'New York Yankees',
        away: 'Boston Red Sox'
      },
      startTime: '2025-08-18T18:30:00Z',
      sport: 'baseball',
      sportEmoji: '⚾',
      odds: {
        homeWin: 1.7,
        awayWin: 2.3
      }
    },
    {
      id: '4',
      league: 'NFL',
      teams: {
        home: 'Kansas City Chiefs',
        away: 'Buffalo Bills'
      },
      startTime: '2025-08-19T00:15:00Z',
      sport: 'football',
      sportEmoji: '🏈',
      odds: {
        homeWin: 1.9,
        awayWin: 1.95,
        overUnder: 48.5,
        overUnderLine: 1.9
      }
    },
    {
      id: '5',
      league: 'Tennis - US Open',
      teams: {
        home: 'Djokovic',
        away: 'Nadal'
      },
      startTime: '2025-08-18T16:00:00Z',
      sport: 'tennis',
      sportEmoji: '🎾',
      odds: {
        homeWin: 1.7,
        awayWin: 2.2
      }
    }
  ];

  // Simulate fetching from Chainlink oracle
  useEffect(() => {
    const fetchOdds = async () => {
      setIsLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real implementation, we would call the Chainlink oracle here
      setMatches(mockMatches);
      setIsLoading(false);
    };

    fetchOdds();
    
    // Refresh odds every 60 seconds for live feel
    const interval = setInterval(fetchOdds, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter matches by selected sport
  const filteredMatches = selectedSport === 'all' 
    ? matches 
    : matches.filter(match => match.sport === selectedSport);

  // Format date for display
  const formatMatchTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMatchDate = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Calculate potential winnings based on odds and a standard bet
  const calculateWinnings = (odds: number, betAmount: number = 10) => {
    return (odds * betAmount).toFixed(2);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="flex items-center">
            <h3 className="text-xl font-bold text-gray-900">
              Live Odds Feed
            </h3>
            <div className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              Powered by Chainlink
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-1">Real-time odds from multiple sports</p>
        </div>
        
        <div className="flex items-center space-x-1">
          <Image 
            src="/images/chainlink-logo.png" 
            alt="Chainlink" 
            width={24} 
            height={24} 
            className="object-contain"
          />
          <span className="text-sm font-medium text-blue-600">Chainlink Oracle</span>
        </div>
      </div>

      {/* Sport filter tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
        <button 
          onClick={() => setSelectedSport('all')}
          className={`px-4 py-3 whitespace-nowrap ${selectedSport === 'all' 
            ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          All Sports
        </button>
        <button 
          onClick={() => setSelectedSport('soccer')}
          className={`px-4 py-3 whitespace-nowrap ${selectedSport === 'soccer' 
            ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          ⚽ Soccer
        </button>
        <button 
          onClick={() => setSelectedSport('basketball')}
          className={`px-4 py-3 whitespace-nowrap ${selectedSport === 'basketball' 
            ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          🏀 Basketball
        </button>
        <button 
          onClick={() => setSelectedSport('football')}
          className={`px-4 py-3 whitespace-nowrap ${selectedSport === 'football' 
            ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          🏈 Football
        </button>
        <button 
          onClick={() => setSelectedSport('baseball')}
          className={`px-4 py-3 whitespace-nowrap ${selectedSport === 'baseball' 
            ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          ⚾ Baseball
        </button>
        <button 
          onClick={() => setSelectedSport('tennis')}
          className={`px-4 py-3 whitespace-nowrap ${selectedSport === 'tennis' 
            ? 'text-blue-600 border-b-2 border-blue-600 font-medium' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          🎾 Tennis
        </button>
      </div>

      {/* Matches and odds */}
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center p-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">Loading odds from Chainlink...</span>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No matches found for the selected sport
          </div>
        ) : (
          filteredMatches.map(match => (
            <div key={match.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{match.sportEmoji}</span>
                <span className="text-sm text-gray-500">{match.league}</span>
                <div className="ml-auto flex items-center text-xs text-gray-500">
                  <span>{formatMatchDate(match.startTime)}</span>
                  <span className="mx-1">•</span>
                  <span>{formatMatchTime(match.startTime)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-900">
                  {match.teams.home} vs {match.teams.away}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-lg border border-gray-200 p-3 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="text-xs text-gray-500 mb-1">{match.teams.home} Win</div>
                  <div className="font-semibold text-blue-600">{match.odds.homeWin.toFixed(2)}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Win {calculateWinnings(match.odds.homeWin)} USDT
                    <span className="block text-gray-500 text-[10px]">
                      ({(parseFloat(calculateWinnings(match.odds.homeWin)) * CHZ_TO_USDT_RATE).toFixed(1)} CHZ)
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-3 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <div className="text-xs text-gray-500 mb-1">{match.teams.away} Win</div>
                  <div className="font-semibold text-blue-600">{match.odds.awayWin.toFixed(2)}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Win {calculateWinnings(match.odds.awayWin)} USDT
                    <span className="block text-gray-500 text-[10px]">
                      ({(parseFloat(calculateWinnings(match.odds.awayWin)) * CHZ_TO_USDT_RATE).toFixed(1)} CHZ)
                    </span>
                  </div>
                </div>

                {match.odds.draw !== undefined && (
                  <div className="col-span-2 rounded-lg border border-gray-200 p-3 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="text-xs text-gray-500 mb-1">Draw</div>
                    <div className="font-semibold text-blue-600">{match.odds.draw.toFixed(2)}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Win {calculateWinnings(match.odds.draw)} USDT
                      <span className="block text-gray-500 text-[10px]">
                        ({(parseFloat(calculateWinnings(match.odds.draw)) * CHZ_TO_USDT_RATE).toFixed(1)} CHZ)
                      </span>
                    </div>
                  </div>
                )}

                {match.odds.overUnder !== undefined && (
                  <div className="col-span-2 rounded-lg border border-gray-200 p-3 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors">
                    <div className="text-xs text-gray-500 mb-1">Over/Under {match.odds.overUnder}</div>
                    <div className="font-semibold text-blue-600">{match.odds.overUnderLine?.toFixed(2)}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Win {calculateWinnings(match.odds.overUnderLine || 0)} USDT
                      <span className="block text-gray-500 text-[10px]">
                        ({(parseFloat(calculateWinnings(match.odds.overUnderLine || 0)) * CHZ_TO_USDT_RATE).toFixed(1)} CHZ)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex justify-end">
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  Create Bet 🎮
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-500 flex items-center">
          <span>Data refreshes every 60 seconds. Powered by </span>
          <span className="text-blue-600 font-medium ml-1">Chainlink Functions</span>
          <div className="ml-auto flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="ml-1 text-green-600">Live feed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
