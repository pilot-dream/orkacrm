import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Product } from '../model/types';
import { useAuthStore } from '../../usuario/model/store';

export const mapProductFromDb = (db: any): Product => ({
  id: db.id,
  nome: db.nome,
  categoria: db.categoria,
  descricao: db.descricao,
  setup: Number(db.setup || 0),
  mrr: Number(db.mrr || 0),
  percentual: Number(db.percentual || 0),
  status: db.status as 'ativo' | 'inativo',
  createdAt: db.created_at,
  tenant_id: db.tenant_id
});

export const mapProductToDb = (product: Product) => ({
  id: product.id,
  nome: product.nome,
  categoria: product.categoria,
  descricao: product.descricao,
  setup: product.setup,
  mrr: product.mrr,
  percentual: product.percentual,
  status: product.status,
  tenant_id: product.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
});

export const produtoService = {
  fetch: async (): Promise<Product[]> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      const list: Product[] = saved ? JSON.parse(saved) : [];
      return list.filter(p => p.tenant_id === tenant);
    }
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('tenant_id', tenant)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('❌ Erro ao buscar produtos:', error.message);
      return [];
    }
    return (data || []).map(mapProductFromDb);
  },
  
  insert: async (product: Product): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      const list = saved ? JSON.parse(saved) : [];
      const productWithTenant = {
        ...product,
        tenant_id: product.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
      };
      list.push(productWithTenant);
      localStorage.setItem('orka_produtos', JSON.stringify(list));
      console.log('✅ Produto criado (offline):', productWithTenant);
      return true;
    }
    const { error } = await supabase.from('produtos').insert([mapProductToDb(product)]);
    if (error) {
      console.error('❌ Erro ao criar produto:', error.message);
      throw new Error(error.message || 'Erro ao inserir produto no Supabase');
    }
    console.log('✅ Produto criado:', product);
    return true;
  },
  
  update: async (product: Product): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      let list: Product[] = saved ? JSON.parse(saved) : [];
      list = list.map(p => p.id === product.id ? product : p);
      localStorage.setItem('orka_produtos', JSON.stringify(list));
      console.log('✅ Produto atualizado (offline):', product);
      return true;
    }
    const { error } = await supabase.from('produtos').update(mapProductToDb(product)).eq('id', product.id);
    if (error) {
      console.error('❌ Erro ao atualizar produto:', error.message);
      throw new Error(error.message || 'Erro ao atualizar produto no Supabase');
    }
    console.log('✅ Produto atualizado:', product);
    return true;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_produtos');
      let list: Product[] = saved ? JSON.parse(saved) : [];
      list = list.filter(p => p.id !== id);
      localStorage.setItem('orka_produtos', JSON.stringify(list));
      console.log('✅ Produto excluído (offline):', id);
      return true;
    }
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) {
      console.error('❌ Erro ao excluir produto:', error.message);
      throw new Error(error.message || 'Erro ao deletar produto no Supabase');
    }
    console.log('✅ Produto excluído:', id);
    return true;
  }
};
