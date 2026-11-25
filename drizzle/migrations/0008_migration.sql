CREATE TABLE public.account_access (
  user_id uuid PRIMARY KEY,
  active_device uuid,
  paid_until timestamptz,
  last_payment_ref text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.account_access TO authenticated;
GRANT ALL ON public.account_access TO service_role;
ALTER TABLE public.account_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own access read" ON public.account_access FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.claim_device(_device uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.account_access(user_id, active_device, updated_at)
  VALUES (auth.uid(), _device, now())
  ON CONFLICT (user_id) DO UPDATE SET active_device = EXCLUDED.active_device, updated_at = now();
$$;
REVOKE ALL ON FUNCTION public.claim_device(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_device(uuid) TO authenticated;

-- Returns: 'ok' | 'other_device' | 'unpaid'
CREATE OR REPLACE FUNCTION public.access_status(_device uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.account_access;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 'unpaid'; END IF;
  SELECT * INTO r FROM public.account_access WHERE user_id = auth.uid();
  IF r.active_device IS NOT NULL AND r.active_device <> _device THEN RETURN 'other_device'; END IF;
  IF public.has_role(auth.uid(), 'admin') THEN RETURN 'ok'; END IF;
  IF r.paid_until IS NULL OR r.paid_until < now() THEN RETURN 'unpaid'; END IF;
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.access_status(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.access_status(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_grant_access(_user uuid, _days int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.account_access(user_id, paid_until, updated_at)
  VALUES (_user, CASE WHEN _days > 0 THEN now() + make_interval(days => _days) ELSE now() END, now())
  ON CONFLICT (user_id) DO UPDATE SET
    paid_until = CASE WHEN _days > 0 THEN greatest(coalesce(account_access.paid_until, now()), now()) + make_interval(days => _days) ELSE now() END,
    updated_at = now();
END $$;
REVOKE ALL ON FUNCTION public.admin_grant_access(uuid, int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_access(uuid, int) TO authenticated;