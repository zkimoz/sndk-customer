import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") || "SNDK <onboarding@resend.dev>";

// Always-notified department inboxes, in addition to any staff member who has
// opted in individually via notify_email in الموظفين.
const DEPARTMENT_EMAILS = ["info@sndkqa.com", "workshop@sndkqa.com", "customerservice@sndkqa.com"];

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const wrap = (title: string, rows: [string, string][]) => `
<div dir="rtl" style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#8A1538;padding:18px 22px">
      <h2 style="margin:0;color:#fff;font-size:16px">${title}</h2>
    </div>
    <div style="padding:20px 22px">
      ${rows.map(([label, value]) => `
        <div style="padding:8px 0;border-bottom:1px solid #f1f5f9">
          <span style="font-size:11px;color:#94a3b8;font-weight:700">${label}</span>
          <div style="font-size:14px;color:#1e293b;font-weight:600;margin-top:2px">${value || "—"}</div>
        </div>`).join("")}
    </div>
    <div style="padding:12px 22px;background:#fafbfc;text-align:center;font-size:10px;color:#94a3b8">سندك — قطر · SNDK Qatar</div>
  </div>
</div>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" },
    });
  }

  try {
    const { event, jobNumber, customerName, serviceLabel, appointmentDate, appointmentTime } = await req.json();

    const { data: staffList } = await supabase
      .from("profiles")
      .select("email")
      .eq("notify_email", true)
      .not("email", "is", null);

    const recipients = [...new Set([...DEPARTMENT_EMAILS, ...(staffList || []).map((s: { email: string }) => s.email)])];
    if (!recipients.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 });

    let subject = "";
    let html = "";
    if (event === "quotation_approved") {
      subject = `✅ العميل ${customerName || ""} وافق على عرض السعر — ${jobNumber || ""}`;
      html = wrap("تمت موافقة العميل على عرض السعر", [
        ["العميل", customerName],
        ["رقم أمر الشغل", jobNumber],
      ]);
    } else if (event === "new_booking") {
      subject = `📅 حجز موعد جديد — ${customerName || ""}`;
      html = wrap("حجز موعد جديد", [
        ["العميل", customerName],
        ["الخدمة", serviceLabel],
        ["التاريخ", appointmentDate],
        ["الوقت", appointmentTime],
      ]);
    } else {
      return new Response(JSON.stringify({ error: "unknown event" }), { status: 400 });
    }

    // Sent one at a time (not Promise.all) — Resend's free tier caps at 2 requests/sec,
    // and firing every recipient concurrently was tripping that limit. Also reports each
    // email's actual response rather than just whether the network call completed.
    const results: { email: string; ok: boolean; status: number; body: string }[] = [];
    for (const email of recipients) {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html }),
      });
      const body = await resp.text();
      results.push({ email, ok: resp.ok, status: resp.status, body });
      await new Promise((r) => setTimeout(r, 550));
    }
    const sent = results.filter((r) => r.ok).length;
    return new Response(JSON.stringify({ sent, results }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
