import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Powers the "Copy Link" share link staff can send a customer directly
// (?po=<token> on sndk-customer) — lets them see a spare-parts request's
// price quote (parts, photos, pricing) without logging in first, same
// sensitivity as a PDF quote already sent by email/WhatsApp today. Nothing
// here is reachable through RLS: this does its own exact-token-match
// lookup server-side with the service role, same pattern paypal-parts-
// payment's loadOwnedPartOrder already uses for its own authorization.
// Approving/paying still requires the customer to actually log in — this
// function only ever reads, never writes.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return jsonResponse({ error: "Missing token" }, 400);
    }

    // Exact match only — never a browsable list. A guest with the anon key
    // but no specific token can't enumerate shared requests this way.
    const { data: partOrder } = await adminClient
      .from("part_orders")
      .select(
        "request_number, status, customer_approved_at, approval_signature_data, approval_signed_by, item_decisions, car_snapshot, created_at, part_order_items(id, quoted_sell_price, quantity, admin_image_urls, admin_description, part_snapshot, part_number, source_country, compatible_cars, availability_eta, tracking_number, tracking_stage), part_order_payments(amount)",
      )
      .eq("share_token", token)
      .maybeSingle();

    if (!partOrder) return jsonResponse({ error: "Not found" }, 404);

    return jsonResponse({ partOrder });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
