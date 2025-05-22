"use client";

import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { createGameStore, useStoreSync } from "./store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Game({ id }: { id: number }) {
  const [useGameStore] = useState(() => createGameStore(id));
  const { game, makeMove, resetGame, undoMove, addUser, removeUser } =
    useGameStore();

  useStoreSync(id, useGameStore);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-16 p-8">
      <div className="flex flex-col xl:flex-row xl:items-stretch gap-16">
        <div className="flex flex-col items-center gap-16">
          <div className="flex flex-col items-center gap-2">
            <p>Turn {game.history.length + 1}</p>
            <h1 className="font-bold text-2xl">
              {game.turn === "w" ? "White" : "Black"}&apos;s Turn
              {game.isGameOver && (
                <>
                  {game.isCheckmate && <span>. Checkmate!</span>}
                  {game.isStalemate && <span>. Stalemate!</span>}
                  {game.isDraw && <span>. Draw!</span>}
                </>
              )}
              {game.isCheck && !game.isGameOver && <span>. Check!</span>}
            </h1>
          </div>

          {/* Currently doesnt replay moves in order but it assumes you aren't playing too quickly */}
          <div className="size-[400px] bg-[#f0d9b5]">
            <Chessboard
              position={game.fen}
              onPieceDrop={(source, target) => {
                return makeMove(source, target);
              }}
              onPromotionPieceSelect={(piece, source, target) => {
                if (!source || !target) return false;
                return makeMove(
                  source,
                  target,
                  piece?.substring(1).toLowerCase(),
                );
              }}
              boardWidth={400}
            />
          </div>
        </div>

        {/* users list and input with select next to it to handle adding users to the list on hover on a user reavles x icon button to remove */}
        <div className="flex flex-col gap-4 w-full max-w-md xl:w-[300px]">
          <div className="flex flex-col gap-2 xl:flex-1 xl:mt-31">
            {!game.users?.length ? (
              <p className="text-center text-muted-foreground xl:my-8 italic">
                Add who is playing or spectating
              </p>
            ) : null}

            {game.users?.map((user) => (
              <div
                key={user.name}
                className="flex justify-between items-center gap-3 group"
              >
                <Badge
                  className="w-[75px]"
                  variant={
                    user.turn === "w"
                      ? "secondary"
                      : user.turn === "b"
                        ? "default"
                        : "outline"
                  }
                >
                  {user.turn === "w"
                    ? "White"
                    : user.turn === "b"
                      ? "Black"
                      : "Spectator"}
                </Badge>
                <span className="flex-1">{user.name}</span>
                <Button
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    removeUser(user.name);
                  }}
                  variant="ghost"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <form
            className="flex xl:flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();

              const form = e.target as HTMLFormElement;
              const data = new FormData(form);
              const name = data.get("name") as string;
              const turn = data.get("turn") as "b" | "w" | "s";

              if (name && turn) {
                addUser({ name, turn });
                // only reset the input, for repeat select adding
                (form.elements.namedItem("name") as HTMLInputElement).value =
                  "";
              }
            }}
          >
            <div className="flex gap-2 w-full">
              <Input name="name" placeholder="Name" />
              <Select name="turn">
                <SelectTrigger className="flex-grow w-full max-w-xs">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="b">Black</SelectItem>
                  <SelectItem value="w">White</SelectItem>
                  <SelectItem value="s">Spectator</SelectItem>
                </SelectContent>
                {/* SelectContent and SelectItems would go here */}
              </Select>
            </div>
            <Button variant="outline" type="submit">
              Add
            </Button>
          </form>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={resetGame}
          disabled={game.history.length === 0}
        >
          Reset
        </Button>
        <Button
          variant="outline"
          onClick={undoMove}
          disabled={game.history.length === 0}
        >
          Undo Move
        </Button>
      </div>
    </div>
  );
}
