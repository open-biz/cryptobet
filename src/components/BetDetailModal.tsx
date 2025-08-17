'use client';

import { useState } from 'react';

interface BetDetailModalProps {
  bet: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function BetDetailModal({ bet, isOpen, onClose }: BetDetailModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen || !bet) return null;

  const handleAcceptBet = async () => {
    setIsAccepting(true);
    // Simulate accepting bet
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAccepting(false);
    onClose();
    alert('Bet accepted! In production, this would trigger smart contract deposit.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
        {/* Header - Clean Style */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Bet Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-bold transition-all"
          >
            ×
          </button>
        </div>

        {/* Content - Clean Style */}
        <div className="p-6 space-y-6">
          {/* Game Info */}
          <div className="flex items-center gap-4">
            <span className="text-4xl">{bet.sport}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{bet.game}</h3>
              <p className="text-gray-600">Created {bet.createdAt}</p>
            </div>
          </div>

          {/* Prediction */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">
              Prediction
            </h4>
            <p className="text-gray-900 text-lg font-medium">"{bet.prediction}"</p>
          </div>

          {/* Players - Clean Style */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">
                Challenger
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  C
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{bet.challengerHandle}</p>
                  <p className="text-sm text-blue-600 font-mono">{bet.challenger}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3">
                {bet.status === 'pending' ? 'Seeking Opponent' : 'Accepter'}
              </h4>
              {bet.status === 'pending' ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold mx-auto mb-2">
                    ?
                  </div>
                  <p className="text-orange-700 font-semibold">Waiting for challenger...</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900">{bet.accepterHandle}</p>
                    <p className="text-sm text-orange-600 font-mono">{bet.accepter}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bet Amount - Clean Style */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-900">
                  Bet Amount
                </h4>
                <p className="text-sm text-green-700 font-medium">Each player deposits</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{bet.amount}</p>
                <p className="text-sm text-green-700 font-medium">Winner takes {(parseFloat(bet.amount.split(' ')[0]) * 2).toFixed(1)} {bet.amount.split(' ')[1]}</p>
              </div>
            </div>
          </div>

          {/* Smart Contract Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Smart Contract Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">Chiliz Chain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Contract:</span>
                <span className="font-medium font-mono text-xs">0x742d35d4...8B3f7A9e</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Oracle Settlement:</span>
                <span className="font-medium text-green-600">Automated</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timeout:</span>
                <span className="font-medium">24 hours</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="border-l-2 border-gray-200 pl-4 space-y-4">
            <h4 className="font-semibold text-gray-900">Bet Timeline</h4>
            
            <div className="relative">
              <div className="absolute -left-6 w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-green-600">Bet Created</p>
                <p className="text-sm text-gray-600">{bet.createdAt} by {bet.challengerHandle}</p>
              </div>
            </div>

            {bet.status !== 'pending' && (
              <div className="relative">
                <div className="absolute -left-6 w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-blue-600">Bet Accepted</p>
                  <p className="text-sm text-gray-600">5 minutes ago by {bet.accepterHandle}</p>
                </div>
              </div>
            )}

            {bet.status === 'settled' && (
              <div className="relative">
                <div className="absolute -left-6 w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-purple-600">Bet Settled</p>
                  <p className="text-sm text-gray-600">Winner: {bet.challengerHandle}</p>
                </div>
              </div>
            )}

            {bet.status === 'pending' && (
              <div className="relative">
                <div className="absolute -left-6 w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-500">Waiting for Accepter</p>
                  <p className="text-sm text-gray-400">Bet expires in 23h 45m</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions - Clean Style */}
          {bet.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={handleAcceptBet}
                disabled={isAccepting}
                className="flex-1 bg-black text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
              >
                {isAccepting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Accepting...
                  </div>
                ) : (
                  'Accept Bet'
                )}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          )}

          {bet.tweetUrl && (
            <div className="text-center">
              <a
                href={bet.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 transition-all duration-200 hover:bg-blue-100"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                View Original Tweet
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}