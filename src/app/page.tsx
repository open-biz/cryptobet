'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LiveBettingFeed from '@/components/LiveBettingFeed';
import LiveTicker from '@/components/LiveTicker';

export default function HomePage() {
  // CHZ to USDT conversion rate: 25 CHZ = 1 USDT
  const CHZ_TO_USDT_RATE = 25;

  const [liveStats, setLiveStats] = useState({
    totalVolumeCHZ: 12400,
    totalVolumeUSDT: 12400 / CHZ_TO_USDT_RATE,
    activeBets: 53,
    playersOnline: 1247,
    lastBetAmountCHZ: 234,
    lastBetAmountUSDT: 234 / CHZ_TO_USDT_RATE
  });

  // Update stats frequently for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      const newVolumeCHZ = Math.floor(Math.random() * 100);
      const newLastBetCHZ = Math.floor(Math.random() * 500 + 50);
      
      setLiveStats(prev => ({
        totalVolumeCHZ: prev.totalVolumeCHZ + newVolumeCHZ,
        totalVolumeUSDT: (prev.totalVolumeCHZ + newVolumeCHZ) / CHZ_TO_USDT_RATE,
        activeBets: prev.activeBets + (Math.random() > 0.7 ? 1 : 0),
        playersOnline: prev.playersOnline + Math.floor(Math.random() * 5 - 2),
        lastBetAmountCHZ: newLastBetCHZ,
        lastBetAmountUSDT: newLastBetCHZ / CHZ_TO_USDT_RATE
      }));
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Live Ticker */}
      <LiveTicker />
      
      {/* Hero Section - Clean Crypto Style */}
      <div className="relative border-b border-blue-700">
        {/* Cover image as background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <Image 
            src="/images/cover.jpg" 
            alt="SendBet Cover" 
            fill 
            priority
            className="object-cover object-center brightness-[0.35]" 
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 relative z-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-blue-200 font-medium text-xs sm:text-sm">LIVE BETTING PLATFORM</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              SendBet
            </h1>
            
            <p className="text-lg sm:text-xl text-blue-200 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
              Decentralized sports predictions with USDT smart contracts
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
              <Link href="/wager" className="bg-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-green-600 transition-all duration-200 w-full sm:w-auto text-center shadow-lg">
                Create Bet Challenge
              </Link>
              <Link href="/bets" className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-blue-700 transition-all duration-200 w-full sm:w-auto shadow-lg">
                Browse Active Bets
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Bar - Clean Style */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 text-center">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                ${liveStats.totalVolumeUSDT.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Volume</div>
              <div className="text-xs text-gray-500 mt-0.5 lg:hidden">USDT</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {liveStats.activeBets}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Active Bets</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {liveStats.playersOnline}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Players Online</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
                ${liveStats.lastBetAmountUSDT.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">Last Bet</div>
              <div className="text-xs text-gray-500 mt-0.5 lg:hidden">USDT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile-First Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        
        {/* Mobile-First: Live Bets take full width on mobile */}
        <div className="space-y-4 lg:grid lg:grid-cols-4 lg:gap-6 lg:space-y-0">
          
          {/* Live Betting Feed - Full width on mobile, 3/4 on desktop */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold">🔥 Live Bets</h1>
                    <p className="text-blue-100 text-sm">Real-time betting action</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="min-h-[600px]">
                <LiveBettingFeed />
              </div>
            </div>
          </div>

          {/* Sidebar - Stacked on mobile, sidebar on desktop */}
          <div className="space-y-4 lg:col-span-1">
            
            {/* Quick Actions - Mobile First */}
            <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
              <h3 className="font-bold text-lg mb-3">🎯 Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 text-left transition-all">
                  <div className="font-semibold">Create Bet Challenge</div>
                  <div className="text-xs text-white/80">Start a new wager</div>
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3 text-left transition-all">
                  <div className="font-semibold">Browse Active Bets</div>
                  <div className="text-xs text-white/80">Join existing challenges</div>
                </button>
              </div>
            </div>
            
            {/* Top Games - Compact Mobile Design */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">🏆 Top Games</h3>
                <p className="text-xs text-gray-600">Trending matches</p>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⚽</span>
                    <div>
                      <div className="font-semibold text-sm">Arsenal vs Man City</div>
                      <div className="text-xs text-gray-500">Premier League</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">$1.2k</div>
                    <div className="text-xs text-gray-500">23 bets</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏀</span>
                    <div>
                      <div className="font-semibold text-sm">Lakers vs Warriors</div>
                      <div className="text-xs text-gray-500">NBA</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">$890</div>
                    <div className="text-xs text-gray-500">18 bets</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏈</span>
                    <div>
                      <div className="font-semibold text-sm">Chiefs vs Bills</div>
                      <div className="text-xs text-gray-500">NFL</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green-600">$650</div>
                    <div className="text-xs text-gray-500">12 bets</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card - Mobile Optimized */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                <h3 className="font-bold">📊 Platform Stats</h3>
                <p className="text-xs text-purple-100">Live metrics</p>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">${liveStats.totalVolumeUSDT.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{liveStats.activeBets}</div>
                  <div className="text-xs text-gray-500">Active Bets</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{liveStats.playersOnline}</div>
                  <div className="text-xs text-gray-500">Players</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">${liveStats.lastBetAmountUSDT.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Last Bet</div>
                </div>
              </div>
            </div>

            {/* How it Works - Minimal */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-3">💡 How it Works</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</span>
                    <span className="text-gray-700">Connect wallet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</span>
                    <span className="text-gray-700">Make prediction</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</span>
                    <span className="text-gray-700">Win rewards</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}