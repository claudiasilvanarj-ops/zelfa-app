CREATE TABLE public.dietary_restrictions (
  user_id uuid PRIMARY KEY DEFAULT auth.uid(),
  restrictions text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dietary_restrictions TO authenticated;
GRANT ALL ON public.dietary_restrictions TO service_role;
ALTER TABLE public.dietary_restrictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY dietary_owner ON public.dietary_restrictions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);