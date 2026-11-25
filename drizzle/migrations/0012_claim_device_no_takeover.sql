CREATE OR REPLACE FUNCTION public.claim_device(_device uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.claim_device_first(_device, NULL);
$$;