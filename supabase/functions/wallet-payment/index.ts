import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Lets a customer pay part or all of what's still owed on a job card
// straight out of their SNDK wallet, self-service — no staff action needed,
// unlike the manual cash/transfer methods which only set a 'pending' status
// for staff to confirm later. Mirrors the service-role/env-secret pattern
// already used by paypal-payment/index.ts in this same project.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

// Same waterfall as paypal-payment's computeAmountDueQAR, but split out per
// type so a wallet payment that only covers one of parts/labor/towing still
// reports accurate remaining figures for the others afterward.
function computeDueBreakdown(order: any) {
  const payments: any[] = order.payments || [];

  const towingPaidSoFar = payments
    .filter((p) => p.purpose === "towing")
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const pickupDue = order.pickup_method === "flatbed" ? Number(order.flatbed_price || 0) : 0;
  const returnDue = order.return_pickup_method === "flatbed" ? Number(order.return_flatbed_price || 0) : 0;
  const towingRemaining = Math.max(pickupDue + returnDue - towingPaidSoFar, 0);

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

  // A pending overpayment_credit wallet row is real money already paid
  // (see loadOwnedOrder) — must count here too, same as paypal-payment.
  const pendingExcessForGating = ((order.wallet_transactions || []) as any[])
    .filter((w) => w.type === "overpayment_credit" && w.status === "pending")
    .reduce((s: number, w: any) => s + Number(w.amount || 0), 0);
  const paidSoFar = payments
    .filter((p) => p.purpose !== "towing")
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0) + pendingExcessForGating;

  const partsRemaining = Math.max(partsTotal - paidSoFar, 0);
  const paidTowardLabor = Math.max(paidSoFar - partsTotal, 0);
  const laborRemaining = Math.max(laborTotal - paidTowardLabor, 0);

  return { partsRemaining, laborRemaining, towingRemaining, partsTotal, laborTotal };
}

function amountDueForTypes(breakdown: ReturnType<typeof computeDueBreakdown>, types: string[]): number {
  let amount = 0;
  if (types.includes("towing")) amount += breakdown.towingRemaining;
  if (types.includes("parts")) amount += breakdown.partsRemaining;
  if (types.includes("labor")) amount += breakdown.laborRemaining;
  return amount;
}

// Confirms the caller actually owns this order (order -> appointment ->
// profile_id) server-side, where it can't be bypassed — identical to
// paypal-payment/index.ts's loadOwnedOrder.
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

  const { data: walletTxns } = await adminClient
    .from("wallet_transactions")
    .select("amount, type, status")
    .eq("order_id", orderId)
    .eq("type", "overpayment_credit")
    .eq("status", "pending");
  order.wallet_transactions = walletTxns || [];

  return { order, profileId: appt.profile_id, jobNumber: appt.job_cards?.job_number };
}

// Best-effort — a notification failure must never fail the payment response
// itself (the money has already moved by the time this is called).
function notifyPaymentReceived(profileId: string, jobNumber: string | undefined, amountQAR: number, isTowing: boolean) {
  const methodAr = isTowing ? "رسوم الساطحة (المحفظة)" : "المحفظة";
  const methodEn = isTowing ? "Flatbed Fee (Wallet)" : "Wallet";
  adminClient.functions.invoke("clever-endpoint", {
    body: { event: "payment_receipt", customerId: profileId, jobNumber, amountQAR, methodAr, methodEn },
  }).catch(() => {});
  adminClient.from("profiles").select("full_name").eq("id", profileId).maybeSingle().then(({ data }) => {
    adminClient.functions.invoke("clever-endpoint", {
      body: { event: "payment_received", jobNumber, customerName: data?.full_name, amountQAR, methodAr, methodEn },
    }).catch(() => {});
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const { orderId, types, amount } = await req.json();
    if (!orderId || !Array.isArray(types) || !types.length) {
      return jsonResponse({ error: "Missing orderId/types" }, 400);
    }
    const requestedAmount = Math.round(Number(amount) * 1000) / 1000;
    if (!requestedAmount || requestedAmount <= 0) {
      return jsonResponse({ error: "Invalid amount" }, 400);
    }

    const { order, profileId, jobNumber, error: ownErr } = await loadOwnedOrder(userClient, orderId);
    if (ownErr) return ownErr;

    const breakdown = computeDueBreakdown(order);
    const due = amountDueForTypes(breakdown, types);
    if (due <= 0.001) return jsonResponse({ error: "Nothing outstanding to pay" }, 400);

    if (requestedAmount > due + 0.001) {
      return jsonResponse({ error: "Amount exceeds what is still owed" }, 400);
    }
    const isTowing = types.includes("towing");
    const purpose = isTowing ? "towing" : "service";

    // The balance check and both inserts (payments + the debit itself) all
    // happen atomically inside pay_order_from_wallet, under a per-customer
    // advisory lock — reading the balance here first and inserting after
    // was a classic read-then-write race: two concurrent requests (two
    // tabs, a retried request) could both read the same pre-debit balance,
    // both pass the check, and both debit, pushing the wallet negative.
    const { data: rpcRows, error: payErr } = await adminClient.rpc("pay_order_from_wallet", {
      p_profile_id: profileId,
      p_order_id: orderId,
      p_requested_amount: Math.min(requestedAmount, due),
      p_purpose: purpose,
    });
    if (payErr || !rpcRows?.[0]) {
      if (payErr?.message?.includes("insufficient_wallet_balance")) {
        return jsonResponse({ error: "Insufficient wallet balance" }, 400);
      }
      return jsonResponse({ error: `Payment failed: ${payErr?.message || "unknown error"}` }, 500);
    }
    const appliedAmount = Number(rpcRows[0].applied_amount);

    // Parts-then-labor waterfall, same priority order as the admin app's
    // addPayment — only flips a status to 'paid' once that type's remaining
    // balance is actually fully covered by this payment.
    let remainingToApply = appliedAmount;
    let partsCovered = 0, laborCovered = 0;
    if (types.includes("parts")) {
      partsCovered = Math.min(remainingToApply, breakdown.partsRemaining);
      remainingToApply -= partsCovered;
    }
    if (types.includes("labor")) {
      laborCovered = Math.min(remainingToApply, breakdown.laborRemaining);
      remainingToApply -= laborCovered;
    }
    const statusUpdates: Record<string, string> = {};
    if (types.includes("parts") && breakdown.partsTotal > 0 && breakdown.partsRemaining - partsCovered <= 0.001) {
      statusUpdates.parts_payment_status = "paid";
    }
    if (types.includes("labor") && breakdown.laborTotal > 0 && breakdown.laborRemaining - laborCovered <= 0.001) {
      statusUpdates.labor_payment_status = "paid";
    }
    if (Object.keys(statusUpdates).length) {
      await adminClient.from("orders").update(statusUpdates).eq("id", orderId);
    }

    notifyPaymentReceived(profileId, jobNumber, appliedAmount, isTowing);

    return jsonResponse({
      success: true,
      amountQAR: appliedAmount,
      remainingQAR: Math.max(due - appliedAmount, 0),
    });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
