import { pgTable, text, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { jobs } from "./jobs.js";

export const applications = pgTable("applications", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: varchar("job_id", { length: 255 }).notNull().references(() => jobs.id, { onDelete: "cascade" }),
  stage: varchar("stage", { length: 50 }).notNull(),
  followUp: text("follow_up"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("applications_user_id_idx").on(t.userId),
  index("applications_job_id_idx").on(t.jobId),
]);
