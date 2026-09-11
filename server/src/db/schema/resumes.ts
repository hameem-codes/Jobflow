import { pgTable, text, timestamp, varchar, integer, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const resumes = pgTable("resumes", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  score: integer("score"),
  ats: integer("ats"),
  text: text("text"),
  content: jsonb("content"), // For StructuredResume payload
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("resumes_user_id_idx").on(t.userId),
]);
