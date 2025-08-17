import { NextApiRequest, NextApiResponse } from 'next';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ODDS_API_KEY) {
    return res.status(500).json({ error: 'Odds API key not configured' });
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        const { action } = req.query;
        
        if (action === 'sports') {
          // Get available sports
          const sportsResponse = await fetch(
            `${ODDS_API_BASE}/sports/?apiKey=${ODDS_API_KEY}`
          );
          const sports = await sportsResponse.json();
          return res.status(200).json(sports);
        }
        
        if (action === 'games') {
          // Get top 10 active games across popular sports
          const sports = ['americanfootball_nfl', 'basketball_nba', 'soccer_epl', 'baseball_mlb'];
          const allGames = [];
          
          for (const sport of sports) {
            try {
              const gamesResponse = await fetch(
                `${ODDS_API_BASE}/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=decimal&dateFormat=iso`
              );
              const games = await gamesResponse.json();
              
              if (Array.isArray(games)) {
                allGames.push(...games.slice(0, 3).map(game => ({
                  id: game.id,
                  sport_key: game.sport_key,
                  sport_title: game.sport_title,
                  home_team: game.home_team,
                  away_team: game.away_team,
                  commence_time: game.commence_time,
                  bookmakers: game.bookmakers
                })));
              }
            } catch (sportError) {
              console.error(`Error fetching ${sport}:`, sportError);
            }
          }
          
          // Sort by commence time and return top 10
          const topGames = allGames
            .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
            .slice(0, 10);
            
          return res.status(200).json(topGames);
        }
        
        if (action === 'resolve') {
          const { gameId } = req.query;
          
          if (!gameId) {
            return res.status(400).json({ error: 'Game ID required' });
          }
          
          // Get game scores
          const scoresResponse = await fetch(
            `${ODDS_API_BASE}/sports/americanfootball_nfl/scores/?apiKey=${ODDS_API_KEY}&eventIds=${gameId}&daysFrom=3`
          );
          const scores = await scoresResponse.json();
          
          return res.status(200).json(scores);
        }
        
        return res.status(400).json({ error: 'Invalid action' });
        
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Odds API error:', error);
    return res.status(500).json({ error: 'Failed to fetch odds data' });
  }
}