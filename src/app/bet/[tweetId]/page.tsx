import { notFound } from 'next/navigation';
import BetPage from '@/components/BetPage';
import { findBetByTweetId } from '@/lib/database';

interface Props {
  params: {
    tweetId: string;
  };
}

export default async function BetPageRoute({ params }: Props) {
  const bet = await findBetByTweetId(params.tweetId);
  
  if (!bet) {
    notFound();
  }

  return <BetPage bet={bet} />;
}

export async function generateMetadata({ params }: Props) {
  const bet = await findBetByTweetId(params.tweetId);
  
  if (!bet) {
    return {
      title: 'Bet Not Found - SendBet',
    };
  }

  return {
    title: `Bet: ${bet.prediction} - SendBet`,
    description: `$${bet.amount} bet between two Twitter users about: ${bet.prediction}`,
  };
}