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
  paymentValue?: number | null;
  paidBy?: string | null;
  originalValue?: number;
  currency?: string;
  exchangeRate?: number;
  recurringExpenseId?: string;
}

export interface RecurringExpense {
  id: string;
  tenant_id: string;
  name: string;
  category: string;
  originalValue: number;
  currency: string;
  frequency: 'Mensal' | 'Anual';
  dueDay: number;
  paymentMethod?: string;
  observations?: string;
  status: 'Ativa' | 'Cancelada';
  nextGenerationDate: string;
  createdAt?: string;
}
