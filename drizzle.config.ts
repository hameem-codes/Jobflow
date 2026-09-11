import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Note: Ensure DATABASE_URL is in the environment
export default defineConfig({
  schema: "./server/src/db/schema/*.ts",
  out: "./server/src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://dummy:dummy@localhost:5432/dummy",
  },
});
