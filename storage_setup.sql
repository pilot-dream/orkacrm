-- ====================================================================
-- CONFIGURAR BUCKET DE STORAGE PARA ARQUIVOS - ORKA CRM
-- Execute este script no SQL Editor do seu projeto Supabase
-- caso o bucket "arquivos" nao exista ainda.
-- ====================================================================

-- Criar o bucket "arquivos" (publico para leitura de URLs geradas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'arquivos',
  'arquivos',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Remover politicas antigas se existirem
DROP POLICY IF EXISTS "Storage Arquivos - Upload" ON storage.objects;
DROP POLICY IF EXISTS "Storage Arquivos - Download" ON storage.objects;
DROP POLICY IF EXISTS "Storage Arquivos - Delete" ON storage.objects;
DROP POLICY IF EXISTS "Storage Arquivos - Update" ON storage.objects;

-- Politica: qualquer usuario autenticado pode fazer upload
CREATE POLICY "Storage Arquivos - Upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'arquivos');

-- Politica: leitura publica (para URLs publicas funcionarem)
CREATE POLICY "Storage Arquivos - Download" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'arquivos');

-- Politica: usuario autenticado pode deletar
CREATE POLICY "Storage Arquivos - Delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'arquivos');

-- Politica: usuario autenticado pode atualizar
CREATE POLICY "Storage Arquivos - Update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'arquivos');