-- =====================================================================
-- UPGRADE: Módulo Tarefas - Novos Campos
-- Execute no SQL Editor do Supabase como New Query
-- =====================================================================

-- Adicionar campo de horário da tarefa (ex: "14:30")
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS time TEXT;

-- Adicionar tipo da tarefa (ex: 'reuniao', 'ligacao', etc.)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'outro';

-- Adicionar campo de lembrete
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reminder TEXT DEFAULT 'sem_lembrete';

-- Adicionar local / link de reunião (Google Meet, Zoom, endereço físico)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS location_link TEXT;

-- Arquitetura de notificações: flag para saber se já foi notificado
-- FUTURE_WORKER: Verificar tarefas próximas, comparar horário atual e enviar notificação
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;

-- Forçar recarga do cache de esquema do Supabase
NOTIFY pgrst, 'reload schema';
