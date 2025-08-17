// Mock smart contract service for development
// Simulates Chiliz chain interactions with local storage

export const CHZ_TO_USDT_RATE = 25; // 25 CHZ = 1 USDT

export interface MockBet {
  id: string;
  tweetId: string;
  prediction: string;
  challenger: string;
  accepter: string;
  amountCHZ: number;
  amountUSDT: number;
  gameId: string;
  settled: boolean;
  winner?: string;
  createdAt: number;
  challengerDeposited: boolean;
  accepterDeposited: boolean;
  challengerTwitterHandle: string;
  accepterTwitterHandle: string;
  challengerTwitterId: string;
  accepterTwitterId: string;
  status: 'pending' | 'active' | 'settled' | 'cancelled';
}

export interface MockUserStats {
  betCount: number;
  winnings: number;
  totalVolume: number;
}

class MockContractService {
  private STORAGE_KEY = 'sendbet_mock_bets';
  private STATS_KEY = 'sendbet_mock_stats';

  // Get all bets from localStorage
  private getBets(): MockBet[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Save bets to localStorage
  private saveBets(bets: MockBet[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bets));
  }

  // Get user stats
  private getUserStats(): { [address: string]: MockUserStats } {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(this.STATS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  // Save user stats
  private saveUserStats(stats: { [address: string]: MockUserStats }): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
  }

  // Convert CHZ to USDT
  public chzToUsdt(chzAmount: number): number {
    return chzAmount / CHZ_TO_USDT_RATE;
  }

  // Convert USDT to CHZ
  public usdtToChz(usdtAmount: number): number {
    return usdtAmount * CHZ_TO_USDT_RATE;
  }

  // Create a new bet
  public async createBet(
    tweetId: string,
    prediction: string,
    challenger: string,
    accepter: string,
    amountUSDT: number,
    gameId: string,
    challengerTwitterHandle: string,
    accepterTwitterHandle: string,
    challengerTwitterId: string,
    accepterTwitterId: string
  ): Promise<MockBet> {
    const bets = this.getBets();
    
    // Check if bet already exists
    if (bets.find(bet => bet.tweetId === tweetId)) {
      throw new Error('Bet already exists for this tweet');
    }

    const amountCHZ = this.usdtToChz(amountUSDT);
    
    const newBet: MockBet = {
      id: `bet_${Date.now()}`,
      tweetId,
      prediction,
      challenger,
      accepter,
      amountCHZ,
      amountUSDT,
      gameId,
      settled: false,
      createdAt: Date.now(),
      challengerDeposited: false,
      accepterDeposited: false,
      challengerTwitterHandle,
      accepterTwitterHandle,
      challengerTwitterId,
      accepterTwitterId,
      status: 'pending'
    };

    bets.push(newBet);
    this.saveBets(bets);

    // Update user stats
    const stats = this.getUserStats();
    if (!stats[challenger]) {
      stats[challenger] = { betCount: 0, winnings: 0, totalVolume: 0 };
    }
    if (!stats[accepter]) {
      stats[accepter] = { betCount: 0, winnings: 0, totalVolume: 0 };
    }
    
    stats[challenger].betCount++;
    stats[challenger].totalVolume += amountCHZ;
    stats[accepter].betCount++;
    stats[accepter].totalVolume += amountCHZ;
    
    this.saveUserStats(stats);

    return newBet;
  }

  // Deposit for a bet
  public async depositForBet(tweetId: string, userAddress: string): Promise<MockBet> {
    const bets = this.getBets();
    const betIndex = bets.findIndex(bet => bet.tweetId === tweetId);
    
    if (betIndex === -1) {
      throw new Error('Bet not found');
    }

    const bet = bets[betIndex];
    
    if (bet.settled) {
      throw new Error('Bet already settled');
    }

    if (userAddress === bet.challenger) {
      if (bet.challengerDeposited) {
        throw new Error('Challenger already deposited');
      }
      bet.challengerDeposited = true;
    } else if (userAddress === bet.accepter) {
      if (bet.accepterDeposited) {
        throw new Error('Accepter already deposited');
      }
      bet.accepterDeposited = true;
    } else {
      throw new Error('Not a participant in this bet');
    }

    // Update status
    if (bet.challengerDeposited && bet.accepterDeposited) {
      bet.status = 'active';
    }

    bets[betIndex] = bet;
    this.saveBets(bets);
    
    return bet;
  }

  // Settle a bet (admin only)
  public async settleBet(tweetId: string, challengerWins: boolean): Promise<MockBet> {
    const bets = this.getBets();
    const betIndex = bets.findIndex(bet => bet.tweetId === tweetId);
    
    if (betIndex === -1) {
      throw new Error('Bet not found');
    }

    const bet = bets[betIndex];
    
    if (bet.settled) {
      throw new Error('Bet already settled');
    }

    if (!bet.challengerDeposited || !bet.accepterDeposited) {
      throw new Error('Bet not fully funded');
    }

    bet.settled = true;
    bet.winner = challengerWins ? bet.challenger : bet.accepter;
    bet.status = 'settled';

    bets[betIndex] = bet;
    this.saveBets(bets);

    // Update winner stats
    const stats = this.getUserStats();
    if (stats[bet.winner]) {
      stats[bet.winner].winnings += bet.amountCHZ * 2; // Winner gets double
    }
    this.saveUserStats(stats);

    return bet;
  }

  // Cancel a bet (admin only)
  public async cancelBet(tweetId: string, reason: string): Promise<MockBet> {
    const bets = this.getBets();
    const betIndex = bets.findIndex(bet => bet.tweetId === tweetId);
    
    if (betIndex === -1) {
      throw new Error('Bet not found');
    }

    const bet = bets[betIndex];
    
    if (bet.settled) {
      throw new Error('Bet already settled');
    }

    bet.settled = true;
    bet.status = 'cancelled';

    bets[betIndex] = bet;
    this.saveBets(bets);

    return bet;
  }

  // Get bet by tweet ID
  public async getBetByTweetId(tweetId: string): Promise<MockBet | null> {
    const bets = this.getBets();
    return bets.find(bet => bet.tweetId === tweetId) || null;
  }

  // Get bet by ID
  public async getBetById(id: string): Promise<MockBet | null> {
    const bets = this.getBets();
    return bets.find(bet => bet.id === id) || null;
  }

  // Check if bet is fully funded
  public async isBetFullyFunded(tweetId: string): Promise<boolean> {
    const bet = await this.getBetByTweetId(tweetId);
    return bet ? bet.challengerDeposited && bet.accepterDeposited : false;
  }

  // Get all bets
  public async getAllBets(): Promise<MockBet[]> {
    return this.getBets();
  }

  // Get bets by status
  public async getBetsByStatus(status: 'pending' | 'active' | 'settled' | 'cancelled'): Promise<MockBet[]> {
    const bets = this.getBets();
    return bets.filter(bet => bet.status === status);
  }

  // Get user bets
  public async getUserBets(userAddress: string): Promise<MockBet[]> {
    const bets = this.getBets();
    return bets.filter(bet => 
      bet.challenger === userAddress || bet.accepter === userAddress
    );
  }

  // Get user stats
  public async getUserStatsForAddress(userAddress: string): Promise<MockUserStats> {
    const stats = this.getUserStats();
    return stats[userAddress] || { betCount: 0, winnings: 0, totalVolume: 0 };
  }

  // Get recent bets for live feed
  public async getRecentBets(limit: number = 10): Promise<MockBet[]> {
    const bets = this.getBets();
    return bets
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // Initialize with some demo data
  public async initializeDemoData(): Promise<void> {
    const existingBets = this.getBets();
    if (existingBets.length > 0) return; // Already initialized

    const demoBets: MockBet[] = [
      {
        id: 'bet_demo_1',
        tweetId: 'twitter_1234567890',
        prediction: 'Lakers will beat Warriors by 5+ points',
        challenger: '0x1234567890123456789012345678901234567890',
        accepter: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        amountCHZ: 125, // 5 USDT
        amountUSDT: 5,
        gameId: 'nba_lakers_warriors_20241201',
        settled: false,
        createdAt: Date.now() - 3600000, // 1 hour ago
        challengerDeposited: true,
        accepterDeposited: true,
        challengerTwitterHandle: '@cryptobettor1',
        accepterTwitterHandle: '@sportsfan2',
        challengerTwitterId: '1234567890',
        accepterTwitterId: 'abcdefghij',
        status: 'active'
      },
      {
        id: 'bet_demo_2',
        tweetId: 'twitter_2345678901',
        prediction: 'Messi will score 2+ goals tonight',
        challenger: '0x2345678901234567890123456789012345678901',
        accepter: '0xbcdefabcdefabcdefabcdefabcdefabcdefabcde',
        amountCHZ: 250, // 10 USDT
        amountUSDT: 10,
        gameId: 'soccer_psg_barcelona_20241201',
        settled: true,
        winner: '0x2345678901234567890123456789012345678901',
        createdAt: Date.now() - 7200000, // 2 hours ago
        challengerDeposited: true,
        accepterDeposited: true,
        challengerTwitterHandle: '@messifan',
        accepterTwitterHandle: '@soccerskeptic',
        challengerTwitterId: '2345678901',
        accepterTwitterId: 'bcdefghijk',
        status: 'settled'
      },
      {
        id: 'bet_demo_3',
        tweetId: 'twitter_3456789012',
        prediction: 'Chiefs will win by 2 touchdowns',
        challenger: '0x3456789012345678901234567890123456789012',
        accepter: '0xcdefabcdefabcdefabcdefabcdefabcdefabcdef',
        amountCHZ: 75, // 3 USDT
        amountUSDT: 3,
        gameId: 'nfl_chiefs_bills_20241201',
        settled: false,
        createdAt: Date.now() - 1800000, // 30 minutes ago
        challengerDeposited: true,
        accepterDeposited: false,
        challengerTwitterHandle: '@chiefskingdom',
        accepterTwitterHandle: '@billsmafia',
        challengerTwitterId: '3456789012',
        accepterTwitterId: 'cdefghijkl',
        status: 'pending'
      }
    ];

    this.saveBets(demoBets);

    // Initialize demo stats
    const demoStats = {
      '0x1234567890123456789012345678901234567890': {
        betCount: 3,
        winnings: 250,
        totalVolume: 500
      },
      '0x2345678901234567890123456789012345678901': {
        betCount: 2,
        winnings: 500,
        totalVolume: 375
      },
      '0x3456789012345678901234567890123456789012': {
        betCount: 1,
        winnings: 0,
        totalVolume: 75
      }
    };

    this.saveUserStats(demoStats);
  }

  // Clear all data (for testing)
  public clearAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STATS_KEY);
  }
}

// Export singleton instance
export const mockContract = new MockContractService();

// Auto-initialize demo data
if (typeof window !== 'undefined') {
  mockContract.initializeDemoData();
}