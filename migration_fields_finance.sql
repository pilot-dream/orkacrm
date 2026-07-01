-- Adicionar novas colunas na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_payment_method TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_payment_date TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_installments_count INT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_installment_value NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS setup_first_installment_date TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS mrr_due_day INT DEFAULT 10;

-- Adicionar colunas em customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS monthly_revenue NUMERIC DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS mrr_due_day INT DEFAULT 10;

-- Adicionar colunas em transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS installment_number INT;

-- Recriar trigger converter_lead_fechado com a lógica de parcelamento e MRR com data de vencimento calculada
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
    IF NEW.stage IN ('Fechado', 'fechado') AND (OLD.stage IS NULL OR OLD.stage NOT IN ('Fechado', 'fechado')) THEN
        -- Validar se há responsável
        IF NEW.owner IS NULL OR NEW.owner = '' THEN
            RAISE EXCEPTION 'Não é possível converter um lead sem responsável atribuído.';
        END IF;

        v_mrr := COALESCE(NEW.mrr_value, 0);
        v_setup := COALESCE(NEW.value, 0);
        v_tenant := NEW.tenant_id;

        -- Criar Cliente (tabela customers do schema original)
        v_customer_id := NEW.id;
        INSERT INTO public.customers (id, name, plan, status, poc, monthly_spend, start_date, tenant_id, monthly_revenue, mrr_due_day)
        VALUES (
            v_customer_id,
            NEW.company,
            'ORKA CRM Cliente',
            'active',
            NEW.contact_name,
            v_mrr,
            to_char(now(), 'DD/MM/YYYY'),
            v_tenant,
            COALESCE(NEW.monthly_revenue, 0),
            COALESCE(NEW.mrr_due_day, 10)
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            poc = EXCLUDED.poc,
            monthly_spend = EXCLUDED.monthly_spend,
            monthly_revenue = EXCLUDED.monthly_revenue,
            mrr_due_day = EXCLUDED.mrr_due_day;

        -- Criar Projeto (tabela projects)
        v_project_id := 'proj-' || substring(md5(random()::text) from 1 for 8);
        INSERT INTO public.projects (id, name, description, stage, deadline, priority, progress, tenant_id)
        VALUES (
            v_project_id,
            'Projeto - ' || NEW.company,
            'Projeto operacional gerado automaticamente a partir da conversão.',
            'fila',
            to_char(now() + INTERVAL '30 days', 'DD/MM/YYYY'),
            'media',
            0,
            v_tenant
        )
        ON CONFLICT (id) DO NOTHING;

        -- Criar Transações de Setup no Financeiro
        IF v_setup > 0 THEN
            IF NEW.setup_payment_method = 'a_vista' THEN
                INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id)
                VALUES (
                    'trx-setup-' || substring(md5(random()::text) from 1 for 8),
                    'income',
                    'Taxa de Setup - ' || NEW.company,
                    v_setup,
                    COALESCE(NEW.setup_payment_date, to_char(now(), 'DD/MM/YYYY')),
                    'Pendente',
                    NEW.company,
                    v_tenant,
                    'Setup',
                    v_project_id
                );
            ELSIF NEW.setup_payment_method = 'parcelado' AND COALESCE(NEW.setup_installments_count, 0) > 0 THEN
                DECLARE
                    v_inst_val NUMERIC := COALESCE(NEW.setup_installment_value, v_setup / NEW.setup_installments_count);
                    v_first_date TEXT := COALESCE(NEW.setup_first_installment_date, to_char(now(), 'DD/MM/YYYY'));
                    v_due TEXT;
                BEGIN
                    FOR i IN 0..(NEW.setup_installments_count - 1) LOOP
                        -- Calculate due date monthly in Postgres
                        v_due := to_char(to_date(v_first_date, 'DD/MM/YYYY') + (i || ' month')::interval, 'DD/MM/YYYY');
                        
                        INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id, installment_number)
                        VALUES (
                            'trx-setup-' || substring(md5(random()::text) from 1 for 8),
                            'income',
                            'Taxa de Setup - ' || NEW.company || ' (Parcela ' || (i+1) || '/' || NEW.setup_installments_count || ')',
                            v_inst_val,
                            v_due,
                            'Pendente',
                            NEW.company,
                            v_tenant,
                            'Setup',
                            v_project_id,
                            (i+1)
                        );
                    END LOOP;
                END;
            ELSE
                -- Default fallback if method not set
                INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id)
                VALUES (
                    'trx-setup-' || substring(md5(random()::text) from 1 for 8),
                    'income',
                    'Taxa de Setup - ' || NEW.company,
                    v_setup,
                    to_char(now(), 'DD/MM/YYYY'),
                    'Pendente',
                    NEW.company,
                    v_tenant,
                    'Setup',
                    v_project_id
                );
            END IF;
        END IF;

        -- Criar Transação de MRR (Mensalidade) no Financeiro se maior que zero
        IF v_mrr > 0 THEN
            DECLARE
                v_due_date DATE;
                v_day INT := COALESCE(NEW.mrr_due_day, 10);
                v_today DATE := CURRENT_DATE;
                v_due_str TEXT;
            BEGIN
                IF EXTRACT(DAY FROM v_today) <= v_day THEN
                    v_due_date := make_date(EXTRACT(YEAR FROM v_today)::INT, EXTRACT(MONTH FROM v_today)::INT, v_day);
                ELSE
                    v_due_date := make_date(EXTRACT(YEAR FROM v_today)::INT, EXTRACT(MONTH FROM v_today)::INT, v_day) + INTERVAL '1 month';
                END IF;
                v_due_str := to_char(v_due_date, 'DD/MM/YYYY');

                INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id)
                VALUES (
                    'trx-mrr-' || substring(md5(random()::text) from 1 for 8),
                    'income',
                    'Mensalidade (MRR) - ' || NEW.company,
                    v_mrr,
                    v_due_str,
                    'Pendente',
                    NEW.company,
                    v_tenant,
                    'Assinatura',
                    v_project_id
                );
            END;
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
