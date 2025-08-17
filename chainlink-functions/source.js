// Chainlink Functions JavaScript source for SendBet Oracle
// This function fetches game results from The Odds API and evaluates predictions

// The request comes with these args:
// args[0] = gameId (e.g., "40b7a0cf70f76ca5afbecf1e8dc1c60e")
// args[1] = prediction (e.g., "Lakers will beat Warriors by 10+ points")
// args[2] = sport (e.g., "basketball_nba")

const gameId = args[0];
const prediction = args[1];
const sport = args[2] || 'basketball_nba';

console.log(`Evaluating prediction: "${prediction}" for game: ${gameId} in sport: ${sport}`);

// Make HTTP request to The Odds API
const oddsApiRequest = Functions.makeHttpRequest({
  url: `https://api.the-odds-api.com/v4/sports/${sport}/scores`,
  method: "GET",
  params: {
    api_key: secrets.ODDS_API_KEY,
    eventIds: gameId,
    daysFrom: 3
  },
  headers: {
    'Accept': 'application/json'
  }
});

// Execute the request
const response = await oddsApiRequest;

console.log(`API Response status: ${response.status}`);

if (response.error) {
  console.error('API Error:', response.error);
  throw Error(`Odds API request failed: ${response.error}`);
}

const games = response.data;
console.log(`Found ${games.length} games`);

if (games.length === 0) {
  throw Error(`Game ${gameId} not found`);
}

const game = games[0];
console.log(`Game data:`, JSON.stringify(game, null, 2));

// Check if game is completed
if (!game.completed) {
  console.log('Game not completed yet');
  // Return false for pending games (challenger doesn't win yet)
  return Functions.encodeUint256(0);
}

// Extract scores
const scores = game.scores;
if (!scores || scores.length < 2) {
  throw Error('Insufficient score data');
}

const homeTeam = game.home_team;
const awayTeam = game.away_team;

// Find home and away scores
let homeScore = 0;
let awayScore = 0;

for (const scoreEntry of scores) {
  if (scoreEntry.name === homeTeam) {
    homeScore = parseInt(scoreEntry.score) || 0;
  } else if (scoreEntry.name === awayTeam) {
    awayScore = parseInt(scoreEntry.score) || 0;
  }
}

console.log(`Final Score: ${homeTeam} ${homeScore} - ${awayTeam} ${awayScore}`);

// Evaluate the prediction
const outcome = evaluatePrediction(prediction, {
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  game
});

console.log(`Prediction outcome: ${outcome}`);

// Return 1 for true (challenger wins), 0 for false (accepter wins)
return Functions.encodeUint256(outcome ? 1 : 0);

