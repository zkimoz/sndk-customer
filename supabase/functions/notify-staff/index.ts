import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("NOTIFY_FROM_EMAIL") || "SNDK <onboarding@resend.dev>";
// Customer-facing update emails are sent from a separate no-reply address so
// replies don't land in the internal department inboxes.
const CUSTOMER_FROM_EMAIL = Deno.env.get("CUSTOMER_FROM_EMAIL") || "SNDK <noreply@sndkqa.com>";

// Always-notified department inboxes, in addition to any staff member who has
// opted in individually via notify_email in الموظفين.
const DEPARTMENT_EMAILS = ["info@sndkqa.com", "workshop@sndkqa.com", "customerservice@sndkqa.com"];
const STAFF_EVENTS = new Set(["quotation_approved", "new_booking"]);
const CUSTOMER_EVENTS = new Set(["status_changed", "quotation_sent", "invoice_ready", "job_closed", "resignature_requested", "details_updated"]);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Every email is bilingual (Modern Standard Arabic + English) with both
// languages rendered at the same font size — labels and titles are passed
// pre-combined as "العربية / English" strings by the caller.
const wrap = (title: string, rows: [string, string][], note?: string) => `
<div dir="rtl" style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#8A1538;padding:18px 22px">
      <h2 style="margin:0;color:#fff;font-size:16px;font-weight:700">${title}</h2>
    </div>
    <div style="padding:20px 22px">
      ${rows.map(([label, value]) => `
        <div style="padding:8px 0;border-bottom:1px solid #f1f5f9">
          <span style="font-size:12px;color:#94a3b8;font-weight:700">${label}</span>
          <div style="font-size:14px;color:#1e293b;font-weight:600;margin-top:2px">${value || "—"}</div>
        </div>`).join("")}
      ${note ? `<div style="margin-top:14px;padding:14px 16px;background:#fdf3e7;border-radius:8px;font-size:14px;line-height:1.9;color:#1e293b">${note}</div>` : ""}
    </div>
    <div style="padding:12px 22px;background:#fafbfc;text-align:center;font-size:10px;color:#94a3b8">سندك — قطر · SNDK Qatar</div>
  </div>
</div>`;

const bi = (ar: string, en: string) => `${ar} / ${en}`;

