'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LiveBettingFeed from '@/components/LiveBettingFeed';
import QuickBetCreator from '@/components/QuickBetCreator';
import LiveTicker from '@/components/LiveTicker';
import TwitterMonitorControl from '@/components/TwitterMonitorControl';
import ActiveGames from '@/components/ActiveGames';
import ChainlinkOddsWidget from '@/components/ChainlinkOddsWidget';

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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Live Betting Feed - Clean Style */}
          <div className="lg:col-span-2 flex flex-col order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col h-full">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      Live Bets
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">See what others are betting on in real-time</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs sm:text-sm text-gray-600">Live</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                <LiveBettingFeed />
              </div>
            </div>
          </div>

          {/* Sidebar - Clean Style */}
          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            
            {/* Chainlink Odds Widget */}
            <ChainlinkOddsWidget />
            
            {/* Active Games */}
            <ActiveGames />
            
            {/* Quick Bet Creator */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Create Bet
                </h3>
                <p className="text-gray-600 text-sm mt-1">Test the betting interface</p>
              </div>
              <QuickBetCreator />
            </div>


            {/* Popular Sports */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  Popular Sports
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚽</span>
                    <div>
                      <p className="font-semibold text-gray-900">Soccer</p>
                      <p className="text-sm text-gray-500">23 active bets</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-semibold">$1.2k</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏀</span>
                    <div>
                      <p className="font-semibold text-gray-900">Basketball</p>
                      <p className="text-sm text-gray-500">18 active bets</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-semibold">$890</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏈</span>
                    <div>
                      <p className="font-semibold text-gray-900">Football</p>
                      <p className="text-sm text-gray-500">12 active bets</p>
                    </div>
                  </div>
                  <span className="text-green-600 font-semibold">$650</span>
                </div>
              </div>
            </div>

            {/* How it Works */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  How it Works
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs">1</span>
                    <p className="text-gray-700">Connect your crypto wallet</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs">2</span>
                    <p className="text-gray-700">Tweet @SendBet with your prediction</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-gray-900 text-white rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs">3</span>
                    <p className="text-gray-700">Smart contract handles escrow and payouts</p>
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