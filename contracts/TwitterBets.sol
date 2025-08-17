// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TwitterBets {
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
    }

    mapping(string => TwitterBet) public bets;
    mapping(address => uint256) public userBetCounts;
    mapping(address => uint256) public userWinnings;
    mapping(address => string) public walletToTwitterHandle;
    mapping(string => address) public twitterIdToWallet;
    
    string[] public allBetIds;
    mapping(address => string[]) public userBets;
    
    address public oracle;
    address public owner;
    uint256 public constant MIN_BET = 0.001 ether;
    uint256 public constant MAX_BET = 1 ether;
    uint256 public constant TIMEOUT_DURATION = 24 hours;

    event BetCreated(
        string indexed tweetId,
        address indexed challenger,
        address indexed accepter,
        string prediction,
        uint256 amount,
        string gameId
    );

    event BetFunded(
        string indexed tweetId,
        address indexed user,
        uint256 amount
    );

    event BetFullyFunded(
        string indexed tweetId,
        uint256 totalAmount
    );

    event BetSettled(
        string indexed tweetId,
        address indexed winner,
        uint256 payout,
        bool outcome
    );

    event BetCancelled(
        string indexed tweetId,
        string reason
    );

    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _oracle) {
        owner = msg.sender;
        oracle = _oracle;
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
        string memory _accepterTwitterId
    ) external payable {
        require(bytes(_tweetId).length > 0, "Tweet ID required");
        require(bytes(_prediction).length > 0, "Prediction required");
        require(_challenger != _accepter, "Cannot bet against yourself");
        require(msg.value >= MIN_BET && msg.value <= MAX_BET, "Invalid bet amount");
        require(bytes(bets[_tweetId].tweetId).length == 0, "Bet already exists");

        TwitterBet storage newBet = bets[_tweetId];
        newBet.challenger = _challenger;
        newBet.accepter = _accepter;
        newBet.tweetId = _tweetId;
        newBet.prediction = _prediction;
        newBet.amount = msg.value;
        newBet.gameId = _gameId;
        newBet.createdAt = block.timestamp;
        newBet.challengerTwitterHandle = _challengerTwitterHandle;
        newBet.accepterTwitterHandle = _accepterTwitterHandle;
        newBet.challengerTwitterId = _challengerTwitterId;
        newBet.accepterTwitterId = _accepterTwitterId;

        allBetIds.push(_tweetId);
        userBets[_challenger].push(_tweetId);
        userBets[_accepter].push(_tweetId);
        
        walletToTwitterHandle[_challenger] = _challengerTwitterHandle;
        walletToTwitterHandle[_accepter] = _accepterTwitterHandle;
        twitterIdToWallet[_challengerTwitterId] = _challenger;
        twitterIdToWallet[_accepterTwitterId] = _accepter;

        if (msg.sender == _challenger) {
            newBet.challengerDeposited = true;
        } else if (msg.sender == _accepter) {
            newBet.accepterDeposited = true;
        } else {
            revert("Sender must be challenger or accepter");
        }

        userBetCounts[msg.sender]++;

        emit BetCreated(_tweetId, _challenger, _accepter, _prediction, msg.value, _gameId);
        emit BetFunded(_tweetId, msg.sender, msg.value);

        if (newBet.challengerDeposited && newBet.accepterDeposited) {
            emit BetFullyFunded(_tweetId, msg.value * 2);
        }
    }

    function depositForBet(string memory _tweetId) external payable {
        TwitterBet storage bet = bets[_tweetId];
        require(bytes(bet.tweetId).length > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(msg.value == bet.amount, "Must match bet amount");
        require(
            msg.sender == bet.challenger || msg.sender == bet.accepter,
            "Not a participant in this bet"
        );

        if (msg.sender == bet.challenger) {
            require(!bet.challengerDeposited, "Challenger already deposited");
            bet.challengerDeposited = true;
        } else {
            require(!bet.accepterDeposited, "Accepter already deposited");
            bet.accepterDeposited = true;
        }

        userBetCounts[msg.sender]++;
        emit BetFunded(_tweetId, msg.sender, msg.value);

        if (bet.challengerDeposited && bet.accepterDeposited) {
            emit BetFullyFunded(_tweetId, bet.amount * 2);
        }
    }

    function settleBet(string memory _tweetId, bool _outcome) external onlyOracle {
        TwitterBet storage bet = bets[_tweetId];
        require(bytes(bet.tweetId).length > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(bet.challengerDeposited && bet.accepterDeposited, "Bet not fully funded");

        bet.settled = true;
        address winner = _outcome ? bet.challenger : bet.accepter;
        bet.winner = winner;

        uint256 payout = bet.amount * 2;
        userWinnings[winner] += payout;

        (bool success, ) = payable(winner).call{value: payout}("");
        require(success, "Payout failed");

        emit BetSettled(_tweetId, winner, payout, _outcome);
    }

    function cancelBet(string memory _tweetId, string memory _reason) external onlyOracle {
        TwitterBet storage bet = bets[_tweetId];
        require(bytes(bet.tweetId).length > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");

        bet.settled = true;

        if (bet.challengerDeposited) {
            (bool success1, ) = payable(bet.challenger).call{value: bet.amount}("");
            require(success1, "Refund to challenger failed");
        }

        if (bet.accepterDeposited) {
            (bool success2, ) = payable(bet.accepter).call{value: bet.amount}("");
            require(success2, "Refund to accepter failed");
        }

        emit BetCancelled(_tweetId, _reason);
    }

    function cancelExpiredBet(string memory _tweetId) external {
        TwitterBet storage bet = bets[_tweetId];
        require(bytes(bet.tweetId).length > 0, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(
            block.timestamp >= bet.createdAt + TIMEOUT_DURATION,
            "Bet not expired yet"
        );

        this.cancelBet(_tweetId, "Expired - not fully funded within 24 hours");
    }

    function getBet(string memory _tweetId) external view returns (TwitterBet memory) {
        return bets[_tweetId];
    }

    function isBetFullyFunded(string memory _tweetId) external view returns (bool) {
        TwitterBet memory bet = bets[_tweetId];
        return bet.challengerDeposited && bet.accepterDeposited;
    }

    function setOracle(address _newOracle) external onlyOwner {
        oracle = _newOracle;
    }

    function getUserStats(address _user) external view returns (uint256 betCount, uint256 winnings) {
        return (userBetCounts[_user], userWinnings[_user]);
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

    function getWalletByTwitterId(string memory _twitterId) external view returns (address) {
        return twitterIdToWallet[_twitterId];
    }

    function getTwitterHandleByWallet(address _wallet) external view returns (string memory) {
        return walletToTwitterHandle[_wallet];
    }

    function getTotalBetsCount() external view returns (uint256) {
        return allBetIds.length;
    }

    receive() external payable {
        revert("Direct payments not allowed");
    }
}