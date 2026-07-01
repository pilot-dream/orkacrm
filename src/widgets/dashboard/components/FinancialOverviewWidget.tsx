import { useEffect } from 'react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { DollarSign, Clock, AlertTriangle, CheckCircle, TrendingUp, Receipt, ShieldAlert, BadgeHelp } from 'lucide-react';

export default function FinancialOverviewWidget() {
  const { transactions, fetchTransactions } = useFinanceiroStore();
  const { clientes, fetchClientes } = useClienteStore();

  useEffect(() => {
    fetchTransactions();
    fetchClientes();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // 1. Receita prevista (Status = Pendente ou Atrasado, tipo = income)
  const receitaPrevista = transactions
    .filter(t => t.type === 'income' && (t.status === 'Pendente' || t.status === 'Atrasado'))
    .reduce((acc, curr) => acc + curr.value, 0);

  // 2. Receita recebida (Status = Recebido, tipo = income)
  const receitaRecebida = transactions
    .filter(t => t.type === 'income' && t.status === 'Recebido')
    .reduce((acc, curr) => acc + curr.value, 0);

  // 3. Receita em atraso (Status = Atrasado, tipo = income)
  const receitaAtrasada = transactions
    .filter(t => t.type === 'income' && t.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0);

  // 4. Fluxo de caixa (Receita recebida - Despesa paga)
  const despesasPagas = transactions
    .filter(t => t.type === 'expense' && (t.status === 'Pago' || t.status === 'Recebido')) // Pago ou recebido para despesas
    .reduce((acc, curr) => acc + curr.value, 0);
  const fluxoCaixa = receitaRecebida - despesasPagas;

  // 5. MRR contratado (Clientes ativos)
  const mrrContratado = clientes
    .filter(c => c.status === 'active')
    .reduce((acc, curr) => acc + (curr.monthlySpend || 0), 0);

  // 6. MRR recebido (Transações de categoria Assinatura com status Recebido)
  const mrrRecebido = transactions
    .filter(t => t.type === 'income' && t.category === 'Assinatura' && t.status === 'Recebido')
    .reduce((acc, curr) => acc + curr.value, 0);

  // 7. Contas vencidas (quantidade)
  const contasVencidas = transactions.filter(t => t.status === 'Atrasado').length;

  // 8. Contas pendentes (quantidade)
  const contasPendentes = transactions.filter(t => t.status === 'Pendente').length;

  const financialKpis = [
    {
      id: 'receita_prevista',
      label: 'RECEITA PREVISTA',
      value: formatCurrency(receitaPrevista),
      icon: Clock,
      color: '#FBBF24',
      sub: 'Setup & Mensalidades em aberto'
    },
    {
      id: 'receita_recebida',
      label: 'RECEITA RECEBIDA',
      value: formatCurrency(receitaRecebida),
      icon: CheckCircle,
      color: '#10B981',
      sub: 'Lançamentos liquidados'
    },
    {
      id: 'receita_atraso',
      label: 'RECEITA EM ATRASO',
      value: formatCurrency(receitaAtrasada),
      icon: ShieldAlert,
      color: '#EF4444',
      sub: 'Vencidas e não pagas'
    },
    {
      id: 'fluxo_caixa',
      label: 'SALDO REALIZADO (NET)',
      value: formatCurrency(fluxoCaixa),
      icon: DollarSign,
      color: '#60A5FA',
      sub: 'Recebido - Pago realizado'
    },
    {
      id: 'mrr_contratado',
      label: 'MRR CONTRATADO',
      value: formatCurrency(mrrContratado),
      icon: TrendingUp,
      color: '#C084FC',
      sub: 'Base de clientes ativos'
    },
    {
      id: 'mrr_recebido',
      label: 'MRR REALIZADO',
      value: formatCurrency(mrrRecebido),
      icon: Receipt,
      color: '#34D399',
      sub: 'Assinaturas já recebidas'
    },
    {
      id: 'contas_vencidas',
      label: 'CONTAS VENCIDAS',
      value: contasVencidas,
      icon: AlertTriangle,
      color: '#F87171',
      sub: 'Lançamentos em atraso'
    },
    {
      id: 'contas_pendentes',
      label: 'CONTAS PENDENTES',
      value: contasPendentes,
      icon: BadgeHelp,
      color: '#FCD34D',
      sub: 'Aguardando vencimento'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
        Visão Geral Financeira (Tempo Real)
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="dashboard-grid-3">
        {financialKpis.map((kpi) => {
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
  );
}
