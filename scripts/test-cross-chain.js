const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Test cross-chain oracle functionality
async function main() {
  console.log("🧪 Testing cross-chain oracle setup...\n");

  // Load deployment info
  const chilizDeploymentPath = path.join(__dirname, "../deployments/chiliz-main.json");
  const amoyDeploymentPath = path.join(__dirname, "../deployments/amoy-oracle.json");
  
  let chilizInfo, amoyInfo;
  
  try {
    const chilizData = await fs.promises.readFile(chilizDeploymentPath, 'utf8');
    chilizInfo = JSON.parse(chilizData);
    console.log("✅ Loaded Chiliz deployment info");
  } catch (error) {
    console.error("❌ Chiliz deployment info not found");
    process.exit(1);
  }

  try {
    const amoyData = await fs.promises.readFile(amoyDeploymentPath, 'utf8');
    amoyInfo = JSON.parse(amoyData);
    console.log("✅ Loaded Polygon Amoy deployment info");
  } catch (error) {
    console.error("❌ Polygon Amoy deployment info not found");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Test 1: Check contract deployments
  console.log("\n📋 1. Checking contract deployments...");
  
  const TwitterBetsHyperlane = await hre.ethers.getContractFactory("TwitterBetsHyperlane");
  const mainContract = TwitterBetsHyperlane.attach(chilizInfo.contractAddress);
  
  try {
    const owner = await mainContract.owner();
    console.log("✅ Main contract accessible, owner:", owner);
  } catch (error) {
    console.log("❌ Main contract not accessible:", error.message);
    return;
  }

  // Test 2: Check configuration
  console.log("\n⚙️  2. Checking cross-chain configuration...");
  
  try {
    const oracleDomain = await mainContract.oracleDomain();
    const oracleContract = await mainContract.oracleContract();
    
    console.log("Oracle Domain:", oracleDomain.toString());
    console.log("Oracle Contract:", oracleContract);
    console.log("Expected Address:", amoyInfo.oracleAddress);
    
    if (oracleDomain.toString() === "80002") {
      console.log("✅ Oracle domain correctly set to Polygon Amoy");
    } else {
      console.log("⚠️  Oracle domain mismatch");
    }
  } catch (error) {
    console.log("❌ Configuration check failed:", error.message);
  }

  // Test 3: Check balances for gas
  console.log("\n💰 3. Checking gas balances...");
  
  try {
    const mainBalance = await hre.ethers.provider.getBalance(chilizInfo.contractAddress);
    console.log("Main contract balance:", hre.ethers.formatEther(mainBalance), "CHZ");
    
    if (mainBalance > 0) {
      console.log("✅ Main contract has gas for Hyperlane messages");
    } else {
      console.log("⚠️  Main contract needs CHZ for gas payments");
      console.log(`Send CHZ to: ${chilizInfo.contractAddress}`);
    }
  } catch (error) {
    console.log("❌ Balance check failed:", error.message);
  }

  // Test 4: Estimate settlement gas cost
  console.log("\n⛽ 4. Estimating settlement gas costs...");
  
  try {
    // Create a mock bet for gas estimation
    const mockBetId = "test_bet_" + Date.now();
    const mockGameId = "test_game_123";
    const mockPrediction = "Lakers will beat Warriors";
    const mockSport = "basketball_nba";
    
    // This would normally be done through the UI, but we're simulating
    console.log("Mock bet parameters:");
    console.log("- Bet ID:", mockBetId);
    console.log("- Game ID:", mockGameId);
    console.log("- Prediction:", mockPrediction);
    console.log("- Sport:", mockSport);
    
    // Note: We can't actually estimate without creating a real bet
    // But we can provide guidance
    console.log("💡 To test settlement:");
    console.log("1. Create a bet through the web interface");
    console.log("2. Fund both sides of the bet");
    console.log("3. Wait for settlement time or manually trigger");
    
  } catch (error) {
    console.log("❌ Gas estimation failed:", error.message);
  }

  // Test 5: Check Functions configuration
  console.log("\n🔗 5. Chainlink Functions checklist...");
  
  console.log("Oracle contract:", amoyInfo.oracleAddress);
  console.log("Functions router:", amoyInfo.functionsRouter);
  console.log("DON ID:", amoyInfo.donId);
  console.log("Subscription ID:", amoyInfo.subscriptionId);
  
  console.log("\n📝 Manual verification needed:");
  console.log("□ Functions subscription is funded with LINK");
  console.log("□ Oracle contract is added as Functions consumer");
  console.log("□ ODDS_API_KEY is uploaded as encrypted secret");
  console.log("□ Both contracts have gas for Hyperlane messages");

  // Test 6: Deployment summary
  console.log("\n📊 6. Deployment Summary:");
  console.log("┌─────────────────────────────────────────────────────────┐");
  console.log("│                   CROSS-CHAIN SETUP                    │");
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log(`│ Chiliz Contract: ${chilizInfo.contractAddress}          │`);
  console.log(`│ Amoy Oracle:     ${amoyInfo.oracleAddress}             │`);
  console.log("├─────────────────────────────────────────────────────────┤");
  console.log("│ Flow: Chiliz → Hyperlane → Amoy → Functions → API      │");
  console.log("│       API → Functions → Amoy → Hyperlane → Chiliz      │");
  console.log("└─────────────────────────────────────────────────────────┘");

  console.log("\n🚀 Next Steps:");
  console.log("1. Fund contracts with gas tokens");
  console.log("2. Configure Chainlink Functions subscription");
  console.log("3. Test with a real bet through the web interface");
  console.log("4. Monitor cross-chain messages in block explorers");

  console.log("\n🔍 Monitoring URLs:");
  console.log("- Chiliz Explorer: https://spicy-explorer.chiliz.com");
  console.log("- Polygon Amoy Explorer: https://amoy.polygonscan.com");
  console.log("- Hyperlane Explorer: https://explorer.hyperlane.xyz");
  console.log("- Functions Dashboard: https://functions.chain.link");

  console.log("\n✅ Cross-chain setup verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });