// Supabase Edge Function: send-order-sms
//
// Sends the order-confirmation SMS using the "تایید سفارش" template
// you already created in app.sms.ir. Open that template in the
// sms.ir panel and check what parameter name(s) it actually expects
// — the default below assumes one parameter for the order number,
// named CODE (sms.ir's templates commonly use that name even for
// non-OTP codes). Adjust SMSIR_ORDER_PARAM_NAME if yours differs.
//
// Deploy:
//   supabase functions deploy send-order-sms --no-verify-jwt
// Secrets (set once; SMSIR_API_KEY is shared with send-otp):
//   supabase secrets set SMSIR_API_KEY=your-key-from-app.sms.ir
//   supabase secrets set SMSIR_ORDER_TEMPLATE_ID=123456
//   supabase secrets set SMSIR_ORDER_PARAM_NAME=CODE

const IRAN_MOBILE = /^09\d{9}$/;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders() });

  try {
    const { phone, orderId } = await req.json();
    if (!phone || !IRAN_MOBILE.test(phone) || !orderId) {
      return new Response(JSON.stringify({ ok: false, message: "اطلاعات ناقص است." }), { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("SMSIR_API_KEY")!;
    const templateId = Deno.env.get("SMSIR_ORDER_TEMPLATE_ID")!;
    const paramName = Deno.env.get("SMSIR_ORDER_PARAM_NAME") || "CODE";

    const smsRes = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "text/plain", "x-api-key": apiKey },
      body: JSON.stringify({ mobile: phone, templateId: Number(templateId), parameters: [{ name: paramName, value: String(orderId) }] }),
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
