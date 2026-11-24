import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { hmacBase64, recordWalletTopupIfNew, timingSafeEqual } from "../_shared/skipcash.ts";

// Public endpoint SkipCash's own server POSTs to directly when a wallet
// top-up payment completes — mirrors skipcash-parts-webhook/index.ts
// exactly (same signature verification, same deploy with --no-verify-jwt),
// kept as its own function so a bug here can never touch the
// already-hardened job-card/spare-parts webhooks. Pointed at by
// skipcash-wallet-payment's own WebhookUrl, never shared with the others.
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

    if (!timingSafeEqual(authHeader, expectedSig)) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Only a paid (StatusId 2) event needs recording — other statuses (e.g.
    // failed/cancelled) are just acknowledged so SkipCash stops retrying.
    if (Number(body.StatusId) !== 2) {
      return new Response("OK", { status: 200 });
    }

    // Custom1 is the customer's own profile id here (there's no pre-existing
    // order/request row to look up for a wallet top-up — see
    // skipcash-wallet-payment).
    const profileId = body.Custom1;
    if (!profileId) return new Response("OK", { status: 200 });

    await recordWalletTopupIfNew({
      skipcashId: body.PaymentId,
      profileId,
      amountQAR: Number(body.Amount),
    });

    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("skipcash-wallet-webhook error:", e);
    // Still 200 — a malformed body should never trigger SkipCash's retry
    // storm; whatever's wrong needs a code fix, not a retry.
    return new Response("OK", { status: 200 });
  }
});
