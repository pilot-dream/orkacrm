import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Transaction, TransactionType, TransactionStatus } from '../model/types';
import { useAuthStore } from '../../usuario/model/store';

export const mapTransactionFromDb = (db: any): Transaction => ({
  id: db.id,
  type: db.type as TransactionType,
  description: db.description,
  value: Number(db.value || 0),
  dueDate: db.due_date || '',
  paymentDate: db.payment_date,
  category: db.category || 'Outros',
  status: db.status as TransactionStatus,
  party: db.party || '',
  tenant_id: db.tenant_id,
  projectId: db.project_id,
  installmentNumber: db.installment_number,
  paymentValue: db.payment_value !== undefined && db.payment_value !== null ? Number(db.payment_value) : null,
  paidBy: db.paid_by || null,
  originalValue: db.original_value !== null && db.original_value !== undefined ? Number(db.original_value) : undefined,
  currency: db.currency || 'BRL',
  exchangeRate: db.exchange_rate !== null && db.exchange_rate !== undefined ? Number(db.exchange_rate) : undefined,
  recurringExpenseId: db.recurring_expense_id || undefined
});

export const mapTransactionToDb = (t: Transaction) => ({
  id: t.id,
  type: t.type,
  description: t.description,
  value: t.value,
  due_date: t.dueDate,
  payment_date: t.paymentDate || null,
  category: t.category,
  status: t.status,
  party: t.party,
  project_id: t.projectId || null,
  installment_number: t.installmentNumber || null,
  tenant_id: t.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai',
  payment_value: t.paymentValue !== undefined ? t.paymentValue : null,
  original_value: t.originalValue !== undefined ? t.originalValue : null,
  currency: t.currency || 'BRL',
  exchange_rate: t.exchangeRate !== undefined ? t.exchangeRate : null,
  recurring_expense_id: t.recurringExpenseId || null
});

export const financeiroService = {
  fetch: async (): Promise<Transaction[]> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_transactions');
      if (saved) {
        const list: Transaction[] = JSON.parse(saved);
        return list.filter(item => item.tenant_id === tenant);
      }
      
      // Default initial mock transactions matching original design with tenant_id
      const initial: Transaction[] = [
        { id: 'inc-1', type: 'income', description: 'Setup Orquestração Comercial IA', value: 45000, dueDate: '15/06/2026', paymentDate: '15/06/2026', category: 'Setup', status: 'Recebido', party: 'Stripe Brasil', tenant_id: tenant },
        { id: 'inc-2', type: 'income', description: 'Faturamento MRR Junho', value: 10000, dueDate: '20/06/2026', paymentDate: '20/06/2026', category: 'Assinatura', status: 'Recebido', party: 'Stripe Brasil', tenant_id: tenant },
        { id: 'inc-3', type: 'income', description: 'Faturamento MRR Junho', value: 12000, dueDate: '10/06/2026', paymentDate: '10/06/2026', category: 'Assinatura', status: 'Recebido', party: 'Vercel Inc', tenant_id: tenant },
        { id: 'inc-4', type: 'income', description: 'Faturamento MRR Junho', value: 7500, dueDate: '10/06/2026', paymentDate: '10/06/2026', category: 'Assinatura', status: 'Recebido', party: 'Linear Co', tenant_id: tenant },
        { id: 'inc-5', type: 'income', description: 'Consultoria de Escopo IA', value: 15000, dueDate: '22/06/2026', paymentDate: null, category: 'Consultoria', status: 'Pendente', party: 'Notion Space', tenant_id: tenant },
        { id: 'exp-1', type: 'expense', description: 'Hospedagem & DB Cluster AWS', value: 14500, dueDate: '05/06/2026', paymentDate: '05/06/2026', category: 'Infraestrutura', status: 'Pago', party: 'Amazon Web Services', tenant_id: tenant },
        { id: 'exp-2', type: 'expense', description: 'Créditos API Modelos LLM', value: 8900, dueDate: '10/06/2026', paymentDate: '10/06/2026', category: 'Infraestrutura', status: 'Pago', party: 'OpenAI Inc', tenant_id: tenant },
        { id: 'exp-3', type: 'expense', description: 'Assinatura Google Workspace', value: 1200, dueDate: '12/06/2026', paymentDate: '12/06/2026', category: 'Serviços', status: 'Pago', party: 'Google Cloud Brasil', tenant_id: tenant }
      ];
      localStorage.setItem('orka_transactions', JSON.stringify(initial));
      return initial;
    }
    const { data, error } = await supabase.from('transactions').select('*').eq('tenant_id', tenant).order('due_date', { ascending: false });
    if (error) {
      console.error('Erro ao buscar transações no Supabase:', error);
      return [];
    }
    return (data || []).map(mapTransactionFromDb);
  },
  
  insert: async (t: Transaction): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_transactions');
      const list = saved ? JSON.parse(saved) : [];
      list.push(t);
      localStorage.setItem('orka_transactions', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('transactions').insert([mapTransactionToDb(t)]);
    if (error) console.error('Erro ao inserir transação no Supabase:', error);
    return !error;
  },
  
  update: async (t: Transaction): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_transactions');
      let list: Transaction[] = saved ? JSON.parse(saved) : [];
      list = list.map(item => item.id === t.id ? t : item);
      localStorage.setItem('orka_transactions', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('transactions').update(mapTransactionToDb(t)).eq('id', t.id);
    if (error) console.error('Erro ao atualizar transação no Supabase:', error);
    return !error;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_transactions');
      let list: Transaction[] = saved ? JSON.parse(saved) : [];
      list = list.filter(item => item.id !== id);
      localStorage.setItem('orka_transactions', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Erro ao deletar transação no Supabase:', error);
    return !error;
  }
};

