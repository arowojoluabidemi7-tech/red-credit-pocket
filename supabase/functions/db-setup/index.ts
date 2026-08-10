// One-shot DDL runner
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) throw new Error("SUPABASE_DB_URL missing");
    const sql = postgres(dbUrl, { max: 1 });

    await sql.unsafe(`
      ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS support_whatsapp text NOT NULL DEFAULT '';
      ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS support_telegram text NOT NULL DEFAULT '';
      ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS support_email text NOT NULL DEFAULT '';
      ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS community_whatsapp text NOT NULL DEFAULT '';
      ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS community_telegram text NOT NULL DEFAULT '';

      UPDATE public.site_settings SET
        support_whatsapp   = COALESCE(NULLIF(support_whatsapp,''), '27641451346'),
        support_telegram   = COALESCE(NULLIF(support_telegram,''), 'https://t.me/Redpayagent1'),
        support_email      = COALESCE(NULLIF(support_email,''), 'redpay313@gmail.com'),
        community_whatsapp = COALESCE(NULLIF(community_whatsapp,''), 'https://chat.whatsapp.com/EE0IPvPLr28JqRaHFiNbtM?mode=gi_t'),
        community_telegram = COALESCE(NULLIF(community_telegram,''), 'https://t.me/Redpayagent1')
      WHERE id = 'payment';
    `);

    await sql.end();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
