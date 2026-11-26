-- Sessao unica automatica inteligente: sem limite mensal rigido, com freio anti-abuso (8+ trocas em 24h -> pausa de 1h)
CREATE OR REPLACE FUNCTION public.switch_device(_device uuid, _label text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.account_access;
  n24 int;
  last_sw timestamptz;
  cutoff timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  SELECT * INTO r FROM public.account_access WHERE user_id = auth.uid();
  IF r.active_device IS NULL OR r.active_device = _device OR public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.account_access(user_id, active_device, active_label, updated_at)
    VALUES (auth.uid(), _device, left(_label, 80), now())
    ON CONFLICT (user_id) DO UPDATE SET active_device = EXCLUDED.active_device, active_label = EXCLUDED.active_label, updated_at = now();
    RETURN 'ok';
  END IF;

  cutoff := greatest(now() - interval '24 hours', coalesce(r.switches_reset_at, '-infinity'::timestamptz));
  SELECT count(*), max(created_at) INTO n24, last_sw
  FROM public.device_switches
  WHERE user_id = auth.uid() AND created_at >= cutoff;

  IF n24 >= 8 AND last_sw IS NOT NULL AND last_sw > now() - interval '1 hour' THEN
    RETURN 'cooldown';
  END IF;

  INSERT INTO public.device_switches(user_id, email, old_device, old_label, new_device, new_label)
  VALUES (auth.uid(), auth.jwt() ->> 'email', r.active_device, r.active_label, _device, left(_label, 80));

  UPDATE public.account_access
  SET active_device = _device, active_label = left(_label, 80), updated_at = now()
  WHERE user_id = auth.uid();

  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.switch_device(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.switch_device(uuid, text) TO authenticated;
