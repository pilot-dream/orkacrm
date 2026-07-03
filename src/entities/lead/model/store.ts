import { create } from 'zustand';
import type { Lead, LeadStage } from './types';
import { leadService } from '../api/service';
import { notifyUserByName } from '../../usuario/api/notificationHelper';

interface LeadState {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  lastFetch: number;
  abortController: AbortController | null;
  
  fetchLeads: (force?: boolean) => Promise<void>;
  addLead: (lead: Lead) => Promise<boolean>;
  updateLead: (lead: Lead) => Promise<boolean>;
  updateLeadStage: (leadId: string, newStage: LeadStage, oldStage: LeadStage) => Promise<boolean>;
  deleteLead: (id: string) => Promise<boolean>;
}

export const useLeadStore = create<LeadState>((set, get) => ({
  leads: [],
  loading: false,
  error: null,
  isRefreshing: false,
  lastFetch: 0,
  abortController: null,
  
  fetchLeads: async (force = false) => {
    const { leads, lastFetch, abortController } = get();
    const now = Date.now();
    const TTL = 5 * 60 * 1000; // 5 minutes

    if (!force && leads.length > 0 && (now - lastFetch) < TTL) {
      return; // Valid cache, return immediately
    }

    if (abortController) {
      abortController.abort(); // Cancel previous request
    }
    const newAbortController = new AbortController();
    set({ abortController: newAbortController });

    const isInitialLoad = leads.length === 0;
    if (isInitialLoad) {
      set({ loading: true, error: null });
    } else {
      set({ isRefreshing: true, error: null });
    }

    try {
      // In a real implementation, we could pass newAbortController.signal to leadService.fetch
      const data = await leadService.fetch();
      
      if (newAbortController.signal.aborted) return;

      set({ leads: data, loading: false, isRefreshing: false, lastFetch: Date.now(), abortController: null });
    } catch (err: any) {
      if (newAbortController.signal.aborted) return;
      set({ error: err.message || 'Erro ao carregar leads', loading: false, isRefreshing: false, abortController: null });
    }
  },
  
  addLead: async (lead) => {
    set({ loading: true, error: null });
    try {
      const success = await leadService.insert(lead);
      if (success) {
        set((state) => ({ leads: [lead, ...state.leads], loading: false }));
        notifyUserByName(`💼 Novo lead criado: ${lead.company} (${lead.contactName})`, lead.owner);
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar lead', loading: false });
      throw err;
    }
  },
  
  updateLead: async (lead) => {
    set({ loading: true, error: null });
    try {
      const oldLead = get().leads.find(l => l.id === lead.id);
      const success = await leadService.update(lead);
      if (success) {
        set((state) => ({
          leads: state.leads.map((l) => (l.id === lead.id ? lead : l)),
          loading: false
        }));
        if (lead.stage === 'fechado' && oldLead && oldLead.stage !== 'fechado') {
          notifyUserByName(`🎉 Lead ${lead.company} convertido em Projeto com sucesso!`, lead.owner);
        }
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar lead', loading: false });
      return false;
    }
  },

  updateLeadStage: async (leadId, newStage, oldStage) => {
    // 1. Optimistically update local state
    set((state) => ({
      leads: state.leads.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
    }));

    try {
      const targetLead = get().leads.find((l) => l.id === leadId);
      if (!targetLead) {
        throw new Error('Lead não encontrado.');
      }
      
      const success = await leadService.update(targetLead);
      if (!success) {
        throw new Error('Falha ao atualizar estágio do lead no Supabase.');
      }
      if (newStage === 'fechado' && oldStage !== 'fechado') {
        notifyUserByName(`🎉 Lead ${targetLead.company} convertido em Projeto com sucesso!`, targetLead.owner);
      }
      return true;
    } catch (err: any) {
      // 2. Rollback to original state on failure
      set((state) => ({
        leads: state.leads.map((l) => (l.id === leadId ? { ...l, stage: oldStage } : l)),
        error: err.message || 'Erro ao persistir mudança de estágio'
      }));
      throw err;
    }
  },
  
  deleteLead: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await leadService.delete(id);
      if (success) {
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar lead', loading: false });
      return false;
    }
  }
}));
