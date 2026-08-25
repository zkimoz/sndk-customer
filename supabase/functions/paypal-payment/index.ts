import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Real PayPal checkout for job-card parts/labor payments. Mirrors the
// service-role/env-secret pattern already used by notify-staff/index.ts —
// PAYPAL_CLIENT_SECRET lives only here, never in client code or a DB table
// (see payment_methods.secret_env_hint, which is informational-only).
const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// QAR is pegged to USD at a fixed rate by Qatar's central bank (never
// floats) — PayPal doesn't settle in QAR, so every charge is converted at
// this constant instead of calling a live FX API.
const QAR_PER_USD = 3.65;

// PayPal's cut never touches what the customer paid or the order/job-card
// totals — it's purely an internal cost logged to Finance > Expenses so
// profit reporting accounts for it. The real fee (which varies by currency/
// cross-border rules — observed ~3.4% + a fixed $0.30, not a flat rate) comes
// straight from the capture response's seller_receivable_breakdown; this
// flat estimate is only a fallback for the rare case that field is missing.
const PAYPAL_FEE_RATE_FALLBACK = 0.034;

// `types` elements are 'parts'/'labor' (matching the *_payment_method order
// columns), but order_items.item_type is singular 'part'/'labor' — easy to
// mix up, so the mapping is explicit rather than assumed equal.
const TYPE_TO_ITEM_TYPE: Record<string, string> = { parts: "part", labor: "labor" };

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

// Recomputes what's owed entirely from server-trusted data — never accepts
// a client-supplied amount. Mirrors selectedQuotationTotal + the parts-then-
// labor waterfall in sndk-customer/src/App.jsx (MyOrdersView), restricted to
// locked order.service_decisions only: an undecided service is simply
// excluded, same as what a fresh customer page load would show before they
// pick anything this session (there's no live client selection state to
// consult server-side).
function computeAmountDueQAR(order: any, types: string[]): number {
  const payments: any[] = order.payments || [];

  if (types.includes("towing")) {
    const towingPaidSoFar = payments
      .filter((p) => p.purpose === "towing")
      .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    // Outbound + return legs are billed together as one combined towing
    // amount — mirrors App.jsx's PaymentRow/setPayMethodModal for 'towing'.
    const pickupDue = order.pickup_method === "flatbed" ? Number(order.flatbed_price || 0) : 0;
    const returnDue = order.return_pickup_method === "flatbed" ? Number(order.return_flatbed_price || 0) : 0;
    return Math.max(pickupDue + returnDue - towingPaidSoFar, 0);
  }

  const items: any[] = order.order_items || [];
  const decisions = order.service_decisions || {};

  const totalFor = (itemType: string) =>
    items
      .filter((it) => it.item_type === itemType)
      .reduce((sum, it) => {
        const lt = Number(it.sell_price || 0) * Number(it.quantity || 1) *
          (1 - Math.min(Number(it.discount_pct || 0), 100) / 100);
        const key = it.service_name?.group_id || it.service_name?.ar || it.service_name?.en;
        if (!key) return sum + lt;
        return decisions[key] === "approved" ? sum + lt : sum;
      }, 0);

  const partsTotal = totalFor("part");
  const laborTotal = totalFor("labor");
  // Towing payments are tracked separately (purpose:'towing') and must never
  // be mistaken for parts/labor progress in this waterfall.
  // A pending overpayment_credit wallet row (see loadOwnedOrder) is real
  // money the customer already paid — must count here too, or a re-priced
  // quotation could ask PayPal to charge again for it.
  const pendingExcessForGating = ((order.wallet_transactions || []) as any[])
    .filter((w) => w.type === "overpayment_credit" && w.status === "pending")
    .reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
  const paidSoFar = payments
    .filter((p) => p.purpose !== "towing")
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0) + pendingExcessForGating;

  const partsRemaining = Math.max(partsTotal - paidSoFar, 0);
  const paidTowardLabor = Math.max(paidSoFar - partsTotal, 0);
  const laborRemaining = Math.max(laborTotal - paidTowardLabor, 0);

  let amount = 0;
  if (types.includes("parts")) amount += partsRemaining;
  if (types.includes("labor")) amount += laborRemaining;
  return amount;
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

