// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

contract TwitterBetsFunctions is FunctionsClient, AutomationCompatibleInterface, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

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
        // Chainlink Functions specific fields
        bytes32 requestId;
        uint256 settlementTime; // When the game should be checked (timestamp)
        bool settlementRequested;
    }

    // Chainlink Functions configuration
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit;
    string public source; // JavaScript source code
    bytes public encryptedSecretsUrls;
    
    // Contract state
    mapping(string => TwitterBet) public bets;
    mapping(address => uint256) public userBetCounts;
    mapping(address => uint256) public userWinnings;
    mapping(address => string) public walletToTwitterHandle;
    mapping(string => address) public twitterIdToWallet;
    mapping(bytes32 => string) public requestIdToBetId; // Functions request tracking
    
    string[] public allBetIds;
    mapping(address => string[]) public userBets;
    
    // Events
    event BetCreated(string indexed tweetId, address indexed challenger, address indexed accepter, string prediction, uint256 amount, string gameId);
    event BetFunded(string indexed tweetId, address indexed user, uint256 amount);
    event BetFullyFunded(string indexed tweetId, uint256 totalAmount);
    event BetSettled(string indexed tweetId, address indexed winner, uint256 payout, bool outcome);
    event BetCancelled(string indexed tweetId, string reason);
    event SettlementRequested(string indexed tweetId, bytes32 indexed requestId, string gameId);
    event FunctionsResponse(bytes32 indexed requestId, uint256 outcome, bytes response, bytes err);

    constructor(
        address router,
        bytes32 _donId,
        uint64 _subscriptionId,
        uint32 _gasLimit
    ) FunctionsClient(router) ConfirmedOwner(msg.sender) {
        donId = _donId;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
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

        // Check if bet is fully funded
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
                block.timestamp >= bet.settlementTime &&
                bytes(source).length > 0 // Ensure source code is set
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

    // Request settlement using Chainlink Functions
    function requestSettlement(string memory _tweetId) public {
        TwitterBet storage bet = bets[_tweetId];
        require(bet.createdAt > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(!bet.settlementRequested, "Settlement already requested");
        require(isBetFullyFunded(_tweetId), "Bet not fully funded");
        require(bytes(source).length > 0, "Source code not set");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        // Set arguments: [gameId, prediction, sport]
        string[] memory args = new string[](3);
        args[0] = bet.gameId;
        args[1] = bet.prediction;
        args[2] = bet.sport;
        req.setArgs(args);

        // Set secrets if available
        if (encryptedSecretsUrls.length > 0) {
            req.addSecretsReference(encryptedSecretsUrls);
        }

        // Send the request
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );
        
        // Store the request ID for tracking
        requestIdToBetId[requestId] = _tweetId;
        bet.requestId = requestId;
        bet.settlementRequested = true;

        emit SettlementRequested(_tweetId, requestId, bet.gameId);
    }

    // Chainlink Functions fulfill function
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        string memory tweetId = requestIdToBetId[requestId];
        require(bytes(tweetId).length > 0, "Request ID not found");

        TwitterBet storage bet = bets[tweetId];
        require(!bet.settled, "Bet already settled");

        // Decode the response (should be 0 or 1)
        uint256 outcome = 0;
        if (response.length > 0) {
            outcome = abi.decode(response, (uint256));
        }

        // If there was an error, we could implement retry logic or manual settlement
        if (err.length > 0) {
            emit FunctionsResponse(requestId, outcome, response, err);
            // For now, we'll still process with the outcome (0 = accepter wins)
        }

        // Settle the bet
        bet.settled = true;
        
        if (outcome == 1) {
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

        emit FunctionsResponse(requestId, outcome, response, err);
        emit BetSettled(tweetId, bet.winner, bet.amount * 2, outcome == 1);
    }

    // Manual settlement by owner (backup)
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

    // Cancel bet (refund)
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

    // Configuration functions
    function updateFunctionsConfig(
        bytes32 _donId,
        uint64 _subscriptionId,
        uint32 _gasLimit,
        string memory _source,
        bytes memory _encryptedSecretsUrls
    ) external onlyOwner {
        donId = _donId;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
        source = _source;
        encryptedSecretsUrls = _encryptedSecretsUrls;
    }

    function updateSource(string memory _source) external onlyOwner {
        source = _source;
    }

    function updateSecretsUrls(bytes memory _encryptedSecretsUrls) external onlyOwner {
        encryptedSecretsUrls = _encryptedSecretsUrls;
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

    // Emergency functions
    receive() external payable {
        revert("Direct payments not allowed");
    }

    fallback() external payable {
        revert("Function not found");
    }
}