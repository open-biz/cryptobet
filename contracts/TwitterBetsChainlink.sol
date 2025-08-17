// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

contract TwitterBetsChainlink is ChainlinkClient, AutomationCompatibleInterface, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    struct TwitterBet {
        address challenger;
        address accepter;
        string tweetId;
        string prediction;
        uint256 amount;
        string gameId;
        bool settled;
        address winner;
        uint256 createdAt;
        bool challengerDeposited;
        bool accepterDeposited;
        string challengerTwitterHandle;
        string accepterTwitterHandle;
        string challengerTwitterId;
        string accepterTwitterId;
        // Chainlink specific fields
        bytes32 requestId;
        uint256 settlementTime; // When the game should be checked
        bool settlementRequested;
    }

    // Chainlink configuration
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    // Contract state
    mapping(string => TwitterBet) public bets;
    mapping(address => uint256) public userBetCounts;
    mapping(address => uint256) public userWinnings;
    mapping(address => string) public walletToTwitterHandle;
    mapping(string => address) public twitterIdToWallet;
    mapping(bytes32 => string) public requestIdToBetId; // Chainlink request tracking
    
    string[] public allBetIds;
    mapping(address => string[]) public userBets;
    
    // Events
    event BetCreated(string indexed tweetId, address indexed challenger, address indexed accepter, string prediction, uint256 amount, string gameId);
    event BetFunded(string indexed tweetId, address indexed user, uint256 amount);
    event BetFullyFunded(string indexed tweetId, uint256 totalAmount);
    event BetSettled(string indexed tweetId, address indexed winner, uint256 payout, bool outcome);
    event BetCancelled(string indexed tweetId, string reason);
    event SettlementRequested(string indexed tweetId, bytes32 indexed requestId, string gameId);
    event ChainlinkResponse(bytes32 indexed requestId, bool outcome, string gameResult);

    constructor(
        address _oracle,
        bytes32 _jobId,
        uint256 _fee,
        address _link
    ) ConfirmedOwner(msg.sender) {
        setChainlinkToken(_link);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    function createBet(
        string memory _tweetId,
        string memory _prediction,
        address _challenger,
        address _accepter,
        string memory _gameId,
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

        TwitterBet storage bet = bets[_tweetId];
        bet.challenger = _challenger;
        bet.accepter = _accepter;
        bet.tweetId = _tweetId;
        bet.prediction = _prediction;
        bet.amount = msg.value;
        bet.gameId = _gameId;
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
        string[] memory betIds = new string[](0);
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
                count++;
            }
        }

        if (count > 0) {
            betIds = new string[](count);
            uint256 index = 0;
            
            for (uint256 i = 0; i < allBetIds.length; i++) {
                string memory betId = allBetIds[i];
                TwitterBet storage bet = bets[betId];
                
                if (
                    !bet.settled &&
                    !bet.settlementRequested &&
                    isBetFullyFunded(betId) &&
                    block.timestamp >= bet.settlementTime
                ) {
                    betIds[index] = betId;
                    index++;
                }
            }
        }

        upkeepNeeded = count > 0;
        performData = abi.encode(betIds);
    }

    // Chainlink Automation - performUpkeep
    function performUpkeep(bytes calldata performData) external override {
        string[] memory betIds = abi.decode(performData, (string[]));
        
        for (uint256 i = 0; i < betIds.length; i++) {
            requestSettlement(betIds[i]);
        }
    }

    // Request settlement from Chainlink Oracle
    function requestSettlement(string memory _tweetId) public {
        TwitterBet storage bet = bets[_tweetId];
        require(bet.createdAt > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(!bet.settlementRequested, "Settlement already requested");
        require(isBetFullyFunded(_tweetId), "Bet not fully funded");

        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillSettlement.selector
        );

        // Set the URL parameters for our external adapter
        request.add("sport", extractSport(bet.gameId));
        request.add("gameId", bet.gameId);
        request.add("prediction", bet.prediction);

        // Send the request
        bytes32 requestId = sendChainlinkRequest(request, fee);
        
        // Store the request ID for tracking
        requestIdToBetId[requestId] = _tweetId;
        bet.requestId = requestId;
        bet.settlementRequested = true;

        emit SettlementRequested(_tweetId, requestId, bet.gameId);
    }

    // Chainlink fulfill function
    function fulfillSettlement(
        bytes32 _requestId,
        bool _outcome
    ) public recordChainlinkFulfillment(_requestId) {
        string memory tweetId = requestIdToBetId[_requestId];
        require(bytes(tweetId).length > 0, "Request ID not found");

        TwitterBet storage bet = bets[tweetId];
        require(!bet.settled, "Bet already settled");

        // Settle the bet
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

        emit ChainlinkResponse(_requestId, _outcome, "Game settled");
        emit BetSettled(tweetId, bet.winner, bet.amount * 2, _outcome);
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

    // Utility functions
    function extractSport(string memory gameId) internal pure returns (string memory) {
        // Extract sport from gameId format like "nfl_game_123" or "nba_game_456"
        bytes memory gameIdBytes = bytes(gameId);
        
        for (uint i = 0; i < gameIdBytes.length; i++) {
            if (gameIdBytes[i] == 0x5f) { // underscore
                bytes memory sport = new bytes(i);
                for (uint j = 0; j < i; j++) {
                    sport[j] = gameIdBytes[j];
                }
                return string(sport);
            }
        }
        
        return "americanfootball_nfl"; // default
    }

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

    // Chainlink configuration functions
    function updateChainlinkConfig(
        address _oracle,
        bytes32 _jobId,
        uint256 _fee
    ) external onlyOwner {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    function withdrawLink() external onlyOwner {
        LinkTokenInterface linkToken = LinkTokenInterface(chainlinkTokenAddress());
        require(linkToken.transfer(msg.sender, linkToken.balanceOf(address(this))), "Unable to transfer");
    }

    // Emergency functions
    receive() external payable {
        revert("Direct payments not allowed");
    }

    fallback() external payable {
        revert("Function not found");
    }
}