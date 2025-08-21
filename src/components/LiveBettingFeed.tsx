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

// Mock data for demonstration - extended with more diverse bets
const mockBets: Bet[] = [
  // NBA Basketball
  {
    id: '1',
    challenger: '0x742d...35d4',
    challengerHandle: '@CryptoSports23',
    accepter: '0x8B3f...7A9e',
    accepterHandle: '@BetKing_NFT',
    prediction: 'Lakers will beat Warriors by 10+ points',
    amount: '2.5 USDT (62.5 CHZ)',
    sport: '🏀',
    game: 'Lakers vs Warriors',
    status: 'active',
    createdAt: '2 minutes ago',
    tweetUrl: 'https://twitter.com/CryptoSports23/status/123456789'
  },
  {
    id: '101',
    challenger: '0xA48d...1c2f',
    challengerHandle: '@HoopsDreams',
    accepter: '0x7F3a...92e7',
    accepterHandle: '@NBAFanatic',
    prediction: 'Curry scores 30+ points tonight',
    amount: '5.8 USDT (145 CHZ)',
    sport: '🏀',
    game: 'Warriors vs Celtics',
    status: 'active',
    createdAt: '8 minutes ago'
  },
  {
    id: '102',
    challenger: '0x3D2e...9f5a',
    challengerHandle: '@RingsChasers',
    accepter: '0x6B1f...34d2',
    accepterHandle: '@BenchWarmer',
    prediction: 'Heat to win Eastern Conference',
    amount: '15.0 USDT (375 CHZ)',
    sport: '🏀',
    game: 'NBA Season Futures',
    status: 'pending',
    createdAt: '15 minutes ago',
    tweetUrl: 'https://twitter.com/RingsChasers/status/123876543'
  },

  // Soccer
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
    id: '201',
    challenger: '0xC5a3...76b9',
    challengerHandle: '@LaLigaLover',
    accepter: '0x9D4f...21c8',
    accepterHandle: '@ElClasicoBettor',
    prediction: 'Benzema scores a header',
    amount: '3.4 USDT (85 CHZ)',
    sport: '⚽',
    game: 'Real Madrid vs Barcelona',
    status: 'active',
    createdAt: '22 minutes ago'
  },
  {
    id: '202',
    challenger: '0x2F7d...45e1',
    challengerHandle: '@SerieAFan',
    accepter: '0x8A3c...91f7',
    accepterHandle: '@CalcioTrader',
    prediction: 'Over 3.5 cards in first half',
    amount: '1.7 USDT (42.5 CHZ)',
    sport: '⚽',
    game: 'Juventus vs Inter Milan',
    status: 'settled',
    createdAt: '1 hour ago'
  },
  {
    id: '203',
    challenger: '0xE2b5...34a9',
    challengerHandle: '@EPLExpert',
    accepter: '0xA1c7...82d4',
    accepterHandle: '@ToffeesTrader',
    prediction: 'Liverpool clean sheet',
    amount: '4.6 USDT (115 CHZ)',
    sport: '⚽',
    game: 'Liverpool vs Everton',
    status: 'pending',
    createdAt: '17 minutes ago',
    tweetUrl: 'https://twitter.com/EPLExpert/status/123498765'
  },

  // NFL Football
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
    id: '301',
    challenger: '0xF5e2...73c9',
    challengerHandle: '@GridironGambler',
    accepter: '0x2D4e...51a8',
    accepterHandle: '@NFLDegen',
    prediction: 'Cowboys score in first 5 minutes',
    amount: '6.8 USDT (170 CHZ)',
    sport: '🏈',
    game: 'Cowboys vs Eagles',
    status: 'active',
    createdAt: '4 minutes ago'
  },
  {
    id: '302',
    challenger: '0x7A9c...23f5',
    challengerHandle: '@NFLFutures',
    accepter: '0xB3d7...91e2',
    accepterHandle: '@BoltsFan',
    prediction: 'Chargers win Super Bowl',
    amount: '25.0 USDT (625 CHZ)',
    sport: '🏈',
    game: 'NFL Season Futures',
    status: 'pending',
    createdAt: '2 hours ago',
    tweetUrl: 'https://twitter.com/NFLFutures/status/123765432'
  },

  // Tennis
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
    id: '401',
    challenger: '0xD1f7...34a2',
    challengerHandle: '@TieBreakTrader',
    accepter: '0x9E3c...76b5',
    accepterHandle: '@GrandSlamGuru',
    prediction: 'Match goes to final set',
    amount: '4.2 USDT (105 CHZ)',
    sport: '🎾',
    game: 'Alcaraz vs Sinner',
    status: 'pending',
    createdAt: '36 minutes ago'
  },

  // Baseball
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
  },
  {
    id: '501',
    challenger: '0xA3b5...21c7',
    challengerHandle: '@MLBMarkets',
    accepter: '0x4F2d...87e3',
    accepterHandle: '@PinchHitter',
    prediction: 'No runs in first inning',
    amount: '2.7 USDT (67.5 CHZ)',
    sport: '⚾',
    game: 'Dodgers vs Giants',
    status: 'active',
    createdAt: '14 minutes ago',
    tweetUrl: 'https://twitter.com/MLBMarkets/status/123432109'
  },
  {
    id: '502',
    challenger: '0xE4d2...98f3',
    challengerHandle: '@BaseballOracle',
    accepter: '0x7B6a...45c2',
    accepterHandle: '@CubsFanatic',
    prediction: 'Cubs win World Series',
    amount: '18.5 USDT (462.5 CHZ)',
    sport: '⚾',
    game: 'MLB Season Futures',
    status: 'pending',
    createdAt: '3 hours ago'
  },

  // Golf
  {
    id: '6',
    challenger: '0xF23a...8d71',
    challengerHandle: '@GolfEnthusiast',
    accepter: '0x3B9c...24a5',
    accepterHandle: '@PGATour_Fan',
    prediction: 'McIlroy to finish in top 5',
    amount: '5.5 USDT (137.5 CHZ)',
    sport: '⛳',
    game: 'US Open Championship',
    status: 'active',
    createdAt: '30 minutes ago',
    tweetUrl: 'https://twitter.com/GolfEnthusiast/status/123456792'
  },
  {
    id: '601',
    challenger: '0x8C5d...21a4',
    challengerHandle: '@MastersTrader',
    accepter: '0x3A7f...92d6',
    accepterHandle: '@GreenJacketGuru',
    prediction: 'Hole in one on Sunday',
    amount: '9.2 USDT (230 CHZ)',
    sport: '⛳',
    game: 'Masters Tournament',
    status: 'pending',
    createdAt: '1 hour ago'
  },

  // Boxing
  {
    id: '7',
    challenger: '0x4F1d...7e92',
    challengerHandle: '@BoxingBets',
    accepter: '0xA2c5...91f7',
    accepterHandle: '@FightNightKing',
    prediction: 'Fight ends in round 3 or earlier',
    amount: '10 USDT (250 CHZ)',
    sport: '🥊',
    game: 'Fury vs Joshua',
    status: 'pending',
    createdAt: '35 minutes ago'
  },
  {
    id: '701',
    challenger: '0xC7e3...45b2',
    challengerHandle: '@HeavyweightHustler',
    accepter: '0x9D3f...72a8',
    accepterHandle: '@RingwalkBets',
    prediction: 'Fight goes the distance',
    amount: '7.8 USDT (195 CHZ)',
    sport: '🥊',
    game: 'Canelo vs GGG',
    status: 'active',
    createdAt: '42 minutes ago',
    tweetUrl: 'https://twitter.com/HeavyweightHustler/status/123765890'
  },

  // Hockey
  {
    id: '8',
    challenger: '0x6D2e...1c4b',
    challengerHandle: '@HockeyDegen',
    accepter: '0xE9b7...45d3',
    accepterHandle: '@IceTimeTrader',
    prediction: 'Maple Leafs score first',
    amount: '3.2 USDT (80 CHZ)',
    sport: '🏒',
    game: 'Maple Leafs vs Canadiens',
    status: 'active',
    createdAt: '38 minutes ago'
  },
  {
    id: '801',
    challenger: '0xB5a7...23f9',
    challengerHandle: '@PuckLuck',
    accepter: '0x4D9c...87b5',
    accepterHandle: '@StanleyCupChaser',
    prediction: 'Hat trick scored in game',
    amount: '6.4 USDT (160 CHZ)',
    sport: '🏒',
    game: 'Bruins vs Rangers',
    status: 'pending',
    createdAt: '27 minutes ago'
  },

  // Formula 1
  {
    id: '9',
    challenger: '0x8B3a...9f21',
    challengerHandle: '@F1Bettor',
    accepter: '0xC4d7...2e85',
    accepterHandle: '@RacingOdds',
    prediction: 'Verstappen podium finish',
    amount: '7.5 USDT (187.5 CHZ)',
    sport: '🏎️',
    game: 'Monaco Grand Prix',
    status: 'settled',
    createdAt: '42 minutes ago',
    tweetUrl: 'https://twitter.com/F1Bettor/status/123456793'
  },
  {
    id: '901',
    challenger: '0xF9a3...45d7',
    challengerHandle: '@SpeedDemon',
    accepter: '0x2B8f...61c3',
    accepterHandle: '@GridPosition',
    prediction: 'Safety car in first 10 laps',
    amount: '5.2 USDT (130 CHZ)',
    sport: '🏎️',
    game: 'Singapore Grand Prix',
    status: 'active',
    createdAt: '19 minutes ago'
  },

  // Cricket
  {
    id: '10',
    challenger: '0x9A1f...4d23',
    challengerHandle: '@CricketWagers',
    accepter: '0xD5e8...7b29',
    accepterHandle: '@IPL_Bettor',
    prediction: 'Mumbai Indians to win by 20+ runs',
    amount: '4.8 USDT (120 CHZ)',
    sport: '🏏',
    game: 'Mumbai Indians vs Chennai Super Kings',
    status: 'pending',
    createdAt: '50 minutes ago'
  },
  {
    id: '1001',
    challenger: '0xE8b3...21f5',
    challengerHandle: '@WicketWisdom',
    accepter: '0x7D4e...93a7',
    accepterHandle: '@TestMatchTrader',
    prediction: 'Century scored in match',
    amount: '8.6 USDT (215 CHZ)',
    sport: '🏏',
    game: 'England vs Australia',
    status: 'active',
    createdAt: '1 hour ago',
    tweetUrl: 'https://twitter.com/WicketWisdom/status/123887654'
  },

  // MMA/UFC
  {
    id: '1101',
    challenger: '0xA9c7...34d1',
    challengerHandle: '@OctagonOracle',
    accepter: '0x5F2e...87c9',
    accepterHandle: '@UFCUnleashed',
    prediction: 'Fight ends via submission',
    amount: '12.5 USDT (312.5 CHZ)',
    sport: '🥋',
    game: 'McGregor vs Poirier',
    status: 'pending',
    createdAt: '7 minutes ago'
  },
  {
    id: '1102',
    challenger: '0xD3f5...76b2',
    challengerHandle: '@MMAMoney',
    accepter: '0x8A2c...45f9',
    accepterHandle: '@CageFighter',
    prediction: 'Champion retains title',
    amount: '20 USDT (500 CHZ)',
    sport: '🥋',
    game: 'UFC 320',
    status: 'active',
    createdAt: '55 minutes ago',
    tweetUrl: 'https://twitter.com/MMAMoney/status/123654321'
  },

  // eSports
  {
    id: '1201',
    challenger: '0xC5d3...21f8',
    challengerHandle: '@LeagueOfBets',
    accepter: '0x9F4a...76e3',
    accepterHandle: '@GamerWager',
    prediction: 'T1 wins 2-0',
    amount: '3.7 USDT (92.5 CHZ)',
    sport: '🎮',
    game: 'League of Legends - Worlds',
    status: 'pending',
    createdAt: '10 minutes ago'
  },
  {
    id: '1202',
    challenger: '0xB2e5...43f9',
    challengerHandle: '@CSGOBets',
    accepter: '0x4A8d...37c2',
    accepterHandle: '@ESportsFutures',
    prediction: 'Match goes to overtime',
    amount: '5.6 USDT (140 CHZ)',
    sport: '🎮',
    game: 'CS:GO - Major Finals',
    status: 'active',
    createdAt: '28 minutes ago',
    tweetUrl: 'https://twitter.com/CSGOBets/status/123789456'
  }
];

