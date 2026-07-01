import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Lead, LeadStage } from '../model/types';
import { useAuthStore } from '../../usuario/model/store';

export const mapLeadFromDb = (db: any): Lead => ({
  id: db.id,
  company: db.company,
  contactName: db.contact_name,
  value: Number(db.value || 0),
  stage: db.stage as LeadStage,
  aiScore: db.ai_score,
  aiInsights: db.ai_insights,
  dateAdded: db.date_added,
  email: db.email,
  needs: db.needs,
  phone: db.phone,
  whatsapp: db.whatsapp,
  source: db.source,
  owner: db.owner,
  observations: db.observations || [],
  timeline: db.timeline || [],
  role: db.role,
  segment: db.segment,
  employeeCount: db.employee_count,
  monthlyRevenue: Number(db.monthly_revenue || 0),
  productsNegotiated: db.lead_products && db.lead_products.length > 0
    ? db.lead_products.map((lp: any) => ({
        productId: lp.product_id,
        name: lp.produtos?.nome || 'Produto',
        setup: Number(lp.setup_valor || 0),
        mrr: Number(lp.mrr_valor || 0),
        percentual: Number(lp.percentual_comissao || 0)
      }))
    : (db.products_negotiated || []).map((p: any) => ({
        productId: p.productId,
        name: p.name,
        setup: Number(p.setup || 0),
        mrr: Number(p.mrr || 0),
        percentual: Number(p.percentual || 0)
      })),
  mrrValue: Number(db.mrr_value || 0),
  percentage: Number(db.percentage || 0),
  probability: Number(db.probability || 0),
  expectedDate: db.expected_date,
  comments: db.comments || [],
  tags: db.tags || [],
  cnpj: db.cnpj,
  address: db.address,
  city: db.city,
  state: db.state,
  country: db.country,
  setupPaymentMethod: db.setup_payment_method,
  setupPaymentDate: db.setup_payment_date,
  setupInstallmentsCount: db.setup_installments_count ? Number(db.setup_installments_count) : undefined,
  setupInstallmentValue: db.setup_installment_value ? Number(db.setup_installment_value) : undefined,
  setupFirstInstallmentDate: db.setup_first_installment_date,
  mrrDueDay: db.mrr_due_day ? Number(db.mrr_due_day) : 10,
  tenant_id: db.tenant_id
});

export const mapLeadToDb = (lead: Lead) => ({
  id: lead.id,
  company: lead.company,
  contact_name: lead.contactName,
  value: lead.value,
  stage: lead.stage,
  ai_score: lead.aiScore,
  ai_insights: lead.aiInsights,
  date_added: lead.dateAdded,
  email: lead.email,
  needs: lead.needs,
  phone: lead.phone,
  whatsapp: lead.whatsapp,
  source: lead.source,
  owner: lead.owner,
  observations: lead.observations,
  timeline: lead.timeline,
  role: lead.role,
  segment: lead.segment,
  employee_count: lead.employeeCount,
  monthly_revenue: lead.monthlyRevenue,
  products_negotiated: lead.productsNegotiated || [],
  setup_value: lead.value,
  mrr_value: lead.mrrValue,
  percentage: lead.percentage,
  probability: lead.probability,
  expected_date: lead.expectedDate,
  comments: lead.comments,
  tags: lead.tags,
  cnpj: lead.cnpj,
  address: lead.address,
  city: lead.city,
  state: lead.state,
  country: lead.country,
  setup_payment_method: lead.setupPaymentMethod,
  setup_payment_date: lead.setupPaymentDate,
  setup_installments_count: lead.setupInstallmentsCount,
  setup_installment_value: lead.setupInstallmentValue,
  setup_first_installment_date: lead.setupFirstInstallmentDate,
  mrr_due_day: lead.mrrDueDay,
  tenant_id: lead.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
});

export const leadService = {
  fetch: async (): Promise<Lead[]> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_leads');
      const list: Lead[] = saved ? JSON.parse(saved) : [];
      return list.filter(l => l.tenant_id === tenant);
    }
    const { data, error } = await supabase
      .from('leads')
      .select('*, lead_products(*, produtos(*))')
      .eq('tenant_id', tenant)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar leads no Supabase:', error);
      return [];
    }
    return (data || []).map(mapLeadFromDb);
  },
  
  insert: async (lead: Lead): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_leads');
      const list = saved ? JSON.parse(saved) : [];
      list.push(lead);
      localStorage.setItem('orka_leads', JSON.stringify(list));
      return true;
    }
    
    // 1. Insert into leads table
    const { error: leadError } = await supabase.from('leads').insert([mapLeadToDb(lead)]);
    if (leadError) {
      console.error('Erro ao inserir lead no Supabase:', leadError);
      throw new Error(leadError.message || 'Erro ao salvar o lead');
    }

    // 2. Insert associations into lead_products table
    if (lead.productsNegotiated && lead.productsNegotiated.length > 0) {
      const rows = lead.productsNegotiated.map(p => ({
        lead_id: lead.id,
        product_id: p.productId,
        setup_valor: p.setup,
        mrr_valor: p.mrr,
        percentual_comissao: p.percentual
      }));
      const { error: relError } = await supabase.from('lead_products').insert(rows);
      if (relError) {
        console.error('Erro ao vincular produtos ao lead no Supabase:', relError);
      }
    }
    return true;
  },
  
  update: async (lead: Lead): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_leads');
      let list: Lead[] = saved ? JSON.parse(saved) : [];
      list = list.map(l => l.id === lead.id ? lead : l);
      localStorage.setItem('orka_leads', JSON.stringify(list));
      return true;
    }

    // 1. Update lead table
    const { error: leadError } = await supabase.from('leads').update(mapLeadToDb(lead)).eq('id', lead.id);
    if (leadError) {
      console.error('Erro ao atualizar lead no Supabase:', leadError);
      throw new Error(leadError.message || 'Erro ao atualizar o lead');
    }

    // 2. Clean associations in lead_products table
    const { error: deleteError } = await supabase.from('lead_products').delete().eq('lead_id', lead.id);
    if (deleteError) {
      console.error('Erro ao limpar vínculos de produtos:', deleteError);
    }

    // 3. Insert new associations
    if (lead.productsNegotiated && lead.productsNegotiated.length > 0) {
      const rows = lead.productsNegotiated.map(p => ({
        lead_id: lead.id,
        product_id: p.productId,
        setup_valor: p.setup,
        mrr_valor: p.mrr,
        percentual_comissao: p.percentual
      }));
      const { error: relError } = await supabase.from('lead_products').insert(rows);
      if (relError) {
        console.error('Erro ao atualizar vínculos de produtos no Supabase:', relError);
      }
    }
    return true;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_leads');
      let list: Lead[] = saved ? JSON.parse(saved) : [];
      list = list.filter(l => l.id !== id);
      localStorage.setItem('orka_leads', JSON.stringify(list));
      return true;
    }
    // Clean up lead products association first to prevent foreign key errors
    await supabase.from('lead_products').delete().eq('lead_id', id);
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar lead no Supabase:', error);
      throw new Error(error.message || 'Erro ao deletar o lead');
    }
    return true;
  }
};
