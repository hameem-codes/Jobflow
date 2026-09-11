import { pgTable, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { applications } from "./applications.js";

export const interviewRounds = pgTable("interview_rounds", {
  id: varchar("id", { length: 255 }).primaryKey(),
  applicationId: varchar("application_id", { length: 255 }).notNull().references(() => applications.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }).notNull(),
  date: timestamp("date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("interview_rounds_application_id_idx").on(t.applicationId),
]);
