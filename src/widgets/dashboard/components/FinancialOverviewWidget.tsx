import { useEffect } from 'react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useFilterStore, isDateInRange } from '../../../entities/dashboard/model/filterStore';
import { 
  DollarSign, Clock, AlertTriangle, CheckCircle, TrendingUp, Receipt, ShieldAlert, FileText 
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { CardSkeleton } from '../../skeletons/WidgetSkeletons';

const GenericFinancialCard = ({ loading, label, value, sub, icon: IconComponent, color }: any) => {
  if (loading) return <CardSkeleton height="100%" />;
  
  // Use a pseudo-random seed based on the label length to keep chart consistent
  const seed = label.length;
  const data = [
    { v: seed * 2 }, { v: seed * 3 }, { v: seed * 1.5 }, { v: seed * 4 }, { v: seed * 2.5 }
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'var(--transition-smooth)',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="table-row-hover"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <div style={{ color, display: 'flex', alignItems: 'center' }}>
          <IconComponent size={20} />
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
          {value}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {sub}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45px', opacity: 0.4, zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`color-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip cursor={false} content={<></>} />
            <Area 
              type="monotone" 
              dataKey="v" 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#color-${label.replace(/\s+/g, '')})`} 
              strokeWidth={2} 
              isAnimationActive={false} 
              activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)', stroke: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
};

export const MrrContratadoWidget = () => {
  const { clientes, fetchClientes, loading } = useClienteStore();

  useEffect(() => { fetchClientes(); }, []);
  
  const mrrContratado = clientes
    .filter(c => c.status === 'active')
    .reduce((acc, c) => acc + (c.mrrValue || c.monthlySpend || c.monthlyRevenue || 0), 0);

  return <GenericFinancialCard loading={loading && clientes.length === 0} label="MRR CONTRATADO" value={formatCurrency(mrrContratado)} sub="Base de clientes ativos" icon={TrendingUp} color="#C084FC" />;
};

export const ReceitaRecebidaWidget = () => {
  const { transactions, fetchTransactions, loading } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const receitaRecebida = transactions
    .filter(t => isDateInRange(t.dueDate, startDate, endDate) && t.type === 'income' && t.status === 'Recebido')
    .reduce((acc, curr) => acc + curr.value, 0);

  return <GenericFinancialCard loading={loading && transactions.length === 0} label="RECEITA RECEBIDA" value={formatCurrency(receitaRecebida)} sub="Entradas liquidadas" icon={CheckCircle} color="#10B981" />;
};

export const ReceitaPrevistaWidget = () => {
  const { transactions, fetchTransactions, loading } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const receitaPrevista = transactions
    .filter(t => isDateInRange(t.dueDate, startDate, endDate) && t.type === 'income' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.value, 0);

  return <GenericFinancialCard loading={loading && transactions.length === 0} label="A RECEBER (PENDENTE)" value={formatCurrency(receitaPrevista)} sub="Setup e faturas em aberto" icon={Clock} color="#60A5FA" />;
};

export const ReceitaAtrasadaWidget = () => {
  const { transactions, fetchTransactions, loading } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const receitaAtrasada = transactions
    .filter(t => isDateInRange(t.dueDate, startDate, endDate) && t.type === 'income' && t.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0);

  return <GenericFinancialCard loading={loading && transactions.length === 0} label="RECEITA EM ATRASO" value={formatCurrency(receitaAtrasada)} sub="Vencidas e não recebidas" icon={ShieldAlert} color="#F59E0B" />;
};

export const DespesasPagasWidget = () => {
  const { transactions, fetchTransactions, loading } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const despesasPagas = transactions
    .filter(t => isDateInRange(t.dueDate, startDate, endDate) && t.type === 'expense' && t.status === 'Pago')
    .reduce((acc, curr) => acc + curr.value, 0);

  return <GenericFinancialCard loading={loading && transactions.length === 0} label="DESPESAS PAGAS" value={formatCurrency(despesasPagas)} sub="Custos realizados liquidados" icon={Receipt} color="#9CA3AF" />;
};

export const DespesasAPagarWidget = () => {
  const { transactions, fetchTransactions, loading } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const filtered = transactions.filter(t => isDateInRange(t.dueDate, startDate, endDate) && t.type === 'expense' && t.status === 'Pendente');
  const despesasAPagar = filtered.reduce((acc, curr) => acc + curr.value, 0);
  const count = filtered.length;

  return <GenericFinancialCard loading={loading && transactions.length === 0} label="DESPESAS A PAGAR" value={formatCurrency(despesasAPagar)} sub={`${count} ${count === 1 ? 'conta pendente' : 'contas pendentes'}`} icon={FileText} color="#FBBF24" />;
};

export const DespesasAtrasadasWidget = () => {
  const { transactions, fetchTransactions, loading } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const filtered = transactions.filter(t => isDateInRange(t.dueDate, startDate, endDate) && t.type === 'expense' && t.status === 'Atrasado');
  const despesasAtrasadas = filtered.reduce((acc, curr) => acc + curr.value, 0);
  const count = filtered.length;

  return <GenericFinancialCard loading={loading && transactions.length === 0} label="DESPESAS ATRASADAS" value={formatCurrency(despesasAtrasadas)} sub={`${count} ${count === 1 ? 'conta vencida' : 'contas vencidas'}`} icon={AlertTriangle} color="#EF4444" />;
};

export const FluxoCaixaWidget = () => {
  const { transactions, fetchTransactions, loading } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const filtered = transactions.filter(t => isDateInRange(t.dueDate, startDate, endDate));
  const receitaRecebida = filtered.filter(t => t.type === 'income' && t.status === 'Recebido').reduce((acc, curr) => acc + curr.value, 0);
  const despesasPagas = filtered.filter(t => t.type === 'expense' && t.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
  const fluxoCaixa = receitaRecebida - despesasPagas;

  return <GenericFinancialCard loading={loading && transactions.length === 0} label="SALDO REALIZADO (NET)" value={formatCurrency(fluxoCaixa)} sub="Recebido menos Pago realizado" icon={DollarSign} color="#34D399" />;
};

export default function FinancialOverviewWidget() {
  // Keeping this wrapper just in case any old layouts still reference it before they reset, to prevent crashes.
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <MrrContratadoWidget />
      <ReceitaRecebidaWidget />
      <ReceitaPrevistaWidget />
      <ReceitaAtrasadaWidget />
      <DespesasPagasWidget />
      <DespesasAPagarWidget />
      <DespesasAtrasadasWidget />
      <FluxoCaixaWidget />
    </div>
  );
}
