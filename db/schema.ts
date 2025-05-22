import {
  varchar,
  integer,
  pgTable,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const gamesTable = pgTable("games", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  data: jsonb("data"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  password: varchar("password", { length: 255 }), // optional
});

export type Game = typeof gamesTable.$inferSelect;
