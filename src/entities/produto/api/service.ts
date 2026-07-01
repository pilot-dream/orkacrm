import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Product } from '../model/types';

export const mapProductFromDb = (db: any): Product => ({
  id: db.id,
  nome: db.nome,
  categoria: db.categoria,
  descricao: db.descricao,
  setup: Number(db.setup || 0),
  mrr: Number(db.mrr || 0),
  percentual: Number(db.percentual || 0),
  status: db.status as 'ativo' | 'inativo',
  createdAt: db.created_at
});

export const mapProductToDb = (product: Product) => ({
  id: product.id,
  nome: product.nome,
  categoria: product.categoria,
  descricao: product.descricao,
  setup: product.setup,
  mrr: product.mrr,
  percentual: product.percentual,
  status: product.status
});

export const produtoService = {
  fetch: async (): Promise<Product[]> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      return saved ? JSON.parse(saved) : [];
    }
    const { data, error } = await supabase.from('produtos').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar produtos no Supabase:', error);
      return [];
    }
    return (data || []).map(mapProductFromDb);
  },
  
  insert: async (product: Product): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      const list = saved ? JSON.parse(saved) : [];
      list.push(product);
      localStorage.setItem('orka_produtos', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('produtos').insert([mapProductToDb(product)]);
    if (error) {
      console.error('Erro ao inserir produto no Supabase:', error);
      throw new Error(error.message || 'Erro ao inserir produto no Supabase');
    }
    return true;
  },
  
  update: async (product: Product): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      let list: Product[] = saved ? JSON.parse(saved) : [];
      list = list.map(p => p.id === product.id ? product : p);
      localStorage.setItem('orka_produtos', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('produtos').update(mapProductToDb(product)).eq('id', product.id);
    if (error) {
      console.error('Erro ao atualizar produto no Supabase:', error);
      throw new Error(error.message || 'Erro ao atualizar produto no Supabase');
    }
    return true;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      let list: Product[] = saved ? JSON.parse(saved) : [];
      list = list.filter(p => p.id !== id);
      localStorage.setItem('orka_produtos', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar produto no Supabase:', error);
      throw new Error(error.message || 'Erro ao deletar produto no Supabase');
    }
    return true;
  }
};
