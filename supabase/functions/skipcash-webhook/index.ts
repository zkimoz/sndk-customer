import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { hmacBase64, loadOrderContactInfo, recordPaymentIfNew } from "../_shared/skipcash.ts";

// Public endpoint SkipCash's own server POSTs to directly when a payment
// completes — no Supabase JWT is ever sent here, so this function is
// deployed with --no-verify-jwt (unlike every other function in this
// project). Authenticity instead rests entirely on the HMAC signature
// below, computed with the Webhook Key from the merchant portal — never
// trust the body without checking it first.
const SKIPCASH_WEBHOOK_KEY = Deno.env.get("SKIPCASH_WEBHOOK_KEY")!;

const TYPE_FROM_CUSTOM2: Record<string, string> = { part: "parts", labor: "labor" };

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

    const orderId = body.Custom1;
    if (!orderId) return new Response("OK", { status: 200 });

    const types = String(body.Custom2 || "service").split("+").map((t: string) => TYPE_FROM_CUSTOM2[t] || t);

    const contact = await loadOrderContactInfo(orderId);
    if (!contact) return new Response("OK", { status: 200 });

    await recordPaymentIfNew({
      skipcashId: body.PaymentId,
      orderId,
      amountQAR: Number(body.Amount),
      types,
      profileId: contact.profileId,
      jobNumber: contact.jobNumber,
    });

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("skipcash-webhook error:", e);
    // Still 200 — a malformed body should never trigger SkipCash's retry
    // storm; whatever's wrong needs a code fix, not a retry.
    return new Response("OK", { status: 200 });
  }
});
