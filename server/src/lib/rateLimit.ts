import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "../config/env.js";

// Initialize the Redis client using Upstash Redis Rest URL & Token
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Create a new ratelimiter that allows 10 requests per 60 seconds
export const copilotRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.fixedWindow(10, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});
