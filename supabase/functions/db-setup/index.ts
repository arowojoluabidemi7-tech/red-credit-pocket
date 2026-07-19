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
      CREATE TABLE IF NOT EXISTS public.deposits (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references public.profiles(id) on delete cascade,
        user_email text,
        user_name text,
        amount numeric not null,
        reference text not null,
        bank_name text,
        note text,
        status text not null default 'pending',
        admin_id uuid,
        admin_note text,
        reviewed_at timestamptz,
        created_at timestamptz not null default now()
      );
      GRANT SELECT, INSERT ON public.deposits TO authenticated;
      GRANT ALL ON public.deposits TO service_role;
      ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        CREATE POLICY "user insert own deposit" ON public.deposits
          FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "read own or admin deposits" ON public.deposits
          FOR SELECT TO authenticated
          USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "admin update deposits" ON public.deposits
          FOR UPDATE TO authenticated
          USING (public.has_role(auth.uid(),'admin'))
          WITH CHECK (public.has_role(auth.uid(),'admin'));
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY "admin delete deposits" ON public.deposits
          FOR DELETE TO authenticated
          USING (public.has_role(auth.uid(),'admin'));
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
