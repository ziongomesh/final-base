
-- Storage bucket para arquivos CNH
INSERT INTO storage.buckets (id, name, public) VALUES ('cnh-files', 'cnh-files', true);

-- Políticas de acesso: leitura pública, escrita via service role
CREATE POLICY "cnh_files_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'cnh-files');
CREATE POLICY "cnh_files_service_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'cnh-files');
CREATE POLICY "cnh_files_service_update" ON storage.objects FOR UPDATE USING (bucket_id = 'cnh-files');
CREATE POLICY "cnh_files_service_delete" ON storage.objects FOR DELETE USING (bucket_id = 'cnh-files');
