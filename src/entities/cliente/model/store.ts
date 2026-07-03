import { create } from 'zustand';
import type { Cliente } from './types';
import { clienteService } from '../api/service';

interface ClienteState {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  lastFetch: number;
  abortController: AbortController | null;
  
  fetchClientes: (force?: boolean) => Promise<void>;
  addCliente: (cliente: Cliente) => Promise<boolean>;
  updateCliente: (cliente: Cliente) => Promise<boolean>;
  deleteCliente: (id: string) => Promise<boolean>;
}

export const useClienteStore = create<ClienteState>((set, get) => ({
  clientes: [],
  loading: false,
  error: null,
  isRefreshing: false,
  lastFetch: 0,
  abortController: null,
  
  fetchClientes: async (force = false) => {
    const { clientes, lastFetch, abortController } = get();
    const now = Date.now();
    const TTL = 5 * 60 * 1000;

    if (!force && clientes.length > 0 && (now - lastFetch) < TTL) {
      return;
    }

    if (abortController) {
      abortController.abort();
    }
    const newAbortController = new AbortController();
    set({ abortController: newAbortController });

    const isInitialLoad = clientes.length === 0;
    if (isInitialLoad) {
      set({ loading: true, error: null });
    } else {
      set({ isRefreshing: true, error: null });
    }

    try {
      const data = await clienteService.fetch();
      
      if (newAbortController.signal.aborted) return;

      set({ clientes: data, loading: false, isRefreshing: false, lastFetch: Date.now(), abortController: null });
    } catch (err: any) {
      if (newAbortController.signal.aborted) return;
      set({ error: err.message || 'Erro ao carregar clientes', loading: false, isRefreshing: false, abortController: null });
    }
  },
  
  addCliente: async (cliente) => {
    set({ loading: true, error: null });
    try {
      const success = await clienteService.insert(cliente);
      if (success) {
        set((state) => ({ clientes: [cliente, ...state.clientes], loading: false }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar cliente', loading: false });
      throw err;
    }
  },
  
  updateCliente: async (cliente) => {
    set({ loading: true, error: null });
    try {
      const success = await clienteService.update(cliente);
      if (success) {
        set((state) => ({
          clientes: state.clientes.map((c) => (c.id === cliente.id ? cliente : c)),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar cliente', loading: false });
      return false;
    }
  },
  
  deleteCliente: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await clienteService.delete(id);
      if (success) {
        set((state) => ({
          clientes: state.clientes.filter((c) => c.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar cliente', loading: false });
      return false;
    }
  }
}));
