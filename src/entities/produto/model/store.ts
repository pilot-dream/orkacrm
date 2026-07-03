import { create } from 'zustand';
import type { Product } from './types';
import { produtoService } from '../api/service';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  lastFetch: number;
  abortController: AbortController | null;
  
  fetchProducts: (force?: boolean) => Promise<void>;
  addProduct: (product: Product) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  isRefreshing: false,
  lastFetch: 0,
  abortController: null,
  
  fetchProducts: async (force = false) => {
    const { products, lastFetch, abortController } = get();
    const now = Date.now();
    const TTL = 5 * 60 * 1000;

    if (!force && products.length > 0 && (now - lastFetch) < TTL) {
      return;
    }

    if (abortController) {
      abortController.abort();
    }
    const newAbortController = new AbortController();
    set({ abortController: newAbortController });

    const isInitialLoad = products.length === 0;
    if (isInitialLoad) {
      set({ loading: true, error: null });
    } else {
      set({ isRefreshing: true, error: null });
    }

    try {
      const data = await produtoService.fetch();
      
      if (newAbortController.signal.aborted) return;

      set({ products: data, loading: false, isRefreshing: false, lastFetch: Date.now(), abortController: null });
    } catch (err: any) {
      if (newAbortController.signal.aborted) return;
      set({ error: err.message || 'Erro ao carregar produtos', loading: false, isRefreshing: false, abortController: null });
    }
  },
  
  addProduct: async (product) => {
    set({ loading: true, error: null });
    try {
      const success = await produtoService.insert(product);
      if (success) {
        set((state) => ({ products: [product, ...state.products], loading: false }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar produto', loading: false });
      throw err;
    }
  },
  
  updateProduct: async (product) => {
    set({ loading: true, error: null });
    try {
      const success = await produtoService.update(product);
      if (success) {
        set((state) => ({
          products: state.products.map((p) => (p.id === product.id ? product : p)),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar produto', loading: false });
      return false;
    }
  },
  
  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await produtoService.delete(id);
      if (success) {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar produto', loading: false });
      return false;
    }
  }
}));
