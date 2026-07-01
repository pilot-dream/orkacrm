export interface Product {
  id: string;
  nome: string;
  categoria?: string;
  descricao?: string;
  setup: number;
  mrr: number;
  percentual: number;
  status: 'ativo' | 'inativo';
  createdAt?: string;
  tenant_id?: string;
}
