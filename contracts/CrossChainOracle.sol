// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IMailbox} from "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import {IInterchainSecurityModule} from "@hyperlane-xyz/core/contracts/interfaces/IInterchainSecurityModule.sol";
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title CrossChainOracle
 * @notice Oracle contract deployed on Chainlink Functions supported chain (e.g., Sepolia)
 * @dev Receives settlement requests from Chiliz via Hyperlane, calls Chainlink Functions, sends results back
 */
contract CrossChainOracle is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    struct SettlementRequest {
        string betId;
        string gameId;
        string prediction;
        string sport;
        uint32 originDomain; // Hyperlane domain of requesting chain
        bytes32 originSender; // Address of requesting contract
        bool processed;
    }

    // Hyperlane
    IMailbox public immutable mailbox;
    
    // Chainlink Functions
    bytes32 public donId;
    uint64 public subscriptionId;
    uint32 public gasLimit;
    string public source;
    bytes public encryptedSecretsUrls;

    // State
    mapping(bytes32 => SettlementRequest) public requests;
    mapping(bytes32 => bytes32) public functionsRequestToHyperlane; // Functions requestId → Hyperlane messageId
    
    // Events
    event SettlementRequestReceived(bytes32 indexed messageId, string betId, string gameId, string prediction);
    event FunctionsRequestSent(bytes32 indexed functionsRequestId, bytes32 indexed hyperlaneMessageId);
    event SettlementCompleted(bytes32 indexed messageId, string betId, bool outcome);

    constructor(
        address _mailbox,
        address _functionsRouter,
        bytes32 _donId,
        uint64 _subscriptionId,
        uint32 _gasLimit
    ) FunctionsClient(_functionsRouter) ConfirmedOwner(msg.sender) {
        mailbox = IMailbox(_mailbox);
        donId = _donId;
        subscriptionId = _subscriptionId;
        gasLimit = _gasLimit;
    }

    /**
     * @notice Handle incoming Hyperlane messages requesting bet settlement
     * @param _origin Domain of origin chain
     * @param _sender Address of sender on origin chain
     * @param _body Encoded settlement request data
     */
    function handle(
        uint32 _origin,
        bytes32 _sender,
        bytes calldata _body
    ) external {
        require(msg.sender == address(mailbox), "Only mailbox can call");
        
        // Decode the settlement request
        (string memory betId, string memory gameId, string memory prediction, string memory sport) = 
            abi.decode(_body, (string, string, string, string));

        bytes32 messageId = keccak256(abi.encodePacked(_origin, _sender, betId, block.timestamp));

        // Store the request
        requests[messageId] = SettlementRequest({
            betId: betId,
            gameId: gameId,
            prediction: prediction,
            sport: sport,
            originDomain: _origin,
            originSender: _sender,
            processed: false
        });

        emit SettlementRequestReceived(messageId, betId, gameId, prediction);

        // Immediately send Chainlink Functions request
        _sendFunctionsRequest(messageId);
    }

    /**
     * @notice Send request to Chainlink Functions
     */
    function _sendFunctionsRequest(bytes32 messageId) internal {
        SettlementRequest storage request = requests[messageId];
        require(!request.processed, "Request already processed");
        require(bytes(source).length > 0, "Source code not set");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        // Set arguments: [gameId, prediction, sport]
        string[] memory args = new string[](3);
        args[0] = request.gameId;
        args[1] = request.prediction;
        args[2] = request.sport;
        req.setArgs(args);

        // Set secrets if available
        if (encryptedSecretsUrls.length > 0) {
            req.addSecretsReference(encryptedSecretsUrls);
        }

        // Send the Functions request
        bytes32 functionsRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        // Map Functions request to Hyperlane message
        functionsRequestToHyperlane[functionsRequestId] = messageId;

        emit FunctionsRequestSent(functionsRequestId, messageId);
    }

    /**
     * @notice Chainlink Functions callback
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        bytes32 messageId = functionsRequestToHyperlane[requestId];
        require(messageId != bytes32(0), "Unknown Functions request");

        SettlementRequest storage request = requests[messageId];
        require(!request.processed, "Request already processed");

        // Decode response (0 or 1)
        uint256 outcome = 0;
        if (response.length > 0) {
            outcome = abi.decode(response, (uint256));
        }

        bool challengerWins = outcome == 1;

        // Mark as processed
        request.processed = true;

        // Send result back to origin chain via Hyperlane
        _sendSettlementResult(request, challengerWins);

        emit SettlementCompleted(messageId, request.betId, challengerWins);
    }

    /**
     * @notice Send settlement result back to origin chain
     */
    function _sendSettlementResult(SettlementRequest memory request, bool outcome) internal {
        bytes memory messageBody = abi.encode(request.betId, outcome);
        
        // Calculate gas payment for cross-chain message
        uint256 gasPayment = mailbox.quoteDispatch(
            request.originDomain,
            request.originSender,
            messageBody
        );

        // Send message back to origin chain
        mailbox.dispatch{value: gasPayment}(
            request.originDomain,
            request.originSender,
            messageBody
        );
    }

    /**
     * @notice Emergency function to manually send settlement result
     */
    function manualSettlement(bytes32 messageId, bool outcome) external onlyOwner {
        SettlementRequest storage request = requests[messageId];
        require(!request.processed, "Request already processed");
        
        request.processed = true;
        _sendSettlementResult(request, outcome);
        
        emit SettlementCompleted(messageId, request.betId, outcome);
    }

    /**
     * @notice Update Chainlink Functions configuration
     */
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

    /**
     * @notice Fund contract for Hyperlane gas payments
     */
    receive() external payable {}

    /**
     * @notice Withdraw excess funds
     */
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}