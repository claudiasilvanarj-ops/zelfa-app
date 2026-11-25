-- Libera contas admin da trava de aparelho único e adiciona função de reset pelo admin.
CREATE OR REPLACE FUNCTION public.access_status(_device uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.account_access;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 'unpaid'; END IF;
  IF public.has_role(auth.uid(), 'admin') THEN RETURN 'ok'; END IF;
  SELECT * INTO r FROM public.account_access WHERE user_id = auth.uid();
  IF r.active_device IS NOT NULL AND r.active_device <> _device THEN RETURN 'other_device'; END IF;
  IF r.paid_until IS NULL OR r.paid_until < now() THEN RETURN 'unpaid'; END IF;
  RETURN 'ok';
END $$;

CREATE OR REPLACE FUNCTION public.admin_reset_device(_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.account_access SET active_device = NULL, active_label = NULL, updated_at = now() WHERE user_id = _user;
  DELETE FROM public.device_switches WHERE user_id = _user;
END $$;
REVOKE ALL ON FUNCTION public.admin_reset_device(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_device(uuid) TO authenticated;
