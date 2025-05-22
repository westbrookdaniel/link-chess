import { Game } from "@/app/Game";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { gamesTable } from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import Link from "next/link";
import { PasswordForm } from "./passwordForm";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const game = await db.query.gamesTable.findFirst({
    where: eq(gamesTable.slug, slug),
  });

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold mb-2">Game Not Found</h1>
        <p className="mb-8">
          {`Sorry, we couldn't find the game you're looking for.`}
        </p>
        <Button asChild>
          <Link href="/">Back Home</Link>
        </Button>
      </div>
    );
  }

  if (game.password) {
    async function onSubmitAction({ password }: { password: string }) {
      "use server";

      if (!password) {
        return { error: "Password is required" };
      }

      const game = await db.query.gamesTable.findFirst({
        where: eq(gamesTable.slug, slug),
      });

      if (!game || !game.password) {
        return { error: "Game not found or password not required" };
      }

      const passwordMatches = await bcrypt.compare(password, game.password);

      if (!passwordMatches) {
        return { error: "Invalid password" };
      }

      const cookieJar = await cookies();

      cookieJar.set(`game-${slug}-password`, password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
      });

      return { success: true };
    }

    const cookieJar = await cookies();
    const gamePassword = cookieJar.get(`game-${slug}-password`)?.value;

    if (!gamePassword) {
      return <PasswordForm onSubmitAction={onSubmitAction} />;
    }

    const passwordMatches = await bcrypt.compare(gamePassword, game.password);

    if (!passwordMatches) {
      return (
        <PasswordForm
          error="Invalid password"
          onSubmitAction={onSubmitAction}
        />
      );
    }
  }

  return <Game id={game.id} />;
}
