import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

// Proves the caller is using a service-role (or higher) credential WITHOUT
// comparing against a specific secret string — this project currently has
// two simultaneously-valid representations of "the service role" (a legacy
// long-JWT key, and a newer sb_secret_... key from Supabase's API-key
// migration), and Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") can reflect
// either one depending on platform state, so a plain string match is
// fragile and breaks across any future key rotation/format change.
//
// Asks Postgres directly which role the caller's credential resolved to
// (via the public.whoami() SQL function, itself just `current_setting
// ('role')`) rather than inferring it from a data-access side effect — an
// earlier version of this probed SELECT on the `payments` table and
// treated "no error" as proof, but RLS silently returns an EMPTY result
// for an unauthorized SELECT rather than an error, so that version wrongly
// accepted literally any caller, anon key included.
export async function isServiceRoleCaller(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  try {
    const probe = createClient(SUPABASE_URL, token);
    const { data, error } = await probe.rpc("whoami");
    return !error && data === "service_role";
  } catch {
    return false;
  }
}
