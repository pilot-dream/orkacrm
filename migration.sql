-- ====================================================================
-- SCRIPT DE MIGRAÇÃO DEFINITIVO - ORKA CRM (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ====================================================================

-- 1. Criar a tabela de Produtos caso não exista
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    categoria TEXT,
    descricao TEXT,
    setup NUMERIC NOT NULL DEFAULT 0,
    mrr NUMERIC NOT NULL DEFAULT 0,
    percentual NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e criar política para produtos
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso completo produtos" ON public.produtos;
CREATE POLICY "Acesso completo produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);

-- 2. Garante que TODAS as colunas da Versão 2.0 existem na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS employee_count INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS products_negotiated JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_value NUMERIC DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mrr_value NUMERIC DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS percentage NUMERIC DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS probability INT DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS expected_date TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS comments TEXT[] DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 3. Criar a tabela associativa N:N para produtos negociados
CREATE TABLE IF NOT EXISTS public.lead_products (
    lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    setup_valor NUMERIC NOT NULL DEFAULT 0,
    mrr_valor NUMERIC NOT NULL DEFAULT 0,
    percentual_comissao NUMERIC NOT NULL DEFAULT 0,
    PRIMARY KEY (lead_id, product_id)
);

-- Habilitar RLS e criar política de acesso completo para a tabela de associação
ALTER TABLE public.lead_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso completo lead_products" ON public.lead_products;
CREATE POLICY "Acesso completo lead_products" ON public.lead_products FOR ALL USING (true) WITH CHECK (true);

-- 4. Garante que as colunas de checklists, comments, attachments e project_id existem na tabela tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 5. Forçar a recarga imediata do cache de esquema do Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';

-- 5.1 Criar tabelas auxiliares caso não existam (necessárias para o trigger de conversão)
CREATE TABLE IF NOT EXISTS public.atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relacionamento_tipo TEXT NOT NULL,
    relacionamento_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relacionamento_tipo TEXT NOT NULL,
    relacionamento_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    tamanho NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso completo atividades" ON public.atividades;
CREATE POLICY "Acesso completo atividades" ON public.atividades FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Acesso completo arquivos" ON public.arquivos;
CREATE POLICY "Acesso completo arquivos" ON public.arquivos FOR ALL USING (true) WITH CHECK (true);

-- 6. Adicionar novas colunas nas tabelas de leads e customers para conversão automática
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp BOOLEAN DEFAULT false;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS owner TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS products_negotiated JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS setup_value NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mrr_value NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS observations TEXT[] DEFAULT '{}';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS conversion_date TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS original_lead TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS converted_by TEXT;

-- 7. Função de gatilho bidirecional: conversão E reversão automática
CREATE OR REPLACE FUNCTION public.converter_lead_fechado()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id TEXT;
    v_project_id TEXT;
    v_mrr NUMERIC := 0;
    v_setup NUMERIC := 0;
BEGIN
    -- ============================================================
    -- CASO 1: Lead ENTRA em Fechado -> Converter em Cliente
    -- ============================================================
    IF lower(NEW.stage) = 'fechado' AND (OLD.stage IS NULL OR lower(OLD.stage) <> 'fechado') THEN
        IF NEW.owner IS NULL OR NEW.owner = '' THEN
            RAISE EXCEPTION 'Não é possível converter um lead para Fechado sem responsável comercial atribuído.';
        END IF;

        v_mrr := COALESCE(NEW.mrr_value, 0);
        v_setup := COALESCE(NEW.setup_value, NEW.value);

        -- Verificar duplicidade por CNPJ ou E-mail
        SELECT id INTO v_customer_id FROM public.customers 
        WHERE (NEW.cnpj IS NOT NULL AND NEW.cnpj <> '' AND cnpj = NEW.cnpj)
           OR (NEW.email IS NOT NULL AND NEW.email <> '' AND email = NEW.email)
        LIMIT 1;

        IF v_customer_id IS NOT NULL THEN
            UPDATE public.customers
            SET original_lead = NEW.company,
                conversion_date = to_char(now(), 'DD/MM/YYYY'),
                converted_by = COALESCE(NEW.owner, 'Comercial'),
                setup_value = v_setup, mrr_value = v_mrr, monthly_spend = v_mrr,
                products_negotiated = NEW.products_negotiated,
                owner = NEW.owner, poc = NEW.contact_name, contact_name = NEW.contact_name,
                email = NEW.email, phone = NEW.phone, whatsapp = COALESCE(NEW.whatsapp, false),
                status = 'active'
            WHERE id = v_customer_id;
        ELSE
            v_customer_id := NEW.id;
            INSERT INTO public.customers (
                id, name, plan, status, poc, monthly_spend, start_date,
                contact_name, role, email, phone, whatsapp, cnpj, address, city, state, country,
                segment, owner, source, products_negotiated, setup_value, mrr_value,
                observations, tags, conversion_date, original_lead, converted_by
            ) VALUES (
                v_customer_id, NEW.company, 'ORKA CRM Cliente Ativo', 'active',
                NEW.contact_name, v_mrr, to_char(now(), 'DD/MM/YYYY'),
                NEW.contact_name, NEW.role, NEW.email, NEW.phone, COALESCE(NEW.whatsapp, false),
                NEW.cnpj, NEW.address, NEW.city, NEW.state, NEW.country,
                NEW.segment, NEW.owner, NEW.source, NEW.products_negotiated,
                v_setup, v_mrr, NEW.observations, NEW.tags,
                to_char(now(), 'DD/MM/YYYY'), NEW.company, COALESCE(NEW.owner, 'Comercial')
            );
        END IF;

        -- Criar Projeto
        v_project_id := 'proj-' || substring(md5(random()::text) from 1 for 8);
        INSERT INTO public.projects (id, name, description, stage, deadline, priority, progress)
        VALUES (v_project_id, 'Projeto - ' || NEW.company,
            'Projeto operacional de onboarding gerado automaticamente a partir da conversão do Lead ' || NEW.company || '.',
            'fila', to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'), 'media', 0);

        -- Criar Transações Financeiras
        IF v_setup > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party)
            VALUES ('trx-setup-' || NEW.id, 'income', 'Taxa de Setup - ' || NEW.company,
                    v_setup, to_char(now(), 'DD/MM/YYYY'), 'Pendente', NEW.company);
        END IF;
        IF v_mrr > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party)
            VALUES ('trx-mrr-' || NEW.id, 'income', 'Mensalidade (MRR) - ' || NEW.company,
                    v_mrr, to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'), 'Pendente', NEW.company);
        END IF;

        -- Registrar Timeline
        INSERT INTO public.atividades (relacionamento_tipo, relacionamento_id, titulo, descricao)
        VALUES 
        ('lead', NEW.id, 'Lead convertido em Cliente', 'Convertido por ' || COALESCE(NEW.owner, 'Comercial') || ' em ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || '.'),
        ('cliente', v_customer_id, 'Cliente Ativado', 'Ficha cadastrada via automação de fechamento.'),
        ('projeto', v_project_id, 'Projeto de Onboarding', 'Projeto inicial ativado na fila.');

    -- ============================================================
    -- CASO 2: Lead SAI de Fechado -> Reverter conversão
    -- ============================================================
    ELSIF lower(OLD.stage) = 'fechado' AND lower(NEW.stage) <> 'fechado' THEN

        -- Desativar o Cliente (manter histórico, não deletar)
        UPDATE public.customers SET status = 'inactive'
        WHERE id = OLD.id OR (OLD.email IS NOT NULL AND OLD.email <> '' AND email = OLD.email);

        -- Remover transações financeiras geradas automaticamente
        DELETE FROM public.transactions WHERE id = 'trx-setup-' || OLD.id;
        DELETE FROM public.transactions WHERE id = 'trx-mrr-' || OLD.id;

        -- Remover projeto de onboarding gerado automaticamente
        DELETE FROM public.projects WHERE name = 'Projeto - ' || OLD.company
            AND description ILIKE '%gerado automaticamente%';

        -- Registrar reversão na Timeline
        INSERT INTO public.atividades (relacionamento_tipo, relacionamento_id, titulo, descricao)
        VALUES ('lead', OLD.id, 'Conversão Revertida',
            'Lead retirado de Fechado e movido para ' || NEW.stage || '. Cliente desativado e registros financeiros removidos.');

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Dropar trigger antiga e recriar
DROP TRIGGER IF EXISTS trg_lead_conversao ON public.leads;

CREATE TRIGGER trg_lead_conversao
AFTER UPDATE OF stage ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.converter_lead_fechado();

-- 9. Forçar a recarga imediata do cache de esquema do Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
