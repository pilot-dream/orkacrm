import { create } from 'zustand';
import type { Product } from './types';
import { produtoService } from '../api/service';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  
  fetchProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  loading: false,
  error: null,
  
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await produtoService.fetch();
      set({ products: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar produtos', loading: false });
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
