import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Standard client for public or authenticated user actions, verification, etc.
// Important: This uses the anonymous key and relies on RLS/JWTs.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Admin client for privileged server-side actions (e.g., managing user identities, robust lookups).
// NEVER expose this to the client or use it for unprivileged operations.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