// supabase-js's functions.invoke() sends 'apikey' and 'x-client-info' headers by
// default — omitting them here made the browser's CORS preflight reject the
// request outright before it ever reached this function (curl/Node fetch calls
// don't enforce CORS, which is why direct testing always looked fine).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }

  try {
    const {
      event, jobNumber, customerName, serviceLabel, appointmentDate, appointmentTime,
      customerId, statusLabelAr, statusLabelEn, invoicePdfBase64, invoiceFilename,
    } = await req.json();

    let recipients: string[] = [];
    let subject = "";
    let html = "";

    if (CUSTOMER_EVENTS.has(event)) {
      const { data: cust } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", customerId)
        .maybeSingle();
      if (cust?.email) recipients = [cust.email];
      const name = cust?.full_name || customerName || "عميلنا العزيز / Dear Customer";

      if (event === "status_changed") {
        subject = bi(`🔧 تحديث على أمر شغلك — ${jobNumber || ""}`, `Update on your job card — ${jobNumber || ""}`);
        html = wrap(bi("تحديث على حالة سيارتك", "Update on your car's status"), [
          [bi("العميل", "Customer"), name],
          [bi("رقم أمر الشغل", "Job Number"), jobNumber],
          [bi("الحالة الجديدة", "New Status"), bi(statusLabelAr || "", statusLabelEn || "")],
        ]);
      } else if (event === "quotation_sent") {
        subject = bi(`📋 عرض سعر جاهز لموافقتك — ${jobNumber || ""}`, `Quotation ready for your approval — ${jobNumber || ""}`);
        html = wrap(bi("عرض السعر جاهز للمراجعة", "Your quotation is ready"), [
          [bi("العميل", "Customer"), name],
          [bi("رقم أمر الشغل", "Job Number"), jobNumber],
          [bi("الإجراء المطلوب", "Action Needed"), bi("يرجى فتح تطبيق سندك للموافقة على عرض السعر", "Please open the SNDK app to review and approve")],
        ]);
      } else if (event === "invoice_ready") {
        subject = bi(`🧾 فاتورتك جاهزة — ${jobNumber || ""}`, `Your invoice is ready — ${jobNumber || ""}`);
        html = wrap(bi("الفاتورة جاهزة", "Invoice Ready"), [
          [bi("العميل", "Customer"), name],
          [bi("رقم أمر الشغل", "Job Number"), jobNumber],
        ]);
      } else if (event === "job_closed") {
        subject = bi(`✅ سيارتك جاهزة للاستلام — ${jobNumber || ""}`, `Your car is ready for pickup — ${jobNumber || ""}`);
        const thankYouNote = `
          شكراً لاختيارك سندك! يسعدنا دائماً أن نكون في خدمتك، وسنظل بجانبك في أي وقت تحتاج فيه إلى رعاية سيارتك.
          <br><br>
          Thank you for choosing SNDK! We are always glad to serve you, and we will remain at your service anytime your car needs care.
          ${invoicePdfBase64 ? `<br><br><strong>🧾 الفاتورة الضريبية مرفقة بهذا البريد.<br>The tax invoice is attached to this email.</strong>` : ""}
        `;
        html = wrap(bi("تم إغلاق أمر الشغل — السيارة جاهزة", "Job Card Closed — Car Ready"), [
          [bi("العميل", "Customer"), name],
          [bi("رقم أمر الشغل", "Job Number"), jobNumber],
        ], thankYouNote);
      } else if (event === "resignature_requested") {
        subject = bi(`✍️ مطلوب توقيعك مرة أخرى — ${jobNumber || ""}`, `We need your signature again — ${jobNumber || ""}`);
        html = wrap(bi("مطلوب توقيع جديد على عرض السعر", "New Signature Required"), [
          [bi("العميل", "Customer"), name],
          [bi("رقم أمر الشغل", "Job Number"), jobNumber],
        ]);
      } else if (event === "details_updated") {
        subject = bi(`🔄 تحديث على بيانات أمر شغلك — ${jobNumber || ""}`, `Your job card was updated — ${jobNumber || ""}`);
        html = wrap(bi("تم تحديث بيانات أمر الشغل", "Job Card Details Updated"), [
          [bi("العميل", "Customer"), name],
          [bi("رقم أمر الشغل", "Job Number"), jobNumber],
        ]);
      }
    } else if (STAFF_EVENTS.has(event)) {
      const { data: staffList } = await supabase
        .from("profiles")
        .select("email")
        .eq("notify_email", true)
        .not("email", "is", null);
      recipients = [...new Set([...DEPARTMENT_EMAILS, ...(staffList || []).map((s: { email: string }) => s.email)])];

      if (event === "quotation_approved") {
        subject = bi(`✅ العميل ${customerName || ""} وافق على عرض السعر — ${jobNumber || ""}`, `Customer approved the quotation — ${jobNumber || ""}`);
        html = wrap(bi("تمت موافقة العميل على عرض السعر", "Customer Approved the Quotation"), [
          [bi("العميل", "Customer"), customerName],
          [bi("رقم أمر الشغل", "Job Number"), jobNumber],
        ]);
      } else if (event === "new_booking") {
        subject = bi(`📅 حجز موعد جديد — ${customerName || ""}`, `New appointment booking — ${customerName || ""}`);
        html = wrap(bi("حجز موعد جديد", "New Appointment Booking"), [
          [bi("العميل", "Customer"), customerName],
          [bi("الخدمة", "Service"), serviceLabel],
          [bi("التاريخ", "Date"), appointmentDate],
          [bi("الوقت", "Time"), appointmentTime],
        ]);
      }
    } else {
      return new Response(JSON.stringify({ error: "unknown event" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    if (!recipients.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Sent one at a time (not Promise.all) — Resend's free tier caps at 2 requests/sec,
    // and firing every recipient concurrently was tripping that limit. Also reports each
    // email's actual response rather than just whether the network call completed.
    const fromAddress = CUSTOMER_EVENTS.has(event) ? CUSTOMER_FROM_EMAIL : FROM_EMAIL;
    const attachments = invoicePdfBase64
      ? [{ filename: invoiceFilename || "invoice.pdf", content: invoicePdfBase64 }]
      : undefined;
    const results: { email: string; ok: boolean; status: number; body: string }[] = [];
    for (const email of recipients) {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromAddress, to: email, subject, html, ...(attachments ? { attachments } : {}) }),
      });
      const body = await resp.text();
      results.push({ email, ok: resp.ok, status: resp.status, body });
      await new Promise((r) => setTimeout(r, 550));
    }
    const sent = results.filter((r) => r.ok).length;
    return new Response(JSON.stringify({ sent, results }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
