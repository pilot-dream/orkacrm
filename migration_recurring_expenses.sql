-- ====================================================================
-- MIGRAÇÃO: SUPORTE A DESPESAS RECORRENTES (ASSINATURAS) E MULTI-MOEDA
-- ====================================================================

-- 1. Criação da tabela recurring_expenses
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    original_value NUMERIC NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    frequency TEXT NOT NULL DEFAULT 'Mensal',
    due_day INT NOT NULL DEFAULT 1,
    payment_method TEXT,
    observations TEXT,
    status TEXT NOT NULL DEFAULT 'Ativa',
    next_generation_date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modificação da tabela transactions para suportar multi-moeda e vínculo com recorrentes
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS original_value NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recurring_expense_id TEXT;

-- 3. Habilitar Segurança RLS na nova tabela
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança Multi-Tenant
CREATE POLICY "RLS Recurring Expenses" 
ON public.recurring_expenses 
FOR ALL 
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email')) 
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email'));
