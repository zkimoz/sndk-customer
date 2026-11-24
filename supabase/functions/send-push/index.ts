import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToUser } from "../_shared/push.ts";
import { isServiceRoleCaller } from "../_shared/auth.ts";

// Direct-trigger endpoint (sndk-admin calls this itself for status_changed/
// quotation_sent) — the actual FCM/web-push mechanics now live in
// _shared/push.ts, shared with notify-staff's own automatic push alongside
// every customer email.
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  SUPABASE_SERVICE_ROLE_KEY,
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" },
    });
  }

  // This sends a push "from SNDK" to an arbitrary user_id with attacker-chosen
  // title/body/url — only sndk-admin (which calls via its service-role client)
  // may trigger it, or any logged-in customer could spoof a push at any other
  // customer (phishing). The default JWT gateway check only proves "some valid
  // session", not "this caller is staff", so that check alone isn't enough.
  if (!(await isServiceRoleCaller(req))) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const { user_id, title, body, url } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400 });

    const result = await sendPushToUser(supabase, user_id, title, body, url);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
