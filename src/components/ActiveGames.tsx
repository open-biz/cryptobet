'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// CHZ to USDT conversion rate: 25 CHZ = 1 USDT
const CHZ_TO_USDT_RATE = 25;

interface Game {
  id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: any[];
  odds?: {
    home: number;
    away: number;
    draw?: number;
  };
}

export default function ActiveGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveGames();
  }, []);

  const fetchActiveGames = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/odds?action=games');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setGames(data.slice(0, 5)); // Show top 5 games
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setError(error instanceof Error ? error.message : 'Failed to load games');
      // Fallback to mock data for demo
      setGames([
        {
          id: 'demo_1',
          sport_key: 'basketball_nba',
          sport_title: 'NBA',
          home_team: 'Lakers',
          away_team: 'Warriors',
          commence_time: new Date(Date.now() + 86400000).toISOString(),
          bookmakers: [],
          odds: {
            home: 1.85,
            away: 2.10
          }
        },
        {
          id: 'demo_2',
          sport_key: 'americanfootball_nfl',
          sport_title: 'NFL',
          home_team: 'Chiefs',
          away_team: 'Bills',
          commence_time: new Date(Date.now() + 172800000).toISOString(),
          bookmakers: [],
          odds: {
            home: 1.75,
            away: 2.25
          }
        },
        {
          id: 'demo_3',
          sport_key: 'soccer_epl',
          sport_title: 'Premier League',
          home_team: 'Arsenal',
          away_team: 'Man City',
          commence_time: new Date(Date.now() + 129600000).toISOString(),
          bookmakers: [],
          odds: {
            home: 2.80,
            draw: 3.25,
            away: 2.40
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatGameTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    }
  };

  const getSportEmoji = (sportKey: string) => {
    const emojiMap: { [key: string]: string } = {
      'basketball_nba': '🏀',
      'americanfootball_nfl': '🏈',
      'soccer_epl': '⚽',
      'baseball_mlb': '⚾',
      'icehockey_nhl': '🏒',
      'tennis': '🎾'
    };
    return emojiMap[sportKey] || '🏆';
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-blue-900">
            Top Games
          </h3>
          <button
            onClick={fetchActiveGames}
            disabled={loading}
            className="text-sm bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center w-8 h-8 shadow-sm"
          >
            {loading ? '...' : '↻'}
          </button>
        </div>
        <p className="text-blue-700 text-sm mt-1 font-medium">Popular matches & odds</p>
      </div>
      
      <div className="p-6">
        {loading && games.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="text-gray-500 mt-2 text-sm">Loading games...</p>
          </div>
        ) : error && games.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchActiveGames}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <Link href={`/wager?game=${game.id}`} key={game.id} className="block">
                <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSportEmoji(game.sport_key)}</span>
                      <div>
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-bold">
                          {game.sport_title}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                      {formatGameTime(game.commence_time)}
                    </span>
                  </div>
                  
                  {/* Game Info */}
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 text-base mb-1">
                      {game.away_team} @ {game.home_team}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {new Date(game.commence_time).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* Odds Cards */}
                  {game.odds && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Home Team */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 text-center">
                          <div className="text-blue-700 font-bold text-sm mb-1">{game.home_team.split(' ')[0]}</div>
                          <div className="text-blue-800 font-bold text-lg">{game.odds.home.toFixed(2)}</div>
                          <div className="text-xs text-blue-600">USDT</div>
                        </div>
                        
                        {/* Away Team */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-3 text-center">
                          <div className="text-orange-700 font-bold text-sm mb-1">{game.away_team.split(' ')[0]}</div>
                          <div className="text-orange-800 font-bold text-lg">{game.odds.away.toFixed(2)}</div>
                          <div className="text-xs text-orange-600">USDT</div>
                        </div>
                      </div>
                      
                      {/* Draw (if exists) */}
                      {game.odds.draw !== undefined && (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3 text-center">
                          <div className="text-gray-700 font-bold text-sm mb-1">Draw</div>
                          <div className="text-gray-800 font-bold text-lg">{game.odds.draw.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">USDT</div>
                        </div>
                      )}
                      
                      {/* Action Button */}
                      <div className="mt-3">
                        <div className="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-bold text-center">
                          🎯 Create Wager
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
            
            {games.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No games available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}