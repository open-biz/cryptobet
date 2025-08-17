import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from './wagmi';
import type { TwitterBet } from '@/types';

const CONTRACT_ABI = [
  "function createBet(string _tweetId, string _prediction, address _challenger, address _accepter, string _gameId, string _challengerTwitterHandle, string _accepterTwitterHandle, string _challengerTwitterId, string _accepterTwitterId) external payable",
  "function depositForBet(string _tweetId) external payable",
  "function settleBet(string _tweetId, bool _outcome) external",
  "function cancelBet(string _tweetId, string _reason) external",
  "function getBet(string _tweetId) external view returns (tuple(address challenger, address accepter, string tweetId, string prediction, uint256 amount, string gameId, bool settled, address winner, uint256 createdAt, bool challengerDeposited, bool accepterDeposited, string challengerTwitterHandle, string accepterTwitterHandle, string challengerTwitterId, string accepterTwitterId))",
  "function isBetFullyFunded(string _tweetId) external view returns (bool)",
  "function getAllBets() external view returns (string[] memory)",
  "function getUserBets(address _user) external view returns (string[] memory)",
  "function getBetsByStatus(bool _settled) external view returns (string[] memory)",
  "function getWalletByTwitterId(string _twitterId) external view returns (address)",
  "function getTwitterHandleByWallet(address _wallet) external view returns (string)",
  "function getUserStats(address _user) external view returns (uint256 betCount, uint256 winnings)",
  "function getTotalBetsCount() external view returns (uint256)",
  "event BetCreated(string indexed tweetId, address indexed challenger, address indexed accepter, string prediction, uint256 amount, string gameId)",
  "event BetFunded(string indexed tweetId, address indexed user, uint256 amount)",
  "event BetFullyFunded(string indexed tweetId, uint256 totalAmount)",
  "event BetSettled(string indexed tweetId, address indexed winner, uint256 payout, bool outcome)"
];

export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer?: ethers.Signer;

  constructor() {
    const rpcUrl = process.env.NODE_ENV === 'production' 
      ? process.env.CHILIZ_MAINNET_RPC_URL || 'https://chiliz-rpc.com'
      : process.env.CHILIZ_TESTNET_RPC_URL || 'https://spicy-rpc.chiliz.com';
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
    
    if (process.env.PRIVATE_KEY) {
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      this.contract = this.contract.connect(this.signer);
    }
  }

  async createBet(
    tweetId: string,
    prediction: string,
    challengerAddress: string,
    accepterAddress: string,
    gameId: string,
    challengerTwitterHandle: string,
    accepterTwitterHandle: string,
    challengerTwitterId: string,
    accepterTwitterId: string,
    amountWei: bigint
  ) {
    if (!this.signer) {
      throw new Error('No signer available for contract interaction');
    }

    const tx = await this.contract.createBet(
      tweetId,
      prediction,
      challengerAddress,
      accepterAddress,
      gameId,
      challengerTwitterHandle,
      accepterTwitterHandle,
      challengerTwitterId,
      accepterTwitterId,
      { value: amountWei }
    );

    return await tx.wait();
  }

  async getBet(betId: string): Promise<TwitterBet | null> {
    try {
      const betData = await this.contract.getBet(betId);
      
      if (betData.tweetId === '') {
        return null;
      }

      return {
        tweetId: betData.tweetId,
        challengerTwitterId: betData.challengerTwitterId,
        accepterTwitterId: betData.accepterTwitterId,
        challengerAddress: betData.challenger,
        accepterAddress: betData.accepter,
        prediction: betData.prediction,
        amount: parseFloat(ethers.formatEther(betData.amount)),
        gameId: betData.gameId,
        status: this.getStatusFromBetData(betData),
        winner: betData.winner === ethers.ZeroAddress ? undefined : betData.winner,
        createdAt: new Date(Number(betData.createdAt) * 1000),
      };
    } catch (error) {
      console.error('Error fetching bet:', error);
      return null;
    }
  }

  async getWalletByTwitterId(twitterId: string): Promise<string | null> {
    try {
      const address = await this.contract.getWalletByTwitterId(twitterId);
      return address === ethers.ZeroAddress ? null : address;
    } catch (error) {
      console.error('Error fetching wallet by Twitter ID:', error);
      return null;
    }
  }

  async getTwitterHandleByWallet(wallet: string): Promise<string | null> {
    try {
      const handle = await this.contract.getTwitterHandleByWallet(wallet);
      return handle || null;
    } catch (error) {
      console.error('Error fetching Twitter handle by wallet:', error);
      return null;
    }
  }

  async getAllActiveBets(): Promise<TwitterBet[]> {
    try {
      const activeBetIds = await this.contract.getBetsByStatus(false);
      const bets: TwitterBet[] = [];

      for (const tweetId of activeBetIds) {
        const bet = await this.getBetByTweetId(tweetId);
        if (bet) {
          bets.push(bet);
        }
      }

      return bets;
    } catch (error) {
      console.error('Error fetching active bets:', error);
      return [];
    }
  }

  async getUserBets(userAddress: string): Promise<TwitterBet[]> {
    try {
      const betIds = await this.contract.getUserBets(userAddress);
      const bets: TwitterBet[] = [];

      for (const tweetId of betIds) {
        const bet = await this.getBetByTweetId(tweetId);
        if (bet) {
          bets.push(bet);
        }
      }

      return bets;
    } catch (error) {
      console.error('Error fetching user bets:', error);
      return [];
    }
  }

  async isBetFullyFunded(tweetId: string): Promise<boolean> {
    try {
      return await this.contract.isBetFullyFunded(tweetId);
    } catch (error) {
      console.error('Error checking if bet is fully funded:', error);
      return false;
    }
  }

  async settleBet(tweetId: string, outcome: boolean) {
    if (!this.signer) {
      throw new Error('No signer available for contract interaction');
    }

    const tx = await this.contract.settleBet(tweetId, outcome);
    return await tx.wait();
  }

  async cancelBet(tweetId: string, reason: string) {
    if (!this.signer) {
      throw new Error('No signer available for contract interaction');
    }

    const tx = await this.contract.cancelBet(tweetId, reason);
    return await tx.wait();
  }

  async getUserStats(userAddress: string): Promise<{ betCount: number; winnings: number }> {
    try {
      const [betCount, winnings] = await this.contract.getUserStats(userAddress);
      return {
        betCount: Number(betCount),
        winnings: parseFloat(ethers.formatEther(winnings)),
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { betCount: 0, winnings: 0 };
    }
  }

  private getStatusFromBetData(betData: any): 'pending' | 'funded' | 'settled' | 'cancelled' {
    if (betData.settled) {
      return 'settled';
    }
    if (betData.challengerDeposited && betData.accepterDeposited) {
      return 'funded';
    }
    return 'pending';
  }

  getContractWithSigner(signer: ethers.Signer) {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }
}

export const contractService = new ContractService();