// Confirms the caller actually owns this order (order -> appointment ->
// profile_id), the same defense-in-depth check PaymentMethodModal.confirm()
// does client-side (App.jsx:1548-1557) — done here server-side where it
// can't be bypassed. `user.id` comes from Supabase Auth verifying the
// caller's JWT, never from a client-supplied value.
async function loadOwnedOrder(userClient: any, orderId: string) {
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { error: jsonResponse({ error: "Not authenticated" }, 401) };

  const { data: order } = await adminClient
    .from("orders")
    .select("id, appointment_id, service_decisions, flatbed_price, pickup_method, return_flatbed_price, return_pickup_method, order_items(item_type, sell_price, quantity, discount_pct, service_name), payments(amount, purpose)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: jsonResponse({ error: "Order not found" }, 404) };

  const { data: appt } = await adminClient
    .from("appointments")
    .select("profile_id, job_cards(job_number)")
    .eq("id", order.appointment_id)
    .maybeSingle();
  if (!appt || appt.profile_id !== user.id) {
    return { error: jsonResponse({ error: "Not authorized for this order" }, 403) };
  }

  // A payment taken before all services were added can be sitting as a
  // pending overpayment_credit wallet row — real money the customer already
  // paid (see App.jsx's identical "Paid/Remaining" reconciliation). Attaching
  // it here, in the same shape the client reads, is what lets
  // computeAmountDueQAR below count it too, instead of asking PayPal to
  // charge again for money that's already covered.
  const { data: walletTxns } = await adminClient
    .from("wallet_transactions")
    .select("amount, type, status")
    .eq("order_id", orderId)
    .eq("type", "overpayment_credit")
    .eq("status", "pending");
  order.wallet_transactions = walletTxns || [];

  return { order, profileId: appt.profile_id, jobNumber: appt.job_cards?.job_number };
}

// Best-effort — logging PayPal's cut must never fail the payment response
// itself. Recorded as a plain internal expense (not tied to the order/job
// card in any way the customer or job card totals can see).
function recordPaypalFee(feeQAR: number, jobNumber: string | undefined, amountQAR: number) {
  const fee = Math.round(feeQAR * 1000) / 1000;
  if (fee <= 0) return;
  adminClient.from("admin_expenses").insert({
    item_name: "رسوم باي بال",
    cost: fee,
    note: jobNumber ? `أمر شغل ${jobNumber} — دفعة ${amountQAR.toFixed(3)} ر.ق` : `دفعة ${amountQAR.toFixed(3)} ر.ق`,
    expense_date: new Date().toISOString().slice(0, 10),
    created_by: null,
  }).then(() => {}).catch(() => {});
}

// Best-effort — a notification failure must never fail the payment response
// itself (the money has already moved by the time this is called).
function notifyPaymentReceived(profileId: string, jobNumber: string | undefined, amountQAR: number, isTowing: boolean) {
  const methodAr = isTowing ? "رسوم الساطحة (باي بال)" : "باي بال";
  const methodEn = isTowing ? "Flatbed Fee (PayPal)" : "PayPal";
  adminClient.functions.invoke("clever-endpoint", {
    body: { event: "payment_receipt", customerId: profileId, jobNumber, amountQAR, methodAr, methodEn },
  }).catch(() => {});
  adminClient.from("profiles").select("full_name").eq("id", profileId).maybeSingle().then(({ data }) => {
    adminClient.functions.invoke("clever-endpoint", {
      body: { event: "payment_received", jobNumber, customerName: data?.full_name, amountQAR, methodAr, methodEn },
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

    const { action, orderId, types, paypalOrderId, returnUrl, cancelUrl } = await req.json();
    if (!orderId || !Array.isArray(types) || !types.length) {
      return jsonResponse({ error: "Missing orderId/types" }, 400);
    }

    const { order, profileId, jobNumber, error: ownErr } = await loadOwnedOrder(userClient, orderId);
    if (ownErr) return ownErr;

    const { clientId, base, error: cfgErr } = await loadPaypalConfig();
    if (cfgErr) return cfgErr;

    if (action === "create") {
      const amountQAR = computeAmountDueQAR(order, types);
      if (amountQAR <= 0.01) return jsonResponse({ error: "Nothing outstanding to pay" }, 400);
      const amountUSD = Math.round((amountQAR / QAR_PER_USD) * 100) / 100;

      const token = await getPaypalAccessToken(base, clientId);
      const resp = await fetch(`${base}/v2/checkout/orders`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            custom_id: orderId,
            description: `SNDK Qatar — ${types.map((t: string) => TYPE_TO_ITEM_TYPE[t] || t).join(" + ")}`,
            amount: { currency_code: "USD", value: amountUSD.toFixed(2) },
          }],
          // Only set by the mobile app, which opens the approval link in an
          // in-app browser and needs PayPal to redirect back to a custom URL
          // scheme afterward — the web flow uses the JS SDK's popup instead,
          // which never sends returnUrl/cancelUrl, so this stays a no-op there.
          ...(returnUrl || cancelUrl ? {
            application_context: {
              ...(returnUrl ? { return_url: returnUrl } : {}),
              ...(cancelUrl ? { cancel_url: cancelUrl } : {}),
              user_action: "PAY_NOW",
            },
          } : {}),
        }),
      });
      const json = await resp.json();
      if (!resp.ok) return jsonResponse({ error: `PayPal order creation failed: ${JSON.stringify(json)}` }, 502);
      // approveUrl is only consumed by the mobile app (opened in an in-app
      // browser) — the web JS SDK builds its own popup from `id` alone.
      const approveUrl = json.links?.find((l: any) => l.rel === "approve")?.href;
      return jsonResponse({ id: json.id, amountUSD, amountQAR, approveUrl });
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
      if (!capture || capture.custom_id !== orderId) {
        return jsonResponse({ error: "Captured order does not match requested order" }, 502);
      }
      const capturedUSD = Number(capture.amount?.value || 0);
      const amountQAR = Math.round(capturedUSD * QAR_PER_USD * 1000) / 1000;
      const isTowing = types.includes("towing");

      const { error: insErr } = await adminClient.from("payments").insert({
        order_id: orderId,
        amount: amountQAR,
        method: "paypal",
        recorded_by: null,
        purpose: isTowing ? "towing" : "service",
      });
      if (insErr) return jsonResponse({ error: `Payment captured but failed to record: ${insErr.message}` }, 500);

      // PayPal reports the exact fee it kept on this specific capture — use
      // that instead of estimating, so logged expenses always match what
      // actually left the account (fee % varies by card/currency/country).
      const feeUSD = Number(capture.seller_receivable_breakdown?.paypal_fee?.value);
      const feeQAR = Number.isFinite(feeUSD) && feeUSD > 0
        ? Math.round(feeUSD * QAR_PER_USD * 1000) / 1000
        : Math.round(amountQAR * PAYPAL_FEE_RATE_FALLBACK * 1000) / 1000;

      recordPaypalFee(feeQAR, jobNumber, amountQAR);
      notifyPaymentReceived(profileId!, jobNumber, amountQAR, isTowing);
      return jsonResponse({ success: true, amountQAR });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
