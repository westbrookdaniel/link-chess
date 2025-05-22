import { db } from "@/db";
import { LinkForm } from "./form";
import bcrypt from "bcryptjs";
import { gamesTable } from "@/db/schema";
import { customAlphabet } from "nanoid";
import { eq } from "drizzle-orm";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Link Chess</h1>
      <p className="mb-16 text-muted-foreground">
        Create a shared chess board, accessible by a link
      </p>
      <LinkForm
        onSubmitAction={async ({ password }) => {
          "use server";

          try {
            const hashedPassword = password
              ? await bcrypt.hash(password, 10)
              : null;

            // Custom nanoid function with a shorter alphabet (avoiding similar characters)
            const nanoid = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 6);
            let slug: string | null = null;

            // Check if slug already exists in the database
            while (true) {
              slug = nanoid();

              const existingGame = await db.query.gamesTable.findFirst({
                where: eq(gamesTable.slug, slug),
              });

              if (!existingGame) break;
            }

            const [data] = await db
              .insert(gamesTable)
              .values({
                password: hashedPassword,
                data: null,
                slug,
              })
              .returning();

            return { data };
          } catch (error) {
            console.error("Error creating game:", error);
            return { error: "Failed to create game. Please try again." };
          }
        }}
      />
    </div>
  );
}
