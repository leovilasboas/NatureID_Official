/**
 * In-memory database for storing identification history
 * This is a simple implementation as per the blueprint requirements
 */

// Maximum history items to store (for free users)
const MAX_FREE_HISTORY_ITEMS = 10;

// In-memory storage for identification history
let historyItems = [];

/**
 * Add a new identification result to history
 * @param {Object} item - The identification result to add
 */
export function addToHistory(item) {
  // Add new item at the beginning of the array
  historyItems.unshift(item);
  
  // Limit history size for free users
  if (historyItems.length > MAX_FREE_HISTORY_ITEMS) {
    historyItems = historyItems.slice(0, MAX_FREE_HISTORY_ITEMS);
  }
}

/**
 * Get history items, optionally filtered by type
 * @param {string} type - Filter type ('plant', 'animal', or 'all')
 * @returns {Array} Array of history items
 */
export function getHistory(type = 'all') {
  if (type === 'all') {
    return [...historyItems];
  }
  
  return historyItems.filter(item => item.type === type);
}

/**
 * Clear all history items
 */
export function clearHistory() {
  historyItems = [];
}

/**
 * Get a specific history item by ID
 * @param {string} id - The ID of the history item to retrieve
 * @returns {Object|null} The history item or null if not found
 */
export function getHistoryById(id) {
  return historyItems.find(item => item.id === id) || null;
}

/**
 * Delete a specific history item by ID
 * @param {string} id - The ID of the history item to delete
 * @returns {boolean} True if deletion was successful, false otherwise
 */
export function deleteHistoryItem(id) {
  const initialLength = historyItems.length;
  historyItems = historyItems.filter(item => item.id !== id);
  return historyItems.length !== initialLength;
}
