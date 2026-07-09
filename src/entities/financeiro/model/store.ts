import { create } from 'zustand';
import type { Transaction, RecurringExpense } from './types';
import { financeiroService, recurringExpenseService } from '../api/service';

interface FinanceiroState {
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  lastFetch: number;
  abortController: AbortController | null;
  
  fetchTransactions: (force?: boolean) => Promise<void>;
  addTransaction: (t: Transaction) => Promise<boolean>;
  updateTransaction: (t: Transaction) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;

  fetchRecurringExpenses: () => Promise<void>;
  addRecurringExpense: (r: RecurringExpense) => Promise<boolean>;
  updateRecurringExpense: (r: RecurringExpense) => Promise<boolean>;
  deleteRecurringExpense: (id: string) => Promise<boolean>;
  processRecurringExpenses: () => Promise<void>;
}

export const useFinanceiroStore = create<FinanceiroState>((set, get) => ({
  transactions: [],
  recurringExpenses: [],
  loading: false,
  error: null,
  isRefreshing: false,
  lastFetch: 0,
  abortController: null,
  
  fetchTransactions: async (force = false) => {
    const { transactions, lastFetch, abortController, loading } = get();
    const now = Date.now();
    const TTL = 5 * 60 * 1000;

    if (!force && loading) return;

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
      await get().processRecurringExpenses();
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
          if (!t.dueDate) return t;
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
  },

  fetchRecurringExpenses: async () => {
    try {
      const data = await recurringExpenseService.fetch();
      set({ recurringExpenses: data });
    } catch (err) {
      console.error(err);
    }
  },
  
  addRecurringExpense: async (r) => {
    try {
      const success = await recurringExpenseService.insert(r);
      if (success) {
        set((state) => ({ recurringExpenses: [r, ...state.recurringExpenses] }));
      }
      return success;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
  
  updateRecurringExpense: async (r) => {
    try {
      const success = await recurringExpenseService.update(r);
      if (success) {
        set((state) => ({
          recurringExpenses: state.recurringExpenses.map(item => item.id === r.id ? r : item)
        }));
      }
      return success;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
  
  deleteRecurringExpense: async (id) => {
    try {
      const success = await recurringExpenseService.delete(id);
      if (success) {
        set((state) => ({
          recurringExpenses: state.recurringExpenses.filter(item => item.id !== id)
        }));
      }
      return success;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  processRecurringExpenses: async () => {
    try {
      const activeRecurring = await recurringExpenseService.fetch();
      set({ recurringExpenses: activeRecurring });

      const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const parseDate = (dStr: string) => {
        const parts = dStr.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dStr;
      };
      
      let exchangeRate = 1;
      let fetchedRate = false;

      for (const rec of activeRecurring) {
        if (rec.status !== 'Ativa') continue;
        
        const nextGen = parseDate(rec.nextGenerationDate);
        if (nextGen <= todayStr) {
          if (rec.currency === 'USD' && !fetchedRate) {
             try {
                const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
                const data = await res.json();
                exchangeRate = parseFloat(data.USDBRL.ask);
                fetchedRate = true;
             } catch(e) {
                console.error("Failed to fetch exchange rate", e);
                exchangeRate = 5.0; // fallback
             }
          }
          
          const rateToUse = rec.currency === 'USD' ? exchangeRate : 1;
          const convertedValue = rec.originalValue * rateToUse;

          const [yy, mm] = nextGen.split('-');
          const dueDateStr = `${String(rec.dueDay).padStart(2, '0')}/${mm}/${yy}`;
          
          const newTx: Transaction = {
            id: `trx-rec-${Math.random().toString(36).substr(2,9)}`,
            type: 'expense',
            description: rec.name,
            value: convertedValue,
            dueDate: dueDateStr,
            category: rec.category,
            status: 'Pendente',
            party: 'Assinatura',
            originalValue: rec.originalValue,
            currency: rec.currency,
            exchangeRate: rateToUse,
            recurringExpenseId: rec.id
          };
          
          await financeiroService.insert(newTx);
          
          const dateObj = new Date(`${nextGen}T00:00:00`);
          if (rec.frequency === 'Anual') {
            dateObj.setFullYear(dateObj.getFullYear() + 1);
          } else {
            dateObj.setMonth(dateObj.getMonth() + 1);
          }
          const nextDateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
          
          const updatedRec = { ...rec, nextGenerationDate: nextDateStr };
          await recurringExpenseService.update(updatedRec);
          
          set((state) => ({
            recurringExpenses: state.recurringExpenses.map(item => item.id === rec.id ? updatedRec : item)
          }));
        }
      }
    } catch(err) {
      console.error(err);
    }
  }
}));
