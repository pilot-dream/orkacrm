-- Criar tabela de dashboards personalizados por usuário
CREATE TABLE IF NOT EXISTS public.user_dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    tenant_id TEXT,
    name TEXT NOT NULL,
    layout_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes caso precise rodar novamente
DROP POLICY IF EXISTS "Acesso completo user_dashboards" ON public.user_dashboards;
DROP POLICY IF EXISTS "RLS User Dashboards" ON public.user_dashboards;

-- Criar política RLS baseada no email do usuário
CREATE POLICY "RLS User Dashboards" ON public.user_dashboards 
    FOR ALL USING (user_email = auth.jwt()->>'email') 
    WITH CHECK (user_email = auth.jwt()->>'email');

-- Criar função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_dashboards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS trg_user_dashboards_updated_at ON public.user_dashboards;
CREATE TRIGGER trg_user_dashboards_updated_at
    BEFORE UPDATE ON public.user_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_user_dashboards_updated_at();
