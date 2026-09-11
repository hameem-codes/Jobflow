import { pgTable, text, timestamp, varchar, integer, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  company: varchar("company", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  remote: varchar("remote", { length: 50 }),
  experience: varchar("experience", { length: 50 }),
  salary: integer("salary"),
  url: text("url"),
  skills: jsonb("skills").$type<string[]>(),
  source: varchar("source", { length: 255 }),
  externalId: varchar("external_id", { length: 255 }),
  saved: boolean("saved").default(false),
  custom: boolean("custom").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("jobs_source_external_id_idx").on(t.source, t.externalId)
]);
