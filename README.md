# 🎯 SendBet - Twitter-Native Sports Betting Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Chiliz Chain](https://img.shields.io/badge/Chiliz_Chain-EVM-red?logo=ethereum)](https://chiliz.com/)
[![Twitter API](https://img.shields.io/badge/Twitter_API-v2-1DA1F2?logo=twitter)](https://developer.twitter.com/en/docs/twitter-api)

> Turn Twitter sports arguments into real money bets with automatic smart contract settlement

## 🌟 Overview

SendBet transforms organic Twitter sports debates into actual blockchain-based wagers. When two users disagree about a sports outcome, they can instantly create a smart contract bet that settles automatically via oracles.

```
🐦 Twitter Argument → 🤖 Smart Contract → 🌉 Cross-Chain Oracle → 💰 Automatic Payout
```

## 🏗️ Cross-Chain Architecture

SendBet uses **cross-chain oracle architecture** for automated settlement:

```
Chiliz Chain 🏈 ← Hyperlane → Polygon Oracle ⚡ ← Functions → Sports API 📊
    (Bets)                        (Settlement)                  (Results)
```

### Why Cross-Chain?

- **🎯 Chiliz Chain**: Optimized for sports betting and fan tokens
- **⚡ Chainlink Functions**: Serverless oracle with real sports data  
- **🌉 Hyperlane**: Secure cross-chain messaging
- **💰 Cost Efficient**: Pay-per-use oracle vs. hosting infrastructure

## 🎮 How It Works

| Step | Action | Who |
|------|--------|-----|
| 1️⃣ | **Tweet Prediction** | User A makes sports prediction on Twitter |
| 2️⃣ | **Challenge Created** | User B replies `@SendBet challenge $50` |
| 3️⃣ | **Bot Response** | SendBet bot creates bet link automatically |
| 4️⃣ | **Accept & Fund** | Both users connect wallets and deposit |
| 5️⃣ | **Smart Contract** | Bet stored on-chain with oracle settlement |
| 6️⃣ | **Auto Settlement** | Oracle checks game result and pays winner |

### Example Flow

```bash
👤 UserA: "Messi will definitely score 2+ goals tonight 🐐"
👤 UserB: "No way, City's defense is too strong @SendBet challenge $50"
👤 UserA: "@SendBet accept"

🤖 @SendBet: "🎯 Bet Challenge Created!
             @UserA vs @UserB: 'Messi will score 2+ goals'
             💰 Stake: $50 each
             🔗 sendbet.app/bet/1234567890"

# After game ends...
🤖 @SendBet: "🏆 Bet Settled!
             Result: Messi scored 1 goal
             Winner: @UserB
             💰 Payout: $100"
```

## 🏗️ Architecture

### Smart Contract Layer (Chiliz Chain)
- **TwitterBets.sol**: Main betting contract with on-chain data storage
- **No Database**: All bet data stored directly on blockchain
- **USDT Integration**: USD-pegged betting for easy understanding
- **Oracle Settlement**: Automatic payout based on sports results

### Twitter Integration
- **Bot Monitoring**: Listens for @SendBet mentions
- **Parsing Engine**: Extracts bet amounts, predictions, participants
- **Auto-Responses**: Creates bet links and settlement announcements

### Web Interface
- **Minimal UI**: Wallet connection and deposit confirmation
- **Mobile-First**: Optimized for Twitter mobile users
- **One-Click Flow**: From Twitter mention to funded bet

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+
npm or yarn
Wallet with CHZ for gas fees
Twitter Developer Account
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sendbet.git
cd sendbet

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your environment
nano .env
```

### Environment Setup

```bash
# Twitter API Configuration
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

# Blockchain (Chiliz Chain)
CHILIZ_TESTNET_RPC_URL=https://spicy-rpc.chiliz.com
CHILIZ_MAINNET_RPC_URL=https://chiliz-rpc.com
PRIVATE_KEY=your_private_key_for_contract_deployment

# Deployed Contract Addresses
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_ORACLE_ADDRESS=your_oracle_wallet_address
NEXT_PUBLIC_USDT_ADDRESS=0x02A6EA3B9632db2a5c5C6CFfa68FA03B64d24AB1

# External Services
ODDS_API_KEY=your_odds_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### Deploy Smart Contract

```bash
# Compile contracts
npx hardhat compile

# Deploy to Chiliz testnet
npx hardhat run scripts/deploy.js --network chilizTestnet

# Deploy to Chiliz mainnet
npx hardhat run scripts/deploy.js --network chilizMainnet
```

### Run Development Server

```bash
# Start Next.js development server
npm run dev

# Visit http://localhost:3000
```

## 📱 Usage

### For Bettors

1. **Create a Challenge**:
   ```
   @SendBet challenge $50 "Messi will score 2+ goals tonight" @opponent
   ```

2. **Accept a Challenge**:
   ```
   @SendBet accept
   ```

3. **Fund Your Bet**:
   - Click the bot's reply link
   - Connect your wallet
   - Deposit the bet amount in USDT

4. **Wait for Settlement**:
   - Oracle automatically settles when game ends
   - Winner receives 2x the bet amount

### For Developers

```javascript
// Query bet data from contract
const bet = await contractService.getBetByTweetId("1234567890");

// Get user's betting history
const userBets = await contractService.getUserBets(userAddress);

// Check if bet is fully funded
const isFunded = await contractService.isBetFullyFunded(tweetId);
```

## 🛠️ Technical Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Blockchain** | Chiliz Chain (EVM) | Smart contract execution |
| **Smart Contracts** | Solidity 0.8.19 | Bet logic and storage |
| **Frontend** | Next.js 14 + TypeScript | Web interface |
| **Styling** | Tailwind CSS | Responsive design |
| **Wallet** | RainbowKit + Wagmi | Web3 connectivity |
| **Twitter** | Twitter API v2 | Bot integration |
| **Oracle** | The Odds API | Sports results |
| **Deployment** | Vercel | Hosting |

## 📊 Smart Contract Functions

### Core Betting Functions

```solidity
// Create a new bet
function createBet(
    string _tweetId,
    string _prediction,
    address _challenger,
    address _accepter,
    string _gameId,
    string _challengerTwitterHandle,
    string _accepterTwitterHandle,
    string _challengerTwitterId,
    string _accepterTwitterId
) external payable

// Deposit funds for existing bet
function depositForBet(string _tweetId) external payable

// Settle bet (oracle only)
function settleBet(string _tweetId, bool _outcome) external

// Cancel bet (oracle only)
function cancelBet(string _tweetId, string _reason) external
```

### Query Functions

```solidity
// Get bet details
function getBet(string _tweetId) external view returns (TwitterBet)

// Check if bet is fully funded
function isBetFullyFunded(string _tweetId) external view returns (bool)

// Get all active bets
function getBetsByStatus(bool _settled) external view returns (string[])

// Get user statistics
function getUserStats(address _user) external view returns (uint256 betCount, uint256 winnings)
```

## 🔒 Security Features

- **Oracle-Only Settlement**: Only designated oracle can settle bets
- **Timeout Protection**: Unfunded bets expire after 24 hours
- **Bet Limits**: Min $1, Max $100 per bet in MVP
- **Refund Mechanism**: Automatic refunds for cancelled/disputed bets
- **No Direct Payments**: Contract rejects direct ETH/CHZ transfers

## 🎯 Roadmap

### Phase 1: MVP (Current)
- [x] Smart contract development
- [x] Twitter bot integration
- [x] Basic web UI
- [x] Chiliz testnet deployment

### Phase 2: Enhancement
- [ ] Oracle integration (The Odds API)
- [ ] Mobile app development
- [ ] Multi-sport support
- [ ] Community betting pools

### Phase 3: Scale
- [ ] Cross-chain deployment
- [ ] Advanced prediction types
- [ ] Leaderboards and reputation
- [ ] Partnership integrations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Fork the repository
# Create a feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chiliz Chain** for sports-focused blockchain infrastructure
- **OpenZeppelin** for secure smart contract patterns
- **RainbowKit** for seamless wallet integration
- **Twitter API** for real-time social media integration

## 📞 Support

- **Documentation**: [docs.sendbet.app](https://docs.sendbet.app)
- **Discord**: [discord.gg/sendbet](https://discord.gg/sendbet)
- **Twitter**: [@SendBetProtocol](https://twitter.com/SendBetProtocol)
- **Email**: support@sendbet.app

---

<div align="center">

**Turn every sports argument into a bet!** 🏆

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sendbet)
[![Run on Repl.it](https://repl.it/badge/github/your-username/sendbet)](https://repl.it/github/your-username/sendbet)

Made with ❤️ for the sports betting community

</div>