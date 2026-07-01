import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Check
} from 'lucide-react';

import { useFinanceiroStore } from '../../entities/financeiro/model/store';
import { useClienteStore } from '../../entities/cliente/model/store';
import type { Transaction, TransactionType, TransactionStatus } from '../../entities/financeiro/model/types';
import { PageContainer } from '../../shared/components/PageContainer';
import { SearchBar } from '../../shared/components/SearchBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';

const CATEGORIES_INCOME = ['Assinatura', 'Consultoria', 'Setup', 'Outros'];
const CATEGORIES_EXPENSE = ['Infraestrutura', 'Marketing', 'Salários', 'Impostos', 'Serviços', 'Outros'];

export default function FinanceiroPage() {
  const { transactions, loading, error, fetchTransactions, addTransaction, updateTransaction, deleteTransaction } = useFinanceiroStore();
  const { clientes, fetchClientes } = useClienteStore();

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  
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
    if (!formDescription || !formValue || !formDueDate) return;

    const newTrx: Transaction = {
      id: `trx-${Date.now()}`,
      type: formType,
      description: formDescription,
      value: Number(formValue),
      dueDate: formDueDate,
      paymentDate: formStatus === 'Recebido' || formStatus === 'Pago' ? formDueDate : null,
      category: formCategory,
      status: formStatus,
      party: formParty
    };

    const success = await addTransaction(newTrx);
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
  const churnRate = 2.4; // Taxa de churn fixa do MVP
  const ltvEstimado = churnRate > 0 ? (mrrAcumulado * 100) / churnRate : mrrAcumulado * 12;

  const totalInflows = transactions
    .filter(t => t.type === 'income' && t.status !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.value, 0);

  const totalOutflows = transactions
    .filter(t => t.type === 'expense' && t.status !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.value, 0);

  const netBalance = totalInflows - totalOutflows;

  // Filter logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.party.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesMonth = !monthFilter || t.dueDate.includes(`/${monthFilter}/`);

    return matchesSearch && matchesType && matchesStatus && matchesMonth;
  });

  return (
    <PageContainer>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Gestão Financeira</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Fluxo de caixa, receitas recorrentes e controle de caixa empresarial</p>
        </div>
        <button className="primary-btn" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} />
          <span>Lançar Transação</span>
        </button>
      </header>

      {/* SaaS Metric Grid Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>MRR ACUMULADO</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#C084FC', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {formatCurrency(mrrAcumulado)}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mês</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <TrendingUp size={10} /> +12.4% este mês
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LTV ESTIMADO</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '8px' }}>
            {formatCurrency(ltvEstimado)}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Baseado em Churn de {churnRate}%</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TAXA DE CHURN</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', marginTop: '8px' }}>
            {churnRate}%
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Alvo operacional abaixo de 3.0%</span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>SALDO CAIXA (NET)</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '8px' }}>
            {formatCurrency(netBalance)}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Entradas menos saídas cadastradas</span>
        </div>
      </section>

      {/* Visual Cash Flow Chart Component */}
      <section style={{ backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '16px' }}>Comparativo Fluxo de Caixa (Setup & Mensalidades)</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><ArrowUpRight size={14} color="var(--color-success)" /> Total de Entradas</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(totalInflows)}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: totalInflows + totalOutflows > 0 ? `${(totalInflows / (totalInflows + totalOutflows)) * 100}%` : '0%', height: '100%', backgroundColor: 'var(--color-success)' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><ArrowDownRight size={14} color="var(--color-danger)" /> Total de Saídas</span>
              <span style={{ fontWeight: 700 }}>{formatCurrency(totalOutflows)}</span>
            </div>
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: totalInflows + totalOutflows > 0 ? `${(totalOutflows / (totalInflows + totalOutflows)) * 100}%` : '0%', height: '100%', backgroundColor: 'var(--color-danger)' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por descrição, cliente/fornecedor ou categoria..." />
        
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end' }}>
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

      {monthFilter && (
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

      {/* Cash Flow Ledger List */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Operação</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Descrição</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Cliente/Fornecedor</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Categoria</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Vencimento</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Valor</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
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
                    {(t.status === 'Pendente' || t.status === 'Atrasado') && (
                      <button
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
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma transação cadastrada.</div>
        )}
      </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Valor (R$) *</span>
                  <input type="number" className="form-input" value={formValue} onChange={(e) => setFormValue(e.target.value)} required placeholder="Ex: 5000" />
                </div>
                <div className="input-group">
                  <span className="input-label">Vencimento *</span>
                  <input type="text" className="form-input" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required placeholder="Ex: 30/07/2026" />
                </div>
              </div>

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
