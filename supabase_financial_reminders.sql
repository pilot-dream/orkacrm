-- =====================================================================
-- SCRIPT DE ALERTA E LEMBRETES FINANCEIROS AUTOMATIZADOS (CRON + WEB PUSH)
-- Execute este script no SQL Editor do Supabase
-- =====================================================================

-- 1. MIGRAÇÃO DA TABELA TRANSACTIONS (ADICIONAR COLUNA PARA FLUXO FINANCEIRO CASO NÃO EXISTA)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS notification_financial_sent BOOLEAN DEFAULT false;

-- Criar índice para agilizar busca do cron
CREATE INDEX IF NOT EXISTS idx_transactions_financial_reminder 
ON public.transactions (status, type, notification_financial_sent) 
WHERE type = 'expense' AND status IN ('Pendente', 'Atrasado');

-- 2. CRIAR FUNÇÃO PRINCIPAL DE CHECAGEM PL/pgSQL
CREATE OR REPLACE FUNCTION public.check_financial_reminders()
RETURNS void AS $$
DECLARE
  trans_rec RECORD;
  trans_date DATE;
  today_date DATE;
  project_ref TEXT;
  target_email TEXT;
  email_rec RECORD;
BEGIN
  -- Obter a data atual no Fuso Horário de Brasília
  today_date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  
  -- Recuperar a referência do projeto Supabase dinamicamente
  BEGIN
    project_ref := current_setting('app.settings.project_ref', true);
    IF project_ref IS NULL THEN
      project_ref := 'smeuablaevmdozlkjbjx';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    project_ref := 'smeuablaevmdozlkjbjx';
  END;

  -- 1. Varrer contas a pagar pendentes/atrasadas não notificadas
  FOR trans_rec IN 
    SELECT * FROM public.transactions 
    WHERE type = 'expense' 
      AND status IN ('Pendente', 'Atrasado') 
      AND (notification_financial_sent = false OR notification_financial_sent IS NULL)
      AND dueDate IS NOT NULL 
      AND dueDate != ''
  LOOP
    -- 2. Converter dueDate para DATE de forma robusta
    BEGIN
      IF trans_rec.dueDate::text LIKE '%/%' THEN
        trans_date := to_date(trans_rec.dueDate::text, 'DD/MM/YYYY');
      ELSE
        trans_date := to_date(trans_rec.dueDate::text, 'YYYY-MM-DD');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Pula se a data for inválida
      CONTINUE;
    END;

    -- 3. Se a conta vence hoje ou já venceu (atrasada)
    IF trans_date <= today_date THEN
      -- 4. Encontrar responsáveis pelo Financeiro ou Administradores vinculados ao mesmo tenant
      FOR email_rec IN
        SELECT DISTINCT email FROM (
          SELECT email FROM public.team_members 
          WHERE tenant_id = trans_rec.tenant_id AND role IN ('Financeiro', 'Admin') AND status = 'Ativo'
          UNION
          SELECT email FROM public.profiles 
          WHERE tenant_id = trans_rec.tenant_id AND role IN ('Financeiro', 'Admin')
        ) sub
        WHERE email IS NOT NULL AND email != ''
      LOOP
        target_email := email_rec.email;

        -- 5. Disparar notificações dependendo do status de vencimento
        IF trans_date = today_date THEN
          -- Vence hoje:
          -- A) Inserir notificação interna
          INSERT INTO public.notifications (id, user_email, text, "time", read, tenant_id)
          VALUES (
            'notif-fin-' || extract(epoch from now())::text || '-' || substring(md5(random()::text) from 1 for 6),
            target_email,
            '⚠️ Atenção! A conta "' || trans_rec.description || '" de R$ ' || to_char(trans_rec.value, 'FM999G999G990D00') || ' vence hoje. Evite juros!',
            to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
            false,
            trans_rec.tenant_id
          );

          -- B) Disparar Push Notification
          PERFORM net.http_post(
            url := 'https://' || project_ref || '.supabase.co/functions/v1/send-push',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'apikey', 'sb_publishable_UZQmOucePwYEp5aL2a4uVA_qUXjkDvz',
              'Authorization', 'Bearer sb_publishable_UZQmOucePwYEp5aL2a4uVA_qUXjkDvz'
            ),
            body := jsonb_build_object(
              'user_email', target_email,
              'title', '⚠️ Conta Vence Hoje',
              'body', 'A conta "' || trans_rec.description || '" de R$ ' || trans_rec.value::text || ' vence hoje. Evite juros!',
              'url', '/financeiro'
            )
          );
        ELSE
          -- Atrasada/Vencida:
          -- A) Inserir notificação interna
          INSERT INTO public.notifications (id, user_email, text, "time", read, tenant_id)
          VALUES (
            'notif-fin-' || extract(epoch from now())::text || '-' || substring(md5(random()::text) from 1 for 6),
            target_email,
            '🚨 Urgente: A conta "' || trans_rec.description || '" de R$ ' || to_char(trans_rec.value, 'FM999G999G990D00') || ' está vencida desde ' || trans_rec.dueDate || '. Regularize o quanto antes!',
            to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
            false,
            trans_rec.tenant_id
          );

          -- B) Disparar Push Notification
          PERFORM net.http_post(
            url := 'https://' || project_ref || '.supabase.co/functions/v1/send-push',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'apikey', 'sb_publishable_UZQmOucePwYEp5aL2a4uVA_qUXjkDvz',
              'Authorization', 'Bearer sb_publishable_UZQmOucePwYEp5aL2a4uVA_qUXjkDvz'
            ),
            body := jsonb_build_object(
              'user_email', target_email,
              'title', '🚨 Conta Vencida',
              'body', 'A conta "' || trans_rec.description || '" de R$ ' || trans_rec.value::text || ' está vencida desde ' || trans_rec.dueDate || '.',
              'url', '/financeiro'
            )
          );
        END IF;
      END LOOP;

      -- Marcar como enviada para evitar disparos infinitos na mesma execução do dia
      UPDATE public.transactions SET notification_financial_sent = true WHERE id = trans_rec.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CADASTRAR O AGENDAMENTO DE DISPARO (CRON JOB DIÁRIO ÀS 08:00 HORÁRIO DE BRASÍLIA = 11:00 UTC)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'check-financial-reminders';

SELECT cron.schedule(
  'check-financial-reminders',
  '0 11 * * *', -- Executa às 11:00 UTC (08:00 Horário de Brasília)
  $$SELECT check_financial_reminders()$$
);

-- 4. CADASTRAR O RESET DIÁRIO (CRON JOB MEIA-NOITE HORÁRIO DE BRASÍLIA = 03:00 UTC)
-- Permite que contas vencidas (Atrasadas) ou pendentes ainda não pagas sejam reavaliadas no dia seguinte
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'reset-daily-financial-reminders';

SELECT cron.schedule(
  'reset-daily-financial-reminders',
  '0 3 * * *', -- Executa às 03:00 UTC (00:00 Horário de Brasília)
  $$
    UPDATE public.transactions 
    SET notification_financial_sent = false 
    WHERE type = 'expense' AND status IN ('Pendente', 'Atrasado');
  $$
);

-- Recarregar cache de esquema do PostgREST
NOTIFY pgrst, 'reload schema';
