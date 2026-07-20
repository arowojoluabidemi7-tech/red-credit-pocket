// One-shot DDL runner for the deposits table
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
        CREATE POLICY "receipts public read" ON storage.objects
          FOR SELECT TO public USING (bucket_id = 'receipts');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "receipts auth upload" ON storage.objects
          FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
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
