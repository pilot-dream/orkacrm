-- =====================================================================
-- FIX: Infinite recursion in "profiles" RLS policy
-- Execute este script no SQL Editor do Supabase
-- =====================================================================

-- 1. Criar função helper com SECURITY DEFINER para pegar o tenant_id
--    sem disparar as políticas RLS da tabela profiles
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT tenant_id FROM public.profiles WHERE email = auth.jwt()->>'email' LIMIT 1),
    split_part(auth.jwt()->>'email', '@', 2)
  );
$$;


-- 2. Recriar a política de profiles SEM recursão
--    (só permite que o próprio usuário acesse seu perfil)
DROP POLICY IF EXISTS "RLS Perfil" ON public.profiles;

CREATE POLICY "RLS Perfil" ON public.profiles FOR ALL
USING (email = auth.jwt()->>'email')
WITH CHECK (email = auth.jwt()->>'email');


-- 3. Atualizar todas as outras políticas para usar a função helper
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

CREATE POLICY "RLS Team Members" ON public.team_members FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Leads" ON public.leads FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Customers" ON public.customers FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Projects" ON public.projects FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Tasks" ON public.tasks FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Transactions" ON public.transactions FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Notifications" ON public.notifications FOR ALL
USING (user_email = auth.jwt()->>'email')
WITH CHECK (user_email = auth.jwt()->>'email');

CREATE POLICY "RLS Produtos" ON public.produtos FOR ALL
USING (tenant_id IS NULL OR tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Atividades" ON public.atividades FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Arquivos" ON public.arquivos FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "RLS Lead Products" ON public.lead_products FOR ALL
USING (tenant_id = public.get_my_tenant_id())
WITH CHECK (tenant_id = public.get_my_tenant_id());


-- 4. Garantir que a tabela profiles ainda existe e tem tenant_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- 5. Recarregar o cache do Supabase
NOTIFY pgrst, 'reload schema';
