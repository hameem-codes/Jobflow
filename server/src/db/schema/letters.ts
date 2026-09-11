import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { jobs } from "./jobs.js";

export const letters = pgTable("letters", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: varchar("job_id", { length: 255 }).references(() => jobs.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Draft"), // "Draft" | "Final" | "Sent"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
