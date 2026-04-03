
-- Criar bucket uploads (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Política de leitura pública
CREATE POLICY "uploads_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'uploads');

-- Política de upload via service role (edge functions)
CREATE POLICY "uploads_service_insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- Política de update via service role
CREATE POLICY "uploads_service_update" ON storage.objects
FOR UPDATE USING (bucket_id = 'uploads');
