import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { adminClient, hmacBase64, loadSkipCashBase } from "../_shared/skipcash.ts";

// SkipCash checkout for job-card parts/labor/towing payments — a hosted
// redirect flow (not an SDK popup like paypal-payment), so this function
// only ever creates the payment and hands back a payUrl to redirect to.
// Unlike paypal-payment, there's no "capture" call here — the customer
// completes payment on SkipCash's own hosted page, and the *only* place the
// payments row actually gets inserted is skipcash-webhook (see
// _shared/skipcash.ts's recordPaymentIfNew), once SkipCash confirms the
// charge server-to-server. The client never has to be trusted to report
// back that it succeeded.
const SKIPCASH_KEY_ID = Deno.env.get("SKIPCASH_KEY_ID")!;
const SKIPCASH_KEY_SECRET = Deno.env.get("SKIPCASH_KEY_SECRET")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

// Same waterfall as paypal-payment's computeAmountDueQAR — SkipCash settles
// in QAR directly, so unlike PayPal there's no USD conversion step here.
function computeAmountDueQAR(order: any, types: string[]): number {
  const payments: any[] = order.payments || [];

  if (types.includes("towing")) {
    const towingPaidSoFar = payments
      .filter((p) => p.purpose === "towing")
      .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
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

// Confirms the caller actually owns this order — identical pattern to
// paypal-payment.ts's loadOwnedOrder, plus the customer contact fields
// SkipCash's create-payment call requires (name/phone/email).
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
    .select("profile_id, job_cards(job_number), profiles(full_name, phone_number, email)")
    .eq("id", order.appointment_id)
    .maybeSingle();
  if (!appt || appt.profile_id !== user.id) {
    return { error: jsonResponse({ error: "Not authorized for this order" }, 403) };
  }

  const { data: walletTxns } = await adminClient
    .from("wallet_transactions")
    .select("amount, type, status")
    .eq("order_id", orderId)
    .eq("type", "overpayment_credit")
    .eq("status", "pending");
  order.wallet_transactions = walletTxns || [];

  return { order, profileId: appt.profile_id, jobNumber: appt.job_cards?.job_number, profile: appt.profiles };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const { orderId, types, returnUrl } = await req.json();
    if (!orderId || !Array.isArray(types) || !types.length) {
      return jsonResponse({ error: "Missing orderId/types" }, 400);
    }
    if (!returnUrl) return jsonResponse({ error: "Missing returnUrl" }, 400);

    const { order, jobNumber, profile, error: ownErr } = await loadOwnedOrder(userClient, orderId);
    if (ownErr) return ownErr;

    const baseRes = await loadSkipCashBase();
    if ("error" in baseRes) return jsonResponse({ error: "SkipCash is not configured" }, 500);
    const { base } = baseRes;

    const amountQAR = computeAmountDueQAR(order, types);
    if (amountQAR <= 0.01) return jsonResponse({ error: "Nothing outstanding to pay" }, 400);

    const fullName = (profile?.full_name || "Customer").trim().replace(/,/g, " ");
    const spaceIdx = fullName.indexOf(" ");
    const firstName = (spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName).slice(0, 60) || "Customer";
    const lastName = (spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "Customer").slice(0, 60).replace(/,/g, " ") || "Customer";
    const phone = (profile?.phone_number || "").replace(/,/g, "").slice(0, 15);
    const email = (profile?.email || `${phone || "customer"}@sndkqa.com`).replace(/,/g, "").slice(0, 255);

    const paymentDetails: Record<string, string> = {
      Uid: crypto.randomUUID(),
      KeyId: SKIPCASH_KEY_ID,
      Amount: amountQAR.toFixed(2),
      FirstName: firstName,
      LastName: lastName,
      Phone: phone,
      Email: email,
      TransactionId: `${orderId.slice(0, 20)}-${Date.now()}`.slice(0, 40),
      Custom1: orderId,
      Custom2: types.map((t: string) => TYPE_TO_ITEM_TYPE[t] || t).join("+"),
    };

    // Signature covers only the fields the docs list as signable, in their
    // fixed order — Custom2 isn't one of them, so it's in the body but not
    // in combinedData (same reasoning as paypal-payment's custom_id).
    const combinedData = [
      `Uid=${paymentDetails.Uid}`, `KeyId=${paymentDetails.KeyId}`, `Amount=${paymentDetails.Amount}`,
      `FirstName=${paymentDetails.FirstName}`, `LastName=${paymentDetails.LastName}`,
      `Phone=${paymentDetails.Phone}`, `Email=${paymentDetails.Email}`,
      `TransactionId=${paymentDetails.TransactionId}`, `Custom1=${paymentDetails.Custom1}`,
    ].join(",");
    const signature = await hmacBase64(combinedData, SKIPCASH_KEY_SECRET);

    const resp = await fetch(`${base}/api/v1/payments`, {
      method: "POST",
      headers: { Authorization: signature, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...paymentDetails,
        WebhookUrl: `${SUPABASE_URL}/functions/v1/skipcash-webhook`,
        ReturnUrl: returnUrl,
        Subject: "SNDK Qatar",
        Description: `SNDK Qatar — ${jobNumber || orderId}`,
      }),
    });
    const json = await resp.json();
    if (!resp.ok || json.hasError || !json.resultObj?.payUrl) {
      return jsonResponse({ error: `SkipCash payment creation failed: ${JSON.stringify(json)}` }, 502);
    }
    return jsonResponse({ payUrl: json.resultObj.payUrl, amountQAR });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
