import { pgTable, timestamp, varchar, integer, index } from "drizzle-orm/pg-core";
import { applications } from "./applications.js";

export const offers = pgTable("offers", {
  id: varchar("id", { length: 255 }).primaryKey(),
  applicationId: varchar("application_id", { length: 255 }).notNull().references(() => applications.id, { onDelete: "cascade" }),
  baseSalary: integer("base_salary"),
  bonus: integer("bonus"),
  equity: integer("equity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("offers_application_id_idx").on(t.applicationId),
]);
