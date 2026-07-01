import { create } from 'zustand';
import type { Transaction } from './types';
import { financeiroService } from '../api/service';

interface FinanceiroState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  
  fetchTransactions: () => Promise<void>;
  addTransaction: (t: Transaction) => Promise<boolean>;
  updateTransaction: (t: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

export const useFinanceiroStore = create<FinanceiroState>((set) => ({
  transactions: [],
  loading: false,
  error: null,
  
  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const data = await financeiroService.fetch();
      
      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const parseDate = (dStr: string) => {
        const parts = dStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dStr;
      };

      const updatedData = await Promise.all(data.map(async (t) => {
        if (t.status === 'Pendente') {
          const parsedDue = parseDate(t.dueDate);
          if (parsedDue < todayStr) {
            const updated = { ...t, status: 'Atrasado' as const };
            await financeiroService.update(updated);
            return updated;
          }
        }
        return t;
      }));

      set({ transactions: updatedData, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar lançamentos financeiros', loading: false });
    }
  },
  
  addTransaction: async (t) => {
    set({ loading: true, error: null });
    try {
      const success = await financeiroService.insert(t);
      if (success) {
        set((state) => ({ transactions: [t, ...state.transactions], loading: false }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar lançamento', loading: false });
      return false;
    }
  },
  
  updateTransaction: async (t) => {
    set({ loading: true, error: null });
    try {
      const success = await financeiroService.update(t);
      if (success) {
        set((state) => ({
          transactions: state.transactions.map((item) => (item.id === t.id ? t : item)),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar lançamento', loading: false });
      return false;
    }
  },
  
  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await financeiroService.delete(id);
      if (success) {
        set((state) => ({
          transactions: state.transactions.filter((item) => item.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar lançamento', loading: false });
      return false;
    }
  }
}));
