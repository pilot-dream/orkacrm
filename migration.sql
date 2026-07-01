-- ====================================================================
-- SCRIPT DE MIGRAÇÃO CONSOLIDADO - ORKA CRM (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ====================================================================

-- Habilitar a extensão UUID caso queira chaves primárias automáticas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CRIAR TABELAS CASO NÃO EXISTAM

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

CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'contato',
    ai_score INT DEFAULT 50,
    ai_insights TEXT,
    date_added TEXT,
    email TEXT,
    needs TEXT,
    phone TEXT,
    whatsapp BOOLEAN DEFAULT false,
    source TEXT DEFAULT 'Site',
    owner TEXT,
    observations TEXT[] DEFAULT '{}',
    history TEXT[] DEFAULT '{}',
    timeline JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lead_products (
    lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
    setup_valor NUMERIC NOT NULL DEFAULT 0,
    mrr_valor NUMERIC NOT NULL DEFAULT 0,
    percentual_comissao NUMERIC NOT NULL DEFAULT 0,
    PRIMARY KEY (lead_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    abbr TEXT,
    plan TEXT,
    automations_count INT DEFAULT 0,
    monthly_spend NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    start_date TEXT,
    poc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    description TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    due_date TEXT NOT NULL,
    payment_date TEXT,
    category TEXT,
    status TEXT NOT NULL,
    party TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    stage TEXT NOT NULL DEFAULT 'planejamento',
    deadline TEXT,
    priority TEXT DEFAULT 'media',
    progress INT DEFAULT 0,
    team JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    files JSONB DEFAULT '[]'::jsonb,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    priority TEXT DEFAULT 'media',
    assignee TEXT,
    deadline TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    avatar TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    text TEXT NOT NULL,
    time TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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


-- 2. ADICIONAR COLUNAS DE TENANT_ID A TODAS AS TABELAS

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.arquivos ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.lead_products ADD COLUMN IF NOT EXISTS tenant_id TEXT;


-- 3. ADICIONAR NOVAS COLUNAS FINANCEIRAS E AUXILIARES

-- Leads
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
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_payment_method TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_payment_date TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_installments_count INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_installment_value NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_first_installment_date TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mrr_due_day INT DEFAULT 10;

-- Customers
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
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mrr_due_day INT DEFAULT 10;

-- Tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installment_number INT;


-- 4. FUNÇÃO E TRIGGER DE CONVERSÃO DE LEAD

CREATE OR REPLACE FUNCTION public.converter_lead_fechado()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id TEXT;
    v_project_id TEXT;
    v_mrr NUMERIC := 0;
    v_setup NUMERIC := 0;
    v_tenant TEXT;
BEGIN
    -- Dispara quando o lead vai para Fechado
    IF lower(NEW.stage) = 'fechado' AND (OLD.stage IS NULL OR lower(OLD.stage) <> 'fechado') THEN
        IF NEW.owner IS NULL OR NEW.owner = '' THEN
            RAISE EXCEPTION 'Não é possível converter um lead para Fechado sem responsável comercial atribuído.';
        END IF;

        -- Pegar tenant_id do lead
        v_tenant := COALESCE(NEW.tenant_id, 'orka.ai');

        v_mrr := COALESCE(NEW.mrr_value, 0);
        v_setup := COALESCE(NEW.setup_value, NEW.value);

        -- Verificar duplicidade por CNPJ ou E-mail
        SELECT id INTO v_customer_id FROM public.customers 
        WHERE ((NEW.cnpj IS NOT NULL AND NEW.cnpj <> '' AND cnpj = NEW.cnpj)
           OR (NEW.email IS NOT NULL AND NEW.email <> '' AND email = NEW.email))
           AND tenant_id = v_tenant
        LIMIT 1;

        IF v_customer_id IS NOT NULL THEN
            UPDATE public.customers
            SET original_lead = NEW.company,
                conversion_date = to_char(now(), 'DD/MM/YYYY'),
                converted_by = COALESCE(NEW.owner, 'Comercial'),
                setup_value = v_setup, mrr_value = v_mrr, monthly_spend = v_mrr,
                monthly_revenue = v_mrr, mrr_due_day = COALESCE(NEW.mrr_due_day, 10),
                products_negotiated = NEW.products_negotiated,
                owner = NEW.owner, poc = NEW.contact_name, contact_name = NEW.contact_name,
                email = NEW.email, phone = NEW.phone, whatsapp = COALESCE(NEW.whatsapp, false),
                status = 'active', tenant_id = v_tenant
            WHERE id = v_customer_id;
        ELSE
            v_customer_id := NEW.id;
            INSERT INTO public.customers (
                id, name, plan, status, poc, monthly_spend, start_date,
                contact_name, role, email, phone, whatsapp, cnpj, address, city, state, country,
                segment, owner, source, products_negotiated, setup_value, mrr_value,
                observations, tags, conversion_date, original_lead, converted_by,
                monthly_revenue, mrr_due_day, tenant_id
            ) VALUES (
                v_customer_id, NEW.company, 'ORKA CRM Cliente Ativo', 'active',
                NEW.contact_name, v_mrr, to_char(now(), 'DD/MM/YYYY'),
                NEW.contact_name, NEW.role, NEW.email, NEW.phone, COALESCE(NEW.whatsapp, false),
                NEW.cnpj, NEW.address, NEW.city, NEW.state, NEW.country,
                NEW.segment, NEW.owner, NEW.source, NEW.products_negotiated,
                v_setup, v_mrr, NEW.observations, NEW.tags,
                to_char(now(), 'DD/MM/YYYY'), NEW.company, COALESCE(NEW.owner, 'Comercial'),
                v_mrr, COALESCE(NEW.mrr_due_day, 10), v_tenant
            );
        END IF;

        -- Criar Projeto
        v_project_id := 'proj-' || substring(md5(random()::text) from 1 for 8);
        INSERT INTO public.projects (id, name, description, stage, deadline, priority, progress, tenant_id)
        VALUES (
            v_project_id, 
            'Projeto - ' || NEW.company,
            'Projeto operacional de onboarding gerado automaticamente a partir da conversão do Lead ' || NEW.company || '.',
            'fila', 
            to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'), 
            'media', 
            0,
            v_tenant
        );

        -- Criar Transações Financeiras
        IF v_setup > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id)
            VALUES (
                'trx-setup-' || NEW.id, 
                'income', 
                'Taxa de Setup - ' || NEW.company,
                v_setup, 
                to_char(now(), 'DD/MM/YYYY'), 
                'Pendente', 
                NEW.company,
                v_tenant
            );
        END IF;
        
        IF v_mrr > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id)
            VALUES (
                'trx-mrr-' || NEW.id, 
                'income', 
                'Mensalidade (MRR) - ' || NEW.company,
                v_mrr, 
                to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'), 
                'Pendente', 
                NEW.company,
                v_tenant
            );
        END IF;

        -- Registrar Timeline
        INSERT INTO public.atividades (relacionamento_tipo, relacionamento_id, titulo, descricao, tenant_id)
        VALUES 
        ('lead', NEW.id, 'Lead convertido em Cliente', 'Convertido por ' || COALESCE(NEW.owner, 'Comercial') || ' em ' || to_char(now(), 'DD/MM/YYYY HH24:MI') || '.', v_tenant),
        ('cliente', v_customer_id, 'Cliente Ativado', 'Ficha cadastrada via automação de fechamento.', v_tenant),
        ('projeto', v_project_id, 'Projeto de Onboarding', 'Projeto inicial ativado na fila.', v_tenant);

    ELSIF lower(OLD.stage) = 'fechado' AND lower(NEW.stage) <> 'fechado' THEN
        -- Desativar o Cliente (manter histórico, não deletar)
        UPDATE public.customers SET status = 'inactive'
        WHERE id = OLD.id AND tenant_id = OLD.tenant_id;

        -- Remover transações financeiras geradas automaticamente
        DELETE FROM public.transactions WHERE id = 'trx-setup-' || OLD.id;
        DELETE FROM public.transactions WHERE id = 'trx-mrr-' || OLD.id;

        -- Remover projeto de onboarding gerado automaticamente
        DELETE FROM public.projects 
        WHERE name = 'Projeto - ' || OLD.company
          AND description ILIKE '%gerado automaticamente%'
          AND tenant_id = OLD.tenant_id;

        -- Registrar reversão na Timeline
        INSERT INTO public.atividades (relacionamento_tipo, relacionamento_id, titulo, descricao, tenant_id)
        VALUES (
            'lead', 
            OLD.id, 
            'Conversão Revertida',
            'Lead retirado de Fechado e movido para ' || NEW.stage || '. Cliente desativado e registros financeiros removidos.',
            OLD.tenant_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger antiga e recriar
DROP TRIGGER IF EXISTS trg_lead_conversao ON public.leads;

CREATE TRIGGER trg_lead_conversao
AFTER UPDATE OF stage ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.converter_lead_fechado();


-- 5. ATIVAR E CONFIGURAR SEGURANÇA ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_products ENABLE ROW LEVEL SECURITY;

-- Remover políticas RLS antigas
DROP POLICY IF EXISTS "RLS Perfil" ON public.profiles;
DROP POLICY IF EXISTS "RLS Team Members" ON public.team_members;
DROP POLICY IF EXISTS "RLS Leads" ON public.leads;
DROP POLICY IF EXISTS "RLS Customers" ON public.customers;
DROP POLICY IF EXISTS "RLS Projects" ON public.projects;
DROP POLICY IF EXISTS "RLS Tasks" ON public.tasks;
DROP POLICY IF EXISTS "RLS Transactions" ON public.transactions;
DROP POLICY IF EXISTS "RLS Notifications" ON public.notifications;
DROP POLICY IF EXISTS "RLS Produtos" ON public.produtos;
DROP POLICY IF EXISTS "RLS Atividades" ON public.atividades;
DROP POLICY IF EXISTS "RLS Arquivos" ON public.arquivos;
DROP POLICY IF EXISTS "RLS Lead Products" ON public.lead_products;

-- Criar políticas baseadas no tenant_id com tratamento seguro de fallback
CREATE POLICY "RLS Perfil" ON public.profiles FOR ALL 
USING (email = auth.jwt()->>'email' OR tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (email = auth.jwt()->>'email' OR tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Team Members" ON public.team_members FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Leads" ON public.leads FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Customers" ON public.customers FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Projects" ON public.projects FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Tasks" ON public.tasks FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Transactions" ON public.transactions FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Notifications" ON public.notifications FOR ALL 
USING (user_email = auth.jwt()->>'email') 
WITH CHECK (user_email = auth.jwt()->>'email');

CREATE POLICY "RLS Produtos" ON public.produtos FOR ALL 
USING (tenant_id IS NULL OR tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));


CREATE POLICY "RLS Atividades" ON public.atividades FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Arquivos" ON public.arquivos FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));

CREATE POLICY "RLS Lead Products" ON public.lead_products FOR ALL 
USING (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2))) 
WITH CHECK (tenant_id = COALESCE((SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'), split_part(auth.jwt()->>'email', '@', 2)));


-- 6. FORÇAR RECARGA DO CACHE DE ESQUEMA DO SUPABASE
NOTIFY pgrst, 'reload schema';
