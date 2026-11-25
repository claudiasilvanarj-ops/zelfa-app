CREATE TABLE public.camera_invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), viewer_id uuid NOT NULL DEFAULT auth.uid(), viewer_name text NOT NULL CHECK (length(viewer_name) BETWEEN 1 AND 100), owner_email text NOT NULL CHECK (length(owner_email) BETWEEN 3 AND 255), owner_id uuid, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','revoked','declined')), start_time time NOT NULL DEFAULT '00:00', end_time time NOT NULL DEFAULT '00:00', created_at timestamptz NOT NULL DEFAULT now(), CHECK (owner_id IS NULL OR owner_id <> viewer_id)
);
GRANT SELECT, INSERT ON public.camera_invitations TO authenticated;
GRANT ALL ON public.camera_invitations TO service_role;
ALTER TABLE public.camera_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY invitation_read ON public.camera_invitations FOR SELECT TO authenticated USING (viewer_id = auth.uid() OR owner_id = auth.uid() OR (status = 'pending' AND lower(owner_email) = lower(auth.jwt()->>'email')));
CREATE POLICY invitation_request ON public.camera_invitations FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid() AND owner_id IS NULL AND status = 'pending' AND lower(owner_email) <> lower(auth.jwt()->>'email'));
CREATE OR REPLACE FUNCTION public.camera_decide(invitation uuid, decision text, allowed_start time DEFAULT '00:00', allowed_end time DEFAULT '00:00') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF decision NOT IN ('approved','declined','revoked') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 UPDATE public.camera_invitations SET status = decision, owner_id = auth.uid(), start_time = allowed_start, end_time = allowed_end WHERE id = invitation AND viewer_id <> auth.uid() AND ((status = 'pending' AND lower(owner_email) = lower(auth.jwt()->>'email')) OR owner_id = auth.uid());
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.camera_decide(uuid,text,time,time) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.camera_decide(uuid,text,time,time) TO authenticated;
CREATE OR REPLACE FUNCTION public.camera_allowed(invitation uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.camera_invitations WHERE id = invitation AND status = 'approved' AND auth.uid() IN (owner_id,viewer_id) AND (start_time = end_time OR (start_time < end_time AND (now() AT TIME ZONE 'America/Sao_Paulo')::time >= start_time AND (now() AT TIME ZONE 'America/Sao_Paulo')::time < end_time) OR (start_time > end_time AND ((now() AT TIME ZONE 'America/Sao_Paulo')::time >= start_time OR (now() AT TIME ZONE 'America/Sao_Paulo')::time < end_time))));
$$;
REVOKE ALL ON FUNCTION public.camera_allowed(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.camera_allowed(uuid) TO authenticated;
CREATE TABLE public.camera_signals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invitation_id uuid NOT NULL REFERENCES public.camera_invitations(id) ON DELETE CASCADE, sender_id uuid NOT NULL DEFAULT auth.uid(), kind text NOT NULL CHECK (kind IN ('request','offer','answer','ice','stop','alert')), payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), CHECK (octet_length(payload::text) < 50000)
);
GRANT SELECT, INSERT ON public.camera_signals TO authenticated;
GRANT ALL ON public.camera_signals TO service_role;
ALTER TABLE public.camera_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY signal_read ON public.camera_signals FOR SELECT TO authenticated USING (public.camera_allowed(invitation_id) AND created_at > now() - interval '10 minutes');
CREATE POLICY signal_write ON public.camera_signals FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.camera_allowed(invitation_id));
CREATE INDEX camera_signal_session ON public.camera_signals(invitation_id,created_at);
COMMENT ON TABLE public.camera_signals IS 'Ephemeral WebRTC negotiation and auxiliary event text only. No frames, recordings or audio are stored. Reads restricted to authorized schedules and recent sessions.';