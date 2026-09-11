import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  APP_ORIGIN: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional().or(z.literal("")),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // ------------------------------------------
  // EXTERNAL SERVICES
  // ------------------------------------------
  ADZUNA_APP_ID: z.string().optional().or(z.literal("")),
  ADZUNA_APP_KEY: z.string().optional().or(z.literal("")),
  JOBSPY_SERVICE_URL: z.string().default("http://127.0.0.1:8000").or(z.literal("")),
  QSTASH_TOKEN: z.string().optional().or(z.literal("")),
  QSTASH_CURRENT_SIGNING_KEY: z.string().optional().or(z.literal("")),
  QSTASH_NEXT_SIGNING_KEY: z.string().optional().or(z.literal("")),
  CRON_SECRET: z.string().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
  // ------------------------------------------
  // GROQ
  // ------------------------------------------
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required for Phase 7"),
  GROQ_MODEL: z.string().default("openai/gpt-oss-120b"),
  // ------------------------------------------
  // SENTRY
  // ------------------------------------------
  SENTRY_DSN: z.string().url().optional().or(z.literal("")),
});

const rawPort = process.env.BACKEND_PORT
  ? process.env.BACKEND_PORT
  : process.env.NODE_ENV === "production"
    ? (process.env.PORT || "3000")
    : (process.env.PORT && process.env.PORT !== "3000" ? process.env.PORT : "5000");

const _env = envSchema.safeParse({
  ...process.env,
  PORT: rawPort,
});

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
