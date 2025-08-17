const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Deploy TwitterBetsHyperlane on Chiliz Spicy testnet
async function main() {
  console.log("Deploying TwitterBetsHyperlane to Chiliz Spicy testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.formatEther(balance), "CHZ");

  // Load oracle deployment info
  const oracleDeploymentPath = path.join(__dirname, "../deployments/amoy-oracle.json");
  
  let oracleInfo;
  try {
    const oracleData = await fs.promises.readFile(oracleDeploymentPath, 'utf8');
    oracleInfo = JSON.parse(oracleData);
    console.log("Loaded oracle info from:", oracleDeploymentPath);
  } catch (error) {
    console.error("❌ Oracle deployment info not found. Please deploy oracle first.");
    console.log("Run: npx hardhat run scripts/deploy-hyperlane-oracle.js --network polygonAmoy");
    process.exit(1);
  }

  // Hyperlane configuration for Chiliz testnet
  const HYPERLANE_MAILBOX_CHILIZ = "0x0000000000000000000000000000000000000000"; // Replace with actual Chiliz mailbox
  const AMOY_DOMAIN_ID = 80002; // Hyperlane domain ID for Polygon Amoy
  
  // Convert oracle address to bytes32 for Hyperlane
  const oracleAddressBytes32 = "0x" + oracleInfo.oracleAddress.slice(2).padStart(64, '0');

  console.log("Using configuration:");
  console.log("Chiliz Mailbox:", HYPERLANE_MAILBOX_CHILIZ);
  console.log("Oracle Domain (Amoy):", AMOY_DOMAIN_ID);
  console.log("Oracle Contract:", oracleInfo.oracleAddress);
  console.log("Oracle Contract (bytes32):", oracleAddressBytes32);

  // Check if we need to use placeholder for testing
  const mailboxAddress = HYPERLANE_MAILBOX_CHILIZ === "0x0000000000000000000000000000000000000000" 
    ? "0x0000000000000000000000000000000000000001" // Placeholder for testing
    : HYPERLANE_MAILBOX_CHILIZ;

  if (mailboxAddress === "0x0000000000000000000000000000000000000001") {
    console.log("⚠️  Using placeholder mailbox address - update with real Hyperlane deployment");
  }

  // Deploy TwitterBetsHyperlane
  const TwitterBetsHyperlane = await hre.ethers.getContractFactory("TwitterBetsHyperlane");
  const twitterBetsHyperlane = await TwitterBetsHyperlane.deploy(
    mailboxAddress,
    AMOY_DOMAIN_ID,
    oracleAddressBytes32
  );

  await twitterBetsHyperlane.waitForDeployment();
  const contractAddress = await twitterBetsHyperlane.getAddress();

  console.log("TwitterBetsHyperlane deployed to:", contractAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "chiliz-testnet",
    contractAddress: contractAddress,
    mailbox: mailboxAddress,
    oracleDomain: AMOY_DOMAIN_ID,
    oracleContract: oracleInfo.oracleAddress,
    oracleContractBytes32: oracleAddressBytes32,
    deployedAt: new Date().toISOString(),
    oracleDeployment: oracleInfo
  };

  const deploymentPath = path.join(__dirname, "../deployments/chiliz-main.json");
  await fs.promises.writeFile(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✅ Main contract deployment successful!");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Chiliz Spicy Testnet");
  console.log("Deployment info saved to:", deploymentPath);

  // Update .env file
  console.log("\nUpdating .env file...");
  const envPath = path.join(__dirname, "../.env");
  let envContent = await fs.promises.readFile(envPath, 'utf8');
  
  // Update contract address
  envContent = envContent.replace(
    /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
    `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
  );
  
  // Update oracle address
  envContent = envContent.replace(
    /NEXT_PUBLIC_ORACLE_ADDRESS=.*/,
    `NEXT_PUBLIC_ORACLE_ADDRESS=${deployer.address}`
  );

  await fs.promises.writeFile(envPath, envContent);
  console.log("✅ .env file updated");

  console.log("\nNext steps:");
  console.log("1. Fund main contract with CHZ for Hyperlane gas payments");
  console.log("2. Fund oracle contract with MATIC for Hyperlane gas payments");
  console.log("3. Test cross-chain settlement with a sample bet");
  console.log("4. Set up Chainlink Automation for automatic settlement");

  console.log("\nTest the setup:");
  console.log("1. Create a bet on the web interface");
  console.log("2. Fund both sides of the bet");
  console.log("3. Manually trigger settlement to test cross-chain flow");

  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network chilizTestnet ${contractAddress} ${mailboxAddress} ${AMOY_DOMAIN_ID} ${oracleAddressBytes32}`);

  // Show gas funding instructions
  console.log("\n💰 Funding Instructions:");
  console.log(`Send CHZ to main contract for gas: ${contractAddress}`);
  console.log(`Send MATIC to oracle contract for gas: ${oracleInfo.oracleAddress}`);
  console.log("Recommended amounts: 0.1 CHZ and 0.1 MATIC respectively");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });