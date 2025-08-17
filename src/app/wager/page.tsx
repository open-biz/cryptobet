'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useWagmiReady } from '@/components/Providers';
import { ContractService } from '@/lib/contract';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function WagerPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const isWagmiReady = useWagmiReady();
  const chainId = useChainId();
  
  const [ensSupported, setEnsSupported] = useState(false);
  
  useEffect(() => {
    // ENS is typically only supported on mainnet (1) and some testnets
    setEnsSupported(chainId === 1 || chainId === 5 || chainId === 11155111);
  }, [chainId]);
  
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      // Filter out ENS-related errors
      if (
        args[0] && 
        typeof args[0] === 'string' && 
        (args[0].includes('ENS') || 
         (args[0].includes('network') && args[0].includes('UNSUPPORTED_OPERATION')))
      ) {
        // Quietly suppress these errors
        return;
      }
      originalError.apply(console, args);
    };

    // Cleanup
    return () => {
      console.error = originalError;
    };
  }, [chainId]);
  
  const [formData, setFormData] = useState({
    prediction: '',
    amount: '',
    gameId: '',
    accepterTwitterHandle: ''
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [stage, setStage] = useState<'initial' | 'opponent-selected' | 'wager-defined' | 'confirming'>('initial');

  const contractService = new ContractService();

  const generateBetId = (): string => {
    return 'bet_' + Math.random().toString(36).substring(2, 15);
  };

  // Handle Twitter handle input with @ symbol removal
  const handleTwitterHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const handle = e.target.value.trim().replace(/^@/, '');
    handleInputChange('accepterTwitterHandle', handle);
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Update stage based on form completion
    if (field === 'accepterTwitterHandle' && value) {
      setStage('opponent-selected');
    }
    
    if ((field === 'prediction' || field === 'gameId' || field === 'amount') && 
        formData.prediction && formData.gameId && formData.amount) {
      setStage('wager-defined');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!formData.prediction || !formData.amount || !formData.gameId) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setStage('confirming');
    
    try {
      const betId = generateBetId();
      const amountWei = BigInt(Math.floor(parseFloat(formData.amount) * 1e18));
      
      // Check if contract is deployed
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress || contractAddress === 'deployed_contract_address') {
        // Demo mode - just redirect to bet page
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
        router.push(`/bet/${betId}`);
        return;
      }
      
      // Create bet on contract
      await contractService.createBet(
        betId,
        formData.prediction,
        address,
        '0x0000000000000000000000000000000000000000', // Empty for now, opponent will be determined when they accept
        formData.gameId,
        '', // challengerTwitterHandle - could be added later
        formData.accepterTwitterHandle,
        '', // challengerTwitterId - empty for web creation  
        '', // accepterTwitterId - empty for web creation
        amountWei
      );

      // Redirect to the bet page
      router.push(`/bet/${betId}`);
    } catch (error) {
      console.error('Error creating bet:', error);
      alert('Error creating bet. Please try again.');
      setStage('wager-defined');
    } finally {
      setIsCreating(false);
    }
  };

  const getStageCompletion = () => {
    if (stage === 'initial') return 25;
    if (stage === 'opponent-selected') return 50;
    if (stage === 'wager-defined') return 75;
    if (stage === 'confirming') return 100;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Wager
          </h1>
          <p className="text-gray-600">
            Set up a sports prediction challenge
          </p>
          
          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto mt-6 bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${getStageCompletion()}%` }}
            ></div>
          </div>
        </div>

        {/* Visual 3-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Opponent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Opponent</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Twitter Handle
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    @
                  </span>
                  <input
                    type="text"
                    value={formData.accepterTwitterHandle}
                    onChange={handleTwitterHandleChange}
                    placeholder="username"
                    className="w-full p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {formData.accepterTwitterHandle ? (
                <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    {formData.accepterTwitterHandle.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">@{formData.accepterTwitterHandle}</p>
                    <p className="text-xs text-blue-700">Will receive challenge</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  <p>Enter opponent's Twitter handle</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Middle Column - The Wager */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">The Wager</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Prediction *
                </label>
                <textarea
                  value={formData.prediction}
                  onChange={(e) => handleInputChange('prediction', e.target.value)}
                  placeholder="e.g., Lakers will beat Warriors by 10+ points"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Game/Event *
                </label>
                <input
                  type="text"
                  value={formData.gameId}
                  onChange={(e) => handleInputChange('gameId', e.target.value)}
                  placeholder="e.g., NBA Lakers vs Warriors 12/25/2025"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Stake Amount (ETH) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Each player deposits this amount. Winner takes double.
                </p>
              </div>
            </div>
            
            {/* Loading Visual */}
            {stage === 'confirming' && (
              <div className="flex items-center justify-center mt-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {/* Right Column - Your Wallet */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Wallet</h2>
            
            {!isWagmiReady ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : !isConnected ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 font-semibold mb-2">Connect Wallet Required</p>
                <p className="text-yellow-700 text-sm">
                  You need to connect your wallet to create a wager
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                      W
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Wallet Connected</p>
                      <p className="text-sm text-green-700 font-mono">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {formData.amount && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">You will deposit</p>
                    <p className="text-2xl font-bold text-blue-900">{formData.amount} ETH</p>
                    <p className="text-xs text-blue-700 mt-1">Winner takes {parseFloat(formData.amount) * 2} ETH</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Footer */}
        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={handleSubmit}
            disabled={!formData.prediction || !formData.gameId || !formData.amount || !isConnected || isCreating}
            className="bg-black text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-md"
          >
            {isCreating ? "Creating Wager..." : "Create Wager"}
          </button>
          
          <div className="mt-4">
            <Link 
              href="/"
              className="text-gray-600 hover:text-gray-800 font-semibold"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
        
        {/* Visual Representation - Only shown when all required fields are filled */}
        {formData.prediction && formData.gameId && formData.amount && (
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Wager Preview</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* You */}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold">
                  You
                </div>
                <p className="mt-2 font-semibold">You</p>
                <p className="text-sm text-gray-500">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
              </div>
              
              {/* Left Arrow */}
              <div className="flex-1 flex items-center justify-center">
                <div className="h-0.5 w-full bg-blue-200 relative">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-2">
                    <div className="w-4 h-4 border-t-2 border-r-2 border-blue-200 transform rotate-45"></div>
                  </div>
                </div>
              </div>
              
              {/* Wager */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-4 border-yellow-500 mx-auto flex items-center justify-center bg-yellow-50">
                  <span className="text-yellow-700 font-bold">{formData.amount} ETH</span>
                </div>
                <p className="mt-2 text-sm max-w-[150px] overflow-hidden text-ellipsis">
                  {formData.prediction}
                </p>
              </div>
              
              {/* Right Arrow */}
              <div className="flex-1 flex items-center justify-center">
                <div className="h-0.5 w-full bg-orange-200 relative">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-2">
                    <div className="w-4 h-4 border-t-2 border-r-2 border-orange-200 transform rotate-45"></div>
                  </div>
                </div>
              </div>
              
              {/* Opponent */}
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full mx-auto flex items-center justify-center text-white text-xl font-bold">
                  {formData.accepterTwitterHandle ? 
                    formData.accepterTwitterHandle.charAt(0).toUpperCase() : 
                    '?'}
                </div>
                <p className="mt-2 font-semibold">
                  {formData.accepterTwitterHandle ? 
                    `@${formData.accepterTwitterHandle}` : 
                    'Opponent'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
