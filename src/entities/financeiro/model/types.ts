export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'Recebido' | 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  value: number;
  dueDate: string;
  paymentDate?: string | null;
  category: string;
  status: TransactionStatus;
  party: string; // client name or supplier name
  createdAt?: string;
  tenant_id?: string;
  projectId?: string;
  installmentNumber?: number;
}