export const mapRecurringExpenseFromDb = (db: any): any => ({
  id: db.id,
  tenant_id: db.tenant_id,
  name: db.name,
  category: db.category,
  originalValue: Number(db.original_value || 0),
  currency: db.currency,
  frequency: db.frequency,
  dueDay: db.due_day,
  paymentMethod: db.payment_method,
  observations: db.observations,
  status: db.status,
  nextGenerationDate: db.next_generation_date,
  createdAt: db.created_at
});

export const mapRecurringExpenseToDb = (t: any) => ({
  id: t.id,
  tenant_id: t.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai',
  name: t.name,
  category: t.category,
  original_value: t.originalValue,
  currency: t.currency,
  frequency: t.frequency,
  due_day: t.dueDay,
  payment_method: t.paymentMethod,
  observations: t.observations,
  status: t.status,
  next_generation_date: t.nextGenerationDate
});

export const recurringExpenseService = {
  fetch: async (): Promise<any[]> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_recurring_expenses');
      if (saved) {
        const list = JSON.parse(saved);
        return list.filter((item: any) => item.tenant_id === tenant);
      }
      return [];
    }
    const { data, error } = await supabase.from('recurring_expenses').select('*').eq('tenant_id', tenant);
    if (error) {
      console.error('Erro ao buscar recurring expenses no Supabase:', error);
      return [];
    }
    return (data || []).map(mapRecurringExpenseFromDb);
  },
  
  insert: async (t: any): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_recurring_expenses');
      const list = saved ? JSON.parse(saved) : [];
      list.push(t);
      localStorage.setItem('orka_recurring_expenses', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('recurring_expenses').insert([mapRecurringExpenseToDb(t)]);
    if (error) console.error('Erro ao inserir recurring expense no Supabase:', error);
    return !error;
  },
  
  update: async (t: any): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_recurring_expenses');
      let list = saved ? JSON.parse(saved) : [];
      list = list.map((item: any) => item.id === t.id ? t : item);
      localStorage.setItem('orka_recurring_expenses', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('recurring_expenses').update(mapRecurringExpenseToDb(t)).eq('id', t.id);
    if (error) console.error('Erro ao atualizar recurring expense no Supabase:', error);
    return !error;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_recurring_expenses');
      let list = saved ? JSON.parse(saved) : [];
      list = list.filter((item: any) => item.id !== id);
      localStorage.setItem('orka_recurring_expenses', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (error) console.error('Erro ao deletar recurring expense no Supabase:', error);
    return !error;
  }
};
