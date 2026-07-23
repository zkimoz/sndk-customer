import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// PayPal checkout for the independent spare-parts request system
// (part_orders/part_order_payments) — deliberately separate from
// paypal-payment/index.ts (job-card parts/labor payments) so a bug in this
// newer, unproven flow can never touch the already-hardened job-card
// payment path. Mirrors that function's structure closely, just simpler:
// one price per request instead of a parts-then-labor waterfall.
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Same fixed peg used by paypal-payment/index.ts — QAR never floats against
// USD, so there's no live FX call.
const QAR_PER_USD = 3.64;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-client",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

// Recomputes what's owed server-side from the staff-set price, never a
// client-supplied amount.
function computeAmountDueQAR(partOrder: any): number {
  const paidSoFar = (partOrder.part_order_payments || [])
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  return Math.max(Number(partOrder.quoted_sell_price || 0) - paidSoFar, 0);
}

async function getPaypalAccessToken(base: string, clientId: string): Promise<string> {
  const resp = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${PAYPAL_CLIENT_SECRET}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`PayPal auth failed: ${JSON.stringify(json)}`);
  return json.access_token;
}

// part_orders.profile_id is direct (no appointments join needed, unlike
// orders -> appointments -> profile_id).
async function loadOwnedPartOrder(userClient: any, partOrderId: string) {
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { error: jsonResponse({ error: "Not authenticated" }, 401) };

  const { data: partOrder } = await adminClient
    .from("part_orders")
    .select("id, profile_id, request_number, quoted_sell_price, part_order_payments(amount)")
    .eq("id", partOrderId)
    .maybeSingle();
  if (!partOrder) return { error: jsonResponse({ error: "Request not found" }, 404) };
  if (partOrder.profile_id !== user.id) {
    return { error: jsonResponse({ error: "Not authorized for this request" }, 403) };
  }

  return { partOrder, profileId: partOrder.profile_id };
}

// Best-effort — a notification failure must never fail the payment response
// itself (the money has already moved by the time this is called).
function notifyPaymentReceived(profileId: string, requestNumber: string, amountQAR: number) {
  adminClient.from("profiles").select("full_name").eq("id", profileId).maybeSingle().then(({ data }) => {
    adminClient.functions.invoke("clever-endpoint", {
      body: {
        event: "part_order_payment_received",
        requestNumber,
        customerName: data?.full_name,
        amountQAR,
        methodAr: "باي بال",
        methodEn: "PayPal",
      },
    }).catch(() => {});
  });
}

async function loadPaypalConfig() {
  const { data: pm } = await adminClient
    .from("payment_methods")
    .select("client_id, is_sandbox")
    .eq("key", "paypal")
    .maybeSingle();
  if (!pm?.client_id) return { error: jsonResponse({ error: "PayPal is not configured" }, 500) };
  const base = pm.is_sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
  return { clientId: pm.client_id, base };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const { action, partOrderId, paypalOrderId } = await req.json();
    if (!partOrderId) {
      return jsonResponse({ error: "Missing partOrderId" }, 400);
    }

    const { partOrder, profileId, error: ownErr } = await loadOwnedPartOrder(userClient, partOrderId);
    if (ownErr) return ownErr;

    const { clientId, base, error: cfgErr } = await loadPaypalConfig();
    if (cfgErr) return cfgErr;

    if (action === "create") {
      const amountQAR = computeAmountDueQAR(partOrder);
      if (amountQAR <= 0.01) return jsonResponse({ error: "Nothing outstanding to pay" }, 400);
      const amountUSD = Math.round((amountQAR / QAR_PER_USD) * 100) / 100;

      const token = await getPaypalAccessToken(base, clientId);
      const resp = await fetch(`${base}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            custom_id: partOrderId,
            description: `SNDK Qatar — Spare Part Request #${partOrder.request_number}`,
            amount: { currency_code: "USD", value: amountUSD.toFixed(2) },
          }],
        }),
      });
      const json = await resp.json();
      if (!resp.ok) return jsonResponse({ error: `PayPal order creation failed: ${JSON.stringify(json)}` }, 502);
      return jsonResponse({ id: json.id, amountUSD, amountQAR });
    }

    if (action === "capture") {
      if (!paypalOrderId) return jsonResponse({ error: "Missing paypalOrderId" }, 400);

      const token = await getPaypalAccessToken(base, clientId);
      const resp = await fetch(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await resp.json();
      if (!resp.ok || json.status !== "COMPLETED") {
        return jsonResponse({ error: `PayPal capture failed: ${JSON.stringify(json)}` }, 502);
      }

      const capture = json.purchase_units?.[0]?.payments?.captures?.[0];
      if (!capture || capture.custom_id !== partOrderId) {
        return jsonResponse({ error: "Captured order does not match requested order" }, 502);
      }
      const capturedUSD = Number(capture.amount?.value || 0);
      const amountQAR = Math.round(capturedUSD * QAR_PER_USD * 1000) / 1000;

      const { error: insErr } = await adminClient.from("part_order_payments").insert({
        part_order_id: partOrderId,
        amount: amountQAR,
        method: "paypal",
        recorded_by: null,
      });
      if (insErr) return jsonResponse({ error: `Payment captured but failed to record: ${insErr.message}` }, 500);

      await adminClient.from("part_orders").update({
        status: "paid",
        payment_status: "paid",
        payment_method: "paypal",
        updated_at: new Date().toISOString(),
      }).eq("id", partOrderId);

      notifyPaymentReceived(profileId!, partOrder.request_number, amountQAR);
      return jsonResponse({ success: true, amountQAR });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
