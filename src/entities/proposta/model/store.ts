import { create } from 'zustand';
import type { Proposta } from './types';
import { propostaService } from '../api/service';

interface PropostaState {
  propostas: Proposta[];
  loading: boolean;
  error: string | null;
  
  fetchPropostasByLeadId: (leadId: string) => Promise<void>;
  addProposta: (proposal: Proposta) => Promise<boolean>;
  updateProposta: (proposal: Proposta) => Promise<boolean>;
  deleteProposta: (id: string) => Promise<boolean>;
}

export const usePropostaStore = create<PropostaState>((set) => ({
  propostas: [],
  loading: false,
  error: null,
  
  fetchPropostasByLeadId: async (leadId) => {
    set({ loading: true, error: null });
    try {
      const data = await propostaService.fetchByLeadId(leadId);
      set({ propostas: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar propostas', loading: false });
    }
  },
  
  addProposta: async (proposal) => {
    set({ loading: true, error: null });
    try {
      const success = await propostaService.insert(proposal);
      if (success) {
        set((state) => ({ propostas: [proposal, ...state.propostas], loading: false }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar proposta', loading: false });
      return false;
    }
  },
  
  updateProposta: async (proposal) => {
    set({ loading: true, error: null });
    try {
      const success = await propostaService.update(proposal);
      if (success) {
        set((state) => ({
          propostas: state.propostas.map((p) => (p.id === proposal.id ? proposal : p)),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar proposta', loading: false });
      return false;
    }
  },
  
  deleteProposta: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await propostaService.delete(id);
      if (success) {
        set((state) => ({
          propostas: state.propostas.filter((p) => p.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar proposta', loading: false });
      return false;
    }
  }
}));
