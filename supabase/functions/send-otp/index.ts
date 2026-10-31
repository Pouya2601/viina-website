// Supabase Edge Function: send-otp
//
// Generates a 4-digit one-time code, stores only its hash (never the
// plain code) in the "otp_codes" table, and sends it to the phone via
// sms.ir's template-based "verify" endpoint. The sms.ir API key lives
// only here, as a Supabase secret — it is never sent to the browser.
//
// Deploy:
//   supabase functions deploy send-otp --no-verify-jwt
// Secrets (set once):
//   supabase secrets set SMSIR_API_KEY=your-key-from-app.sms.ir
//   supabase secrets set SMSIR_LOGIN_TEMPLATE_ID=123456
//   supabase secrets set SMSIR_CODE_PARAM_NAME=CODE
//
// SMSIR_LOGIN_TEMPLATE_ID must be the ID of a template you create in
// the sms.ir panel (Templates) with one parameter (e.g. named CODE)
// that your message text references, e.g.: "کد ورود شما: #CODE#".
// SMSIR_CODE_PARAM_NAME must match whatever you named that parameter
// — if your template uses a different name, update the secret, no
// code change needed.

import { createClient } from "jsr:@supabase/supabase-js@2";

const IRAN_MOBILE = /^09\d{9}$/;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  try {
    const { phone } = await req.json();
    if (!phone || !IRAN_MOBILE.test(phone)) {
      return new Response(JSON.stringify({ ok: false, message: "شماره موبایل نامعتبر است." }), { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Simple rate limit: at most one new code per phone every 60s.
    const { data: recent } = await supabase
      .from("otp_codes")
      .select("created_at")
      .eq("phone", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent && Date.now() - new Date(recent.created_at).getTime() < 60_000) {
      return new Response(JSON.stringify({ ok: false, message: "کمی صبر کنید و دوباره تلاش کنید." }), { status: 429, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000)); // 4 digits
    const codeHash = await sha256(code);
    const expiresAt = new Date(Date.now() + 2 * 60_000).toISOString(); // 2 minutes

    const { error: insertError } = await supabase.from("otp_codes").insert({ phone, code_hash: codeHash, expires_at: expiresAt });
    if (insertError) throw new Error(insertError.message);

    const apiKey = Deno.env.get("SMSIR_API_KEY")!;
    const templateId = Deno.env.get("SMSIR_LOGIN_TEMPLATE_ID")!;
    const paramName = Deno.env.get("SMSIR_CODE_PARAM_NAME") || "CODE";

    const smsRes = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "text/plain", "x-api-key": apiKey },
      body: JSON.stringify({ mobile: phone, templateId: Number(templateId), parameters: [{ name: paramName, value: code }] }),
    });
    const smsJson = await smsRes.json().catch(() => null);
    if (!smsRes.ok || (smsJson && smsJson.status && smsJson.status !== 1)) {
      return new Response(JSON.stringify({ ok: false, message: "ارسال پیامک ناموفق بود.", detail: smsJson }), { status: 502, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders(), "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: String(err) }), { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
  }
});
