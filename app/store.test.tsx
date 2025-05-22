/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook } from "@testing-library/react";
import { createGameStore, useStoreSync } from "./store";
import { Chess } from "chess.js";

// Mock chess.js to control its behavior
jest.mock("chess.js", () => {
  return {
    Chess: jest.fn().mockImplementation((fen) => {
      return {
        fen: jest
          .fn()
          .mockReturnValue(
            fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          ),
        move: jest.fn().mockReturnValue({ from: "e2", to: "e4" }),
        inCheck: jest.fn().mockReturnValue(false),
        isCheckmate: jest.fn().mockReturnValue(false),
        isStalemate: jest.fn().mockReturnValue(false),
        isDraw: jest.fn().mockReturnValue(false),
        isGameOver: jest.fn().mockReturnValue(false),
      };
    }),
  };
});

// Mock networkStorage
jest.mock("./networkStorage", () => ({
  createNetworkStorage: jest.fn().mockImplementation(() => ({
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock Zustand's persist to bypass storage
jest.mock("zustand/middleware", () => {
  const actual = jest.requireActual("zustand/middleware");
  return {
    ...actual,
    persist: jest.fn().mockImplementation((config) => config),
    createJSONStorage: jest.fn().mockReturnValue({}),
  };
});

// Mock global fetch for useStoreSync tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Game Store", () => {
  let store: ReturnType<typeof createGameStore>;
  let initialState: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock a simple store state
    initialState = {
      game: {
        users: [],
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        turn: "w",
        history: [],
        isCheck: false,
        isCheckmate: false,
        isStalemate: false,
        isDraw: false,
        isGameOver: false,
      },
    };

    // Create store with our mocked functions
    store = createGameStore(1);
  });

  test("initializes with the correct default state", () => {
    // We're testing the createGameStore correctly initializes
    // We'll check the properties defined in the default state
    const state = store.getState().game;

    expect(state).toBeDefined();
    expect(state.fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    expect(state.turn).toBe("w");
    expect(state.users).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.isCheck).toBe(false);
    expect(state.isCheckmate).toBe(false);
    expect(state.isStalemate).toBe(false);
    expect(state.isDraw).toBe(false);
    expect(state.isGameOver).toBe(false);
  });

  test("makeMove updates the game state correctly", () => {
    const { makeMove } = store.getState();

    // Execute the move
    const result = makeMove("e2", "e4");

    // Verify chess.js was called
    expect(Chess).toHaveBeenCalled();
    expect(result).toBe(true);

    // After the move, the store state should be updated
    // We'll need to get the latest state
    const gameState = store.getState().game;

    // Check that turn changed from white to black
    expect(gameState.turn).not.toBe(initialState.game.turn);

    // History should have one entry
    expect(gameState.history.length).toBeGreaterThan(0);
  });

  test("makeMove handles invalid moves", () => {
    // Override the Chess mock to simulate an invalid move
    (Chess as jest.Mock).mockImplementationOnce(() => ({
      move: jest.fn().mockImplementation(() => {
        throw new Error("Invalid move");
      }),
    }));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const { makeMove } = store.getState();

    // Execute an invalid move
    const result = makeMove("invalid", "move");

    // Should return false for invalid moves
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("resetGame resets to initial state while preserving users", () => {
    const { resetGame, makeMove, addUser } = store.getState();

    // Setup: make a move and add a user
    makeMove("e2", "e4");
    addUser({ name: "Test User", turn: "w" });

    // Reset the game
    resetGame();

    // Check the state after reset
    const gameState = store.getState().game;

    // Should be back to initial position
    expect(gameState.fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    expect(gameState.history).toEqual([]);

    // Users should be preserved
    expect(gameState.users.length).toBeGreaterThan(0);
    expect(gameState.users[0].name).toBe("Test User");
  });

  test("loadGame loads a game from FEN string", () => {
    const { loadGame } = store.getState();
    const customFen =
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2";

    // Load the game
    loadGame(customFen);

    // Check the state after loading
    const gameState = store.getState().game;

    // FEN should be updated
    expect(gameState.fen).toBe(customFen);

    // History should be reset
    expect(gameState.history).toEqual([]);
  });

  test("loadGame handles invalid FEN strings", () => {
    // Override the Chess mock to simulate an invalid FEN
    (Chess as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Invalid FEN");
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const { loadGame } = store.getState();

    // Try to load an invalid FEN
    loadGame("invalid-fen");

    // Should log the error
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("undoMove reverts to previous state", () => {
    const { makeMove, undoMove } = store.getState();
    const initialFen = store.getState().game.fen;

    // Make a move
    makeMove("e2", "e4");

    // Undo the move
    undoMove();

    // Check the state after undo
    const gameState = store.getState().game;

    // Should be back to initial position
    expect(gameState.fen).toBe(initialFen);
    expect(gameState.history).toEqual([]);
  });

  test("undoMove does nothing if history is empty", () => {
    const { undoMove } = store.getState();
    const initialFen = store.getState().game.fen;

    // Try to undo with empty history
    undoMove();

    // Check the state is unchanged
    const gameState = store.getState().game;
    expect(gameState.fen).toBe(initialFen);
  });

  test("addUser adds a new user", () => {
    const { addUser } = store.getState();
    const user = { name: "Test User", turn: "w" as const };

    // Add a user
    addUser(user);

    // Check the user was added
    const gameState = store.getState().game;
    expect(gameState.users).toContainEqual(user);
  });

  test("addUser updates an existing user", () => {
    const { addUser } = store.getState();
    const user1 = { name: "Test User", turn: "w" as const };
    const user2 = { name: "Test User", turn: "b" as const };

    // Add a user
    addUser(user1);

    // Update the user
    addUser(user2);

    // Check the user was updated, not duplicated
    const gameState = store.getState().game;
    expect(gameState.users.length).toBe(1);
    expect(gameState.users[0]).toEqual(user2);
  });

  test("removeUser removes a user", () => {
    const { addUser, removeUser } = store.getState();
    const user = { name: "Test User", turn: "w" as const };

    // Add a user
    addUser(user);

    // Remove the user
    removeUser("Test User");

    // Check the user was removed
    const gameState = store.getState().game;
    expect(gameState.users).not.toContainEqual(user);
  });
});

describe("useStoreSync", () => {
  let store: ReturnType<typeof createGameStore>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock fetch
    mockFetch.mockReset();

    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        state: JSON.stringify({
          version: 0,
          state: {
            game: {
              fen: "test-fen",
              turn: "b",
              users: [{ name: "Test User", turn: "w" }],
              history: [],
              isCheck: false,
              isCheckmate: false,
              isStalemate: false,
              isDraw: false,
              isGameOver: false,
            },
          },
        }),
      }),
    });

    // Create a new store
    store = createGameStore(1);

    // Mock store.getState().set
    store.getState().set = jest.fn();

    // Mock timers for testing intervals
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("fetches and syncs store on initial render", async () => {
    // Render the hook
    renderHook(() => useStoreSync(1, store));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Check fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/game/test-id?name=game-test-id",
    );

    // Check store.set was called with the data from API
    expect(store.getState().set).toHaveBeenCalled();
  });

  test("polls for updates at regular intervals", async () => {
    // Render the hook
    renderHook(() => useStoreSync(1, store));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Initial fetch call
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Fast-forward time to trigger interval
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have made a second fetch call
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Fast-forward again
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have made a third fetch call
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test("handles API errors gracefully", async () => {
    // Mock a failed API response
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the hook
    renderHook(() => useStoreSync(1, store));

    // Wait for initial fetch to fail
    await act(async () => {
      await Promise.resolve();
    });

    // Should log the error
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("cleans up interval on unmount", () => {
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    // Render the hook
    const { unmount } = renderHook(() => useStoreSync(1, store));

    // Unmount to trigger cleanup
    unmount();

    // Should clear the interval
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  test("exposes a sync function to manually trigger synchronization", async () => {
    // Render the hook
    const { result } = renderHook(() => useStoreSync(1, store));

    // Clear previous fetch calls
    mockFetch.mockClear();

    // Manually trigger sync
    await act(async () => {
      result.current.sync();
      await Promise.resolve();
    });

    // Should make a fetch call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("handles non-OK API responses", async () => {
    // Mock a non-OK API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the hook
    renderHook(() => useStoreSync(1, store));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Should log the error
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("handles unsupported version", async () => {
    // Mock a response with unsupported version
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        state: JSON.stringify({
          version: 1, // Unsupported version
          state: {
            game: {},
          },
        }),
      }),
    });

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    // Render the hook
    renderHook(() => useStoreSync(1, store));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Should log the error
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

