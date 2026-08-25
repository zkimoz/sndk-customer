import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Public by design (VAPID's whole point) — the customer web app ships this
// same value client-side (App.jsx) to call PushManager.subscribe(), so it's
// not a secret. Only the private key needs to stay out of source.
const VAPID_PUBLIC_KEY  = "BI7jNwdDx9eYM2bVIWSytWhDiZcmYI_8HFYc4fqF97vbej-zxPIXfS0nP8mrjQJPzeGcO76tN26vBK8vvg3qPRE";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails("mailto:karimfahmy255@gmail.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// --- FCM (mobile app push) -------------------------------------------------

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function base64url(input: ArrayBuffer | string): string {
  const str = typeof input === "string" ? btoa(input) : btoa(String.fromCharCode(...new Uint8Array(input)));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedFcmToken: { token: string; exp: number } | null = null;

// Exchanges the Firebase service account key for a short-lived OAuth2 access
// token (FCM's HTTP v1 API has no long-lived server key like the legacy API).
async function getFcmAccessToken(sa: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmToken && cachedFcmToken.exp > now + 60) return cachedFcmToken.token;

  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`FCM token exchange failed: ${JSON.stringify(data)}`);

  cachedFcmToken = { token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

async function sendFcm(projectId: string, accessToken: string, token: string, title: string, body: string, url: string) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, notification: { title, body }, data: { url: url || "/" } } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 404 || err?.error?.status === "NOT_FOUND" || err?.error?.status === "INVALID_ARGUMENT") {
      // token is stale (app uninstalled, etc.) — stop trying to deliver to it
      await supabase.from("push_tokens_mobile").delete().eq("token", token);
    }
    throw new Error(JSON.stringify(err));
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" },
    });
  }

  try {
    const { user_id, title, body, url } = await req.json();
    if (!user_id) return new Response(JSON.stringify({ error: "user_id required" }), { status: 400 });

    const [{ data: subs }, { data: mobileTokens }] = await Promise.all([
      supabase.from("push_subscriptions").select("subscription").eq("user_id", user_id),
      supabase.from("push_tokens_mobile").select("token").eq("user_id", user_id),
    ]);

    const payload = JSON.stringify({ title, body, url: url || "/" });
    const webResults = subs?.length
      ? await Promise.allSettled(subs.map((row) => webpush.sendNotification(row.subscription, payload)))
      : [];
    const webSent = webResults.filter((r) => r.status === "fulfilled").length;

    let fcmSent = 0;
    if (mobileTokens?.length) {
      try {
        const sa = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON")!);
        const accessToken = await getFcmAccessToken(sa);
        const fcmResults = await Promise.allSettled(
          mobileTokens.map((row) => sendFcm(sa.project_id, accessToken, row.token, title, body, url))
        );
        fcmSent = fcmResults.filter((r) => r.status === "fulfilled").length;
      } catch (e) {
        console.error("FCM send error:", e);
      }
    }

    return new Response(JSON.stringify({ sent: webSent + fcmSent }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
