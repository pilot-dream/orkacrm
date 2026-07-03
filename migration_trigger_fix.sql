-- 1. DROP TRIGGER ANTERIOR PARA GARANTIR LIMPEZA
DROP TRIGGER IF EXISTS trg_lead_conversao ON public.leads;

-- 2. RECRIAR FUNÇÃO DE CONVERSÃO COM LOGICA ROBUSTA DE PARCELAMENTO E MRR
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
        v_tenant := COALESCE(NEW.tenant_id, 'orka.ai');

        -- Criar Cliente (tabela customers do schema original)
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
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            poc = EXCLUDED.poc,
            monthly_spend = EXCLUDED.monthly_spend,
            monthly_revenue = EXCLUDED.monthly_revenue,
            mrr_due_day = EXCLUDED.mrr_due_day,
            products_negotiated = EXCLUDED.products_negotiated,
            owner = EXCLUDED.owner;

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
                DECLARE
                    v_pay_date DATE;
                BEGIN
                    IF NEW.setup_payment_date LIKE '%-%' THEN
                        v_pay_date := to_date(NEW.setup_payment_date, 'YYYY-MM-DD');
                    ELSE
                        v_pay_date := to_date(COALESCE(NEW.setup_payment_date, to_char(now(), 'YYYY-MM-DD')), 'DD/MM/YYYY');
                    END IF;
                    
                    INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id)
                    VALUES (
                        'trx-setup-' || NEW.id || '-single',
                        'income',
                        'Taxa de Setup - ' || NEW.company,
                        v_setup,
                        to_char(v_pay_date, 'DD/MM/YYYY'),
                        'Pendente',
                        NEW.company,
                        v_tenant,
                        'Setup',
                        v_project_id
                    );
                END;
            ELSIF NEW.setup_payment_method = 'parcelado' AND COALESCE(NEW.setup_installments_count, 0) > 0 THEN
                DECLARE
                    v_inst_val NUMERIC := COALESCE(NEW.setup_installment_value, v_setup / NEW.setup_installments_count);
                    v_first_date_str TEXT := COALESCE(NEW.setup_first_installment_date, to_char(now(), 'YYYY-MM-DD'));
                    v_first_date DATE;
                    v_due TEXT;
                BEGIN
                    IF v_first_date_str LIKE '%-%' THEN
                        v_first_date := to_date(v_first_date_str, 'YYYY-MM-DD');
                    ELSE
                        v_first_date := to_date(v_first_date_str, 'DD/MM/YYYY');
                    END IF;

                    FOR i IN 0..(NEW.setup_installments_count - 1) LOOP
                        v_due := to_char(v_first_date + (i || ' month')::interval, 'DD/MM/YYYY');
                        
                        INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id, installment_number)
                        VALUES (
                            'trx-setup-' || NEW.id || '-' || (i+1),
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
                -- Fallback padrão
                INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id)
                VALUES (
                    'trx-setup-' || NEW.id || '-fallback',
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
        -- Criar Transações de MRR (Mensalidade) no Financeiro se maior que zero (gerar 24 meses recorrentes)
        IF v_mrr > 0 THEN
            DECLARE
                v_first_due DATE;
                v_day INT := COALESCE(NEW.mrr_due_day, 10);
                v_today DATE := CURRENT_DATE;
                v_due TEXT;
            BEGIN
                IF EXTRACT(DAY FROM v_today) <= v_day THEN
                    v_first_due := make_date(EXTRACT(YEAR FROM v_today)::INT, EXTRACT(MONTH FROM v_today)::INT, v_day);
                ELSE
                    v_first_due := make_date(EXTRACT(YEAR FROM v_today)::INT, EXTRACT(MONTH FROM v_today)::INT, v_day) + INTERVAL '1 month';
                END IF;

                FOR i IN 0..23 LOOP
                    v_due := to_char(v_first_due + (i || ' month')::interval, 'DD/MM/YYYY');
                    
                    INSERT INTO public.transactions (id, type, description, value, due_date, status, party, tenant_id, category, project_id, installment_number)
                    VALUES (
                        'trx-mrr-' || NEW.id || '-' || (i+1),
                        'income',
                        'Mensalidade (MRR) - ' || NEW.company || ' (Mês ' || (i+1) || ')',
                        v_mrr,
                        v_due,
                        'Pendente',
                        NEW.company,
                        v_tenant,
                        'Assinatura',
                        v_project_id,
                        (i+1)
                    )
                    ON CONFLICT (id) DO NOTHING;
                END LOOP;
            END;
        END IF;

        -- Registrar as atividades na timeline
        INSERT INTO public.atividades (relacionamento_tipo, relacionamento_id, titulo, descricao, tenant_id)
        VALUES 
        ('lead', NEW.id, 'Lead Fechado', 'Lead marcado como Fechado e convertido em cliente.', v_tenant),
        ('cliente', v_customer_id, 'Cliente Criado', 'Cliente gerado a partir do Lead Fechado.', v_tenant),
        ('projeto', v_project_id, 'Projeto Criado', 'Projeto Operacional criado automaticamente na fila.', v_tenant);

    ELSIF lower(OLD.stage) = 'fechado' AND lower(NEW.stage) <> 'fechado' THEN
        -- Desativar o Cliente (manter histórico, não deletar)
        UPDATE public.customers SET status = 'inactive'
        WHERE id = OLD.id AND tenant_id = OLD.tenant_id;

        -- Remover transações financeiras geradas automaticamente
        DELETE FROM public.transactions WHERE id LIKE 'trx-setup-' || OLD.id || '%';
        DELETE FROM public.transactions WHERE id LIKE 'trx-mrr-' || OLD.id || '%';

        -- Remover projeto de onboarding gerado automaticamente
        DELETE FROM public.projects 
        WHERE name = 'Projeto - ' || OLD.company
          AND description ILIKE '%operacional gerado automaticamente%'
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

-- 3. CRIAR A TRIGGER
CREATE TRIGGER trg_lead_conversao
AFTER UPDATE OF stage ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.converter_lead_fechado();
