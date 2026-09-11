import { pgTable, timestamp, varchar, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { applications } from "./applications.js";

export const contacts = pgTable("contacts", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: varchar("application_id", { length: 255 }).references(() => applications.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  email: varchar("email", { length: 255 }),
  linkedin: varchar("linkedin", { length: 255 }),
  status: varchar("status", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("contacts_user_id_idx").on(t.userId),
  index("contacts_application_id_idx").on(t.applicationId),
]);
