import { createNetworkStorage } from './networkStorage';

describe('Network Storage', () => {
  let originalFetch: typeof global.fetch;
  
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
    global.console.error = jest.fn();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });
  
  describe('getItem', () => {
    test('returns state data when fetch is successful', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ state: 'test-state-data' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const storage = createNetworkStorage('game-123');
      const result = await storage.getItem('game-state');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/game/game-123?name=game-state',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      expect(result).toBe('test-state-data');
    });
    
    test('returns null when fetch fails', async () => {
      const mockResponse = {
        ok: false
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const storage = createNetworkStorage('game-123');
      const result = await storage.getItem('game-state');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
    
    test('returns null when an exception occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const storage = createNetworkStorage('game-123');
      const result = await storage.getItem('game-state');
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('setItem', () => {
    test('calls fetch with correct parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
      
      const storage = createNetworkStorage('game-123');
      await storage.setItem('game-state', 'test-state-data');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/game/game-123',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'game-state', state: 'test-state-data' })
        }
      );
    });
    
    test('handles errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const storage = createNetworkStorage('game-123');
      await storage.setItem('game-state', 'test-state-data');
      
      expect(console.error).toHaveBeenCalled();
    });
  });
  
  describe('removeItem', () => {
    test('calls fetch with correct parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
      
      const storage = createNetworkStorage('game-123');
      await storage.removeItem('game-state');
      
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/game/game-123?name=game-state',
        { method: 'DELETE' }
      );
    });
    
    test('handles errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const storage = createNetworkStorage('game-123');
      await storage.removeItem('game-state');
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});