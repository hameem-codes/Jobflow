import { Client } from "@upstash/qstash";
import { env } from "../config/env.js";

// Export a singleton QStash client if token is available
export const qstash = env.QSTASH_TOKEN ? new Client({
  token: env.QSTASH_TOKEN,
}) : null;
