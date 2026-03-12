import { pgTable, text, serial, integer, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  coins: integer("coins").default(0).notNull(),
  totalWhispersCreated: integer("total_whispers_created").default(0).notNull(),
  totalWhispersDied: integer("total_whispers_died").default(0).notNull(),
  totalReactionsReceived: integer("total_reactions_received").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, coins: true, totalWhispersCreated: true, totalWhispersDied: true, totalReactionsReceived: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const whispersTable = pgTable("whispers", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  lifetime: varchar("lifetime", { length: 5 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: integer("user_id").references(() => usersTable.id),
  reactionFire: integer("reaction_fire").default(0).notNull(),
  reactionHeart: integer("reaction_heart").default(0).notNull(),
  reactionWow: integer("reaction_wow").default(0).notNull(),
});

export const insertWhisperSchema = createInsertSchema(whispersTable).omit({
  id: true, createdAt: true, reactionFire: true, reactionHeart: true, reactionWow: true,
});
export type InsertWhisper = z.infer<typeof insertWhisperSchema>;
export type Whisper = typeof whispersTable.$inferSelect;

export const repliesTable = pgTable("replies", {
  id: serial("id").primaryKey(),
  whisperId: integer("whisper_id").notNull().references(() => whispersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReplySchema = createInsertSchema(repliesTable).omit({ id: true, createdAt: true });
export type InsertReply = z.infer<typeof insertReplySchema>;
export type Reply = typeof repliesTable.$inferSelect;

export const globalStatsTable = pgTable("global_stats", {
  id: integer("id").primaryKey().default(1),
  totalDied: integer("total_died").default(0).notNull(),
  totalCreated: integer("total_created").default(0).notNull(),
});

export type GlobalStats = typeof globalStatsTable.$inferSelect;
