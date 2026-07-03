import { useEffect } from 'react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Receipt, 
  ShieldAlert, 
  FileText 
} from 'lucide-react';

import { CardSkeleton } from '../../skeletons/WidgetSkeletons';

export default function FinancialOverviewWidget() {
  const { transactions, fetchTransactions, loading: loadingFinanceiro } = useFinanceiroStore();
  const { clientes, fetchClientes, loading: loadingClientes } = useClienteStore();

  useEffect(() => {
    fetchTransactions();
    fetchClientes();
  }, []);

  const isInitialLoading = 
    (loadingFinanceiro && transactions.length === 0) || 
    (loadingClientes && clientes.length === 0);

  if (isInitialLoading) {
    return <CardSkeleton height="350px" />;
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // --- REVENUE CALCULATIONS ---
  const mrrContratado = clientes
    .filter(c => c.status === 'active')
    .reduce((acc, curr) => acc + (curr.monthlySpend || 0), 0);

  const receitaRecebida = transactions
    .filter(t => t.type === 'income' && t.status === 'Recebido')
    .reduce((acc, curr) => acc + curr.value, 0);

  const receitaPrevista = transactions
    .filter(t => t.type === 'income' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.value, 0);

  const receitaAtrasada = transactions
    .filter(t => t.type === 'income' && t.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0);

  // --- EXPENSE & NET CALCULATIONS ---
  const despesasPagas = transactions
    .filter(t => t.type === 'expense' && t.status === 'Pago')
    .reduce((acc, curr) => acc + curr.value, 0);

  const despesasAPagar = transactions
    .filter(t => t.type === 'expense' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalContasAPagar = transactions.filter(t => t.type === 'expense' && t.status === 'Pendente').length;

  const despesasAtrasadas = transactions
    .filter(t => t.type === 'expense' && t.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalContasAtrasadas = transactions.filter(t => t.type === 'expense' && t.status === 'Atrasado').length;

  const fluxoCaixa = receitaRecebida - despesasPagas;

  const revenueKpis = [
    {
      id: 'mrr_contratado',
      label: 'MRR CONTRATADO',
      value: formatCurrency(mrrContratado),
      icon: TrendingUp,
      color: '#C084FC',
      sub: 'Base de clientes ativos'
    },
    {
      id: 'receita_recebida',
      label: 'RECEITA RECEBIDA',
      value: formatCurrency(receitaRecebida),
      icon: CheckCircle,
      color: '#10B981',
      sub: 'Entradas liquidadas'
    },
    {
      id: 'receita_prevista',
      label: 'A RECEBER (PENDENTE)',
      value: formatCurrency(receitaPrevista),
      icon: Clock,
      color: '#60A5FA',
      sub: 'Setup e faturas em aberto'
    },
    {
      id: 'receita_atraso',
      label: 'RECEITA EM ATRASO',
      value: formatCurrency(receitaAtrasada),
      icon: ShieldAlert,
      color: '#F59E0B',
      sub: 'Vencidas e não recebidas'
    }
  ];

  const expenseKpis = [
    {
      id: 'despesas_pagas',
      label: 'DESPESAS PAGAS',
      value: formatCurrency(despesasPagas),
      icon: Receipt,
      color: '#9CA3AF',
      sub: 'Custos realizados liquidados'
    },
    {
      id: 'despesas_a_pagar',
      label: 'DESPESAS A PAGAR',
      value: formatCurrency(despesasAPagar),
      icon: FileText,
      color: '#FBBF24',
      sub: `${totalContasAPagar} ${totalContasAPagar === 1 ? 'conta pendente' : 'contas pendentes'}`
    },
    {
      id: 'despesas_atrasadas',
      label: 'DESPESAS ATRASADAS',
      value: formatCurrency(despesasAtrasadas),
      icon: AlertTriangle,
      color: '#EF4444',
      sub: `${totalContasAtrasadas} ${totalContasAtrasadas === 1 ? 'conta vencida' : 'contas vencidas'}`
    },
    {
      id: 'fluxo_caixa',
      label: 'SALDO REALIZADO (NET)',
      value: formatCurrency(fluxoCaixa),
      icon: DollarSign,
      color: '#34D399',
      sub: 'Recebido menos Pago realizado'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 1. Receitas Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          color: 'var(--text-secondary)', 
          letterSpacing: '0.06em', 
          textTransform: 'uppercase', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          margin: 0
        }}>
          <TrendingUp size={14} color="#10B981" />
          <span>Controle de Receitas & Entradas</span>
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="dashboard-grid-3">
          {revenueKpis.map((kpi) => {
            const IconComponent = kpi.icon;
            return (
              <div
                key={kpi.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'var(--transition-smooth)'
                }}
                className="table-row-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {kpi.label}
                  </span>
                  <div style={{ color: kpi.color, display: 'flex', alignItems: 'center' }}>
                    <IconComponent size={16} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {kpi.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Despesas & Saldos Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ 
          fontSize: '0.8rem', 
          fontWeight: 700, 
          color: 'var(--text-secondary)', 
          letterSpacing: '0.06em', 
          textTransform: 'uppercase', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          margin: 0
        }}>
          <Receipt size={14} color="#EF4444" />
          <span>Controle de Despesas & Caixa</span>
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="dashboard-grid-3">
          {expenseKpis.map((kpi) => {
            const IconComponent = kpi.icon;
            return (
              <div
                key={kpi.id}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'var(--transition-smooth)'
                }}
                className="table-row-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {kpi.label}
                  </span>
                  <div style={{ color: kpi.color, display: 'flex', alignItems: 'center' }}>
                    <IconComponent size={16} />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {kpi.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
