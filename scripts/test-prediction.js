// Test script to simulate Chainlink Functions prediction evaluation
const fs = require("fs");
const path = require("path");

// Mock Chainlink Functions environment
const Functions = {
  makeHttpRequest: async (config) => {
    const fetch = (await import('node-fetch')).default;
    
    let url = config.url;
    if (config.params) {
      const params = new URLSearchParams(config.params);
      url += '?' + params.toString();
    }

    console.log(`Making request to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: config.headers || {}
      });
      
      const data = await response.json();
      
      return {
        status: response.status,
        data: data,
        error: response.ok ? null : `HTTP ${response.status}`
      };
    } catch (error) {
      return {
        status: 500,
        data: null,
        error: error.message
      };
    }
  },
  
  encodeUint256: (value) => value
};

// Mock secrets
const secrets = {
  ODDS_API_KEY: process.env.ODDS_API_KEY || 'test-api-key'
};

// Test cases
const testCases = [
  {
    name: "Lakers win prediction",
    args: ["test-game-1", "Lakers will beat Warriors", "basketball_nba"],
    mockResponse: [{
      id: "test-game-1",
      completed: true,
      home_team: "Los Angeles Lakers",
      away_team: "Golden State Warriors",
      scores: [
        { name: "Los Angeles Lakers", score: "112" },
        { name: "Golden State Warriors", score: "108" }
      ]
    }],
    expectedOutcome: 1 // Challenger wins
  },
  {
    name: "Margin prediction",
    args: ["test-game-2", "Lakers will beat Warriors by 10+ points", "basketball_nba"],
    mockResponse: [{
      id: "test-game-2",
      completed: true,
      home_team: "Los Angeles Lakers", 
      away_team: "Golden State Warriors",
      scores: [
        { name: "Los Angeles Lakers", score: "120" },
        { name: "Golden State Warriors", score: "105" }
      ]
    }],
    expectedOutcome: 1 // Challenger wins (15 point margin)
  },
  {
    name: "Over/Under prediction",
    args: ["test-game-3", "Over 220 total points", "basketball_nba"],
    mockResponse: [{
      id: "test-game-3",
      completed: true,
      home_team: "Los Angeles Lakers",
      away_team: "Golden State Warriors", 
      scores: [
        { name: "Los Angeles Lakers", score: "115" },
        { name: "Golden State Warriors", score: "110" }
      ]
    }],
    expectedOutcome: 1 // Challenger wins (225 total > 220)
  },
  {
    name: "Incomplete game",
    args: ["test-game-4", "Lakers will win", "basketball_nba"],
    mockResponse: [{
      id: "test-game-4",
      completed: false,
      home_team: "Los Angeles Lakers",
      away_team: "Golden State Warriors",
      scores: []
    }],
    expectedOutcome: 0 // Game not complete, challenger doesn't win yet
  }
];

async function runTest(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`Arguments: [${testCase.args.join(', ')}]`);

  // Mock the HTTP request to return our test data
  const originalMakeHttpRequest = Functions.makeHttpRequest;
  Functions.makeHttpRequest = async () => ({
    status: 200,
    data: testCase.mockResponse,
    error: null
  });

  try {
    // Load and execute the Functions source code
    const sourcePath = path.join(__dirname, "../chainlink-functions/source.js");
    let source = fs.readFileSync(sourcePath, "utf8");
    
    // Inject test variables
    const args = testCase.args;
    
    // Execute the code
    const result = await eval(`(async () => { ${source} })()`);
    
    console.log(`Result: ${result}`);
    console.log(`Expected: ${testCase.expectedOutcome}`);
    console.log(`✅ ${result === testCase.expectedOutcome ? 'PASS' : 'FAIL'}`);
    
    return result === testCase.expectedOutcome;
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  } finally {
    // Restore original function
    Functions.makeHttpRequest = originalMakeHttpRequest;
  }
}

async function runAllTests() {
  console.log("🚀 Starting Chainlink Functions prediction tests...\n");
  
  let passed = 0;
  let total = testCases.length;
  
  for (const testCase of testCases) {
    const success = await runTest(testCase);
    if (success) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log("🎉 All tests passed! The prediction logic is working correctly.");
  } else {
    console.log("⚠️  Some tests failed. Review the prediction logic.");
  }
}

// Example: Test with real API call
async function testRealAPI() {
  console.log("\n🌐 Testing with real Odds API...");
  
  if (!process.env.ODDS_API_KEY) {
    console.log("❌ ODDS_API_KEY not found in environment variables");
    return;
  }
  
  // Get recent NBA games
  try {
    const response = await Functions.makeHttpRequest({
      url: "https://api.the-odds-api.com/v4/sports/basketball_nba/scores",
      params: {
        api_key: process.env.ODDS_API_KEY,
        daysFrom: 1
      }
    });
    
    console.log(`API Status: ${response.status}`);
    console.log(`Games found: ${response.data?.length || 0}`);
    
    if (response.data && response.data.length > 0) {
      const game = response.data[0];
      console.log(`Sample game: ${game.home_team} vs ${game.away_team}`);
      console.log(`Completed: ${game.completed}`);
      if (game.completed && game.scores) {
        console.log(`Score: ${game.scores.map(s => `${s.name}: ${s.score}`).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
  }
}

// Run tests
async function main() {
  await runAllTests();
  
  if (process.argv.includes('--real-api')) {
    await testRealAPI();
  }
}

main().catch(console.error);