import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Auto-translates a staff-typed quotation note (free text, Arabic or
// English) to the other language, so both apps can show the right
// language without staff ever typing it twice. Language is auto-detected
// (staff aren't asked which one they're typing) — called on blur of the
// note field in the job-card quotation builder (sndk-admin). The result
// is only persisted whenever the existing "Save All" flow next runs, same
// as every other quotation field.
const GOOGLE_TRANSLATE_API_KEY = Deno.env.get("GOOGLE_TRANSLATE_API_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-client",
};

async function detectLanguage(text: string): Promise<string> {
  const resp = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_TRANSLATE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text }),
  });
  const json = await resp.json();
  const lang = json?.data?.detections?.[0]?.[0]?.language;
  // Only "ar" and "en" are meaningful here — anything else (misdetection on
  // very short text, numbers-only, etc.) defaults to Arabic, since that's
  // what staff type in the overwhelming majority of cases.
  return lang === "en" ? "en" : "ar";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { text } = await req.json();
    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ translated: "", detectedLang: "ar" }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const detectedLang = await detectLanguage(text);
    const target = detectedLang === "ar" ? "en" : "ar";

    const resp = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: detectedLang, target, format: "text" }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: json?.error?.message || "Translation failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const translated = json?.data?.translations?.[0]?.translatedText || "";
    return new Response(JSON.stringify({ translated, detectedLang }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
