CREATE TABLE public.community_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  recipe_title text NOT NULL,
  recipe_key text NOT NULL,
  first_name text NOT NULL DEFAULT 'Querida',
  category text NOT NULL DEFAULT 'dia_a_dia',
  storage_path text NOT NULL,
  share_consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'privada',
  caption text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.community_photos TO authenticated;
GRANT ALL ON public.community_photos TO service_role;
ALTER TABLE public.community_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own photos read" ON public.community_photos FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own photos insert" ON public.community_photos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = (CASE WHEN share_consent THEN 'pendente' ELSE 'privada' END) AND caption IS NULL AND approved_at IS NULL AND storage_path LIKE auth.uid()::text || '/%');
CREATE POLICY "own photos delete" ON public.community_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX community_photos_user_key ON public.community_photos (user_id, recipe_key, created_at DESC);

CREATE OR REPLACE FUNCTION public.admin_approve_photo(_id uuid, _caption text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.community_photos SET status = 'aprovada', caption = _caption, approved_at = now()
   WHERE id = _id AND share_consent = true;
END $$;
REVOKE ALL ON FUNCTION public.admin_approve_photo(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_photo(uuid, text) TO authenticated;

CREATE POLICY "dish photos own upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dish-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "dish photos own or admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dish-photos' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "dish photos own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'dish-photos' AND (storage.foldername(name))[1] = auth.uid()::text);