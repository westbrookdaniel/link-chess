/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { Game } from "./Game";
import { createGameStore } from "./store";

jest.mock("react-chessboard", () => ({
  Chessboard: () => <div data-testid="chessboard">Chess Board</div>,
}));

jest.mock("./store", () => ({
  createGameStore: jest.fn().mockImplementation(() => ({})),
  useStoreSync: jest.fn().mockReturnValue({ sync: jest.fn() }),
}));

describe("Game Component", () => {
  const mockStore = {
    game: {
      fen: "test-fen",
      turn: "w",
      isGameOver: false,
      isCheckmate: false,
      isStalemate: false,
      isDraw: false,
      isCheck: false,
      history: [],
      users: [],
    },
    makeMove: jest.fn().mockReturnValue(true),
    resetGame: jest.fn(),
    undoMove: jest.fn(),
    addUser: jest.fn(),
    removeUser: jest.fn(),
  };

  function createMockStore(store: any) {
    const fn = () => store;
    return fn;
  }

  beforeEach(() => {
    jest.clearAllMocks();

    (createGameStore as jest.Mock).mockImplementation(() =>
      createMockStore(mockStore),
    );
  });

  test("renders game board and turn information", () => {
    render(<Game id={1} />);

    expect(screen.getByTestId("chessboard")).toBeInTheDocument();
    expect(screen.getByText("White's Turn")).toBeInTheDocument();
    expect(screen.getByText("Turn 1")).toBeInTheDocument();
  });

  test("renders black turn correctly", () => {
    const blackTurnStore = {
      ...mockStore,
      game: {
        ...mockStore.game,
        turn: "b",
      },
    };

    (createGameStore as jest.Mock).mockImplementation(() =>
      createMockStore(blackTurnStore),
    );

    render(<Game id={1} />);

    expect(screen.getByText("Black's Turn")).toBeInTheDocument();
  });

  test("displays check status", () => {
    const checkStore = {
      ...mockStore,
      game: {
        ...mockStore.game,
        isCheck: true,
      },
    };

    (createGameStore as jest.Mock).mockImplementation(() =>
      createMockStore(checkStore),
    );

    render(<Game id={1} />);

    expect(screen.getByText(/Check!/)).toBeInTheDocument();
  });

  test("displays game over states", () => {
    const checkmateStore = {
      ...mockStore,
      game: {
        ...mockStore.game,
        isGameOver: true,
        isCheckmate: true,
      },
    };

    (createGameStore as jest.Mock).mockImplementation(() =>
      createMockStore(checkmateStore),
    );

    render(<Game id={1} />);

    expect(screen.getByText(/Checkmate!/)).toBeInTheDocument();
  });

  test("disables buttons when history is empty", () => {
    render(<Game id={1} />);

    const resetButton = screen.getByRole("button", { name: "Reset" });
    const undoButton = screen.getByRole("button", { name: "Undo Move" });

    expect(resetButton).toBeDisabled();
    expect(undoButton).toBeDisabled();
  });

  test("enables buttons when history is not empty", () => {
    const storeWithHistory = {
      ...mockStore,
      game: {
        ...mockStore.game,
        history: [
          {
            by: "w",
            from: "e2",
            to: "e4",
            prevFen: "old-fen",
            at: "timestamp",
          },
        ],
      },
    };

    (createGameStore as jest.Mock).mockImplementation(() =>
      createMockStore(storeWithHistory),
    );

    render(<Game id={1} />);

    const resetButton = screen.getByRole("button", { name: "Reset" });
    const undoButton = screen.getByRole("button", { name: "Undo Move" });

    expect(resetButton).not.toBeDisabled();
    expect(undoButton).not.toBeDisabled();
  });

  test("displays users correctly", () => {
    const storeWithUsers = {
      ...mockStore,
      game: {
        ...mockStore.game,
        users: [
          { name: "Player 1", turn: "w" },
          { name: "Player 2", turn: "b" },
          { name: "Spec", turn: "s" },
        ],
      },
    };

    (createGameStore as jest.Mock).mockImplementation(() =>
      createMockStore(storeWithUsers),
    );

    render(<Game id={1} />);

    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
    expect(screen.getByText("Spec")).toBeInTheDocument();

    const badges = screen.getAllByText(/White|Black|Spectator/, {
      selector: "[data-slot=badge]",
    });
    expect(badges.length).toBe(3);
  });

  test("removes a user when X button is clicked", () => {
    const storeWithUsers = {
      ...mockStore,
      game: {
        ...mockStore.game,
        users: [{ name: "Player 1", turn: "w" }],
      },
    };

    (createGameStore as jest.Mock).mockImplementation(() =>
      createMockStore(storeWithUsers),
    );

    render(<Game id={1} />);

    const removeButton = screen.getByRole("button", { name: "" });
    fireEvent.click(removeButton);

    expect(mockStore.removeUser).toHaveBeenCalledWith("Player 1");
  });
});
