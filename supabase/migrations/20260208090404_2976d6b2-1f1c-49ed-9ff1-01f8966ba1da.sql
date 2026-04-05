
-- Remover políticas permissivas e recriar mais restritivas
DROP POLICY IF EXISTS "uploads_service_insert" ON storage.objects;
DROP POLICY IF EXISTS "uploads_service_update" ON storage.objects;

-- Apenas service role pode inserir/atualizar (nenhum usuário anon)
CREATE POLICY "uploads_insert_none" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'uploads' AND false);

CREATE POLICY "uploads_update_none" ON storage.objects
FOR UPDATE USING (bucket_id = 'uploads' AND false);
