const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying TwitterBetsFunctions contract to Chiliz testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.formatEther(balance), "CHZ");

  // Chainlink Functions configuration for Chiliz testnet
  // Note: These values need to be updated with actual Chainlink Functions deployment on Chiliz
  const FUNCTIONS_ROUTER = "0x0000000000000000000000000000000000000000"; // Replace with actual router
  const DON_ID = "0x0000000000000000000000000000000000000000000000000000000000000000"; // Replace with actual DON ID
  const SUBSCRIPTION_ID = 1; // Replace with your subscription ID
  const GAS_LIMIT = 300000; // Gas limit for Functions execution

  console.log("Using Chainlink Functions configuration:");
  console.log("Router:", FUNCTIONS_ROUTER);
  console.log("DON ID:", DON_ID);
  console.log("Subscription ID:", SUBSCRIPTION_ID);
  console.log("Gas Limit:", GAS_LIMIT);

  const TwitterBetsFunctions = await hre.ethers.getContractFactory("TwitterBetsFunctions");
  const twitterBetsFunctions = await TwitterBetsFunctions.deploy(
    FUNCTIONS_ROUTER,
    DON_ID,
    SUBSCRIPTION_ID,
    GAS_LIMIT
  );

  await twitterBetsFunctions.waitForDeployment();
  const contractAddress = await twitterBetsFunctions.getAddress();

  console.log("TwitterBetsFunctions deployed to:", contractAddress);

  // Read and set the JavaScript source code
  const sourcePath = path.join(__dirname, "../chainlink-functions/source.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  
  console.log("Setting Functions source code...");
  
  // Update source code (this will require the contract to be funded with LINK)
  const updateTx = await twitterBetsFunctions.updateSource(source);
  await updateTx.wait();
  
  console.log("Source code updated!");

  console.log("\nContract deployment successful!");
  console.log("Add these to your .env file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS=${deployer.address}`);

  console.log("\nNext steps:");
  console.log("1. Create a Chainlink Functions subscription");
  console.log("2. Fund the subscription with LINK tokens");
  console.log("3. Add your contract as a consumer");
  console.log("4. Upload secrets (ODDS_API_KEY) to the DON");
  console.log("5. Update the contract with encrypted secrets URLs");

  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network chilizTestnet ${contractAddress} ${FUNCTIONS_ROUTER} ${DON_ID} ${SUBSCRIPTION_ID} ${GAS_LIMIT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });