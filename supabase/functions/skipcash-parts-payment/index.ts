import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { adminClient, hmacBase64, loadSkipCashBase } from "../_shared/skipcash.ts";

// SkipCash checkout for the independent spare-parts request system
// (part_orders/part_order_payments) — deliberately separate from
// skipcash-payment/index.ts (job-card parts/labor/towing payments), same
// reasoning paypal-parts-payment already follows: a bug in this newer flow
// can never touch the already-hardened job-card payment path. Mirrors
// skipcash-payment's structure closely, just simpler: one price per
// request instead of a parts-then-labor waterfall, and no towing split.
const SKIPCASH_KEY_ID = Deno.env.get("SKIPCASH_KEY_ID")!;
const SKIPCASH_KEY_SECRET = Deno.env.get("SKIPCASH_KEY_SECRET")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

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

// Recomputes what's owed server-side from the staff-set prices, never a
// client-supplied amount. Once the customer has signed, only the items
// they actually approved count — same rule paypal-parts-payment already
// enforces for this exact request type.
function computeAmountDueQAR(partOrder: any): number {
  const items: any[] = partOrder.part_order_items || [];
  const decisions = partOrder.item_decisions || {};
  const billable = partOrder.customer_approved_at
    ? items.filter((i) => decisions[i.id] === "approved")
    : items;
  const totalQuoted = billable
    .reduce((s: number, i: any) => s + Number(i.quoted_sell_price || 0) * Number(i.quantity || 1), 0);
  const paidSoFar = (partOrder.part_order_payments || [])
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  return Math.max(totalQuoted - paidSoFar, 0);
}

// part_orders.profile_id is direct (no appointments join needed), plus the
// customer contact fields SkipCash's create-payment call requires.
async function loadOwnedPartOrder(userClient: any, partOrderId: string) {
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { error: jsonResponse({ error: "Not authenticated" }, 401) };

  const { data: partOrder } = await adminClient
    .from("part_orders")
    .select("id, profile_id, request_number, customer_approved_at, item_decisions, part_order_items(id, quoted_sell_price, quantity), part_order_payments(amount), profiles(full_name, phone_number, email)")
    .eq("id", partOrderId)
    .maybeSingle();
  if (!partOrder) return { error: jsonResponse({ error: "Request not found" }, 404) };
  if (partOrder.profile_id !== user.id) {
    return { error: jsonResponse({ error: "Not authorized for this request" }, 403) };
  }

  return { partOrder, profileId: partOrder.profile_id, profile: partOrder.profiles };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const body = await req.json();
    const { action, partOrderId } = body;
    if (!partOrderId) return jsonResponse({ error: "Missing partOrderId" }, 400);

    const baseRes = await loadSkipCashBase();
    if ("error" in baseRes) return jsonResponse({ error: "SkipCash is not configured" }, 500);
    const { base, clientId } = baseRes;

    // Read-only — purely informational for the UI right after the customer
    // returns from SkipCash's hosted page. Never writes to
    // part_order_payments — skipcash-parts-webhook stays the only place
    // that actually happens.
    if (action === "status") {
      const { skipcashId } = body;
      if (!skipcashId) return jsonResponse({ error: "Missing skipcashId" }, 400);
      const { error: ownErr } = await loadOwnedPartOrder(userClient, partOrderId);
      if (ownErr) return ownErr;
      if (!clientId) return jsonResponse({ error: "SkipCash is not configured" }, 500);

      const resp = await fetch(`${base}/api/v1/payments/${skipcashId}`, {
        headers: { Authorization: clientId },
      });
      const json = await resp.json();
      if (!resp.ok || !json.resultObj) return jsonResponse({ error: `Could not verify payment status: ${JSON.stringify(json)}` }, 502);
      if (json.resultObj.custom1 !== partOrderId) return jsonResponse({ error: "Payment does not match this request" }, 400);
      return jsonResponse({ statusId: Number(json.resultObj.statusId), status: json.resultObj.status });
    }

    const { returnUrl } = body;
    if (!returnUrl) return jsonResponse({ error: "Missing returnUrl" }, 400);

    const { partOrder, profile, error: ownErr } = await loadOwnedPartOrder(userClient, partOrderId);
    if (ownErr) return ownErr;

    const amountQAR = computeAmountDueQAR(partOrder);
    if (amountQAR <= 0.01) return jsonResponse({ error: "Nothing outstanding to pay" }, 400);

    const fullName = (profile?.full_name || "Customer").trim().replace(/,/g, " ");
    const spaceIdx = fullName.indexOf(" ");
    const firstName = (spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName).slice(0, 60) || "Customer";
    const lastName = (spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "Customer").slice(0, 60).replace(/,/g, " ") || "Customer";
    const phone = (profile?.phone_number || "").replace(/,/g, "").slice(0, 15);
    const email = (profile?.email || `${phone || "customer"}@sndkqa.com`).replace(/,/g, "").slice(0, 255);

    // Same rounding-up-only convention as skipcash-payment — SkipCash only
    // accepts 2 decimals, this house's prices go to 3. The at-most 0.01 QAR
    // this can overcharge by is already handled like any other overpayment
    // elsewhere in this system.
    const skipcashAmount = Math.ceil(amountQAR * 100) / 100;

    const paymentDetails: Record<string, string> = {
      Uid: crypto.randomUUID(),
      KeyId: SKIPCASH_KEY_ID,
      Amount: skipcashAmount.toFixed(2),
      FirstName: firstName,
      LastName: lastName,
      Phone: phone,
      Email: email,
      TransactionId: `${partOrderId.slice(0, 20)}-${Date.now()}`.slice(0, 40),
      Custom1: partOrderId,
    };

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
        WebhookUrl: `${SUPABASE_URL}/functions/v1/skipcash-parts-webhook`,
        ReturnUrl: returnUrl,
        Subject: "SNDK Qatar",
        Description: `SNDK Qatar — ${partOrder.request_number || partOrderId}`,
      }),
    });
    const json = await resp.json();
    if (!resp.ok || json.hasError || !json.resultObj?.payUrl) {
      return jsonResponse({ error: `SkipCash payment creation failed: ${JSON.stringify(json)}` }, 502);
    }
    return jsonResponse({ payUrl: json.resultObj.payUrl, skipcashId: json.resultObj.id, amountQAR: skipcashAmount });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
