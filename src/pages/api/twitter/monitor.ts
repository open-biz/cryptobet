import type { NextApiRequest, NextApiResponse } from 'next';
import { twitterMonitor } from '@/lib/twitter-monitor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action } = req.body;
    
    try {
      if (action === 'start') {
        await twitterMonitor.startMonitoring();
        res.status(200).json({ message: 'Twitter monitoring started' });
      } else if (action === 'stop') {
        twitterMonitor.stopMonitoring();
        res.status(200).json({ message: 'Twitter monitoring stopped' });
      } else {
        res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
      }
    } catch (error) {
      console.error('Monitor API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'GET') {
    // Just start monitoring if it's not running
    try {
      await twitterMonitor.startMonitoring();
      res.status(200).json({ message: 'Twitter monitoring status checked/started' });
    } catch (error) {
      console.error('Monitor status error:', error);
      res.status(500).json({ error: 'Failed to check monitoring status' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}