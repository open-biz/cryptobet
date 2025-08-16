const hre = require("hardhat");

async function main() {
  console.log("Deploying TwitterBets contract to Chiliz testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.formatEther(balance), "CHZ");

  const oracleAddress = deployer.address;
  console.log("Using oracle address:", oracleAddress);

  const TwitterBets = await hre.ethers.getContractFactory("TwitterBets");
  const twitterBets = await TwitterBets.deploy(oracleAddress);

  await twitterBets.waitForDeployment();
  const contractAddress = await twitterBets.getAddress();

  console.log("TwitterBets deployed to:", contractAddress);
  console.log("Oracle address:", oracleAddress);

  console.log("\nContract deployment successful!");
  console.log("Add this to your .env file:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`ORACLE_ADDRESS=${oracleAddress}`);

  console.log("\nVerification command:");
  console.log(`npx hardhat verify --network chilizTestnet ${contractAddress} ${oracleAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });