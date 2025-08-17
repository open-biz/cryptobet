export interface TwitterMention {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  referenced_tweets?: {
    type: 'replied_to' | 'quoted' | 'retweeted';
    id: string;
  }[];
  context_annotations?: {
    domain: {
      id: string;
      name: string;
      description?: string;
    };
    entity: {
      id: string;
      name: string;
      description?: string;
    };
  }[];
}

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

export interface BetIntent {
  type: 'challenge' | 'accept' | 'unknown';
  amount?: number;
  prediction?: string;
  targetUser?: string;
  challenger?: string;
  accepter?: string;
  gameContext?: string;
}

export interface TwitterBet {
  id?: number;
  tweetId: string;
  challengerTwitterId: string;
  accepterTwitterId: string;
  challengerAddress?: string;
  accepterAddress?: string;
  prediction: string;
  amount: number;
  gameId: string;
  contractAddress?: string;
  status: 'pending' | 'funded' | 'settled' | 'cancelled';
  winner?: string;
  createdAt: Date;
}

export interface User {
  twitterId: string;
  walletAddress?: string;
  twitterHandle: string;
  totalBets: number;
  totalWinnings: number;
}

export interface GameResult {
  gameId: string;
  playerStats: {
    [playerId: string]: {
      goals: number;
      assists: number;
      [key: string]: any;
    };
  };
  finalScore: {
    home: number;
    away: number;
  };
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  startTime: string;
}

export interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  scores?: {
    score: number;
    name: string;
  }[];
  last_update: string;
  completed: boolean;
}