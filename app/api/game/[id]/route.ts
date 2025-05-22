import { db } from "@/db";
import { gamesTable } from "@/db/schema";

import { NextResponse, NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const storeStateSchema = z.object({
  name: z.string(),
  state: z.string(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const gameId = parseInt((await params).id);

    const url = new URL(request.url);
    const name = url.searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Missing name parameter" },
        { status: 400 },
      );
    }

    const game = await db.query.gamesTable.findFirst({
      where: eq(gamesTable.id, gameId),
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (game.data as Record<string, any>) || {};
    const state = data[name] || null;

    return NextResponse.json({ state });
  } catch (error) {
    console.error("Error retrieving game state:", error);
    return NextResponse.json(
      { error: "Failed to retrieve game state" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const gameId = parseInt((await params).id);

    const body = await request.json();
    const { name, state } = storeStateSchema.parse(body);

    const existingGame = await db.query.gamesTable.findFirst({
      where: eq(gamesTable.id, gameId),
    });

    if (!existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentData = (existingGame.data as Record<string, any>) || {};
    const updatedData = { ...currentData, [name]: state };

    await db
      .update(gamesTable)
      .set({ data: updatedData })
      .where(eq(gamesTable.id, gameId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving game state:", error);
    return NextResponse.json(
      { error: "Failed to save game state" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const gameId = parseInt((await params).id);

    const url = new URL(request.url);
    const name = url.searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Missing name parameter" },
        { status: 400 },
      );
    }

    const existingGame = await db.query.gamesTable.findFirst({
      where: eq(gamesTable.id, gameId),
    });

    if (!existingGame) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentData = (existingGame.data as Record<string, any>) || {};
    if (currentData[name] !== undefined) {
      delete currentData[name];

      await db
        .update(gamesTable)
        .set({ data: currentData })
        .where(eq(gamesTable.id, gameId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing game state:", error);
    return NextResponse.json(
      { error: "Failed to remove game state" },
      { status: 500 },
    );
  }
}
