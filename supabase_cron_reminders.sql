-- =====================================================================
-- SCRIPT DE INFRAESTRUTURA DE LEMBRETES AUTÔNOMOS (CRON + WEB PUSH)
-- Execute este script no SQL Editor do Supabase (como New Query)
-- =====================================================================

-- 1. HABILITAR EXTENSÕES NECESSÁRIAS
-- pg_cron: Motor de agendamento de tarefas em segundo plano no PostgreSQL
-- pg_net: Realiza requisições HTTP assíncronas assinaladas diretamente pelo banco
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. MIGRAÇÃO DA TABELA TASKS (ADICIONAR COLUNAS DO FLUXO DE COMPROMISSOS CASO NÃO EXISTAM)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "time" TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS location_link TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- Criar índice para melhorar a velocidade da busca de lembretes pelo cron a cada minuto
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_search 
ON public.tasks (status, reminder, notification_sent) 
WHERE status != 'concluida' AND reminder IS NOT NULL AND reminder != 'sem_lembrete';

-- 3. CRIAR FUNÇÃO PRINCIPAL DE CHECAGEM PL/pgSQL
CREATE OR REPLACE FUNCTION public.check_task_reminders()
RETURNS void AS $$
DECLARE
  task_rec RECORD;
  reminder_offset INTERVAL;
  task_datetime TIMESTAMP WITH TIME ZONE;
  reminder_time TIMESTAMP WITH TIME ZONE;
  assignee_email TEXT;
  assignees_list TEXT[];
  assignee_name TEXT;
  project_ref TEXT;
