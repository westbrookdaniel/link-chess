import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Chess } from "chess.js";
import { createNetworkStorage } from "./networkStorage";
import { useEffect, useCallback } from "react";

interface HistoryState {
  by: "w" | "b";
  from: string;
  to: string;
  prevFen: string;
  at: string; // ISO Timestamp
}

interface User {
  name: string;
  turn: "w" | "b" | "s"; // s for spectator
}

export interface GameState {
  users: User[];
  turn: "w" | "b";
  fen: string;
  history: HistoryState[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
}

export interface GameStore {
  game: GameState;
  makeMove: (from: string, to: string, promotion?: string) => boolean;
  resetGame: () => void;
  loadGame: (fen: string) => void;
  undoMove: () => void;
  set: (state: Partial<GameStore>) => void;
  addUser: (user: User) => void;
  removeUser: (name: string) => void;
}

const initialGame: GameState = {
  users: [],
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  turn: "w",
  history: [],
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,
  isGameOver: false,
};

export const createGameStore = (id: number) =>
  create<GameStore>()(
    persist(
      (set, get) => {
        return {
          set,

          game: initialGame,

          makeMove: (from, to, promotion) => {
            const prev = get().game;
            const prevFen = prev.fen;

            const chess = new Chess(prevFen);

            try {
              const move = chess.move({ from, to, promotion });

              if (move) {
                set({
                  game: {
                    users: [],
                    fen: chess.fen(),
                    history: [
                      ...prev.history,
                      {
                        by: prev.turn,
                        from,
                        to,
                        prevFen,
                        at: new Date().toISOString(),
                      },
                    ],
                    turn: prev.turn === "w" ? "b" : "w",
                    isCheck: chess.inCheck(),
                    isCheckmate: chess.isCheckmate(),
                    isStalemate: chess.isStalemate(),
                    isDraw: chess.isDraw(),
                    isGameOver: chess.isGameOver(),
                  },
                });
                return true;
              }
              return false;
            } catch (error) {
              console.error("Invalid move:", error);
              return false;
            }
          },

          resetGame: () => {
            set({
              game: {
                ...initialGame,
                users: get().game.users,
              },
            });
          },

          loadGame: (fen) => {
            try {
              const prev = get().game;
              const chess = new Chess(fen);
              set({
                game: {
                  users: [],
                  fen,
                  history: [],
                  turn: prev.turn === "w" ? "b" : "w",
                  isCheck: chess.inCheck(),
                  isCheckmate: chess.isCheckmate(),
                  isStalemate: chess.isStalemate(),
                  isDraw: chess.isDraw(),
                  isGameOver: chess.isGameOver(),
                },
              });
            } catch (error) {
              console.error("Invalid FEN:", error);
            }
          },

          undoMove: () => {
            const prev = get().game;
            if (prev.history.length === 0) return;

            const newHistory = [...prev.history];
            const last = newHistory.pop();

            if (!last) throw new Error("Invalid undo");

            const chess = new Chess(last.prevFen);

            set({
              game: {
                users: [],
                fen: last.prevFen,
                turn: prev.turn === "w" ? "b" : "w",
                history: newHistory,
                isCheck: chess.inCheck(),
                isCheckmate: chess.isCheckmate(),
                isStalemate: chess.isStalemate(),
                isDraw: chess.isDraw(),
                isGameOver: chess.isGameOver(),
              },
            });
          },

          addUser: (user: User) => {
            const prev = get().game;
            const existingUserIndex = prev.users.findIndex(
              (u) => u.name === user.name,
            );

            const updatedUsers = [...prev.users];

            if (existingUserIndex >= 0) {
              updatedUsers[existingUserIndex] = user;
            } else {
              updatedUsers.push(user);
            }

            set({ game: { ...prev, users: updatedUsers } });
          },

          removeUser: (name: string) => {
            const prev = get().game;
            const updatedUsers = prev.users.filter(
              (user) => user.name !== name,
            );

            set({ game: { ...prev, users: updatedUsers } });
          },
        };
      },
      {
        name: `game-${id}`,
        storage: createJSONStorage(() => createNetworkStorage(id)),
      },
    ),
  );

// Poll /api/game/${id}?name=game-${id} and set back
// into store (what createNetworkStorage uses)
// should really be websockets but want to keep deployment simple
export function useStoreSync(
  id: number,
  store: ReturnType<typeof createGameStore>,
) {
  const fetchAndSyncStore = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/${id}?name=game-${id}`);

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.state) {
        const s = JSON.parse(data.state);
        if (s.version !== 0) throw new Error("Unhandled version");
        store.getState().set({ game: s.state.game });
      }
    } catch (error) {
      console.error("Error syncing store:", error);
    }
  }, [id, store]);

  useEffect(() => {
    // Initial sync
    fetchAndSyncStore();

    // Set up polling interval (every 2 seconds)
    const intervalId = setInterval(fetchAndSyncStore, 2000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [fetchAndSyncStore, id, store]);

  return {
    sync: fetchAndSyncStore,
  };
}
