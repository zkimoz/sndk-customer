import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY  = "BI7jNwdDx9eYM2bVIWSytWhDiZcmYI_8HFYc4fqF97vbej-zxPIXfS0nP8mrjQJPzeGcO76tN26vBK8vvg3qPRE";
const VAPID_PRIVATE_KEY = "_UhC-cUnE3HJW02_Y1j7Brw2i-3jYt-ieE4Eb2nihvA";

webpush.setVapidDetails("mailto:karimfahmy255@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("subscription")
      .eq("user_id", user_id);

    if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

    const payload = JSON.stringify({ title, body, url: url || "/" });
    const results = await Promise.allSettled(
      subs.map((row) => webpush.sendNotification(row.subscription, payload))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return new Response(JSON.stringify({ sent }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
