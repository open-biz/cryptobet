require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Chiliz Spicy Testnet (Main betting contract)
    chilizTestnet: {
      url: process.env.CHILIZ_TESTNET_RPC_URL || "https://spicy-rpc.chiliz.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 88882,
      gasPrice: 10000000000, // 10 gwei
    },
    
    // Polygon Amoy Testnet (Oracle contract)
    polygonAmoy: {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      gasPrice: 10000000000, // 10 gwei
    },
    
    // Polygon Mumbai (backup)
    polygonMumbai: {
      url: process.env.POLYGON_MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
      gasPrice: 10000000000, // 10 gwei
    }
  },
  
  etherscan: {
    apiKey: {
      chilizTestnet: "your-chiliz-api-key", // ChilizScan
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "your-polygonscan-api-key",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "your-polygonscan-api-key"
    },
    customChains: [
      {
        network: "chilizTestnet",
        chainId: 88882,
        urls: {
          apiURL: "https://spicy-explorer.chiliz.com/api",
          browserURL: "https://spicy-explorer.chiliz.com"
        }
      },
      {
        network: "polygonAmoy", 
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com"
        }
      }
    ]
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};