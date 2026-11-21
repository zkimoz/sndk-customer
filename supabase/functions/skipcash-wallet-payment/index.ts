import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { adminClient, hmacBase64, loadSkipCashBase } from "../_shared/skipcash.ts";

// SkipCash checkout for topping up the customer's wallet balance directly —
// deliberately its own function/webhook, same reasoning as
// skipcash-parts-payment: a bug here can never touch the already-hardened
// job-card or spare-parts payment paths. Simpler still: there's no existing
// row to look up or re-price — the amount is just whatever the customer
// typed, and wallet_transactions gets a brand new confirmed row once
// SkipCash confirms the charge (no staff approval step, unlike the
// manual/bank-transfer top-up request this replaces).
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const body = await req.json();
    const { action } = body;

    const baseRes = await loadSkipCashBase();
    if ("error" in baseRes) return jsonResponse({ error: "SkipCash is not configured" }, 500);
    const { base, clientId } = baseRes;

    // Read-only — purely informational for the UI right after the customer
    // returns from SkipCash's hosted page. Never writes to
    // wallet_transactions — skipcash-wallet-webhook stays the only place
    // that actually happens.
    if (action === "status") {
      const { skipcashId } = body;
      if (!skipcashId) return jsonResponse({ error: "Missing skipcashId" }, 400);
      if (!clientId) return jsonResponse({ error: "SkipCash is not configured" }, 500);

      const resp = await fetch(`${base}/api/v1/payments/${skipcashId}`, {
        headers: { Authorization: clientId },
      });
      const json = await resp.json();
      if (!resp.ok || !json.resultObj) return jsonResponse({ error: `Could not verify payment status: ${JSON.stringify(json)}` }, 502);
      if (json.resultObj.custom1 !== user.id) return jsonResponse({ error: "Payment does not match this account" }, 400);
      return jsonResponse({ statusId: Number(json.resultObj.statusId), status: json.resultObj.status });
    }

    const { amount, returnUrl } = body;
    const amountQAR = Number(amount);
    if (!amountQAR || amountQAR <= 0) return jsonResponse({ error: "Invalid amount" }, 400);
    if (!returnUrl) return jsonResponse({ error: "Missing returnUrl" }, 400);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("full_name, phone_number, email")
      .eq("id", user.id)
      .maybeSingle();

    const fullName = (profile?.full_name || "Customer").trim().replace(/,/g, " ");
    const spaceIdx = fullName.indexOf(" ");
    const firstName = (spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName).slice(0, 60) || "Customer";
    const lastName = (spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "Customer").slice(0, 60).replace(/,/g, " ") || "Customer";
    const phone = (profile?.phone_number || "").replace(/,/g, "").slice(0, 15);
    const email = (profile?.email || `${phone || "customer"}@sndkqa.com`).replace(/,/g, "").slice(0, 255);

    // Same rounding-up-only convention as the other SkipCash functions —
    // SkipCash only accepts 2 decimals, this house's prices go to 3. The
    // at-most 0.01 QAR this can overcharge by just lands as extra wallet
    // balance, same way any other overpayment already is elsewhere.
    const skipcashAmount = Math.ceil(amountQAR * 100) / 100;

    const paymentDetails: Record<string, string> = {
      Uid: crypto.randomUUID(),
      KeyId: SKIPCASH_KEY_ID,
      Amount: skipcashAmount.toFixed(2),
      FirstName: firstName,
      LastName: lastName,
      Phone: phone,
      Email: email,
      TransactionId: `wallet-${user.id.slice(0, 20)}-${Date.now()}`.slice(0, 40),
      Custom1: user.id,
      Custom2: "wallet_topup",
    };

    // Signature covers only the fields the docs list as signable, in their
    // fixed order — Custom2 isn't one of them, same as skipcash-payment.
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
        WebhookUrl: `${SUPABASE_URL}/functions/v1/skipcash-wallet-webhook`,
        ReturnUrl: returnUrl,
        Subject: "SNDK Qatar",
        Description: "SNDK Qatar — Wallet top-up",
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
