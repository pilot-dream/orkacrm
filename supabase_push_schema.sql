-- =====================================================================
-- SCHEMA: Tabela de Subscrições de Push Notifications
-- Execute este script no SQL Editor do Supabase (como New Query)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_info TEXT, -- Nome do navegador/SO opcional (ex: Chrome/Windows)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Usuário só pode gerenciar suas próprias inscrições
DROP POLICY IF EXISTS "RLS Push Subscriptions" ON public.push_subscriptions;

CREATE POLICY "RLS Push Subscriptions" ON public.push_subscriptions FOR ALL
USING (user_email = auth.jwt()->>'email')
WITH CHECK (user_email = auth.jwt()->>'email');

-- =====================================================================
-- COMO INTEGRAR O DISPARO DE PUSH COM AS NOTIFICAÇÕES DO SISTEMA:
-- =====================================================================
-- Você tem duas opções para fazer com que toda inserção na tabela de notificações
-- dispare um Push real automaticamente:
--
-- Opção A: Via Supabase Dashboard (Recomendado - Mais simples e estável)
-- 1. Acesse seu projeto no painel do Supabase.
-- 2. Vá em Database -> Webhooks.
-- 3. Clique em "Enable Webhooks" (se ainda não estiver ativado).
-- 4. Clique em "Create a new Webhook".
-- 5. Preencha:
--    - Name: send_push_webhook
--    - Table: notifications
--    - Events: INSERT
--    - Type: HTTP Request / Supabase Edge Function
--    - Method: POST
--    - Edge Function: Escolha "send-push" na lista.
-- 6. Clique em Save. Pronto!
--
-- Opção B: Via Trigger SQL (Usando a extensão pg_net)
-- Habilite se quiser rodar direto pelo banco (necessita pg_net ativado):
--
-- CREATE EXTENSION IF NOT EXISTS pg_net;
-- 
-- CREATE OR REPLACE FUNCTION public.tr_send_push_on_notification()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   project_ref TEXT := 'SEU_PROJECT_REF'; -- Substitua pelo id do seu projeto
--   service_role_key TEXT := 'SUA_SERVICE_ROLE_KEY'; -- Substitua pela key de admin
-- BEGIN
--   PERFORM net.http_post(
--     url := 'https://' || project_ref || '.supabase.co/functions/v1/send-push',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || service_role_key
--     ),
--     body := jsonb_build_object(
--       'user_email', NEW.user_email,
--       'title', 'ORKA CRM',
--       'body', NEW.text,
--       'url', '/'
--     )
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
-- 
-- CREATE OR REPLACE TRIGGER tr_on_notification_insert
--   AFTER INSERT ON public.notifications
--   FOR EACH ROW
--   EXECUTE FUNCTION public.tr_send_push_on_notification();

-- Forçar recarga do cache de esquema do Supabase
NOTIFY pgrst, 'reload schema';
