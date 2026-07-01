import { create } from 'zustand';
import type { Cliente } from './types';
import { clienteService } from '../api/service';

interface ClienteState {
  clientes: Cliente[];
  loading: boolean;
  error: string | null;
  
  fetchClientes: () => Promise<void>;
  addCliente: (cliente: Cliente) => Promise<boolean>;
  updateCliente: (cliente: Cliente) => Promise<boolean>;
  deleteCliente: (id: string) => Promise<boolean>;
}

export const useClienteStore = create<ClienteState>((set) => ({
  clientes: [],
  loading: false,
  error: null,
  
  fetchClientes: async () => {
    set({ loading: true, error: null });
    try {
      const data = await clienteService.fetch();
      set({ clientes: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar clientes', loading: false });
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
      return false;
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
