import React, { useEffect } from 'react';
import { TrendingUp, Users, Target, Wallet, ArrowDownRight } from 'lucide-react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useLeadStore } from '../../../entities/lead/model/store';
import { useFilterStore, isDateInRange } from '../../../entities/dashboard/model/filterStore';
import TaskListWidget from '../../../widgets/dashboard/components/TaskListWidget';

const MobileKpiCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ReactNode; 
  color: string;
  loading?: boolean;
}> = ({ title, value, subtitle, icon, color, loading }) => {
  return (
    <div className="mobile-kpi-card">
      <div className="mobile-kpi-header">
        <div className="mobile-kpi-icon" style={{ backgroundColor: `${color}15`, color: color }}>
          {icon}
        </div>
        <span className="mobile-kpi-title">{title}</span>
      </div>
      
      <div className="mobile-kpi-content">
        <div className="mobile-kpi-value">
          {loading ? '...' : value}
        </div>
        {subtitle && (
          <div className="mobile-kpi-subtitle">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export const MobileDashboard: React.FC = () => {
  const { transactions, loading: loadingFin, fetchTransactions } = useFinanceiroStore();
  const { clientes, loading: loadingCli, fetchClientes } = useClienteStore();
  const { leads, loading: loadingLead, fetchLeads } = useLeadStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { 
    fetchTransactions();
    fetchClientes();
    fetchLeads();
  }, []);
  
  // Calculations
  const receitasRealizadas = transactions
    .filter(t => t.type === 'income' && t.status === 'Pago' && isDateInRange(t.dueDate, startDate, endDate))
    .reduce((acc, curr) => acc + curr.value, 0);

  const fluxoCaixa = transactions
    .filter(t => t.status === 'Pago' && isDateInRange(t.dueDate, startDate, endDate))
    .reduce((acc, curr) => curr.type === 'income' ? acc + curr.value : acc - curr.value, 0);

  const despesasPagas = transactions
    .filter(t => t.type === 'expense' && t.status === 'Pago' && isDateInRange(t.dueDate, startDate, endDate))
    .reduce((acc, curr) => acc + curr.value, 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  return (
    <div className="mobile-dashboard-layout">
      {/* KPI Cards */}
      <MobileKpiCard 
        title="SALDO TOTAL" 
        value={formatCurrency(fluxoCaixa)} 
        subtitle="Momento Atual"
        icon={<Wallet size={16} />} 
        color="var(--color-primary)" 
        loading={loadingFin}
      />

      <MobileKpiCard 
        title="RECEITAS LÍQUIDAS" 
        value={formatCurrency(receitasRealizadas)} 
        subtitle={`Total recebido (${currentMonth})`}
        icon={<TrendingUp size={16} />} 
        color="var(--color-success)" 
        loading={loadingFin}
      />

      <MobileKpiCard 
        title="DESPESAS PAGAS" 
        value={formatCurrency(despesasPagas)} 
        subtitle={`Total gasto (${currentMonth})`}
        icon={<ArrowDownRight size={16} />} 
        color="var(--color-danger)" 
        loading={loadingFin}
      />

      <MobileKpiCard 
        title="CLIENTES ATIVOS" 
        value={clientes.length} 
        icon={<Users size={16} />} 
        color="var(--color-purple)" 
        loading={loadingCli}
      />

      <MobileKpiCard 
        title="LEADS NO FUNIL" 
        value={leads.length} 
        icon={<Target size={16} />} 
        color="#ec4899" 
        loading={loadingLead}
      />

      {/* Tarefas Pendentes */}
      <div className="mobile-task-section">
        <TaskListWidget />
      </div>
    </div>
  );
};
