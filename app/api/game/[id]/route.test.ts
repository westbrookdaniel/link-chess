// Mock next/server before importing route
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: async () => data
    })),
  },
}));

// Now import the route handlers
import { GET, POST, DELETE } from './route';
import { db } from '@/db';
import { gamesTable } from '@/db/schema';

// Mock the database
jest.mock('@/db', () => ({
  db: {
    query: {
      gamesTable: {
        findFirst: jest.fn(),
      },
    },
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

// Mock the Next.js Request/Response
const createMockRequest = (url: string, method: string, body?: any): NextRequest => {
  const request = {
    url,
    method,
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(),
  } as unknown as NextRequest;
  
  return request;
};

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Game API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/game/[id]', () => {
    test('returns game state when found', async () => {
      // Mock database response
      const mockGame = {
        id: 1,
        data: {
          'test-state': JSON.stringify({ value: 'test' })
        },
        slug: 'test-game',
      };
      
      (db.query.gamesTable.findFirst as jest.Mock).mockResolvedValue(mockGame);
      
      // Create mock request
      const request = createMockRequest('http://localhost:3000/api/game/1?name=test-state', 'GET');
      
      // Call the handler
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ state: JSON.stringify({ value: 'test' }) });
      expect(db.query.gamesTable.findFirst).toHaveBeenCalledWith({
        where: expect.anything()
      });
    });

    test('returns 404 when game is not found', async () => {
      // Mock database response - no game found
      (db.query.gamesTable.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Create mock request
      const request = createMockRequest('http://localhost:3000/api/game/999?name=test-state', 'GET');
      
      // Call the handler
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Game not found' });
    });

    test('returns 400 when name parameter is missing', async () => {
      // Create mock request without name parameter
      const request = createMockRequest('http://localhost:3000/api/game/1', 'GET');
      
      // Call the handler
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing name parameter' });
    });

    test('returns 500 when an error occurs', async () => {
      // Mock database error
      (db.query.gamesTable.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Create mock request
      const request = createMockRequest('http://localhost:3000/api/game/1?name=test-state', 'GET');
      
      // Call the handler
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to retrieve game state' });
    });
  });

  describe('POST /api/game/[id]', () => {
    test('updates game state successfully', async () => {
      // Mock database response
      const mockGame = {
        id: 1,
        data: {
          'existing-state': 'value'
        },
        slug: 'test-game',
      };
      
      (db.query.gamesTable.findFirst as jest.Mock).mockResolvedValue(mockGame);
      
      // Create mock request
      const requestBody = { name: 'test-state', state: JSON.stringify({ value: 'updated' }) };
      const request = createMockRequest('http://localhost:3000/api/game/1', 'POST', requestBody);
      
      // Call the handler
      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      
      // Check that database update was called with correct parameters
      expect(db.update).toHaveBeenCalledWith(gamesTable);
    });

    test('returns 404 when game is not found', async () => {
      // Mock database response - no game found
      (db.query.gamesTable.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Create mock request
      const requestBody = { name: 'test-state', state: JSON.stringify({ value: 'test' }) };
      const request = createMockRequest('http://localhost:3000/api/game/999', 'POST', requestBody);
      
      // Call the handler
      const response = await POST(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Game not found' });
    });

    test('returns 400 when request body is invalid', async () => {
      // Create mock request with invalid body
      const requestBody = { invalid: 'body' }; // Missing required fields
      const request = createMockRequest('http://localhost:3000/api/game/1', 'POST', requestBody);
      
      // Call the handler
      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500); // Schema validation error results in 500
      expect(data).toEqual({ error: 'Failed to save game state' });
    });

    test('returns 500 when an error occurs', async () => {
      // Mock database error
      (db.query.gamesTable.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Create mock request
      const requestBody = { name: 'test-state', state: JSON.stringify({ value: 'test' }) };
      const request = createMockRequest('http://localhost:3000/api/game/1', 'POST', requestBody);
      
      // Call the handler
      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to save game state' });
    });
  });

  describe('DELETE /api/game/[id]', () => {
    test('deletes game state successfully', async () => {
      // Mock database response
      const mockGame = {
        id: 1,
        data: {
          'test-state': JSON.stringify({ value: 'test' })
        },
        slug: 'test-game',
      };
      
      (db.query.gamesTable.findFirst as jest.Mock).mockResolvedValue(mockGame);
      
      // Create mock request
      const request = createMockRequest('http://localhost:3000/api/game/1?name=test-state', 'DELETE');
      
      // Call the handler
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      
      // Check that database update was called
      expect(db.update).toHaveBeenCalledWith(gamesTable);
    });

    test('returns 404 when game is not found', async () => {
      // Mock database response - no game found
      (db.query.gamesTable.findFirst as jest.Mock).mockResolvedValue(null);
      
      // Create mock request
      const request = createMockRequest('http://localhost:3000/api/game/999?name=test-state', 'DELETE');
      
      // Call the handler
      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Game not found' });
    });

    test('returns 400 when name parameter is missing', async () => {
      // Create mock request without name parameter
      const request = createMockRequest('http://localhost:3000/api/game/1', 'DELETE');
      
      // Call the handler
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing name parameter' });
    });

    test('handles case when state key does not exist', async () => {
      // Mock database response with no matching state key
      const mockGame = {
        id: 1,
        data: {
          'other-state': JSON.stringify({ value: 'test' })
        },
        slug: 'test-game',
      };
      
      (db.query.gamesTable.findFirst as jest.Mock).mockResolvedValue(mockGame);
      
      // Create mock request
      const request = createMockRequest('http://localhost:3000/api/game/1?name=non-existent-key', 'DELETE');
      
      // Call the handler
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      
      // Database update should not be called since key doesn't exist
      expect(db.update).not.toHaveBeenCalled();
    });

    test('returns 500 when an error occurs', async () => {
      // Mock database error
      (db.query.gamesTable.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Create mock request
      const request = createMockRequest('http://localhost:3000/api/game/1?name=test-state', 'DELETE');
      
      // Call the handler
      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to remove game state' });
    });
  });
});