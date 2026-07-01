-- ====================================================================
-- SCRIPT DE MODELAGEM BANCO DE DADOS - ORKA CRM (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase para criar as tabelas
-- ====================================================================

-- Habilitar a extensão UUID caso queira chaves primárias automáticas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE LEADS (Funil de Vendas & CRM)
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

-- 2. TABELA DE CLIENTES (Diretório de Clientes Ativos)
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

-- 3. TABELA DE TRANSAÇÕES FINANCEIRAS (Receitas & Despesas)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- 'income' = Receita, 'expense' = Despesa
    description TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    due_date TEXT NOT NULL,
    payment_date TEXT,
    category TEXT,
    status TEXT NOT NULL,
    party TEXT NOT NULL, -- Cliente pagador ou Fornecedor credor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA DE PROPOSTAS COMERCIAIS
CREATE TABLE IF NOT EXISTS public.proposals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE CONTRATOS
CREATE TABLE IF NOT EXISTS public.contracts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE COBRANÇAS / PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    client TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    due_date TEXT NOT NULL,
    payment_date TEXT,
    method TEXT DEFAULT 'Pix',
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA DE AGENTES IA
CREATE TABLE IF NOT EXISTS public.agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    objective TEXT NOT NULL,
    model TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo',
    last_run TEXT,
    tokens_used INT DEFAULT 0,
    cost NUMERIC DEFAULT 0.00,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DE AUTOMAÇÕES / FLUXOS DE TRABALHO
CREATE TABLE IF NOT EXISTS public.automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    action TEXT NOT NULL,
    runs INT DEFAULT 0,
    error_rate NUMERIC DEFAULT 0.0,
    active BOOLEAN DEFAULT true,
    nodes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA DE WEBHOOKS
CREATE TABLE IF NOT EXISTS public.webhooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    method TEXT DEFAULT 'POST',
    associated_flow TEXT,
    status TEXT DEFAULT 'Ativo',
    latency TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABELA DE LOGS DE EXECUÇÃO
CREATE TABLE IF NOT EXISTS public.execution_logs (
    id TEXT PRIMARY KEY,
    flow_name TEXT NOT NULL,
    status TEXT NOT NULL,
    time TEXT NOT NULL,
    duration TEXT,
    input_payload TEXT,
    output_payload TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- CONFIGURAÇÕES DE LINHA DE SEGURANÇA (RLS)
-- Ativando RLS e criando políticas públicas para acesso anônimo/desenvolvimento
-- ====================================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para desenvolvimento rápido (pode ser restrito para 'authenticated' posteriormente)
CREATE POLICY "Acesso completo leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo proposals" ON public.proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo contracts" ON public.contracts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo agents" ON public.agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo automations" ON public.automations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo webhooks" ON public.webhooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo execution_logs" ON public.execution_logs FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- CARGA DE INSERÇÃO MOCK DE EXEMPLO
-- ====================================================================
INSERT INTO public.leads (id, company, contact_name, value, stage, ai_score, ai_insights, date_added, email, needs, phone, whatsapp, source, owner)
VALUES 
('1', 'Stripe Brasil', 'Beatriz Santos', 45000, 'proposta', 98, 'Fit comercial excelente.', '15/06/2026', 'beatriz@stripe.com', 'Integração de conciliação financeira.', '(11) 98765-4321', true, 'Outbound', 'Orka Admin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.customers (id, name, abbr, plan, automations_count, monthly_spend, status, start_date, poc)
VALUES 
('1', 'Stripe Brasil', 'ST', 'ORKA Enterprise AI', 15, 10000, 'active', '01 Fev 2026', 'Beatriz Santos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (id, type, description, value, due_date, payment_date, category, status, party)
VALUES 
('inc-1', 'income', 'Setup Orquestração Comercial IA', 45000, '15/06/2026', '15/06/2026', 'Setup', 'Recebido', 'Stripe Brasil')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 11. TABELAS DE PROJETOS E TAREFAS (INTEGRAÇÃO DE OPERAÇÃO DO TIME)
-- ====================================================================
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

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- 12. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    avatar TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. TABELA DE MEMBROS DA EQUIPE
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. TABELA DE NOTIFICAÇÕES EM TEMPO REAL
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    text TEXT NOT NULL,
    time TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo team_members" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- ATUALIZAÇÕES DA VERSÃO 2.0 (ORKA CRM v2.0 MVP)
-- ====================================================================

-- Alteração da tabela de Leads para incluir campos adicionais exigidos pelo PRD
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

-- 15. TABELA DE PRODUTOS (Mestre)
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

-- 16. TABELA DE PROPOSTAS
CREATE TABLE IF NOT EXISTS public.propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id TEXT NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    valor_setup NUMERIC NOT NULL DEFAULT 0,
    valor_mrr NUMERIC NOT NULL DEFAULT 0,
    probabilidade INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'rascunho',
    data_prevista TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. TABELA DE ATIVIDADES (Timeline Universal)
CREATE TABLE IF NOT EXISTS public.atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relacionamento_tipo TEXT NOT NULL, -- 'lead', 'cliente', 'projeto'
    relacionamento_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. TABELA DE ARQUIVOS
CREATE TABLE IF NOT EXISTS public.arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relacionamento_tipo TEXT NOT NULL, -- 'lead', 'cliente', 'projeto'
    relacionamento_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    tamanho NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS públicas para desenvolvimento
CREATE POLICY "Acesso completo produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo propostas" ON public.propostas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo atividades" ON public.atividades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo arquivos" ON public.arquivos FOR ALL USING (true) WITH CHECK (true);

-- 19. FUNÇÃO E TRIGGER DE CONVERSÃO DE LEAD (Backend Automation)
CREATE OR REPLACE FUNCTION public.converter_lead_fechado()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id TEXT;
    v_project_id TEXT;
    v_mrr NUMERIC := 0;
    v_setup NUMERIC := 0;
BEGIN
    -- Dispara quando o lead vai para Fechado
    IF NEW.stage = 'Fechado' AND (OLD.stage IS NULL OR OLD.stage <> 'Fechado') THEN
        -- Validar se há responsável
        IF NEW.owner IS NULL OR NEW.owner = '' THEN
            RAISE EXCEPTION 'Não é possível converter um lead sem responsável atribuído.';
        END IF;

        -- Pegar MRR/Setup definidos no lead
        v_mrr := COALESCE(NEW.mrr_value, 0);
        v_setup := COALESCE(NEW.setup_value, NEW.value);

        -- Criar Cliente (tabela customers do schema original)
        v_customer_id := NEW.id;
        INSERT INTO public.customers (id, name, plan, status, poc, monthly_spend, start_date)
        VALUES (
            v_customer_id,
            NEW.company,
            'ORKA CRM Cliente',
            'active',
            NEW.contact_name,
            v_mrr,
            to_char(now(), 'DD/MM/YYYY')
        )
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            monthly_spend = EXCLUDED.monthly_spend,
            poc = EXCLUDED.poc;

        -- Criar Projeto (tabela projects do schema original)
        v_project_id := 'proj-' || substring(md5(random()::text) from 1 for 8);
        INSERT INTO public.projects (id, name, description, stage, deadline, priority, progress)
        VALUES (
            v_project_id,
            'Projeto - ' || NEW.company,
            'Projeto operacional gerado automaticamente a partir da conversão do Lead.',
            'fila', -- "Fila" é o estágio inicial do Módulo 5 do PRD
            to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'),
            'media',
            0
        );

        -- Criar Transação de Setup no Financeiro (tabela transactions do schema original)
        IF v_setup > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party)
            VALUES (
                'trx-setup-' || substring(md5(random()::text) from 1 for 8),
                'income',
                'Taxa de Setup - ' || NEW.company,
                v_setup,
                to_char(now(), 'DD/MM/YYYY'),
                'Pendente',
                NEW.company
            );
        END IF;

        -- Criar Transação de MRR (Mensalidade) no Financeiro se maior que zero
        IF v_mrr > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party)
            VALUES (
                'trx-mrr-' || substring(md5(random()::text) from 1 for 8),
                'income',
                'Mensalidade (MRR) - ' || NEW.company,
                v_mrr,
                to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'),
                'Pendente',
                NEW.company
            );
        END IF;

        -- Registrar as atividades na timeline
        INSERT INTO public.atividades (relacionamento_tipo, relacionamento_id, titulo, descricao)
        VALUES 
        ('lead', NEW.id, 'Lead Fechado', 'Lead marcado como Fechado e convertido em cliente.'),
        ('cliente', v_customer_id, 'Cliente Criado', 'Cliente gerado a partir do Lead Fechado.'),
        ('projeto', v_project_id, 'Projeto Criado', 'Projeto Operacional criado automaticamente na fila.');

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar trigger se já existir para evitar conflitos de reinicialização
DROP TRIGGER IF EXISTS trg_lead_conversao ON public.leads;

CREATE TRIGGER trg_lead_conversao
AFTER UPDATE OF stage ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.converter_lead_fechado();

-- Alteração da tabela de Tasks para suportar relacionamentos e dados adicionais de v2.0
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- ====================================================================
-- ARQUITETURA MULTI-TENANT / SEGURANÇA RLS
-- ====================================================================

-- 1. Adição da coluna tenant_id a todas as tabelas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.propostas ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE public.arquivos ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- 2. Atualizar funções triggers para herdar tenant_id na conversão de leads
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
    IF NEW.stage = 'Fechado' AND (OLD.stage IS NULL OR OLD.stage <> 'Fechado') THEN
        -- Validar se há responsável
        IF NEW.owner IS NULL OR NEW.owner = '' THEN
            RAISE EXCEPTION 'Não é possível converter um lead sem responsável atribuído.';
        END IF;

        -- Pegar tenant_id do lead
        v_tenant := NEW.tenant_id;

        -- Pegar MRR/Setup definidos no lead
        v_mrr := COALESCE(NEW.mrr_value, 0);
        v_setup := COALESCE(NEW.setup_value, NEW.value);

        -- Criar Cliente (tabela customers do schema original)
        v_customer_id := NEW.id;
        INSERT INTO public.customers (id, name, plan, status, poc, monthly_spend, start_date, tenant_id)
        VALUES (
            v_customer_id,
            NEW.company,
            'ORKA CRM Cliente',
            'active',
            NEW.contact_name,
            v_mrr,
            to_char(now(), 'DD/MM/YYYY'),
            v_tenant
        )
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            monthly_spend = EXCLUDED.monthly_spend,
            poc = EXCLUDED.poc,
            tenant_id = EXCLUDED.tenant_id;

        -- Criar Projeto (tabela projects do schema original)
        v_project_id := 'proj-' || substring(md5(random()::text) from 1 for 8);
        INSERT INTO public.projects (id, name, description, stage, deadline, priority, progress, tenant_id)
        VALUES (
            v_project_id,
            'Projeto - ' || NEW.company,
            'Projeto operacional gerado automaticamente a partir da conversão do Lead.',
            'fila',
            to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'),
            'media',
            0,
            v_tenant
        );

        -- Criar Transação de Setup no Financeiro (tabela transactions do schema original)
        IF v_setup > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id)
            VALUES (
                'trx-setup-' || substring(md5(random()::text) from 1 for 8),
                'income',
                'Taxa de Setup - ' || NEW.company,
                v_setup,
                to_char(now(), 'DD/MM/YYYY'),
                'Pendente',
                NEW.company,
                v_tenant
            );
        END IF;

        -- Criar Transação de MRR (Mensalidade) no Financeiro se maior que zero
        IF v_mrr > 0 THEN
            INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id)
            VALUES (
                'trx-mrr-' || substring(md5(random()::text) from 1 for 8),
                'income',
                'Mensalidade (MRR) - ' || NEW.company,
                v_mrr,
                to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'),
                'Pendente',
                NEW.company,
                v_tenant
            );
        END IF;

        -- Registrar as atividades na timeline
        INSERT INTO public.atividades (relacionamento_tipo, relacionamento_id, titulo, descricao, tenant_id)
        VALUES 
        ('lead', NEW.id, 'Lead Fechado', 'Lead marcado como Fechado e convertido em cliente.', v_tenant),
        ('cliente', v_customer_id, 'Cliente Criado', 'Cliente gerado a partir do Lead Fechado.', v_tenant),
        ('projeto', v_project_id, 'Projeto Criado', 'Projeto Operacional criado automaticamente na fila.', v_tenant);

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arquivos ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas de RLS públicas anteriores
DROP POLICY IF EXISTS "Acesso completo profiles" ON public.profiles;
DROP POLICY IF EXISTS "Acesso completo team_members" ON public.team_members;
DROP POLICY IF EXISTS "Acesso completo leads" ON public.leads;
DROP POLICY IF EXISTS "Acesso completo customers" ON public.customers;
DROP POLICY IF EXISTS "Acesso completo projects" ON public.projects;
DROP POLICY IF EXISTS "Acesso completo tasks" ON public.tasks;
DROP POLICY IF EXISTS "Acesso completo transactions" ON public.transactions;
DROP POLICY IF EXISTS "Acesso completo notifications" ON public.notifications;
DROP POLICY IF EXISTS "Acesso completo produtos" ON public.produtos;
DROP POLICY IF EXISTS "Acesso completo propostas" ON public.propostas;
DROP POLICY IF EXISTS "Acesso completo atividades" ON public.atividades;
DROP POLICY IF EXISTS "Acesso completo arquivos" ON public.arquivos;

-- 5. Criar políticas de segurança Multi-Tenant baseadas em tenant_id e email autenticado
CREATE POLICY "RLS Perfil" ON public.profiles FOR ALL USING (email = auth.jwt()->>'email' OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (email = auth.jwt()->>'email' OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Team Members" ON public.team_members FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Leads" ON public.leads FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Customers" ON public.customers FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Projects" ON public.projects FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Tasks" ON public.tasks FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Transactions" ON public.transactions FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Notifications" ON public.notifications FOR ALL USING (user_email = auth.jwt()->>'email') WITH CHECK (user_email = auth.jwt()->>'email');
CREATE POLICY "RLS Produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Propostas" ON public.propostas FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Atividades" ON public.atividades FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
CREATE POLICY "RLS Arquivos" ON public.arquivos FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));