export default function LiveBettingFeed() {
  const [bets, setBets] = useState<Bet[]>(mockBets);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'settled'>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
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

  // Get unique sports for the filter
  const uniqueSports = Array.from(new Set(bets.map(bet => bet.sport)));
  
  // Apply both status and sport filters
  const filteredBets = bets.filter(bet => {
    const statusMatch = filter === 'all' || bet.status === filter;
    const sportMatch = sportFilter === 'all' || bet.sport === sportFilter;
    return statusMatch && sportMatch;
  });

  // Simulate real-time updates - much more frequent for casino feel
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new bets more frequently for live feel
      if (Math.random() > 0.6) {
        const sportPredictions: Record<string, string[]> = {
          '🏀': ['Player scores 30+ points', 'Game goes to overtime', 'Team wins by 15+ points', '3-pointer in final minute', 'Triple-double achieved'],
          '⚽': ['First half goal', 'Player scores a header', 'Clean sheet', 'Penalty awarded', 'Both teams to score'],
          '🏈': ['First drive touchdown', 'QB throws 300+ yards', 'Defense forces 2+ turnovers', 'Game winning field goal', 'Under 45.5 total points'],
          '⚾': ['No-hitter through 6 innings', 'Player hits home run', 'Extra innings', 'Perfect game', 'Team scores in first inning'],
          '🎾': ['Match goes to final set', 'Straight sets victory', 'Tiebreak in first set', 'Under 9.5 games in set', 'Match point saved'],
          '⛳': ['Eagle on par 5', 'Hole in one', 'Player shoots under 70', 'Bunker save', 'Leader after round 3 wins'],
          '🥊': ['Fight ends by KO', 'Fight goes the distance', 'Fighter wins by decision', 'Fight ends in first 3 rounds', 'Upset victory'],
          '🏒': ['Hat trick scored', 'Shutout victory', 'Game goes to shootout', 'Player scores 2+ goals', 'Power play goal'],
          '🏎️': ['Safety car deployed', 'Driver makes podium', 'Fastest lap achieved', 'Pit stop under 2.5 seconds', 'Both team cars finish'],
          '🏏': ['Century scored', 'Five-wicket haul', 'Match tied', 'Run rate above 8', 'No wickets in power play'],
          '🥋': ['Fight ends via submission', 'Fight ends in round 1', 'Champion retains title', 'Fight goes to decision', 'Fighter lands 100+ strikes'],
          '🎮': ['First blood secured', 'Team wins 2-0', 'Match goes to all games', 'Underdog victory', 'MVP performance']
        };

        const sportGames: Record<string, string[]> = {
          '🏀': ['Lakers vs Warriors', 'Celtics vs Bucks', 'Heat vs Knicks', 'Mavericks vs Suns', 'Bulls vs Pistons'],
          '⚽': ['Man City vs Arsenal', 'Real Madrid vs Barcelona', 'Liverpool vs Man United', 'Bayern vs Dortmund', 'PSG vs Marseille'],
          '🏈': ['Chiefs vs Bills', 'Cowboys vs Eagles', '49ers vs Rams', 'Packers vs Bears', 'Patriots vs Jets'],
          '⚾': ['Yankees vs Red Sox', 'Dodgers vs Giants', 'Cubs vs Cardinals', 'Astros vs Rangers', 'Blue Jays vs Orioles'],
          '🎾': ['Djokovic vs Nadal', 'Alcaraz vs Sinner', 'Swiatek vs Sabalenka', 'Federer vs Murray', 'Williams vs Osaka'],
          '⛳': ['Masters Tournament', 'US Open Championship', 'The Open Championship', 'PGA Championship', 'Ryder Cup'],
          '🥊': ['Fury vs Joshua', 'Canelo vs GGG', 'Wilder vs Usyk', 'Paul vs KSI', 'Taylor vs Serrano'],
          '🏒': ['Maple Leafs vs Canadiens', 'Bruins vs Rangers', 'Penguins vs Capitals', 'Oilers vs Flames', 'Lightning vs Panthers'],
          '🏎️': ['Monaco Grand Prix', 'Singapore Grand Prix', 'Italian Grand Prix', 'British Grand Prix', 'Abu Dhabi Grand Prix'],
          '🏏': ['India vs Pakistan', 'England vs Australia', 'West Indies vs South Africa', 'Mumbai Indians vs Chennai Super Kings', 'Royal Challengers vs Knight Riders'],
          '🥋': ['UFC 320', 'McGregor vs Poirier', 'Adesanya vs Pereira', 'Jones vs Miocic', 'Nunes vs Shevchenko'],
          '🎮': ['League of Legends Worlds', 'CS:GO Major Finals', 'Dota 2 International', 'Valorant Champions', 'Overwatch League Finals']
        };
        
        // Select a random sport and corresponding prediction/game
        const sports = ['🏀', '⚽', '🏈', '⚾', '🎾', '⛳', '🥊', '🏒', '🏎️', '🏏', '🥋', '🎮'];
        const randomSport = sports[Math.floor(Math.random() * sports.length)];
        
        const predictions = sportPredictions[randomSport] || sportPredictions['⚽'];
        const games = sportGames[randomSport] || sportGames['⚽'];
        
        // Generate random bet amounts between 0.1 and 25 USDT
        const usdtAmount = (Math.random() * 25 + 0.1).toFixed(1);
        const chzAmount = (parseFloat(usdtAmount) * CHZ_TO_USDT_RATE).toFixed(1);
        
        // Generate random Twitter handles with sports theme
        const prefixes = ['Crypto', 'Bet', 'Web3', 'Chain', 'Token', 'NFT', 'DAO', 'Degen'];
        const suffixes = ['Trader', 'Guru', 'Master', 'Whale', 'Fan', 'Expert', 'King', 'Oracle'];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        const newBet: Bet = {
          id: Math.random().toString(36).substring(2, 9),
          challenger: '0x' + Math.random().toString(16).substr(2, 4) + '...' + Math.random().toString(16).substr(2, 4),
          challengerHandle: '@' + randomPrefix + Math.floor(Math.random() * 1000),
          accepter: '0x' + Math.random().toString(16).substr(2, 4) + '...' + Math.random().toString(16).substr(2, 4),
          accepterHandle: '@' + randomSuffix + Math.floor(Math.random() * 1000),
          prediction: predictions[Math.floor(Math.random() * predictions.length)],
          amount: `${usdtAmount} USDT (${chzAmount} CHZ)`,
          sport: randomSport,
          game: games[Math.floor(Math.random() * games.length)],
          status: Math.random() > 0.7 ? 'active' : 'pending',
          createdAt: 'just now'
        };
        
        // Add tweet URL to some bets
        if (Math.random() > 0.6) {
          newBet.tweetUrl = `https://twitter.com/${newBet.challengerHandle.substring(1)}/status/${Math.floor(Math.random() * 1000000000)}`;
        }
        
        setBets(prev => [newBet, ...prev.slice(0, 49)]); // Keep top 50 bets max
      }
    }, 2000); // Update every 2 seconds for live casino feel

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white">
      {/* Status Filter Tabs - Clean Style */}
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
      
      {/* Sport Filter - Clean Style */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2 overflow-x-auto pb-2 mobile-scroll">
          <button
            onClick={() => setSportFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
              sportFilter === 'all'
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Sports
          </button>
          
          {uniqueSports.sort().map(sport => (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${
                sportFilter === sport
                  ? 'bg-black text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{sport}</span>
              <span className="text-xs opacity-75">
                ({bets.filter(b => b.sport === sport).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Betting Feed - Clean Style */}
      <div className="divide-y divide-gray-100 overflow-y-auto h-full">
        {filteredBets.map((bet) => (
          <div key={bet.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
               onClick={() => {
                 setSelectedBet(bet);
                 setIsModalOpen(true);
               }}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl sm:text-2xl">{bet.sport}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{bet.game}</p>
                    <p className="text-xs text-gray-500">{bet.createdAt}</p>
                  </div>
                </div>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(bet.status)}`}>
                  <span className="hidden sm:inline">{getStatusIcon(bet.status)} </span>{bet.status}
                </span>
              </div>
              
              <p className="text-gray-900 font-medium text-sm pr-4">"{bet.prediction}"</p>
              
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      C
                    </div>
                    <span className="text-blue-600 font-semibold truncate">{bet.challengerHandle}</span>
                  </div>
                  <span className="text-gray-400 hidden sm:inline">vs</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      A
                    </div>
                    <span className="text-orange-600 font-semibold truncate">{bet.accepterHandle}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="font-bold text-green-600 text-base sm:text-lg">{bet.amount.split(' ')[0]} {bet.amount.split(' ')[1]}</p>
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
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBet(bet);
                      setIsModalOpen(true);
                    }}
                    className="bg-black text-white px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 flex-1 sm:flex-none"
                  >
                    Accept Bet
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBet(bet);
                      setIsModalOpen(true);
                    }}
                    className="border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex-1 sm:flex-none"
                  >
                    Details
                  </button>
                </div>
              )}
                
              {bet.status === 'active' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                  <p className="text-green-700 text-xs font-semibold">Live bet - awaiting settlement</p>
                </div>
              )}
              
              {bet.status === 'settled' && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3">
                  <p className="text-gray-700 text-xs font-semibold">Settled - winner paid out</p>
                </div>
              )}
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