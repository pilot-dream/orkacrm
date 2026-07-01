import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Proposta } from '../model/types';

export const mapPropostaFromDb = (db: any): Proposta => ({
  id: db.id,
  leadId: db.lead_id,
  valorSetup: Number(db.valor_setup || 0),
  valorMrr: Number(db.valor_mrr || 0),
  probabilidade: Number(db.probabilidade || 0),
  status: db.status as 'rascunho' | 'enviada' | 'aprovada' | 'recusada',
  dataPrevista: db.data_prevista,
  createdAt: db.created_at
});

export const mapPropostaToDb = (proposal: Proposta) => ({
  id: proposal.id,
  lead_id: proposal.leadId,
  valor_setup: proposal.valorSetup,
  valor_mrr: proposal.valorMrr,
  probabilidade: proposal.probabilidade,
  status: proposal.status,
  data_prevista: proposal.dataPrevista
});

export const propostaService = {
  fetchByLeadId: async (leadId: string): Promise<Proposta[]> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_propostas');
      const list: Proposta[] = saved ? JSON.parse(saved) : [];
      return list.filter(p => p.leadId === leadId);
    }
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Erro ao buscar propostas no Supabase:', error);
      return [];
    }
    return (data || []).map(mapPropostaFromDb);
  },
  
  insert: async (proposal: Proposta): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_propostas');
      const list = saved ? JSON.parse(saved) : [];
      list.push(proposal);
      localStorage.setItem('orka_propostas', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('propostas').insert([mapPropostaToDb(proposal)]);
    if (error) console.error('Erro ao inserir proposta no Supabase:', error);
    return !error;
  },
  
  update: async (proposal: Proposta): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_propostas');
      let list: Proposta[] = saved ? JSON.parse(saved) : [];
      list = list.map(p => p.id === proposal.id ? proposal : p);
      localStorage.setItem('orka_propostas', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('propostas').update(mapPropostaToDb(proposal)).eq('id', proposal.id);
    if (error) console.error('Erro ao atualizar proposta no Supabase:', error);
    return !error;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_propostas');
      let list: Proposta[] = saved ? JSON.parse(saved) : [];
      list = list.filter(p => p.id !== id);
      localStorage.setItem('orka_propostas', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('propostas').delete().eq('id', id);
    if (error) console.error('Erro ao deletar proposta no Supabase:', error);
    return !error;
  }
};
