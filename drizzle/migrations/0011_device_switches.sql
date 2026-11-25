ALTER TABLE public.account_access ADD COLUMN IF NOT EXISTS active_label text;

CREATE TABLE public.device_switches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  old_device uuid,
  old_label text,
  new_device uuid NOT NULL,
  new_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.device_switches TO authenticated;
GRANT ALL ON public.device_switches TO service_role;
ALTER TABLE public.device_switches ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_read ON public.device_switches FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- First device only: never takes over an account already active elsewhere.
CREATE OR REPLACE FUNCTION public.claim_device_first(_device uuid, _label text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.account_access(user_id, active_device, active_label, updated_at)
  VALUES (auth.uid(), _device, left(_label, 80), now())
  ON CONFLICT (user_id) DO UPDATE SET active_device = EXCLUDED.active_device, active_label = EXCLUDED.active_label, updated_at = now()
  WHERE account_access.active_device IS NULL OR account_access.active_device = EXCLUDED.active_device;
$$;
REVOKE ALL ON FUNCTION public.claim_device_first(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_device_first(uuid, text) TO authenticated;

-- Returns 'ok' or 'limit' (2 switches per calendar month, Brasília time).
CREATE OR REPLACE FUNCTION public.switch_device(_device uuid, _label text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.account_access; n int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT * INTO r FROM public.account_access WHERE user_id = auth.uid();
  IF r.active_device IS NULL OR r.active_device = _device THEN
    PERFORM public.claim_device_first(_device, _label); RETURN 'ok';
  END IF;
  SELECT count(*) INTO n FROM public.device_switches WHERE user_id = auth.uid()
    AND created_at >= (date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo');
  IF n >= 2 THEN RETURN 'limit'; END IF;
  INSERT INTO public.device_switches(user_id, email, old_device, old_label, new_device, new_label)
  VALUES (auth.uid(), auth.jwt() ->> 'email', r.active_device, r.active_label, _device, left(_label, 80));
  UPDATE public.account_access SET active_device = _device, active_label = left(_label, 80), updated_at = now() WHERE user_id = auth.uid();
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.switch_device(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.switch_device(uuid, text) TO authenticated;