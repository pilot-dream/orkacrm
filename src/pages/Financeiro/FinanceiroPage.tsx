import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Check,
  CreditCard,
  UserCheck,
  Calendar,
  TrendingUp
} from 'lucide-react';

import { useFinanceiroStore } from '../../entities/financeiro/model/store';
import { useClienteStore } from '../../entities/cliente/model/store';
import { useAuthStore } from '../../entities/usuario/model/store';
import type { Transaction, TransactionType, TransactionStatus } from '../../entities/financeiro/model/types';
import { PageContainer } from '../../shared/components/PageContainer';
import { SearchBar } from '../../shared/components/SearchBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { 
  PieChart, Pie, Cell, Tooltip as ChartTooltip, 
  LineChart as RechartLineChart, Line as RechartLine, 
  XAxis as ChartXAxis, YAxis as ChartYAxis, 
  CartesianGrid as ChartCartesianGrid, 
  ResponsiveContainer 
} from 'recharts';

const CATEGORIES_INCOME = ['Assinatura', 'Consultoria', 'Setup', 'Outros'];
const CATEGORIES_EXPENSE = ['Infraestrutura', 'Marketing', 'Salários', 'Impostos', 'Serviços', 'Outros'];

export default function FinanceiroPage() {
  const { transactions, recurringExpenses, loading, error, fetchTransactions, addTransaction, updateTransaction, deleteTransaction, addRecurringExpense, deleteRecurringExpense } = useFinanceiroStore();
  const { clientes, fetchClientes } = useClienteStore();
  const teamMembers = useAuthStore((state) => state.teamMembers);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [datePeriod, setDatePeriod] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('month');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  // Custom Navigation Active Tab
  const [activeTab, setActiveTab] = useState<'receber' | 'pagar' | 'fixas' | 'fluxo'>('receber');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset pagination on filter or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    searchQuery,
    typeFilter,
    statusFilter,
    monthFilter,
    datePeriod,
    startDateFilter,
    endDateFilter
  ]);

  // Settlement / Payment confirmation modal states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTx, setPaymentTx] = useState<Transaction | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentValue, setPaymentValue] = useState('');
  const [paymentResponsible, setPaymentResponsible] = useState('');

  // Modals / Dialogs
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [transactionToDeleteId, setTransactionToDeleteId] = useState<string | null>(null);

  // Form states for creating transaction
  const [formType, setFormType] = useState<TransactionType>('income');
  const [formDescription, setFormDescription] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState('Outros');
  const [formStatus, setFormStatus] = useState<TransactionStatus>('Pendente');
  const [formParty, setFormParty] = useState('');

  // Expense custom payment recurrence & installment states
  const [formExpenseRecurrence, setFormExpenseRecurrence] = useState<'unica' | 'fixa'>('unica');
  const [formExpensePaymentMethod, setFormExpensePaymentMethod] = useState<'a_vista' | 'parcelado'>('a_vista');
  const [formExpenseInstallmentsCount, setFormExpenseInstallmentsCount] = useState('1');
  const [formExpenseFirstInstallmentDate, setFormExpenseFirstInstallmentDate] = useState('');
  const [formFixedDueDay, setFormFixedDueDay] = useState('10');
  const [formRecCurrency, setFormRecCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [formRecFrequency, setFormRecFrequency] = useState<'Mensal' | 'Anual'>('Mensal');

  useEffect(() => {
    fetchTransactions();
    fetchClientes();
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSearchQuery(category);
    }
    const month = searchParams.get('month');
    if (month) {
      setMonthFilter(month);
    }
  }, [searchParams]);

  // Set default category when formType changes
  useEffect(() => {
    if (formType === 'income') {
      setFormCategory(CATEGORIES_INCOME[0]);
      setFormStatus('Pendente');
    } else {
      setFormCategory(CATEGORIES_EXPENSE[0]);
      setFormStatus('Pendente');
    }
  }, [formType]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescription || !formValue) return;

    const parseInputDate = (dateStr: string): Date => {
      if (dateStr.includes('-')) {
        return new Date(dateStr + 'T12:00:00');
      }
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      return new Date();
    };

    const formatDateBR = (d: Date): string => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    let transactionsToCreate: Transaction[] = [];

    if (formType === 'expense') {
      if (formExpenseRecurrence === 'fixa') {
        const day = Math.min(Math.max(Number(formFixedDueDay) || 10, 1), 31);
        const today = new Date();
        const baseYear = today.getFullYear();
        const baseMonth = today.getMonth();
        const nextGen = new Date(baseYear, baseMonth, day);
        if (nextGen.getTime() < today.getTime()) {
           if (formRecFrequency === 'Anual') {
               nextGen.setFullYear(nextGen.getFullYear() + 1);
           } else {
               nextGen.setMonth(nextGen.getMonth() + 1);
           }
        }
        
        const success = await addRecurringExpense({
           id: `rec-${Date.now()}`,
           tenant_id: '', 
           name: formDescription,
           category: formCategory,
           originalValue: Number(formValue),
           currency: formRecCurrency,
           frequency: formRecFrequency,
           dueDay: day,
           paymentMethod: formParty,
           status: 'Ativa',
           nextGenerationDate: nextGen.toISOString().split('T')[0]
        });
        
        if (success) {
           setIsAddModalOpen(false);
           resetAddForm();
           fetchTransactions(); 
        }
        return;
      } else {
        if (formExpensePaymentMethod === 'parcelado') {
          const count = Math.max(Number(formExpenseInstallmentsCount) || 1, 1);
          const firstDate = parseInputDate(formExpenseFirstInstallmentDate || new Date().toISOString().split('T')[0]);
          const installmentVal = Math.round(Number(formValue) / count);
          
          for (let i = 0; i < count; i++) {
            const d = new Date(firstDate.getFullYear(), firstDate.getMonth() + i, firstDate.getDate());
            transactionsToCreate.push({
              id: `trx-expense-inst-${Date.now()}-${i+1}`,
              type: 'expense',
              description: `${formDescription} (Parcela ${i+1}/${count})`,
              value: installmentVal,
              dueDate: formatDateBR(d),
              paymentDate: null,
              category: formCategory,
              status: 'Pendente',
              party: formParty
            });
          }
        } else {
          transactionsToCreate.push({
            id: `trx-${Date.now()}`,
            type: 'expense',
            description: formDescription,
            value: Number(formValue),
            dueDate: formDueDate || formatDateBR(new Date()),
            paymentDate: formStatus === 'Pago' ? (formDueDate || formatDateBR(new Date())) : null,
            category: formCategory,
            status: formStatus,
            party: formParty
          });
        }
      }
    } else {
      transactionsToCreate.push({
        id: `trx-${Date.now()}`,
        type: 'income',
        description: formDescription,
        value: Number(formValue),
        dueDate: formDueDate || formatDateBR(new Date()),
        paymentDate: formStatus === 'Recebido' ? (formDueDate || formatDateBR(new Date())) : null,
        category: formCategory,
        status: formStatus,
        party: formParty
      });
    }

    let success = true;
    for (const trx of transactionsToCreate) {
      const res = await addTransaction(trx);
      if (!res) success = false;
    }

    if (success) {
      setIsAddModalOpen(false);
      resetAddForm();
    }
  };

  const resetAddForm = () => {
    setFormType('income');
    setFormDescription('');
    setFormValue('');
    setFormDueDate('');
    setFormCategory('Outros');
    setFormStatus('Pendente');
    setFormParty('');
    setFormExpenseRecurrence('unica');
    setFormExpensePaymentMethod('a_vista');
    setFormExpenseInstallmentsCount('1');
    setFormExpenseFirstInstallmentDate('');
    setFormFixedDueDay('10');
    setFormRecCurrency('BRL');
    setFormRecFrequency('Mensal');
  };

  const handleToggleStatus = async (t: Transaction) => {
    const nextStatus: TransactionStatus = t.type === 'income' 
      ? (t.status === 'Recebido' ? 'Pendente' : 'Recebido')
      : (t.status === 'Pago' ? 'Pendente' : 'Pago');

    const updated = {
      ...t,
      status: nextStatus,
      paymentDate: nextStatus === 'Recebido' || nextStatus === 'Pago' ? new Date().toLocaleDateString('pt-BR') : null
    };

    await updateTransaction(updated);
  };

  const handleOpenPaymentModal = (t: Transaction) => {
    setPaymentTx(t);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentValue(String(t.value));
    setPaymentResponsible(teamMembers[0]?.name || '');
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTx) return;

    const formatDateBR = (dStr: string): string => {
      if (dStr.includes('-')) {
        const parts = dStr.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    };

    const updated: Transaction = {
      ...paymentTx,
      status: 'Pago',
      paymentDate: formatDateBR(paymentDate),
      paymentValue: Number(paymentValue),
      paidBy: paymentResponsible
    };

    const success = await updateTransaction(updated);
    if (success) {
      setIsPaymentModalOpen(false);
      setPaymentTx(null);
    }
  };

  const handleCancelTransaction = async (t: Transaction) => {
    const updated = {
      ...t,
      status: 'Cancelado' as const,
      paymentDate: null
    };
    await updateTransaction(updated);
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (transactionToDeleteId) {
      await deleteTransaction(transactionToDeleteId);
    }
    setIsDeleteConfirmOpen(false);
    setTransactionToDeleteId(null);
  };

  // SaaS Financial Calculations
  const mrrAcumulado = clientes.reduce((acc, curr) => acc + (curr.monthlySpend || 0), 0);

  const parseDueDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const year = Number(parts[2]);
      return new Date(year, month, day);
    }
    return null;
  };

  // Filter logic segmented by activeTab
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab-level filter overrides
    let matchesType = true;
    if (activeTab === 'receber') {
      matchesType = t.type === 'income';
    } else if (activeTab === 'pagar') {
      matchesType = t.type === 'expense';
    } else if (activeTab === 'fixas') {
      matchesType = t.type === 'expense' && (t.id.includes('fixed') || t.description.toLowerCase().includes('recorrente') || t.description.toLowerCase().includes('mensalidade'));
    } else if (activeTab === 'fluxo') {
      matchesType = typeFilter === 'all' || t.type === typeFilter;
    }

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesMonth = !monthFilter || (t.dueDate && t.dueDate.includes(`/${monthFilter}/`));

    let matchesDate = true;
    if (datePeriod !== 'all') {
      const tDate = parseDueDate(t.dueDate || '');
      if (!tDate) {
        matchesDate = false;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (datePeriod === 'today') {
          const compDate = new Date(tDate);
          compDate.setHours(0, 0, 0, 0);
          matchesDate = compDate.getTime() === today.getTime();
        } else if (datePeriod === 'week') {
          const currentDay = today.getDay();
          const firstDayOfWeek = new Date(today);
          firstDayOfWeek.setDate(today.getDate() - currentDay);
          firstDayOfWeek.setHours(0, 0, 0, 0);
          
          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          lastDayOfWeek.setHours(23, 59, 59, 999);
          
          matchesDate = tDate.getTime() >= firstDayOfWeek.getTime() && tDate.getTime() <= lastDayOfWeek.getTime();
        } else if (datePeriod === 'month') {
          matchesDate = tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        } else if (datePeriod === 'custom') {
          const start = startDateFilter ? new Date(startDateFilter + 'T00:00:00') : null;
          const end = endDateFilter ? new Date(endDateFilter + 'T23:59:59') : null;
          if (start) {
            matchesDate = matchesDate && tDate.getTime() >= start.getTime();
          }
          if (end) {
            matchesDate = matchesDate && tDate.getTime() <= end.getTime();
          }
        }
      }
    }

    return matchesSearch && matchesType && matchesStatus && matchesMonth && matchesDate;
  });

  // 1. Receivables Totals (all of 'income')
  const totalRecebidoRealizado = transactions
    .filter(t => t.type === 'income' && t.status === 'Recebido')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalRecebidoPendente = transactions
    .filter(t => t.type === 'income' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalRecebidoAtrasado = transactions
    .filter(t => t.type === 'income' && t.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0);

  // 2. Payables Totals (all of 'expense')
  const totalPagoRealizado = transactions
    .filter(t => t.type === 'expense' && t.status === 'Pago')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalPagoPendente = transactions
    .filter(t => t.type === 'expense' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalPagoAtrasado = transactions
    .filter(t => t.type === 'expense' && t.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0);

  // 3. Consolidated Totals
  const totalInflows = transactions
    .filter(t => t.type === 'income' && t.status !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalOutflows = transactions
    .filter(t => t.type === 'expense' && t.status !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.value, 0);

  // Realized Net = (Inflows Recebido) - (Outflows Pago)
  const realizedNet = totalRecebidoRealizado - totalPagoRealizado;
  // Projected Net = (All Inflows active) - (All Outflows active)
  const projectedNet = totalInflows - totalOutflows;

  // 4. Removed fixedExpensesGroups calculation

  // Donut Chart - Expenses by Category Data
  const categoriesList = ['Infraestrutura', 'Marketing', 'Salários', 'Impostos', 'Serviços', 'Outros'];
  const donutColors = ['#8B5CF6', '#EC4899', '#EF4444', '#FBBF24', '#10B981', '#3B82F6'];
  const expenseByCategoryData = categoriesList.map(cat => {
    const total = transactions
      .filter(t => t.type === 'expense' && t.category === cat && t.status !== 'Cancelado')
      .reduce((acc, curr) => acc + curr.value, 0);
    return { name: cat, value: total };
  }).filter(item => item.value > 0);

  // Line Chart - last 12 months expense evolution
  const getLast12Months = () => {
    const months = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const label = `${monthNames[d.getMonth()]}/${String(year).slice(-2)}`;
      months.push({
        label,
        monthIndex,
        year: String(year)
      });
    }
    return months;
  };

  const months12List = getLast12Months();
  const expensesHistoryData = months12List.map(m => {
    const total = transactions
      .filter(t => {
        if (t.type !== 'expense' || t.status === 'Cancelado') return false;
        if (!t.dueDate) return false;
        const parts = t.dueDate.split('/');
        if (parts.length === 3) {
          return parts[1] === m.monthIndex && parts[2] === m.year;
        }
        return false;
      })
      .reduce((acc, curr) => acc + curr.value, 0);

    return {
      name: m.label,
      despesas: total
    };
  });

  // Pagination calculations
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const paginatedRecurring = recurringExpenses.slice(startIndex, endIndex);

  return (
    <PageContainer>
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>Gestão Financeira & ERP</h1>
        </div>
        <button className="primary-btn" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Lançar Transação</span>
        </button>
      </header>

      {/* ERP Tab Navigation */}
      <div className="mobile-scroll-tabs-container" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '2px' }}>
        {[
          { id: 'receber', label: 'Contas a Receber', icon: <ArrowUpRight size={16} /> },
          { id: 'pagar', label: 'Contas a Pagar', icon: <ArrowDownRight size={16} /> },
          { id: 'fixas', label: 'Assinaturas', icon: <Calendar size={16} /> },
          { id: 'fluxo', label: 'Fluxo de Caixa & BI', icon: <TrendingUp size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as any);
              // Reset type filters according to tab selection for usability
              if (tab.id === 'receber') setTypeFilter('income');
              else if (tab.id === 'pagar') setTypeFilter('expense');
              else setTypeFilter('all');
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SaaS Metric Grid Cards - Segmented per activeTab */}
      <section className="force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {activeTab === 'receber' && (
          <>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>MRR CONTRATADO</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C084FC', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                {formatCurrency(mrrAcumulado)}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mês</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '8px' }}>Clientes recorrentes ativos</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RECEBIDO (LIQUIDADO)</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '8px' }}>
                {formatCurrency(totalRecebidoRealizado)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Entradas já liquidadas no banco</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>A RECEBER (PENDENTE)</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '8px' }}>
                {formatCurrency(totalRecebidoPendente)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Aguardando prazo de vencimento</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RECEITAS EM ATRASO</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '8px' }}>
                {formatCurrency(totalRecebidoAtrasado)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Boletos/mensalidades vencidos</span>
            </div>
          </>
        )}

        {activeTab === 'pagar' && (
          <>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PAGO (LIQUIDADO)</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '8px' }}>
                {formatCurrency(totalPagoRealizado)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Custos operacionais liquidados</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CONTAS PENDENTES</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '8px' }}>
                {formatCurrency(totalPagoPendente)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>Aguardando liquidação</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CONTAS VENCIDAS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '8px' }}>
                {formatCurrency(totalPagoAtrasado)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Despesas com prazo expirado</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL GASTOS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
                {formatCurrency(totalPagoRealizado + totalPagoPendente + totalPagoAtrasado)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Total projetado na competência</span>
            </div>
          </>
        )}

        {activeTab === 'fixas' && (
          <>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CADASTROS DE CUSTO FIXO</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '8px' }}>
                {recurringExpenses.length}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Despesas recorrentes ativas</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>VALOR MENSAL CONSOLIDADO</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '8px' }}>
                {formatCurrency(recurringExpenses.reduce((acc: number, curr: any) => acc + curr.originalValue, 0))}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Custo fixo projetado p/ mês</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>MÉDIA POR DESPESA</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
                {formatCurrency(recurringExpenses.length > 0 ? recurringExpenses.reduce((acc: number, curr: any) => acc + curr.originalValue, 0) / recurringExpenses.length : 0)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Consolidado por cadastro master</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PROJEÇÃO ANUAL (12M)</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '8px' }}>
                {formatCurrency(recurringExpenses.reduce((acc: number, curr: any) => acc + curr.originalValue, 0) * 12)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Comprometimento anual estimado</span>
            </div>
          </>
        )}

        {activeTab === 'fluxo' && (
          <>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RECEITAS TOTAIS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '8px' }}>
                {formatCurrency(totalRecebidoRealizado)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Total liquidado em conta</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DESPESAS TOTAIS</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '8px' }}>
                {formatCurrency(totalPagoRealizado)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Total pago de custos realizados</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SALDO CAIXA (REALIZADO NET)</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: realizedNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '8px' }}>
                {formatCurrency(realizedNet)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Saldo real líquido em caixa</span>
            </div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SALDO CAIXA (PREVISTO NET)</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: projectedNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '8px' }}>
                {formatCurrency(projectedNet)}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Previsão líquida c/ pendentes</span>
            </div>
          </>
        )}
      </section>

      {/* BI Analytics & Consolidated graphs shown ONLY on Fluxo de Caixa Tab */}
      {activeTab === 'fluxo' && (
        <section className="force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Chart 1: Cash Flow Inflow x Outflow bar chart visualization */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Comparativo Entrada x Saída</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><ArrowUpRight size={14} color="var(--color-success)" /> Recebido</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(totalRecebidoRealizado)}</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: totalRecebidoRealizado + totalPagoRealizado > 0 ? `${(totalRecebidoRealizado / (totalRecebidoRealizado + totalPagoRealizado)) * 100}%` : '0%', height: '100%', backgroundColor: 'var(--color-success)' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><ArrowDownRight size={14} color="var(--color-danger)" /> Pago</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(totalPagoRealizado)}</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: totalRecebidoRealizado + totalPagoRealizado > 0 ? `${(totalPagoRealizado / (totalRecebidoRealizado + totalPagoRealizado)) * 100}%` : '0%', height: '100%', backgroundColor: 'var(--color-danger)' }}></div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Margem Líquida Realizada</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: realizedNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '4px' }}>
                {totalRecebidoRealizado > 0 ? `${Math.round((realizedNet / totalRecebidoRealizado) * 100)}%` : '0%'}
              </div>
            </div>
          </div>

          {/* BI Chart 2: Donut of Expenses by Category */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Custos por Categoria</h3>
            {expenseByCategoryData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={expenseByCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseByCategoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      formatter={(val) => formatCurrency(Number(val))}
                      contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend list */}
                <div className="force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                  {expenseByCategoryData.map((entry, idx) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: donutColors[idx % donutColors.length] }}></div>
                      <span style={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Sem despesas registradas neste período.
              </div>
            )}
          </div>

          {/* BI Chart 3: Historical Expenses Line Chart */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Evolução de Custos (12M)</h3>
            <ResponsiveContainer width="100%" height={170}>
              <RechartLineChart data={expensesHistoryData}>
                <ChartCartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                <ChartXAxis dataKey="name" stroke="var(--text-muted)" fontSize={9} />
                <ChartYAxis stroke="var(--text-muted)" fontSize={9} tickFormatter={(val) => `R$ ${val}`} />
                <ChartTooltip 
                  formatter={(val) => formatCurrency(Number(val))}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                />
                <RechartLine type="monotone" dataKey="despesas" stroke="var(--color-danger)" strokeWidth={2} activeDot={{ r: 5 }} dot={{ strokeWidth: 1.5, r: 3 }} />
              </RechartLineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Filter and Search Bar (only for receivables, payables, and consolidated flow) */}
      {activeTab !== 'fixas' && (
        <section style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por descrição, cliente/fornecedor ou categoria..." />
          
          <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end' }}>
            <select 
              value={datePeriod} 
              onChange={(e) => setDatePeriod(e.target.value as any)}
              className="form-select"
              style={{ width: '150px', padding: '6px 12px' }}
            >
              <option value="all">Qualquer data</option>
              <option value="today">Hoje</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="custom">Período personalizado</option>
            </select>

            {activeTab === 'fluxo' && (
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="form-select"
                style={{ width: '150px', padding: '6px 12px' }}
              >
                <option value="all">Todas Operações</option>
                <option value="income">Entradas / Receitas</option>
                <option value="expense">Saídas / Despesas</option>
              </select>
            )}

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="form-select"
              style={{ width: '150px', padding: '6px 12px' }}
            >
              <option value="all">Todos os Status</option>
              <option value="Recebido">Recebido</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
        </section>
      )}

      {datePeriod === 'custom' && activeTab !== 'fixas' && (
        <section style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>De:</span>
            <input type="date" className="form-input" style={{ width: '150px', padding: '4px 8px', fontSize: '0.82rem' }} value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Até:</span>
            <input type="date" className="form-input" style={{ width: '150px', padding: '4px 8px', fontSize: '0.82rem' }} value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} />
          </div>
          <button 
            type="button" 
            className="outline-btn" 
            style={{ padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer' }}
            onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
          >
            Limpar Datas
          </button>
        </section>
      )}

      {monthFilter && activeTab !== 'fixas' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
          <span>Filtrando pelo mês de vencimento: <b>{monthFilter}</b></span>
          <button 
            onClick={() => setMonthFilter(null)}
            style={{ padding: '2px 8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', color: '#fff', fontSize: '0.75rem' }}
          >
            Limpar Filtro de Mês
          </button>
        </div>
      )}

      {loading && <LoadingOverlay active={true} message="Carregando finanças..." />}
      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Main List Rendering based on activeTab */}
      {activeTab === 'fixas' ? (
        /* Recurring Expenses List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Nome da Assinatura</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Categoria</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Moeda / Freq</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Dia Venc.</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Valor Original</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Próx. Geração</th>
                  <th style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecurring.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#fff' }}>
                      {item.name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{item.category}</td>
                    <td style={{ padding: '14px 16px' }}>{item.currency} ({item.frequency})</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600 }}>Todo dia {item.dueDay}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-danger)' }}>
                      {item.currency === 'USD' ? 'US$' : 'R$'} {item.originalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{item.nextGenerationDate}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: '10px', fontSize: '0.72rem', backgroundColor: item.status === 'Ativa' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', color: item.status === 'Ativa' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                       <button className="icon-btn" onClick={() => deleteRecurringExpense(item.id)} title="Excluir">
                          <Trash2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
                {recurringExpenses.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Nenhuma assinatura recorrente encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {Math.ceil(recurringExpenses.length / ITEMS_PER_PAGE) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Mostrando <b>{startIndex + 1}</b> a <b>{Math.min(endIndex, recurringExpenses.length)}</b> de <b>{recurringExpenses.length}</b> assinaturas
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="outline-btn"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Anterior
                </button>
                <button 
                  type="button" 
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(recurringExpenses.length / ITEMS_PER_PAGE), prev + 1))}
                  disabled={currentPage >= Math.ceil(recurringExpenses.length / ITEMS_PER_PAGE)}
                  className="outline-btn"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', opacity: currentPage >= Math.ceil(recurringExpenses.length / ITEMS_PER_PAGE) ? 0.4 : 1, cursor: currentPage >= Math.ceil(recurringExpenses.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer' }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Regular Transaction Table for Receivables, Payables, and Cash Flow */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Operação</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Descrição</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Cliente/Fornecedor</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Categoria</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Vencimento</th>
                  {activeTab === 'pagar' && <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Pago por / Valor Pago</th>}
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Valor Original</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-smooth)' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px' }}>
                      {t.type === 'income' ? (
                        <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <ArrowUpRight size={14} /> Entrada
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <ArrowDownRight size={14} /> Saída
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{t.description}</td>
                    <td style={{ padding: '12px 16px' }}>{t.party || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>{t.category}</td>
                    <td style={{ padding: '12px 16px' }}>{t.dueDate}</td>
                    {activeTab === 'pagar' && (
                      <td style={{ padding: '12px 16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {t.status === 'Pago' ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UserCheck size={12} /> {t.paidBy || 'Não informado'}</span>
                            <div style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <CreditCard size={12} /> {formatCurrency(t.paymentValue || t.value)}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                    )}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: t.type === 'income' ? 'var(--color-success)' : '#fff' }}>
                      {formatCurrency(t.value)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: 
                            t.status === 'Recebido' || t.status === 'Pago' ? 'rgba(16, 185, 129, 0.08)' :
                            t.status === 'Atrasado' ? 'rgba(239, 68, 68, 0.08)' :
                            t.status === 'Cancelado' ? 'rgba(156, 163, 175, 0.08)' :
                            'rgba(245, 158, 11, 0.08)',
                          color: 
                            t.status === 'Recebido' || t.status === 'Pago' ? 'var(--color-success)' :
                            t.status === 'Atrasado' ? 'var(--color-danger)' :
                            t.status === 'Cancelado' ? 'var(--text-secondary)' :
                            'var(--color-warning)'
                        }}
                      >
                        {(t.status === 'Recebido' || t.status === 'Pago') && <Check size={10} />}
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {t.type === 'income' && (t.status === 'Pendente' || t.status === 'Atrasado') && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            className="outline-btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              borderColor: 'var(--color-success)',
                              color: 'var(--color-success)',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={12} />
                            <span>Receber</span>
                          </button>
                        )}
                        {t.type === 'expense' && (t.status === 'Pendente' || t.status === 'Atrasado') && (
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(t)}
                            className="outline-btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              borderColor: 'var(--color-success)',
                              color: 'var(--color-success)',
                              cursor: 'pointer',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={12} />
                            <span>Pagar</span>
                          </button>
                        )}
                        {(t.status === 'Pendente' || t.status === 'Atrasado') && (
                          <button
                            type="button"
                            onClick={() => handleCancelTransaction(t)}
                            className="outline-btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.72rem',
                              borderColor: 'rgba(255,255,255,0.1)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              borderRadius: '4px'
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                        <button 
                          className="icon-btn" 
                          type="button"
                          onClick={() => handleDeleteClick(t.id)}
                          style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransactions.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma transação encontrada.</div>
            )}
          </div>
          {/* Pagination Controls */}
          {Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Mostrando <b>{startIndex + 1}</b> a <b>{Math.min(endIndex, filteredTransactions.length)}</b> de <b>{filteredTransactions.length}</b> transações
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="outline-btn"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                  Página {currentPage} de {Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)}
                </span>
                <button 
                  type="button" 
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)}
                  className="outline-btn"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', opacity: currentPage === Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) ? 0.4 : 1, cursor: currentPage === Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer' }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settlement/Payment Confirmation Modal */}
      {isPaymentModalOpen && paymentTx && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div className="card animate-slide-up" style={{ width: '420px', padding: '24px', backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} color="var(--color-success)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Liquidar Despesa</h3>
              </div>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsPaymentModalOpen(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '18px', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transação</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginTop: '2px' }}>{paymentTx.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                <span>Vencimento: {paymentTx.dueDate}</span>
                <span>Original: <b style={{ color: '#fff' }}>{formatCurrency(paymentTx.value)}</b></span>
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> Data do Pagamento *
                </span>
                <input 
                  type="date" 
                  className="form-input" 
                  value={paymentDate} 
                  onChange={(e) => setPaymentDate(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <span className="input-label">Valor Pago (R$) *</span>
                <input 
                  type="number" 
                  className="form-input" 
                  value={paymentValue} 
                  onChange={(e) => setPaymentValue(e.target.value)} 
                  required 
                />
              </div>

              <div className="input-group">
                <span className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <UserCheck size={12} /> Usuário Responsável *
                </span>
                <select 
                  className="form-select" 
                  value={paymentResponsible} 
                  onChange={(e) => setPaymentResponsible(e.target.value)}
                  required
                >
                  <option value="">Selecione o responsável</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn" style={{ backgroundColor: 'var(--color-success)' }}>Confirmar Pagamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Lançar Transação Financeira</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Tipo de Lançamento</span>
                <select className="form-select" value={formType} onChange={(e) => setFormType(e.target.value as TransactionType)}>
                  <option value="income">Entrada (Receita)</option>
                  <option value="expense">Saída (Despesa)</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">Descrição *</span>
                <input type="text" className="form-input" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} required placeholder="Ex: Mensalidade Junho Stripe" />
              </div>

              {formType === 'expense' && (
                <div className="input-group">
                  <span className="input-label">Recorrência da Despesa</span>
                  <select 
                    className="form-select" 
                    value={formExpenseRecurrence} 
                    onChange={(e) => setFormExpenseRecurrence(e.target.value as any)}
                  >
                    <option value="unica">Despesa Única</option>
                    <option value="fixa">Despesa Fixa / Recorrente</option>
                  </select>
                </div>
              )}

              {formType === 'expense' && formExpenseRecurrence === 'fixa' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Valor Original *</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={formValue} 
                        onChange={(e) => setFormValue(e.target.value)} 
                        required 
                        placeholder="Ex: 500" 
                      />
                    </div>
                    <div className="input-group">
                      <span className="input-label">Moeda</span>
                      <select className="form-select" value={formRecCurrency} onChange={(e) => setFormRecCurrency(e.target.value as any)}>
                        <option value="BRL">Real (BRL)</option>
                        <option value="USD">Dólar (USD)</option>
                      </select>
                    </div>
                  </div>
                  <div className="force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Frequência</span>
                      <select className="form-select" value={formRecFrequency} onChange={(e) => setFormRecFrequency(e.target.value as any)}>
                        <option value="Mensal">Mensal</option>
                        <option value="Anual">Anual</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Dia do Vencimento *</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="1" 
                        max="31" 
                        value={formFixedDueDay} 
                        onChange={(e) => setFormFixedDueDay(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                </div>
              )}

              {formType === 'expense' && formExpenseRecurrence === 'unica' && (
                <div className="input-group">
                  <span className="input-label">Forma de Pagamento</span>
                  <select 
                    className="form-select" 
                    value={formExpensePaymentMethod} 
                    onChange={(e) => setFormExpensePaymentMethod(e.target.value as any)}
                  >
                    <option value="a_vista">À vista</option>
                    <option value="parcelado">Parcelado</option>
                  </select>
                </div>
              )}

              {formType === 'expense' && formExpenseRecurrence === 'unica' && formExpensePaymentMethod === 'parcelado' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="force-1col-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Valor Total (R$) *</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={formValue} 
                        onChange={(e) => setFormValue(e.target.value)} 
                        required 
                        placeholder="Ex: 1200" 
                      />
                    </div>
                    <div className="input-group">
                      <span className="input-label">Quantidade de Parcelas *</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="1" 
                        value={formExpenseInstallmentsCount} 
                        onChange={(e) => setFormExpenseInstallmentsCount(e.target.value)} 
                        required 
                        placeholder="Ex: 3" 
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <span className="input-label">Data da Primeira Parcela *</span>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={formExpenseFirstInstallmentDate} 
                      onChange={(e) => setFormExpenseFirstInstallmentDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              )}

              {!(formType === 'expense' && formExpenseRecurrence === 'fixa') && !(formType === 'expense' && formExpenseRecurrence === 'unica' && formExpensePaymentMethod === 'parcelado') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <span className="input-label">Valor (R$) *</span>
                    <input type="number" className="form-input" value={formValue} onChange={(e) => setFormValue(e.target.value)} required placeholder="Ex: 5000" />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Vencimento *</span>
                    <input type="text" className="form-input" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required={formType === 'income' || (formType === 'expense' && formExpensePaymentMethod === 'a_vista')} placeholder="Ex: 30/07/2026" />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Categoria</span>
                  <select className="form-select" value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                    {formType === 'income' 
                      ? CATEGORIES_INCOME.map(c => <option key={c} value={c}>{c}</option>)
                      : CATEGORIES_EXPENSE.map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Status Inicial</span>
                  <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as TransactionStatus)}>
                    {formType === 'income' ? (
                      <>
                        <option value="Pendente">Pendente</option>
                        <option value="Recebido">Recebido</option>
                        <option value="Atrasado">Atrasado</option>
                        <option value="Cancelado">Cancelado</option>
                      </>
                    ) : (
                      <>
                        <option value="Pendente">Pendente</option>
                        <option value="Pago">Pago</option>
                        <option value="Atrasado">Atrasado</option>
                        <option value="Cancelado">Cancelado</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">{formType === 'income' ? 'Cliente' : 'Fornecedor'}</span>
                <input type="text" className="form-input" value={formParty} onChange={(e) => setFormParty(e.target.value)} placeholder={formType === 'income' ? 'Nome do Cliente' : 'Nome do Fornecedor'} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        title="Excluir Lançamento?"
        message="Esta ação removerá de forma definitiva esta transação do controle de caixa. Deseja prosseguir?"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

    </PageContainer>
  );
}