BEGIN
  -- Recuperar a referência do projeto Supabase dinamicamente
  BEGIN
    project_ref := current_setting('app.settings.project_ref', true);
    IF project_ref IS NULL THEN
      -- Fallback para o project_ref deste workspace
      project_ref := 'smeuablaevmdozlkjbjx';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    project_ref := 'smeuablaevmdozlkjbjx';
  END;

  -- 1. Varrer tarefas não concluídas com lembretes pendentes
  FOR task_rec IN 
    SELECT * FROM public.tasks 
    WHERE status != 'concluida' 
      AND reminder IS NOT NULL 
      AND reminder != 'sem_lembrete' 
      AND (notification_sent = false OR notification_sent IS NULL)
      AND deadline IS NOT NULL 
      AND deadlin    -- 2. Converter o prazo (deadline + time) para timestamp com fuso horário brasileiro
    BEGIN
      -- deadline pode estar formatado como 'DD/MM/YYYY' (gerado por triggers de onboarding) 
      -- ou como 'YYYY-MM-DD' (salvo pelo date picker HTML5 do frontend)
      IF task_rec.deadline LIKE '%/%' THEN
        task_datetime := to_timestamp(
          task_rec.deadline || ' ' || COALESCE(NULLIF(task_rec.time, ''), '09:00'), 
          'DD/MM/YYYY HH24:MI'
        ) AT TIME ZONE 'America/Sao_Paulo';
      ELSE
        task_datetime := to_timestamp(
          task_rec.deadline || ' ' || COALESCE(NULLIF(task_rec.time, ''), '09:00'), 
          'YYYY-MM-DD HH24:MI'
        ) AT TIME ZONE 'America/Sao_Paulo';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignora a tarefa silenciosamente se os dados de data/hora forem inválidos
      CONTINUE;
    END;

    -- 3. Calcular o deslocamento de tempo (offset) com base no tipo de lembrete
    CASE task_rec.reminder
      WHEN 'no_horario' THEN reminder_offset := interval '0 minutes';
      WHEN '5_min'      THEN reminder_offset := interval '5 minutes';
      WHEN '10_min'     THEN reminder_offset := interval '10 minutes';
      WHEN '15_min'     THEN reminder_offset := interval '15 minutes';
      WHEN '30_min'     THEN reminder_offset := interval '30 minutes';
      WHEN '1_hora'     THEN reminder_offset := interval '1 hour';
      WHEN '2_horas'    THEN reminder_offset := interval '2 hours';
      WHEN '1_dia'      THEN reminder_offset := interval '1 day';
      ELSE reminder_offset := NULL;
    END CASE;

    -- 4. Verificar se chegou a hora de disparar o lembrete
    IF reminder_offset IS NOT NULL THEN
      reminder_time := task_datetime - reminder_offset;

      -- Dispara se o momento atual passou do horário do lembrete, com tolerância de 5 minutos (janela de segurança)
      IF now() >= reminder_time AND now() <= reminder_time + interval '5 minutes' THEN
        
        -- 5. Mapear os membros responsáveis (armazenados como string CSV) para seus respectivos emails
        IF task_rec.assignee IS NOT NULL AND task_rec.assignee != '' THEN
          assignees_list := string_to_array(task_rec.assignee, ',');
          
          FOREACH assignee_name IN ARRAY assignees_list LOOP
            assignee_name := trim(assignee_name);
            assignee_email := NULL;
            
            -- Busca o email correspondente em team_members
            SELECT email INTO assignee_email FROM public.team_members 
            WHERE trim(name) = assignee_name AND tenant_id = task_rec.tenant_id
            LIMIT 1;

            -- Fallback: tenta buscar na tabela de profiles se não encontrar na equipe direta
            IF assignee_email IS NULL THEN
              SELECT email INTO assignee_email FROM public.profiles
              WHERE trim(name) = assignee_name AND tenant_id = task_rec.tenant_id
              LIMIT 1;
            END IF;

            -- 6. Se localizou o email do usuário, registra a notificação e aciona o push
            IF assignee_email IS NOT NULL THEN
              
              -- A) Inserir notificação no banco de dados (Sininho em tempo real)
              INSERT INTO public.notifications (id, user_email, text, "time", read, tenant_id)
              VALUES (
                'notif-' || extract(epoch from now())::text || '-' || substring(md5(random()::text) from 1 for 6),
                assignee_email,
                '⏰ Lembrete: A tarefa "' || task_rec.title || '" inicia às ' || COALESCE(task_rec.time, '09:00') || '.',
                to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
                false,
                task_rec.tenant_id
              );

              -- B) Disparar requisição HTTP assíncrona para a Edge Function de push
              PERFORM net.http_post(
                url := 'https://' || project_ref || '.supabase.co/functions/v1/send-push',
                headers := jsonb_build_object(
                  'Content-Type', 'application/json'
                ),
                body := jsonb_build_object(
                  'user_email', assignee_email,
                  'title', '⏰ Lembrete de Tarefa',
                  'body', 'A tarefa "' || task_rec.title || '" inicia às ' || COALESCE(task_rec.time, '09:00') || '.',
                  'url', '/'
                )
              );
            END IF;
          END LOOP;
        END IF;

        -- 7. Atualizar flag de controle para evitar re-disparos (Garantia anti-spam)
        UPDATE public.tasks SET notification_sent = true WHERE id = task_rec.id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CADASTRAR O AGENDAMENTO DE CHECAGEM (CRON JOB DE 1 MINUTO)
-- Remove o agendamento antigo caso exista para evitar duplicidade de execuções
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'check-task-reminders';

SELECT cron.schedule(
  'check-task-reminders',   -- Nome identificador único do cron job
  '* * * * *',              -- Expressão cron (roda a cada minuto, de minuto em minuto)
  $$SELECT check_task_reminders()$$
);

-- 5. CADASTRAR CRON JOB DE REINICIALIZAÇÃO DIÁRIA (MEIA-NOITE)
-- Limpa a flag notification_sent para tarefas pendentes futuras ou reagendadas.
-- Isso é útil se uma tarefa recorrente ou reagendada para o futuro precisar receber novos lembretes.
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname = 'reset-daily-reminders';

SELECT cron.schedule(
  'reset-daily-reminders',
  '0 3 * * *', -- Executa às 03:00 UTC (00:00 Horário de Brasília)
  $$
    UPDATE public.tasks 
    SET notification_sent = false 
    WHERE status != 'concluida' 
      AND (
        CASE 
          WHEN deadline LIKE '%/%' THEN to_date(deadline, 'DD/MM/YYYY')
          ELSE to_date(deadline, 'YYYY-MM-DD')
        END >= (now() AT TIME ZONE 'America/Sao_Paulo')::date
      );
  $$
);

-- Recarregar cache de esquema do Supabase
NOTIFY pgrst, 'reload schema';
