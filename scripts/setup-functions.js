const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// This script helps set up Chainlink Functions after deployment
async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  
  if (!contractAddress || contractAddress === 'deployed_contract_address') {
    console.error("Please deploy the contract first and update NEXT_PUBLIC_CONTRACT_ADDRESS in .env");
    process.exit(1);
  }

  console.log("Setting up Chainlink Functions for contract:", contractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get contract instance
  const TwitterBetsFunctions = await hre.ethers.getContractFactory("TwitterBetsFunctions");
  const contract = TwitterBetsFunctions.attach(contractAddress);

  // Read the JavaScript source code
  const sourcePath = path.join(__dirname, "../chainlink-functions/source.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  
  console.log("JavaScript source code length:", source.length);

  try {
    // Update the source code
    console.log("Updating Functions source code...");
    const updateSourceTx = await contract.updateSource(source);
    await updateSourceTx.wait();
    console.log("✅ Source code updated");

    // Note: Secrets setup requires additional steps with Chainlink CLI
    console.log("\n📋 Manual steps required:");
    console.log("1. Install Chainlink Functions CLI:");
    console.log("   npm install -g @chainlink/functions-toolkit");
    
    console.log("\n2. Create a secrets file (secrets.json):");
    console.log(`   {
     "ODDS_API_KEY": "${process.env.ODDS_API_KEY || 'your-odds-api-key'}"
   }`);

    console.log("\n3. Upload secrets to DON:");
    console.log("   npx functions-toolkit secrets upload --network <network>");

    console.log("\n4. Update contract with encrypted secrets URLs:");
    console.log("   npx hardhat run scripts/update-secrets.js --network chilizTestnet");

    console.log("\n5. Create and fund Chainlink Functions subscription:");
    console.log("   - Visit Chainlink Functions dashboard");
    console.log("   - Create subscription and fund with LINK");
    console.log("   - Add contract as consumer");

    console.log("\n✅ Setup script completed!");
    
  } catch (error) {
    console.error("Error during setup:", error);
    console.log("\n💡 Tips:");
    console.log("- Ensure the contract is deployed and you have owner privileges");
    console.log("- Make sure you have enough gas for the transaction");
    console.log("- Verify the contract address is correct");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });