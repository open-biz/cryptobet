'use client';

import { useState } from 'react';

export default function TwitterMonitorControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleStartMonitoring = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/twitter/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });
      
      const data = await response.json();
      setStatus(data.message || 'Monitoring started');
    } catch (error) {
      setStatus('Error starting monitoring');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/twitter/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      
      const data = await response.json();
      setStatus(data.message || 'Monitoring stopped');
    } catch (error) {
      setStatus('Error stopping monitoring');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Twitter Bot Control
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={handleStartMonitoring}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Starting...' : 'Start Monitoring'}
          </button>
          
          <button
            onClick={handleStopMonitoring}
            disabled={isLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Stopping...' : 'Stop Monitoring'}
          </button>
        </div>
        
        {status && (
          <div className={`p-3 rounded-lg text-sm ${
            status.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {status}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>What this does:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Monitors Twitter for @SendBet mentions every 30 seconds</li>
            <li>Automatically responds to bet challenges and acceptances</li>
            <li>Provides bet links for users to fund their wagers</li>
          </ul>
        </div>
      </div>
    </div>
  );
}