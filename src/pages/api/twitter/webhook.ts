import type { NextApiRequest, NextApiResponse } from 'next';
import { twitterBot } from '@/lib/twitter';
import { createBet, findBetByTweetId, updateBetStatus } from '@/lib/database';
import type { TwitterMention, BetIntent } from '@/types';

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
    await createBet({
      tweetId: tweet.id,
      challengerTwitterId: tweet.user.id,
      accepterTwitterId: targetUser.id,
      prediction: betIntent.prediction,
      amount: betIntent.amount,
      gameId: gameContext,
      status: 'pending',
      createdAt: new Date(),
    });

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

  const originalBet = await findBetByTweetId(tweet.in_reply_to_status_id);
  if (!originalBet) {
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Original bet not found"
    );
    return;
  }

  if (originalBet.status !== 'pending') {
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Bet already accepted or expired"
    );
    return;
  }

  if (tweet.user.id !== originalBet.accepterTwitterId) {
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Only the challenged user can accept this bet"
    );
    return;
  }

  try {
    await updateBetStatus(originalBet.tweetId, 'funded');

    const challenger = await twitterBot.getUserByUsername(originalBet.challengerTwitterId);
    const accepter = await twitterBot.getUserByUsername(originalBet.accepterTwitterId);

    const replyMessage = twitterBot.formatBetAcceptedReply(
      challenger?.username || 'challenger',
      accepter?.username || 'accepter',
      originalBet.prediction,
      originalBet.amount
    );

    await twitterBot.replyToTweet(tweet.id, replyMessage);
  } catch (error) {
    console.error('Error accepting bet:', error);
    await twitterBot.replyToTweet(
      tweet.id,
      "❌ Error accepting bet. Please try again."
    );
  }
}