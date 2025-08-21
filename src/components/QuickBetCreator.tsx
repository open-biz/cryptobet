'use client';

import { useState } from 'react';
import { useWagmiReady } from './Providers';

export default function QuickBetCreator() {
  const isWagmiReady = useWagmiReady();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    sport: '',
    game: '',
    prediction: '',
    amount: '',
    opponentTwitter: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const sports = [
    { emoji: '⚽', name: 'Soccer', games: ['Premier League', 'Champions League', 'World Cup'] },
    { emoji: '🏀', name: 'Basketball', games: ['NBA', 'NCAA', 'EuroLeague'] },
    { emoji: '🏈', name: 'Football', games: ['NFL', 'College Football'] },
    { emoji: '⚾', name: 'Baseball', games: ['MLB', 'World Series'] },
    { emoji: '🎾', name: 'Tennis', games: ['Wimbledon', 'US Open', 'French Open'] }
  ];

  const predictionTemplates = [
    'Team X will win',
    'Team X will win by 7+ points',
    'Player will score 2+ goals',
    'Over/Under 3.5 goals',
    'First team to score',
    'Match will go to overtime'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateBet = async () => {
    setIsCreating(true);
    
    // Simulate bet creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reset form
    setFormData({
      sport: '',
      game: '',
      prediction: '',
      amount: '',
      opponentTwitter: ''
    });
    setStep(1);
    setIsCreating(false);
    
    alert('Test bet created! In production, this would create a smart contract and tweet the challenge.');
  };

  const isFormValid = formData.sport && formData.game && formData.prediction && formData.amount && formData.opponentTwitter;

  if (!isWagmiReady) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded mb-4"></div>
          <div className="h-32 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Choose Sport</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sports.map((sport) => (
                <button
                  key={sport.name}
                  onClick={() => handleInputChange('sport', sport.name)}
                  className={`p-2 sm:p-3 rounded-lg text-center transition-all duration-200 ${
                    formData.sport === sport.name
                      ? 'bg-black text-white border-2 border-black'
                      : 'bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <span className="text-lg sm:text-xl block">{sport.emoji}</span>
                  <span className="text-xs font-semibold">{sport.name}</span>
                </button>
              ))}
            </div>
          </div>

          {formData.sport && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Game/League</label>
              <select
                value={formData.game}
                onChange={(e) => handleInputChange('game', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-black focus:border-black font-semibold"
              >
                <option value="">Select a game...</option>
                {sports.find(s => s.name === formData.sport)?.games.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
          )}

          {formData.game && (
            <button
              onClick={() => setStep(2)}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200"
            >
              Next: Create Prediction
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(1)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← Back
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Prediction</label>
            <textarea
              value={formData.prediction}
              onChange={(e) => handleInputChange('prediction', e.target.value)}
              placeholder="e.g., Lakers will beat Warriors by 10+ points"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="mt-2">
              <p className="text-xs text-gray-600 mb-2">Quick templates:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                {predictionTemplates.slice(0, 3).map(template => (
                  <button
                    key={template}
                    onClick={() => handleInputChange('prediction', template)}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-2 rounded hover:bg-gray-200 text-left"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bet Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.1"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="absolute right-3 top-3 text-gray-500 text-sm">ETH</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opponent</label>
              <input
                type="text"
                value={formData.opponentTwitter}
                onChange={(e) => handleInputChange('opponentTwitter', e.target.value)}
                placeholder="@username"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!isFormValid}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Review Bet
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <button
            onClick={() => setStep(2)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            ← Back
          </button>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Bet Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sport:</span>
                <span className="font-medium">{formData.sport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Game:</span>
                <span className="font-medium">{formData.game}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Prediction:</span>
                <span className="font-medium">"{formData.prediction}"</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-green-600">{formData.amount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Opponent:</span>
                <span className="font-medium">{formData.opponentTwitter}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Smart contract will be created</li>
              <li>• Tweet challenge sent to {formData.opponentTwitter}</li>
              <li>• Both players deposit {formData.amount} ETH</li>
              <li>• Winner takes {(parseFloat(formData.amount) * 2).toFixed(2)} ETH</li>
            </ul>
          </div>

          <button
            onClick={handleCreateBet}
            disabled={isCreating}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300"
          >
            {isCreating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Test Bet...
              </div>
            ) : (
              '🚀 Create Test Bet'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            This is a test interface. No real transactions will be made.
          </p>
        </div>
      )}
    </div>
  );
}