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
      ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS screenshot_url text;
      DO $$ BEGIN
        CREATE POLICY "user update own pending deposit" ON public.deposits
          FOR UPDATE TO authenticated
          USING (auth.uid() = user_id AND status = 'pending')
          WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "receipts auth upload" ON storage.objects
          FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "receipts owner read" ON storage.objects
          FOR SELECT TO authenticated USING (bucket_id = 'receipts' AND owner = auth.uid());
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "receipts admin read" ON storage.objects
          FOR SELECT TO authenticated USING (bucket_id = 'receipts' AND public.has_role(auth.uid(),'admin'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      CREATE TABLE IF NOT EXISTS public.site_settings (
        id text PRIMARY KEY,
        bank_name text NOT NULL DEFAULT '',
        account_number text NOT NULL DEFAULT '',
        account_name text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      GRANT SELECT ON public.site_settings TO anon;
      GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
      GRANT ALL ON public.site_settings TO service_role;
      ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        CREATE POLICY "anyone read settings" ON public.site_settings
          FOR SELECT TO anon, authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "admin insert settings" ON public.site_settings
          FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "admin update settings" ON public.site_settings
          FOR UPDATE TO authenticated
          USING (public.has_role(auth.uid(),'admin'))
          WITH CHECK (public.has_role(auth.uid(),'admin'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      INSERT INTO public.site_settings (id, bank_name, account_number, account_name)
      VALUES ('payment', 'SMARTCASH', '7055968093', 'MOSES GIFT')
      ON CONFLICT (id) DO NOTHING;
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
