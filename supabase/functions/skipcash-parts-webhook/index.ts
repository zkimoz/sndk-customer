import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { hmacBase64, loadPartOrderContactInfo, recordPartOrderPaymentIfNew } from "../_shared/skipcash.ts";

// Public endpoint SkipCash's own server POSTs to directly when a spare-parts
// request payment completes — mirrors skipcash-webhook/index.ts exactly
// (same signature verification, same deploy with --no-verify-jwt), kept as
// its own separate function so a bug here can never touch the
// already-hardened job-card webhook. Pointed at by
// skipcash-parts-payment's own WebhookUrl, never shared with job-card
// payments.
const SKIPCASH_WEBHOOK_KEY = Deno.env.get("SKIPCASH_WEBHOOK_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization") || "";

    // Fixed field order per SkipCash's docs: PaymentId, Amount, StatusId are
    // always included; TransactionId and Custom1 only when present.
    const parts = [`PaymentId=${body.PaymentId}`, `Amount=${body.Amount}`, `StatusId=${body.StatusId}`];
    if (body.TransactionId) parts.push(`TransactionId=${body.TransactionId}`);
    if (body.Custom1) parts.push(`Custom1=${body.Custom1}`);
    parts.push(`VisaId=${body.VisaId}`);
    const expectedSig = await hmacBase64(parts.join(","), SKIPCASH_WEBHOOK_KEY);

    if (authHeader !== expectedSig) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Only a paid (StatusId 2) event needs recording — other statuses (e.g.
    // failed/cancelled) are just acknowledged so SkipCash stops retrying.
    if (Number(body.StatusId) !== 2) {
      return new Response("OK", { status: 200 });
    }

    const partOrderId = body.Custom1;
    if (!partOrderId) return new Response("OK", { status: 200 });

    const contact = await loadPartOrderContactInfo(partOrderId);
    if (!contact) return new Response("OK", { status: 200 });

    await recordPartOrderPaymentIfNew({
      skipcashId: body.PaymentId,
      partOrderId,
      amountQAR: Number(body.Amount),
      profileId: contact.profileId,
      requestNumber: contact.requestNumber,
    });

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("skipcash-parts-webhook error:", e);
    // Still 200 — a malformed body should never trigger SkipCash's retry
    // storm; whatever's wrong needs a code fix, not a retry.
    return new Response("OK", { status: 200 });
  }
});