function evaluatePrediction(prediction, gameData) {
  const pred = prediction.toLowerCase();
  const { homeTeam, awayTeam, homeScore, awayScore } = gameData;
  
  console.log(`Evaluating: "${pred}"`);

  // Determine winning team and score difference
  const winner = homeScore > awayScore ? homeTeam : 
                 awayScore > homeScore ? awayTeam : 'tie';
  const scoreDiff = Math.abs(homeScore - awayScore);
  const totalScore = homeScore + awayScore;

  // Pattern 1: "Team will win"
  if (pred.includes('will win')) {
    const teamName = extractTeamName(pred);
    if (teamName) {
      const teamWon = winner.toLowerCase().includes(teamName.toLowerCase());
      console.log(`"Will win" check: ${teamName} won? ${teamWon}`);
      return teamWon;
    }
  }

  // Pattern 2: "Team will beat Team"
  if (pred.includes('will beat') || pred.includes('beats')) {
    const teamName = extractTeamName(pred);
    if (teamName) {
      const teamWon = winner.toLowerCase().includes(teamName.toLowerCase());
      console.log(`"Will beat" check: ${teamName} won? ${teamWon}`);
      return teamWon;
    }
  }

  // Pattern 3: "Team by X+ points"
  if (pred.includes('by') && (pred.includes('points') || pred.includes('point'))) {
    const teamName = extractTeamName(pred);
    const marginMatch = pred.match(/by\s+(\d+)\s*\+?\s*points?/);
    
    if (teamName && marginMatch) {
      const requiredMargin = parseInt(marginMatch[1]);
      const teamWon = winner.toLowerCase().includes(teamName.toLowerCase());
      const metMargin = scoreDiff >= requiredMargin;
      
      console.log(`Margin check: ${teamName} won by ${scoreDiff}, needed ${requiredMargin}: ${teamWon && metMargin}`);
      return teamWon && metMargin;
    }
  }

  // Pattern 4: Over/Under total points
  if (pred.includes('over') || pred.includes('under')) {
    const scoreMatch = pred.match(/(\d+(?:\.\d+)?)/);
    if (scoreMatch) {
      const threshold = parseFloat(scoreMatch[1]);
      if (pred.includes('over')) {
        const result = totalScore > threshold;
        console.log(`Over ${threshold}: total ${totalScore} > ${threshold}? ${result}`);
        return result;
      } else {
        const result = totalScore < threshold;
        console.log(`Under ${threshold}: total ${totalScore} < ${threshold}? ${result}`);
        return result;
      }
    }
  }

  // Pattern 5: "First to score" (limited support)
  if (pred.includes('first') && pred.includes('score')) {
    // Without play-by-play data, we'll use winning team as proxy
    const teamName = extractTeamName(pred);
    if (teamName) {
      const result = winner.toLowerCase().includes(teamName.toLowerCase());
      console.log(`First to score (proxy): ${teamName} won? ${result}`);
      return result;
    }
  }

  // Pattern 6: Specific score predictions
  if (pred.includes('score') && pred.includes('-')) {
    const scorePattern = /(\d+)\s*-\s*(\d+)/;
    const match = pred.match(scorePattern);
    if (match) {
      const predHome = parseInt(match[1]);
      const predAway = parseInt(match[2]);
      const result = homeScore === predHome && awayScore === predAway;
      console.log(`Exact score: predicted ${predHome}-${predAway}, actual ${homeScore}-${awayScore}: ${result}`);
      return result;
    }
  }

  // Default: Extract team name and check if they won
  const teamName = extractTeamName(pred);
  if (teamName) {
    const result = winner.toLowerCase().includes(teamName.toLowerCase());
    console.log(`Default team check: ${teamName} won? ${result}`);
    return result;
  }

  console.log(`Could not evaluate prediction: ${prediction}`);
  return false;
}

function extractTeamName(prediction) {
  const pred = prediction.toLowerCase();
  
  // NBA teams
  const nbaTeams = [
    'lakers', 'warriors', 'bulls', 'heat', 'knicks', 'celtics', 'nets', 'sixers', 
    'raptors', 'magic', 'hawks', 'hornets', 'pistons', 'pacers', 'cavaliers', 'cavs',
    'bucks', 'suns', 'kings', 'clippers', 'nuggets', 'timberwolves', 'wolves',
    'thunder', 'blazers', 'jazz', 'rockets', 'spurs', 'mavericks', 'mavs',
    'grizzlies', 'pelicans'
  ];

  // NFL teams
  const nflTeams = [
    'patriots', 'bills', 'dolphins', 'jets', 'steelers', 'ravens', 'browns', 'bengals',
    'titans', 'colts', 'texans', 'jaguars', 'chiefs', 'raiders', 'chargers', 'broncos',
    'cowboys', 'giants', 'eagles', 'commanders', 'packers', 'bears', 'vikings', 'lions',
    'falcons', 'panthers', 'saints', 'buccaneers', 'bucs', 'cardinals', 'rams', 'seahawks', '49ers'
  ];

  // Soccer teams (major ones)
  const soccerTeams = [
    'manchester united', 'man united', 'united', 'manchester city', 'man city', 'city',
    'liverpool', 'chelsea', 'arsenal', 'tottenham', 'spurs', 'real madrid', 'madrid',
    'barcelona', 'barca', 'psg', 'bayern', 'juventus', 'juve'
  ];

  const allTeams = [...nbaTeams, ...nflTeams, ...soccerTeams];

  // Find the longest matching team name (to handle "Manchester United" vs "United")
  let bestMatch = '';
  for (const team of allTeams) {
    if (pred.includes(team) && team.length > bestMatch.length) {
      bestMatch = team;
    }
  }

  return bestMatch || null;
}