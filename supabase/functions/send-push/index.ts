import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendPushToUser } from "../_shared/push.ts";

// Direct-trigger endpoint (sndk-admin calls this itself for status_changed/
// quotation_sent) — the actual FCM/web-push mechanics now live in
// _shared/push.ts, shared with notify-staff's own automatic push alongside
// every customer email.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" },
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
