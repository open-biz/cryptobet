import type { NextApiRequest, NextApiResponse } from 'next';
import { twitterBot } from '@/lib/twitter';
import { ContractService } from '@/lib/contract';
import type { TwitterMention, BetIntent } from '@/types';

const contractService = new ContractService();

interface TwitterWebhookPayload {
  tweet_create_events?: Array<{
    id: string;
    text: string;
    user: {
      id: string;
      screen_name: string;
    };
    entities?: {
      user_mentions?: Array<{
        screen_name: string;
        id: string;
      }>;
    };
    in_reply_to_status_id?: string;
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: TwitterWebhookPayload = req.body;
    
    if (!payload.tweet_create_events) {
      return res.status(200).json({ message: 'No tweet events' });
    }

    for (const tweet of payload.tweet_create_events) {
      await processTweetMention(tweet);
    }

    res.status(200).json({ message: 'Processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function processTweetMention(tweet: any) {
  const mentions = tweet.entities?.user_mentions?.map((m: any) => `@${m.screen_name}`) || [];
  
  if (!mentions.includes('@sendbet')) {
    return;
  }

  const betIntent = twitterBot.parseBetIntent(tweet.text, mentions);
  
  if (betIntent.type === 'challenge') {
    await handleBetChallenge(tweet, betIntent);
  } else if (betIntent.type === 'accept') {
    await handleBetAccept(tweet, betIntent);
  }
}

async function handleBetChallenge(tweet: any, betIntent: BetIntent) {
  if (!betIntent.amount || !betIntent.prediction || !betIntent.targetUser) {
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Invalid bet format. Use: @sendbet challenge $amount \"prediction\" @opponent"
    );
    return;
  }

  const targetUser = await twitterBot.getUserByUsername(betIntent.targetUser);
  if (!targetUser) {
    await twitterBot.replyToTweet(
      tweet.id,
      `❌ User @${betIntent.targetUser} not found`
    );
    return;
  }

  const gameContext = twitterBot.extractGameContext(betIntent.prediction) || 'upcoming-game';

  try {
    // For now, we'll track the bet creation in the tweet itself
    // The actual smart contract creation happens when users visit the bet page and connect wallets
    // This webhook just validates the format and posts the bet link

    const replyMessage = twitterBot.formatBetChallengeReply(
      tweet.user.screen_name,
      betIntent.targetUser,
      betIntent.prediction,
      betIntent.amount,
      tweet.id
    );

    await twitterBot.replyToTweet(tweet.id, replyMessage);
  } catch (error) {
    console.error('Error creating bet:', error);
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Error creating bet. Please try again."
    );
  }
}

async function handleBetAccept(tweet: any, betIntent: BetIntent) {
  if (!tweet.in_reply_to_status_id) {
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Must reply to a bet challenge to accept"
    );
    return;
  }

  try {
    // For MVP: Simply acknowledge the bet acceptance
    // The actual bet creation and validation happens when users visit the website
    const replyMessage = `🎯 Bet Accepted!

@${tweet.user.screen_name} has accepted the challenge!
Both players should now visit:
🔗 sendbet.app/bet/${tweet.in_reply_to_status_id}

Connect wallets and deposit to fund this bet! 💰`;

    await twitterBot.replyToTweet(tweet.id, replyMessage);
  } catch (error) {
    console.error('Error processing bet acceptance:', error);
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Error processing acceptance. Please try again."
    );
  }
}