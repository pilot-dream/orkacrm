-- =====================================================================
-- FIX: Dashboard Layout Persistency (user_dashboards RLS)
-- Execute este script no SQL Editor do Supabase
-- =====================================================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS public.user_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    layout_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_dashboards ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any
DROP POLICY IF EXISTS "RLS Dashboards" ON public.user_dashboards;

-- 4. Create proper policy allowing users to CRUD their own dashboards based on user_email
CREATE POLICY "RLS Dashboards" ON public.user_dashboards FOR ALL
USING (user_email = auth.jwt()->>'email')
WITH CHECK (user_email = auth.jwt()->>'email');

-- 5. Reload Schema cache
NOTIFY pgrst, 'reload schema';
