import { TwitterApi } from 'twitter-api-v2';
import type { TwitterMention, TwitterUser, BetIntent } from '@/types';

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

const bearerClient = new TwitterApi(process.env.TWITTER_BEARER_TOKEN!);

export class TwitterBot {
  private readOnlyClient = bearerClient.readOnly;
  private rwClient = client.readWrite;

  async getUserByUsername(username: string): Promise<TwitterUser | null> {
    try {
      const user = await this.readOnlyClient.v2.userByUsername(username);
      return {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getMentions(sinceId?: string): Promise<TwitterMention[]> {
    try {
      const mentions = await this.readOnlyClient.v2.userMentionTimeline(
        process.env.TWITTER_BOT_USER_ID!,
        {
          max_results: 100,
          since_id: sinceId,
          'tweet.fields': ['created_at', 'context_annotations', 'referenced_tweets'],
        }
      );

      return mentions.data?.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        author_id: tweet.author_id!,
        created_at: tweet.created_at!,
        referenced_tweets: tweet.referenced_tweets,
        context_annotations: tweet.context_annotations,
      })) || [];
    } catch (error) {
      console.error('Error fetching mentions:', error);
      return [];
    }
  }

  async replyToTweet(tweetId: string, message: string): Promise<string | null> {
    try {
      const reply = await this.rwClient.v2.reply(message, tweetId);
      return reply.data.id;
    } catch (error) {
      console.error('Error replying to tweet:', error);
      return null;
    }
  }

  async tweet(message: string): Promise<string | null> {
    try {
      const tweet = await this.rwClient.v2.tweet(message);
      return tweet.data.id;
    } catch (error) {
      console.error('Error sending tweet:', error);
      return null;
    }
  }

  parseBetIntent(tweetText: string, mentions: string[]): BetIntent {
    const text = tweetText.toLowerCase();
    
    const challengeKeywords = ['challenge', 'bet', 'wager'];
    const acceptKeywords = ['accept', 'take', 'yes', 'deal'];
    
    const isChallenge = challengeKeywords.some(keyword => text.includes(keyword));
    const isAccept = acceptKeywords.some(keyword => text.includes(keyword));
    
    const amountMatch = text.match(/\$(\d+(?:\.\d{2})?)|(\d+)\s*(?:dollars?|bucks?|usd)/);
    const amount = amountMatch ? parseFloat(amountMatch[1] || amountMatch[2]) : undefined;
    
    const userMentions = mentions.filter(mention => mention !== '@sendbet');
    const targetUser = userMentions[0]?.replace('@', '');
    
    const prediction = this.extractPrediction(tweetText);
    
    if (isChallenge && amount && prediction) {
      return {
        type: 'challenge',
        amount,
        prediction,
        targetUser,
      };
    }
    
    if (isAccept) {
      return {
        type: 'accept',
        amount,
      };
    }
    
    return { type: 'unknown' };
  }

  private extractPrediction(tweetText: string): string | undefined {
    const predictionPatterns = [
      /(.+?)\s+@sendbet/i,
      /"([^"]+)"/,
      /'([^']+)'/,
    ];
    
    for (const pattern of predictionPatterns) {
      const match = tweetText.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    const parts = tweetText.split('@sendbet')[0];
    if (parts && parts.trim().length > 10) {
      return parts.trim();
    }
    
    return undefined;
  }

  formatBetChallengeReply(
    challenger: string,
    accepter: string,
    prediction: string,
    amount: number,
    tweetId: string
  ): string {
    return `🎯 Bet Challenge Created!

@${challenger} challenges @${accepter}: "${prediction}"
💰 Stake: $${amount} each
🔗 Accept here: ${process.env.NEXT_PUBLIC_APP_URL}/bet/${tweetId}

Both parties must deposit within 24hrs ⏰`;
  }

  formatBetAcceptedReply(
    challenger: string,
    accepter: string,
    prediction: string,
    amount: number
  ): string {
    return `✅ Bet Locked In!

@${challenger} vs @${accepter}: "${prediction}"
💰 Total pot: $${amount * 2}
🤖 Will auto-settle when game ends

May the best prediction win! 🏆`;
  }

  formatBetSettledReply(
    winner: string,
    prediction: string,
    amount: number,
    actualOutcome: string
  ): string {
    return `🏆 Bet Settled!

Prediction: "${prediction}"
Result: ${actualOutcome}
Winner: @${winner}
💰 Payout: $${amount * 2}

Thanks for using SendBet! 🚀`;
  }

  extractGameContext(tweetText: string): string | undefined {
    const gamePatterns = [
      /(\w+)\s+vs?\s+(\w+)/i,
      /(\w+)\s+@\s+(\w+)/i,
      /(today|tonight|this\s+(?:week|weekend))/i,
    ];
    
    for (const pattern of gamePatterns) {
      const match = tweetText.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return undefined;
  }
}

export const twitterBot = new TwitterBot();