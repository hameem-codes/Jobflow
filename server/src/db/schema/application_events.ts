import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { applications } from "./applications.js";

export const applicationEvents = pgTable("application_events", {
  id: varchar("id", { length: 255 }).primaryKey(),
  applicationId: varchar("application_id", { length: 255 }).notNull().references(() => applications.id, { onDelete: "cascade" }),
  date: timestamp("date").defaultNow(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
