const { Requester, Validator, AdapterError } = require('@chainlink/ea-bootstrap');

// Define custom error scenarios
const customError = (data) => {
  if (data.Response === 'Error') return true;
  return false;
};

// Define custom parameters to be used by the adapter
// This example uses price feeds, but we'll adapt for sports outcomes
const customParams = {
  sport: ['sport', 'market'],
  gameId: ['game_id', 'event_id', 'game'],
  prediction: ['prediction', 'bet_type'],
  endpoint: false
};

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams);
  const jobRunID = validator.validated.id;
  const sport = validator.validated.data.sport || 'americanfootball_nfl';
  const gameId = validator.validated.data.gameId;
  const prediction = validator.validated.data.prediction;
  const endpoint = validator.validated.data.endpoint || 'scores';

  console.log('Oracle request:', { sport, gameId, prediction, endpoint });

  // API configuration
  const url = `https://api.the-odds-api.com/v4/sports/${sport}/${endpoint}`;
  
  const config = {
    url,
    params: {
      apiKey: process.env.ODDS_API_KEY,
      eventIds: gameId,
      daysFrom: 3 // Look for events up to 3 days in the past
    },
    headers: {
      'Accept': 'application/json'
    }
  };

  console.log('Making request to Odds API:', config.url);

  // Make the HTTP request
  Requester.request(config, customError)
    .then(response => {
      console.log('Odds API response:', JSON.stringify(response.data, null, 2));
      
      const result = processGameResult(response.data, gameId, prediction);
      console.log('Processed result:', result);
      
      callback(response.status, Requester.success(jobRunID, response, result));
    })
    .catch(error => {
      console.error('Error fetching from Odds API:', error);
      callback(500, Requester.errored(jobRunID, error));
    });
};

function processGameResult(apiData, gameId, prediction) {
  try {
    // Find the specific game
    const game = apiData.find(event => event.id === gameId);
    
    if (!game) {
      throw new Error(`Game ${gameId} not found`);
    }

    if (!game.completed) {
      return {
        result: 'pending',
        outcome: false,
        reason: 'Game not completed yet'
      };
    }

    // Extract scores and determine winner
    const scores = game.scores;
    if (!scores || scores.length < 2) {
      throw new Error('Insufficient score data');
    }

    const homeScore = scores.find(s => s.name === game.home_team)?.score || 0;
    const awayScore = scores.find(s => s.name === game.away_team)?.score || 0;
    
    console.log(`Game result: ${game.home_team} ${homeScore} - ${game.away_team} ${awayScore}`);

    // Evaluate prediction
    const outcome = evaluatePrediction(prediction, {
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      homeScore: parseInt(homeScore),
      awayScore: parseInt(awayScore),
      game: game
    });

    return {
      result: 'completed',
      outcome: outcome,
      homeScore: homeScore,
      awayScore: awayScore,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      prediction: prediction
    };

  } catch (error) {
    console.error('Error processing game result:', error);
    throw new AdapterError({
      jobRunID: 'N/A',
      status: 'errored',
      error: error.message
    });
  }
}

function evaluatePrediction(prediction, gameData) {
  const pred = prediction.toLowerCase();
  const { homeTeam, awayTeam, homeScore, awayScore } = gameData;
  
  console.log(`Evaluating prediction: "${prediction}" against game data:`, gameData);

  // Determine winning team
  const winner = homeScore > awayScore ? homeTeam : awayTeam;
  const scoreDiff = Math.abs(homeScore - awayScore);
  const totalScore = homeScore + awayScore;

  // Common prediction patterns
  if (pred.includes('will win')) {
    const teamName = extractTeamName(pred);
    return teamName && winner.toLowerCase().includes(teamName.toLowerCase());
  }

  if (pred.includes('will beat') || pred.includes('beats')) {
    const teamName = extractTeamName(pred);
    return teamName && winner.toLowerCase().includes(teamName.toLowerCase());
  }

  if (pred.includes('by') && pred.includes('points')) {
    const teamName = extractTeamName(pred);
    const pointsMatch = pred.match(/(\d+)\s*\+?\s*points?/);
    if (teamName && pointsMatch) {
      const requiredMargin = parseInt(pointsMatch[1]);
      const teamWon = winner.toLowerCase().includes(teamName.toLowerCase());
      return teamWon && scoreDiff >= requiredMargin;
    }
  }

  if (pred.includes('over') || pred.includes('under')) {
    const scoreMatch = pred.match(/(\d+(?:\.\d+)?)/);
    if (scoreMatch) {
      const threshold = parseFloat(scoreMatch[1]);
      if (pred.includes('over')) {
        return totalScore > threshold;
      } else {
        return totalScore < threshold;
      }
    }
  }

  if (pred.includes('first') && pred.includes('score')) {
    // For "first to score" predictions, we'd need more detailed game data
    // For now, return false as we don't have play-by-play data
    return false;
  }

  // Default: try to match team name to winner
  const teamName = extractTeamName(pred);
  if (teamName) {
    return winner.toLowerCase().includes(teamName.toLowerCase());
  }

  console.warn(`Could not evaluate prediction: ${prediction}`);
  return false;
}

function extractTeamName(prediction) {
  // Extract team names from common patterns
  const teamPatterns = [
    /(?:lakers?|warriors?|bulls?|heat|knicks?|celtics?|nets?|sixers?|raptors?|magic|hawks?|hornets?|pistons?|pacers?|cavaliers?|bucks?|suns?|kings?|clippers?|nuggets?|timberwolves?|thunder|trail\s*blazers?|jazz|rockets?|spurs?|mavericks?|grizzlies?|pelicans?)/i,
    // NFL teams
    /(?:patriots?|bills?|dolphins?|jets?|steelers?|ravens?|browns?|bengals?|titans?|colts?|texans?|jaguars?|chiefs?|raiders?|chargers?|broncos?|cowboys?|giants?|eagles?|redskins?|packers?|bears?|vikings?|lions?|falcons?|panthers?|saints?|buccaneers?|cardinals?|rams?|seahawks?|49ers?)/i,
    // Soccer teams (examples)
    /(?:manchester\s*(?:united|city)|liverpool|chelsea|arsenal|tottenham|real\s*madrid|barcelona|psg|bayern|juventus)/i
  ];

  for (const pattern of teamPatterns) {
    const match = prediction.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

// This is a wrapper to allow the function to work with
// GCP Functions, AWS Lambda, etc
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// This is a wrapper to allow the function to work with AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    });
  });
};

// This allows the function to be exported for testing
// or for running in express
exports.createRequest = createRequest;