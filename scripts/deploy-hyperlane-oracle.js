const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deploy CrossChainOracle on Polygon Amoy testnet
async function main() {
  console.log("Deploying CrossChainOracle to Polygon Amoy testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.formatEther(balance), "MATIC");

  // Hyperlane Polygon Amoy configuration
  const HYPERLANE_MAILBOX_AMOY = "0x2971b9Aec44507A12E7e684e5B1C93c5e70b92e7"; // Hyperlane Amoy mailbox

  // Chainlink Functions configuration for Polygon Amoy
  const FUNCTIONS_ROUTER_AMOY = "0xC22a79eBA640940ABB6dF0f7982cc119578E11De"; // Functions router on Amoy
  const DON_ID_AMOY = "0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000"; // Amoy DON ID
  const SUBSCRIPTION_ID = 1; // Your Functions subscription ID
  const GAS_LIMIT = 300000; // Gas limit for Functions execution

  console.log("Using configuration:");
  console.log("Hyperlane Mailbox:", HYPERLANE_MAILBOX_AMOY);
  console.log("Functions Router:", FUNCTIONS_ROUTER_AMOY);
  console.log("DON ID:", DON_ID_AMOY);
  console.log("Subscription ID:", SUBSCRIPTION_ID);

  // Deploy CrossChainOracle
  const CrossChainOracle = await hre.ethers.getContractFactory("CrossChainOracle");
  const crossChainOracle = await CrossChainOracle.deploy(
    HYPERLANE_MAILBOX_AMOY,
    FUNCTIONS_ROUTER_AMOY,
    DON_ID_AMOY,
    SUBSCRIPTION_ID,
    GAS_LIMIT
  );

  await crossChainOracle.waitForDeployment();
  const oracleAddress = await crossChainOracle.getAddress();

  console.log("CrossChainOracle deployed to:", oracleAddress);

  // Read and set the JavaScript source code
  const sourcePath = path.join(__dirname, "../chainlink-functions/source.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  
  console.log("Setting Functions source code...");
  
  // Update source code
  const updateTx = await crossChainOracle.updateFunctionsConfig(
    DON_ID_AMOY,
    SUBSCRIPTION_ID,
    GAS_LIMIT,
    source,
    "0x" // Empty secrets for now
  );
  await updateTx.wait();
  
  console.log("Source code updated!");

  // Save deployment info
  const deploymentInfo = {
    network: "polygon-amoy",
    oracleAddress: oracleAddress,
    mailbox: HYPERLANE_MAILBOX_AMOY,
    functionsRouter: FUNCTIONS_ROUTER_AMOY,
    donId: DON_ID_AMOY,
    subscriptionId: SUBSCRIPTION_ID,
    deployedAt: new Date().toISOString()
  };

  const deploymentPath = path.join(__dirname, "../deployments/amoy-oracle.json");
  await fs.promises.mkdir(path.dirname(deploymentPath), { recursive: true });
  await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Oracle deployment successful!");
  console.log("Oracle Address:", oracleAddress);
  console.log("Network: Polygon Amoy");
  console.log("Deployment info saved to:", deploymentPath);

  console.log("\nNext steps:");
  console.log("1. Fund Functions subscription with LINK");
  console.log("2. Add oracle contract as Functions consumer");
  console.log("3. Upload ODDS_API_KEY as encrypted secret");
  console.log("4. Deploy main contract on Chiliz testnet");
  console.log("5. Fund oracle contract with MATIC for Hyperlane gas");

  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network polygonAmoy ${oracleAddress} ${HYPERLANE_MAILBOX_AMOY} ${FUNCTIONS_ROUTER_AMOY} ${DON_ID_AMOY} ${SUBSCRIPTION_ID} ${GAS_LIMIT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });