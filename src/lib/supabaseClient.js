import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Doesn't throw — the app is built to degrade gracefully (falls back
  // to each section's local default content) so a missing/misconfigured
  // env var never produces a blank white screen for visitors.
  console.error(
    "VIINA: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. " +
      "Add them to your .env file locally, and to your Netlify site's " +
      "Environment variables in production. See README.md."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
