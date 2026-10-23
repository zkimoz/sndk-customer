import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

// Shared between skipcash-payment (client-facing, JWT-required: create a
// payment, poll its status) and skipcash-webhook (public, no JWT: SkipCash's
// own server push) — both need to record a confirmed payment exactly once,
// so that logic lives here instead of being duplicated.

export const SANDBOX_BASE = "https://skipcashtest.azurewebsites.net";
export const PRODUCTION_BASE = "https://api.skipcash.app";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function hmacBase64(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return base64Encode(new Uint8Array(sig));
}

export async function loadSkipCashBase(): Promise<{ base: string; clientId: string | null } | { error: true }> {
  const { data: pm } = await adminClient
    .from("payment_methods")
    .select("is_sandbox, client_id")
    .eq("key", "skipcash")
    .maybeSingle();
  if (!pm) return { error: true };
  return { base: pm.is_sandbox ? SANDBOX_BASE : PRODUCTION_BASE, clientId: pm.client_id };
}

// Best-effort — a notification failure must never block the payment result.
export function notifySkipCashPaymentReceived(profileId: string, jobNumber: string | undefined, amountQAR: number, isTowing: boolean) {
  const methodAr = isTowing ? "رسوم الساطحة (SkipCash)" : "SkipCash";
  const methodEn = isTowing ? "Flatbed Fee (SkipCash)" : "SkipCash";
  adminClient.functions.invoke("clever-endpoint", {
    body: { event: "payment_receipt", customerId: profileId, jobNumber, amountQAR, methodAr, methodEn },
  }).catch(() => {});
  adminClient.from("profiles").select("full_name").eq("id", profileId).maybeSingle().then(({ data }) => {
    adminClient.functions.invoke("clever-endpoint", {
      body: { event: "payment_received", jobNumber, customerName: data?.full_name, amountQAR, methodAr, methodEn },
    }).catch(() => {});
  });
}

// Looks up what recordPaymentIfNew needs purely from the order itself —
// used by the webhook, which has no authenticated caller to derive it from
// (unlike skipcash-payment's loadOwnedOrder).
export async function loadOrderContactInfo(orderId: string) {
  const { data: order } = await adminClient.from("orders").select("id, appointment_id").eq("id", orderId).maybeSingle();
  if (!order) return null;
  const { data: appt } = await adminClient.from("appointments").select("profile_id, job_cards(job_number)").eq("id", order.appointment_id).maybeSingle();
  if (!appt) return null;
  return { profileId: appt.profile_id as string, jobNumber: appt.job_cards?.job_number as string | undefined };
}

// Idempotent on payments.gateway_ref — SkipCash retries a webhook delivery
// it didn't get a prompt 200 for (and a slow response can make its own HTTP
// client retry a request we're already mid-processing), so two deliveries
// for the same payment can genuinely race each other here. The SELECT
// pre-check alone isn't enough to stop that (both could pass it before
// either INSERT lands) — payments.gateway_ref carries a real unique index,
// so a losing INSERT fails with Postgres error 23505 (unique_violation)
// instead of creating a duplicate row, and that failure is what's actually
// trusted as "already recorded", not just the pre-check.
export async function recordPaymentIfNew(opts: {
  skipcashId: string; orderId: string; amountQAR: number; types: string[];
  profileId: string; jobNumber: string | undefined;
}): Promise<{ alreadyRecorded?: true; recorded?: true; error?: string }> {
  const { data: existing } = await adminClient.from("payments").select("id").eq("gateway_ref", opts.skipcashId).maybeSingle();
  if (existing) return { alreadyRecorded: true };

  const isTowing = opts.types.includes("towing");
  const { error: insErr } = await adminClient.from("payments").insert({
    order_id: opts.orderId,
    amount: opts.amountQAR,
    method: "skipcash",
    recorded_by: null,
    purpose: isTowing ? "towing" : "service",
    gateway_ref: opts.skipcashId,
  });
  if (insErr) {
    if (insErr.code === "23505") return { alreadyRecorded: true };
    return { error: insErr.message };
  }

  notifySkipCashPaymentReceived(opts.profileId, opts.jobNumber, opts.amountQAR, isTowing);
  return { recorded: true };
}
