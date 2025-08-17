import { twitterBot } from './twitter';
import type { BetIntent } from '@/types';

class TwitterMonitor {
  private isRunning = false;
  private lastCheckedId?: string;
  private pollInterval = 30000; // 30 seconds

  async startMonitoring() {
    if (this.isRunning) {
      console.log('Twitter monitoring is already running');
      return;
    }

    this.isRunning = true;
    console.log('🤖 Starting Twitter monitoring for @SendBet mentions...');

    // Initial check to get the latest mention ID
    try {
      const recentMentions = await twitterBot.getMentions();
      if (recentMentions && recentMentions.length > 0) {
        this.lastCheckedId = recentMentions[0].id;
        console.log(`📍 Starting from mention ID: ${this.lastCheckedId}`);
      }
    } catch (error) {
      console.error('Error getting initial mentions:', error);
    }

    this.poll();
  }

  stopMonitoring() {
    this.isRunning = false;
    console.log('⏹️ Stopped Twitter monitoring');
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      const mentions = await twitterBot.getMentions(this.lastCheckedId);
      
      if (mentions && mentions.length > 0) {
        console.log(`📥 Found ${mentions.length} new mentions`);
        
        // Process mentions in reverse order (oldest first)
        for (const mention of mentions.reverse()) {
          await this.processMention(mention);
          this.lastCheckedId = mention.id;
        }
      }
    } catch (error) {
      console.error('Error polling mentions:', error);
    }

    // Schedule next poll
    setTimeout(() => this.poll(), this.pollInterval);
  }

  private async processMention(mention: any) {
    console.log(`🔍 Processing mention: ${mention.text}`);
    
    // Extract mentions from the tweet
    const mentionText = mention.text.toLowerCase();
    const mentions = this.extractMentions(mention.text);
    
    if (!mentions.includes('@sendbet')) {
      console.log('❌ Not a SendBet mention, skipping');
      return;
    }

    const betIntent = twitterBot.parseBetIntent(mention.text, mentions);
    
    if (betIntent.type === 'challenge') {
      await this.handleBetChallenge(mention, betIntent);
    } else if (betIntent.type === 'accept') {
      await this.handleBetAccept(mention, betIntent);
    } else {
      console.log(`❓ Unknown bet intent type: ${betIntent.type}`);
      await this.handleUnknownIntent(mention);
    }
  }

  private extractMentions(text: string): string[] {
    const mentionPattern = /@(\w+)/g;
    const matches = text.match(mentionPattern) || [];
    return matches.map(match => match.toLowerCase());
  }

  private async handleBetChallenge(mention: any, betIntent: BetIntent) {
    console.log(`🎯 Processing bet challenge: ${betIntent.prediction} for $${betIntent.amount}`);
    
    if (!betIntent.amount || !betIntent.prediction || !betIntent.targetUser) {
      await twitterBot.replyToTweet(
        mention.id,
        "❌ Invalid bet format. Use: @sendbet challenge $amount \"prediction\" @opponent"
      );
      return;
    }

    const targetUser = await twitterBot.getUserByUsername(betIntent.targetUser);
    if (!targetUser) {
      await twitterBot.replyToTweet(
        mention.id,
        `❌ User @${betIntent.targetUser} not found`
      );
      return;
    }

    // Generate a unique bet ID for this Twitter bet
    const betId = 'twitter_' + mention.id;
    
    const replyMessage = `🎯 Bet Challenge Created!

📝 Prediction: "${betIntent.prediction}"
💰 Amount: $${betIntent.amount} each
👤 @${betIntent.targetUser} can accept this bet

🔗 Visit: sendbet.app/bet/${betId}
Connect wallets and deposit to fund this bet!

Reply "@sendbet accept" to accept this challenge! 🚀`;

    await twitterBot.replyToTweet(mention.id, replyMessage);
    console.log(`✅ Bet challenge processed for mention ${mention.id}`);
  }

  private async handleBetAccept(mention: any, betIntent: BetIntent) {
    console.log(`🤝 Processing bet acceptance from ${mention.author_id}`);
    
    // Generate bet ID from the original challenge tweet
    const originalBetId = mention.in_reply_to_status_id ? 
      'twitter_' + mention.in_reply_to_status_id : 
      'twitter_' + mention.id;
    
    const replyMessage = `🎯 Bet Accepted!

🤝 Challenge has been accepted!
Both players should now visit:
🔗 sendbet.app/bet/${originalBetId}

Connect wallets and deposit to fund this bet! 💰
May the best prediction win! 🏆`;

    await twitterBot.replyToTweet(mention.id, replyMessage);
    console.log(`✅ Bet acceptance processed for mention ${mention.id}`);
  }

  private async handleUnknownIntent(mention: any) {
    const helpMessage = `👋 Hi! I help create crypto sports bets!

To challenge someone:
@sendbet challenge $50 "Lakers will win" @opponent

To accept a bet:
@sendbet accept

Visit sendbet.app for more info! 🚀`;

    await twitterBot.replyToTweet(mention.id, helpMessage);
    console.log(`❓ Sent help message for mention ${mention.id}`);
  }
}

export const twitterMonitor = new TwitterMonitor();