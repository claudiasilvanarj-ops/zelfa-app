ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  user_id uuid,
  path text NOT NULL,
  source text NOT NULL DEFAULT 'direto',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_visits_created_idx ON public.site_visits(created_at DESC);
CREATE INDEX site_visits_visitor_idx ON public.site_visits(visitor_id);

CREATE TABLE public.app_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX app_sessions_seen_idx ON public.app_sessions(last_seen DESC);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  charge_id text NOT NULL UNIQUE,
  amount_cents integer NOT NULL,
  paid_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.customer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_events_user_idx ON public.customer_events(user_id, created_at DESC);

CREATE TABLE public.customer_admin (
  user_id uuid PRIMARY KEY,
  gift_sent boolean NOT NULL DEFAULT false,
  notes text,
  canceled_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_visits, public.app_sessions, public.payments, public.customer_events, public.customer_admin, public.admin_login_attempts TO authenticated;
GRANT ALL ON public.site_visits, public.app_sessions, public.payments, public.customer_events, public.customer_admin, public.admin_login_attempts TO service_role;

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_read ON public.site_visits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_read ON public.app_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_read ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_read ON public.customer_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_read ON public.customer_admin FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_read ON public.admin_login_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.track_visit(_visitor uuid, _path text, _source text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.site_visits(visitor_id, user_id, path, source)
  SELECT _visitor, auth.uid(), left(coalesce(_path,'/'), 200),
    CASE WHEN _source IN ('instagram','facebook','direto','busca','outro') THEN _source ELSE 'outro' END
  WHERE _visitor IS NOT NULL;
$$;
GRANT EXECUTE ON FUNCTION public.track_visit(uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.app_heartbeat(_session uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR _session IS NULL THEN RETURN; END IF;
  UPDATE public.app_sessions SET last_seen = now() WHERE id = _session AND user_id = auth.uid();
  IF NOT FOUND THEN
    INSERT INTO public.app_sessions(id, user_id) VALUES (_session, auth.uid()) ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.customer_events(user_id, kind) VALUES (auth.uid(), 'acessou');
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.app_heartbeat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_admin_attempt(_email text, _reason text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.admin_login_attempts(email, reason) VALUES (left(_email, 200), left(coalesce(_reason,'bloqueado'), 100));
$$;
GRANT EXECUTE ON FUNCTION public.log_admin_attempt(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_cancel_subscription(_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.account_access SET paid_until = now(), updated_at = now() WHERE user_id = _user;
  INSERT INTO public.customer_admin(user_id, canceled_at) VALUES (_user, now())
    ON CONFLICT (user_id) DO UPDATE SET canceled_at = now(), updated_at = now();
  INSERT INTO public.customer_events(user_id, kind) VALUES (_user, 'cancelou');
END $$;
GRANT EXECUTE ON FUNCTION public.admin_cancel_subscription(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_gift(_user uuid, _sent boolean, _notes text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.customer_admin(user_id, gift_sent, notes) VALUES (_user, _sent, left(_notes, 1000))
    ON CONFLICT (user_id) DO UPDATE SET gift_sent = _sent, notes = left(_notes, 1000), updated_at = now();
  IF _sent THEN INSERT INTO public.customer_events(user_id, kind, detail) VALUES (_user, 'brinde', left(_notes, 200)); END IF;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_gift(uuid, boolean, text) TO authenticated;