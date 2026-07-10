import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Cliente } from '../model/types';
import { useAuthStore } from '../../usuario/model/store';

export const mapCustomerFromDb = (db: any): Cliente => ({
  id: db.id,
  name: db.name,
  abbr: db.abbr,
  plan: db.plan,
  automationsCount: db.automations_count,
  monthlySpend: Number(db.monthly_spend || 0),
  status: db.status === 'inactive' ? 'inactive' : 'active',
  startDate: db.start_date,
  poc: db.poc,
  createdAt: db.created_at,
  
  contactName: db.contact_name,
  role: db.role,
  email: db.email,
  phone: db.phone,
  whatsapp: db.whatsapp,
  cnpj: db.cnpj,
  address: db.address,
  city: db.city,
  state: db.state,
  country: db.country,
  segment: db.segment,
  owner: db.owner,
  source: db.source,
  productsNegotiated: db.products_negotiated || [],
  setupValue: Number(db.setup_value || 0),
  mrrValue: Number(db.mrr_value || 0),
  observations: db.observations || [],
  tags: db.tags || [],
  conversionDate: db.conversion_date,
  originalLead: db.original_lead,
  convertedBy: db.converted_by,
  monthlyRevenue: db.monthly_revenue ? Number(db.monthly_revenue) : undefined,
  mrrDueDay: db.mrr_due_day ? Number(db.mrr_due_day) : undefined,
  tenant_id: db.tenant_id
});

export const mapCustomerToDb = (c: Cliente) => ({
  id: c.id,
  name: c.name,
  abbr: c.abbr,
  plan: c.plan,
  automations_count: c.automationsCount,
  monthly_spend: c.monthlySpend,
  status: c.status,
  start_date: c.startDate,
  poc: c.poc,
  
  contact_name: c.contactName,
  role: c.role,
  email: c.email,
  phone: c.phone,
  whatsapp: c.whatsapp,
  cnpj: c.cnpj,
  address: c.address,
  city: c.city,
  state: c.state,
  country: c.country,
  segment: c.segment,
  owner: c.owner,
  source: c.source,
  products_negotiated: c.productsNegotiated || [],
  setup_value: c.setupValue,
  mrr_value: c.mrrValue,
  observations: c.observations || [],
  tags: c.tags || [],
  conversion_date: c.conversionDate,
  original_lead: c.originalLead,
  converted_by: c.convertedBy,
  monthly_revenue: c.monthlyRevenue,
  mrr_due_day: c.mrrDueDay,
  tenant_id: c.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
});

export const clienteService = {
  fetch: async (): Promise<Cliente[]> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_customers');
      const list: Cliente[] = saved ? JSON.parse(saved) : [];
      return list.filter(item => item.tenant_id === tenant);
    }
    const { data, error } = await supabase.from('customers').select('*').eq('tenant_id', tenant).order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar clientes no Supabase:', error);
      return [];
    }
    return (data || []).map(mapCustomerFromDb);
  },
  
  insert: async (c: Cliente): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_customers');
      const list = saved ? JSON.parse(saved) : [];
      const cWithTenant = {
        ...c,
        tenant_id: c.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
      };
      list.push(cWithTenant);
      localStorage.setItem('orka_customers', JSON.stringify(list));
      console.log('✅ Cliente criado (offline):', cWithTenant);
      return true;
    }
    const { error } = await supabase.from('customers').insert([mapCustomerToDb(c)]);
    if (error) {
      console.error('❌ Erro ao criar cliente:', error.message);
      throw new Error(error.message || 'Erro ao inserir cliente no Supabase');
    }
    console.log('✅ Cliente criado:', c);
    return true;
  },
  
  update: async (c: Cliente): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_customers');
      let list: Cliente[] = saved ? JSON.parse(saved) : [];
      list = list.map(item => item.id === c.id ? c : item);
      localStorage.setItem('orka_customers', JSON.stringify(list));
      console.log('✅ Cliente atualizado (offline):', c);
      return true;
    }
    const { error } = await supabase.from('customers').update(mapCustomerToDb(c)).eq('id', c.id);
    if (error) {
      console.error('❌ Erro ao atualizar cliente:', error.message);
      throw new Error(error.message || 'Erro ao atualizar cliente no Supabase');
    }
    console.log('✅ Cliente atualizado:', c);
    return true;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_customers');
      let list: Cliente[] = saved ? JSON.parse(saved) : [];
      list = list.filter(item => item.id !== id);
      localStorage.setItem('orka_customers', JSON.stringify(list));
      console.log('✅ Cliente deletado (offline):', id);
      return true;
    }
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('❌ Erro ao deletar cliente:', error.message);
      throw new Error(error.message || 'Erro ao deletar cliente no Supabase');
    }
    console.log('✅ Cliente deletado:', id);
    return true;
  },

  fetchPaginated: async (page: number, limit: number, search?: string, plan?: string): Promise<{ data: Cliente[]; count: number }> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_customers');
      const list: Cliente[] = saved ? JSON.parse(saved) : [];
      let filtered = list.filter(item => item.tenant_id === tenant);
      if (search) {
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(search.toLowerCase()) || 
          (c.poc && c.poc.toLowerCase().includes(search.toLowerCase()))
        );
      }
      if (plan && plan !== 'all') {
        filtered = filtered.filter(c => c.plan === plan);
      }
      const from = (page - 1) * limit;
      const to = from + limit;
      return {
        data: filtered.slice(from, to),
        count: filtered.length
      };
    }
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = supabase.from('customers').select('*', { count: 'exact' }).eq('tenant_id', tenant);
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,poc.ilike.%${search}%`);
    }
    if (plan && plan !== 'all') {
      query = query.eq('plan', plan);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Erro ao buscar clientes paginados no Supabase:', error);
      return { data: [], count: 0 };
    }
    return {
      data: (data || []).map(mapCustomerFromDb),
      count: count || 0
    };
  }
};
