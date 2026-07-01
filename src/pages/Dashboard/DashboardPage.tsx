import { useEffect, useState } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';

// Zustand stores
import { useLeadStore } from '../../entities/lead/model/store';
import { useClienteStore } from '../../entities/cliente/model/store';
import { useProjectStore } from '../../entities/projeto/model/store';
import { useFinanceiroStore } from '../../entities/financeiro/model/store';
import { useTaskStore } from '../../entities/tarefa/model/store';

// Decoupled Widgets
import CommandCenterWidget from '../../widgets/dashboard/components/CommandCenterWidget';
import KpisGridWidget from '../../widgets/dashboard/components/KpisGridWidget';
import FinancialOverviewWidget from '../../widgets/dashboard/components/FinancialOverviewWidget';
import GoalProgressWidget from '../../widgets/dashboard/components/GoalProgressWidget';
import CashFlowChartWidget from '../../widgets/dashboard/components/CashFlowChartWidget';
import MrrEvolutionChartWidget from '../../widgets/dashboard/components/MrrEvolutionChartWidget';
import RevenueProductChartWidget from '../../widgets/dashboard/components/RevenueProductChartWidget';
import FunnelConversionChartWidget from '../../widgets/dashboard/components/FunnelConversionChartWidget';
import ActivityTimelineWidget from '../../widgets/dashboard/components/ActivityTimelineWidget';
import AgendaWidget from '../../widgets/dashboard/components/AgendaWidget';
import TaskListWidget from '../../widgets/dashboard/components/TaskListWidget';
import CriticalProjectsWidget from '../../widgets/dashboard/components/CriticalProjectsWidget';
import RecentSalesWidget from '../../widgets/dashboard/components/RecentSalesWidget';

export default function DashboardPage() {
  const fetchLeads = useLeadStore((state) => state.fetchLeads);
  const fetchClientes = useClienteStore((state) => state.fetchClientes);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const fetchTransactions = useFinanceiroStore((state) => state.fetchTransactions);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoadingAll(true);
      await Promise.all([
        fetchLeads(),
        fetchClientes(),
        fetchProjects(),
        fetchTransactions(),
        fetchTasks()
      ]);
      setLoadingAll(false);
    };
    loadAll();
  }, []);

  return (
    <PageContainer>
      {loadingAll && <LoadingOverlay active={true} message="Consolidando dados do Dashboard Executivo..." />}

      <header style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
          Dashboard / Executivo
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: '0 0 2px 0' }}>ORKA Command Center</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Visão geral da operação em tempo real.</p>
      </header>

      {/* Seção 1: Command Center & Health Score & Meta */}
      <div className="dashboard-grid-1">
        <CommandCenterWidget />
        <GoalProgressWidget />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.03)', margin: '28px 0' }} />

      {/* Seção 2: KPIs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <KpisGridWidget />
        <FinancialOverviewWidget />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.03)', margin: '28px 0' }} />

      {/* Seção 3: Receita x Despesa & MRR */}
      <div className="dashboard-grid-2">
        <CashFlowChartWidget />
        <MrrEvolutionChartWidget />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.03)', margin: '28px 0' }} />

      {/* Seção 4: Pipeline & Donut */}
      <div className="dashboard-grid-2">
        <RevenueProductChartWidget />
        <FunnelConversionChartWidget />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.03)', margin: '28px 0' }} />

      {/* Seção 5: Timeline, Agenda & Checklist */}
      <div className="dashboard-grid-3">
        <TaskListWidget />
        <ActivityTimelineWidget />
        <AgendaWidget />
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.03)', margin: '28px 0' }} />

      {/* Seção 6: Projetos Críticos & Últimas Vendas */}
      <div className="dashboard-grid-2" style={{ marginBottom: '24px' }}>
        <CriticalProjectsWidget />
        <RecentSalesWidget />
      </div>
    </PageContainer>
  );
}
