CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

ALTER POLICY "admin insert audit" ON public.audit_log
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) AND admin_id = auth.uid());
ALTER POLICY "admin read audit" ON public.audit_log
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admin delete deposits" ON public.deposits
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "admin update deposits" ON public.deposits
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "read own or admin deposits" ON public.deposits
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admin delete profile" ON public.profiles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "own profile select" ON public.profiles
  USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "own profile update" ON public.profiles
  USING (auth.uid() = id OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admin insert settings" ON public.site_settings
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "admin update settings" ON public.site_settings
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admin manage roles" ON public.user_roles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "read own roles" ON public.user_roles
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER POLICY "admin insert wallet adj" ON public.wallet_adjustments
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) AND admin_id = auth.uid());
ALTER POLICY "admin read wallet adj" ON public.wallet_adjustments
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR user_id = auth.uid());

ALTER POLICY "receipts admin read" ON storage.objects
  USING (bucket_id = 'receipts' AND private.has_role(auth.uid(), 'admin'::public.app_role));

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;