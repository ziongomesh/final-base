
CREATE TABLE public.downloads (
  id integer PRIMARY KEY DEFAULT 1,
  cnh_iphone text DEFAULT '',
  cnh_apk text DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "downloads_select_all" ON public.downloads FOR SELECT USING (true);
CREATE POLICY "downloads_update_service" ON public.downloads FOR UPDATE USING (false);
CREATE POLICY "downloads_insert_service" ON public.downloads FOR INSERT WITH CHECK (false);
CREATE POLICY "downloads_delete_service" ON public.downloads FOR DELETE USING (false);

-- Inserir linha padrão
INSERT INTO public.downloads (id, cnh_iphone, cnh_apk) VALUES (1, '', '');
