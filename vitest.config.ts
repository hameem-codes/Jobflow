import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["server/src/tests/**/*.test.ts"],
    env: {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "https://test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "test-token",
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
});
