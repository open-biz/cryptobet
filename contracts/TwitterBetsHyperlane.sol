// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title TwitterBetsHyperlane
 * @notice Main betting contract on Chiliz testnet that uses Hyperlane for cross-chain oracle
 * @dev Sends settlement requests to oracle chain, receives results via Hyperlane
 */
contract TwitterBetsHyperlane is AutomationCompatibleInterface, ConfirmedOwner {
    
    struct TwitterBet {
        address challenger;
        address accepter;
        string tweetId;
        string prediction;
        uint256 amount;
        string gameId;
        string sport;
        bool settled;
        address winner;
        uint256 createdAt;
        bool challengerDeposited;
        bool accepterDeposited;
        string challengerTwitterHandle;
        string accepterTwitterHandle;
        string challengerTwitterId;
        string accepterTwitterId;
        // Cross-chain oracle fields
        uint256 settlementTime;
        bool settlementRequested;
        bytes32 hyperlaneMessageId;
    }

    // Hyperlane configuration
    IMailbox public immutable mailbox;
    uint32 public oracleDomain; // Domain ID of oracle chain (e.g., Sepolia)
    bytes32 public oracleContract; // Address of CrossChainOracle contract
    
    // Contract state
    mapping(string => TwitterBet) public bets;
    mapping(address => uint256) public userBetCounts;
    mapping(address => uint256) public userWinnings;
    mapping(address => string) public walletToTwitterHandle;
    mapping(string => address) public twitterIdToWallet;
    mapping(bytes32 => string) public messageIdToBetId; // Hyperlane message tracking
    
    string[] public allBetIds;
    mapping(address => string[]) public userBets;
    
    // Events
    event BetCreated(string indexed tweetId, address indexed challenger, address indexed accepter, string prediction, uint256 amount, string gameId);
    event BetFunded(string indexed tweetId, address indexed user, uint256 amount);
    event BetFullyFunded(string indexed tweetId, uint256 totalAmount);
    event BetSettled(string indexed tweetId, address indexed winner, uint256 payout, bool outcome);
    event BetCancelled(string indexed tweetId, string reason);
    event SettlementRequested(string indexed tweetId, bytes32 indexed messageId, string gameId);
    event SettlementReceived(string indexed tweetId, bool outcome);

    constructor(
        address _mailbox,
        uint32 _oracleDomain,
        bytes32 _oracleContract
    ) ConfirmedOwner(msg.sender) {
        mailbox = IMailbox(_mailbox);
        oracleDomain = _oracleDomain;
        oracleContract = _oracleContract;
    }

    function createBet(
        string memory _tweetId,
        string memory _prediction,
        address _challenger,
        address _accepter,
        string memory _gameId,
        string memory _sport,
        string memory _challengerTwitterHandle,
        string memory _accepterTwitterHandle,
        string memory _challengerTwitterId,
        string memory _accepterTwitterId,
        uint256 _settlementTime
    ) external payable {
        require(bytes(_tweetId).length > 0, "Tweet ID required");
        require(bytes(_prediction).length > 0, "Prediction required");
        require(_challenger != address(0), "Challenger address required");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(bets[_tweetId].createdAt == 0, "Bet already exists");
        require(_settlementTime > block.timestamp, "Settlement time must be in the future");

        TwitterBet storage bet = bets[_tweetId];
        bet.challenger = _challenger;
        bet.accepter = _accepter;
        bet.tweetId = _tweetId;
        bet.prediction = _prediction;
        bet.amount = msg.value;
        bet.gameId = _gameId;
        bet.sport = _sport;
        bet.settled = false;
        bet.createdAt = block.timestamp;
        bet.challengerTwitterHandle = _challengerTwitterHandle;
        bet.accepterTwitterHandle = _accepterTwitterHandle;
        bet.challengerTwitterId = _challengerTwitterId;
        bet.accepterTwitterId = _accepterTwitterId;
        bet.settlementTime = _settlementTime;
        bet.settlementRequested = false;

        // Set initial deposit based on who sent the transaction
        if (msg.sender == _challenger) {
            bet.challengerDeposited = true;
        } else if (msg.sender == _accepter) {
            bet.accepterDeposited = true;
        }

        // Update mappings
        allBetIds.push(_tweetId);
        userBets[_challenger].push(_tweetId);
        if (_accepter != address(0)) {
            userBets[_accepter].push(_tweetId);
        }
        userBetCounts[_challenger]++;

        emit BetCreated(_tweetId, _challenger, _accepter, _prediction, msg.value, _gameId);
        emit BetFunded(_tweetId, msg.sender, msg.value);

        if (isBetFullyFunded(_tweetId)) {
            emit BetFullyFunded(_tweetId, msg.value * 2);
        }
    }

    function depositForBet(string memory _tweetId) external payable {
        TwitterBet storage bet = bets[_tweetId];
        require(bet.createdAt > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(msg.value == bet.amount, "Incorrect deposit amount");
        require(
            msg.sender == bet.challenger || msg.sender == bet.accepter,
            "Only bet participants can deposit"
        );

        if (msg.sender == bet.challenger) {
            require(!bet.challengerDeposited, "Challenger already deposited");
            bet.challengerDeposited = true;
        } else if (msg.sender == bet.accepter) {
            require(!bet.accepterDeposited, "Accepter already deposited");
            bet.accepterDeposited = true;
        }

        emit BetFunded(_tweetId, msg.sender, msg.value);

        if (isBetFullyFunded(_tweetId)) {
            emit BetFullyFunded(_tweetId, bet.amount * 2);
        }
    }

    // Chainlink Automation - checkUpkeep
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        string[] memory betIds = new string[](allBetIds.length);
        uint256 count = 0;

        // Check for bets that need settlement
        for (uint256 i = 0; i < allBetIds.length; i++) {
            string memory betId = allBetIds[i];
            TwitterBet storage bet = bets[betId];
            
            if (
                !bet.settled &&
                !bet.settlementRequested &&
                isBetFullyFunded(betId) &&
                block.timestamp >= bet.settlementTime
            ) {
                betIds[count] = betId;
                count++;
            }
        }

        // Resize array to actual count
        string[] memory result = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = betIds[i];
        }

        upkeepNeeded = count > 0;
        performData = abi.encode(result);
    }

    // Chainlink Automation - performUpkeep
    function performUpkeep(bytes calldata performData) external override {
        string[] memory betIds = abi.decode(performData, (string[]));
        
        for (uint256 i = 0; i < betIds.length; i++) {
            requestSettlement(betIds[i]);
        }
    }

    /**
     * @notice Request settlement via cross-chain oracle
     */
    function requestSettlement(string memory _tweetId) public payable {
        TwitterBet storage bet = bets[_tweetId];
        require(bet.createdAt > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(!bet.settlementRequested, "Settlement already requested");
        require(isBetFullyFunded(_tweetId), "Bet not fully funded");

        // Encode message for oracle
        bytes memory messageBody = abi.encode(_tweetId, bet.gameId, bet.prediction, bet.sport);
        
        // Calculate gas payment for cross-chain message
        uint256 gasPayment = mailbox.quoteDispatch(
            oracleDomain,
            oracleContract,
            messageBody
        );

        require(msg.value >= gasPayment, "Insufficient gas payment");

        // Send message to oracle chain
        bytes32 messageId = mailbox.dispatch{value: gasPayment}(
            oracleDomain,
            oracleContract,
            messageBody
        );

        // Track the message
        messageIdToBetId[messageId] = _tweetId;
        bet.hyperlaneMessageId = messageId;
        bet.settlementRequested = true;

        emit SettlementRequested(_tweetId, messageId, bet.gameId);

        // Refund excess gas payment
        if (msg.value > gasPayment) {
            payable(msg.sender).transfer(msg.value - gasPayment);
        }
    }

    /**
     * @notice Handle settlement result from cross-chain oracle
     * @param _origin Domain of origin chain
     * @param _sender Address of sender on origin chain
     * @param _body Encoded settlement result
     */
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _body
    ) external {
        require(msg.sender == address(mailbox), "Only mailbox can call");
        require(_origin == oracleDomain, "Invalid origin domain");
        require(_sender == oracleContract, "Invalid sender");

        // Decode settlement result
        (string memory betId, bool outcome) = abi.decode(_body, (string, bool));

        TwitterBet storage bet = bets[betId];
        require(bet.createdAt > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(bet.settlementRequested, "Settlement not requested");

        // Settle the bet
        bet.settled = true;
        
        if (outcome) {
            // Challenger wins
            bet.winner = bet.challenger;
            userWinnings[bet.challenger] += bet.amount * 2;
            payable(bet.challenger).transfer(bet.amount * 2);
        } else {
            // Accepter wins
            bet.winner = bet.accepter;
            userWinnings[bet.accepter] += bet.amount * 2;
            payable(bet.accepter).transfer(bet.amount * 2);
        }

        emit SettlementReceived(betId, outcome);
        emit BetSettled(betId, bet.winner, bet.amount * 2, outcome);
    }

    /**
     * @notice Manual settlement by owner (backup)
     */
    function manualSettlement(string memory _tweetId, bool _outcome, string memory _reason) external onlyOwner {
        TwitterBet storage bet = bets[_tweetId];
        require(bet.createdAt > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(isBetFullyFunded(_tweetId), "Bet not fully funded");

        bet.settled = true;
        
        if (_outcome) {
            bet.winner = bet.challenger;
            userWinnings[bet.challenger] += bet.amount * 2;
            payable(bet.challenger).transfer(bet.amount * 2);
        } else {
            bet.winner = bet.accepter;
            userWinnings[bet.accepter] += bet.amount * 2;
            payable(bet.accepter).transfer(bet.amount * 2);
        }

        emit BetSettled(_tweetId, bet.winner, bet.amount * 2, _outcome);
    }

    /**
     * @notice Cancel bet and refund
     */
    function cancelBet(string memory _tweetId, string memory _reason) external onlyOwner {
        TwitterBet storage bet = bets[_tweetId];
        require(bet.createdAt > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");

        bet.settled = true;

        // Refund deposits
        if (bet.challengerDeposited) {
            payable(bet.challenger).transfer(bet.amount);
        }
        if (bet.accepterDeposited) {
            payable(bet.accepter).transfer(bet.amount);
        }

        emit BetCancelled(_tweetId, _reason);
    }

    /**
     * @notice Update cross-chain oracle configuration
     */
    function updateOracleConfig(uint32 _oracleDomain, bytes32 _oracleContract) external onlyOwner {
        oracleDomain = _oracleDomain;
        oracleContract = _oracleContract;
    }

    // View functions
    function isBetFullyFunded(string memory _tweetId) public view returns (bool) {
        TwitterBet storage bet = bets[_tweetId];
        return bet.challengerDeposited && bet.accepterDeposited;
    }

    function getBet(string memory _tweetId) external view returns (TwitterBet memory) {
        return bets[_tweetId];
    }

    function getAllBets() external view returns (string[] memory) {
        return allBetIds;
    }

    function getUserBets(address _user) external view returns (string[] memory) {
        return userBets[_user];
    }

    function getBetsByStatus(bool _settled) external view returns (string[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allBetIds.length; i++) {
            if (bets[allBetIds[i]].settled == _settled) {
                count++;
            }
        }

        string[] memory result = new string[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allBetIds.length; i++) {
            if (bets[allBetIds[i]].settled == _settled) {
                result[index] = allBetIds[i];
                index++;
            }
        }

        return result;
    }

    function getUserStats(address _user) external view returns (uint256 betCount, uint256 winnings) {
        return (userBetCounts[_user], userWinnings[_user]);
    }

    function getTotalBetsCount() external view returns (uint256) {
        return allBetIds.length;
    }

    function getWalletByTwitterId(string memory _twitterId) external view returns (address) {
        return twitterIdToWallet[_twitterId];
    }

    function getTwitterHandleByWallet(address _wallet) external view returns (string memory) {
        return walletToTwitterHandle[_wallet];
    }

    /**
     * @notice Get estimated gas cost for settlement request
     */
    function getSettlementGasCost(string memory _tweetId) external view returns (uint256) {
        TwitterBet storage bet = bets[_tweetId];
        bytes memory messageBody = abi.encode(_tweetId, bet.gameId, bet.prediction, bet.sport);
        
        return mailbox.quoteDispatch(
            oracleDomain,
            oracleContract,
            messageBody
        );
    }

    // Fund contract for Hyperlane gas payments
    receive() external payable {}

    fallback() external payable {
        revert("Function not found");
    }
}