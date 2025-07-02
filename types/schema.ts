import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  stationUuid: text("station_uuid").notNull(),
  stationName: text("station_name").notNull(),
  stationUrl: text("station_url").notNull(),
  country: text("country"),
  genre: text("genre"),
  bitrate: integer("bitrate"),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  stationUuid: true,
  stationName: true,
  stationUrl: true,
  country: true,
  genre: true,
  bitrate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;
