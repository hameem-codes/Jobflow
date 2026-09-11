import { pgTable, text, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const starStories = pgTable("star_stories", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  situation: text("situation"),
  task: text("task"),
  action: text("action"),
  result: text("result"),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("star_stories_user_id_idx").on(t.userId),
]);
