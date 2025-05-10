import { getHistory, clearHistory } from '../../utils/memoryDb';

export default async function handler(req, res) {
  // Handle GET request - retrieve history
  if (req.method === 'GET') {
    try {
      const type = req.query.type || 'all';
      const history = getHistory(type);
      return res.status(200).json(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      return res.status(500).json({ message: 'Failed to retrieve history' });
    }
  }
  
  // Handle DELETE request - clear history
  if (req.method === 'DELETE') {
    try {
      clearHistory();
      return res.status(200).json({ message: 'History cleared successfully' });
    } catch (error) {
      console.error('Error clearing history:', error);
      return res.status(500).json({ message: 'Failed to clear history' });
    }
  }

  // If not GET or DELETE, return method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}
