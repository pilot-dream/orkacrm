import { create } from 'zustand';
import type { Transaction } from './types';
import { financeiroService } from '../api/service';

interface FinanceiroState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  lastFetch: number;
  abortController: AbortController | null;
  
  fetchTransactions: (force?: boolean) => Promise<void>;
  addTransaction: (t: Transaction) => Promise<boolean>;
  updateTransaction: (t: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

export const useFinanceiroStore = create<FinanceiroState>((set, get) => ({
  transactions: [],
  loading: false,
  error: null,
  isRefreshing: false,
  lastFetch: 0,
  abortController: null,
  
  fetchTransactions: async (force = false) => {
    const { transactions, lastFetch, abortController } = get();
    const now = Date.now();
    const TTL = 5 * 60 * 1000;

    if (!force && transactions.length > 0 && (now - lastFetch) < TTL) {
      return;
    }

    if (abortController) {
      abortController.abort();
    }
    const newAbortController = new AbortController();
    set({ abortController: newAbortController });

    const isInitialLoad = transactions.length === 0;
    if (isInitialLoad) {
      set({ loading: true, error: null });
    } else {
      set({ isRefreshing: true, error: null });
    }

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

      if (newAbortController.signal.aborted) return;

      set({ transactions: updatedData, loading: false, isRefreshing: false, lastFetch: Date.now(), abortController: null });
    } catch (err: any) {
      if (newAbortController.signal.aborted) return;
      set({ error: err.message || 'Erro ao carregar transações', loading: false, isRefreshing: false, abortController: null });
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
