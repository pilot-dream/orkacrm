import { lazy, Suspense } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { ChartSkeleton } from '../../widgets/skeletons/WidgetSkeletons';

// Static widgets (fast, light, no Recharts)
import CommandCenterWidget from '../../widgets/dashboard/components/CommandCenterWidget';
import KpisGridWidget from '../../widgets/dashboard/components/KpisGridWidget';
import FinancialOverviewWidget from '../../widgets/dashboard/components/FinancialOverviewWidget';
import ActivityTimelineWidget from '../../widgets/dashboard/components/ActivityTimelineWidget';
import AgendaWidget from '../../widgets/dashboard/components/AgendaWidget';
import TaskListWidget from '../../widgets/dashboard/components/TaskListWidget';
import CriticalProjectsWidget from '../../widgets/dashboard/components/CriticalProjectsWidget';
import RecentSalesWidget from '../../widgets/dashboard/components/RecentSalesWidget';

// Lazy loaded charts (heavy, Recharts)
const GoalProgressWidget = lazy(() => import('../../widgets/dashboard/components/GoalProgressWidget'));
const CashFlowChartWidget = lazy(() => import('../../widgets/dashboard/components/CashFlowChartWidget'));
const MrrEvolutionChartWidget = lazy(() => import('../../widgets/dashboard/components/MrrEvolutionChartWidget'));
const RevenueProductChartWidget = lazy(() => import('../../widgets/dashboard/components/RevenueProductChartWidget'));
const FunnelConversionChartWidget = lazy(() => import('../../widgets/dashboard/components/FunnelConversionChartWidget'));

export default function DashboardPage() {
  return (
    <PageContainer>
      <header style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: '0 0 2px 0' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Visão geral da operação em tempo real.</p>
      </header>

      {/* Seção 1: Command Center & Health Score & Meta */}
      <div className="dashboard-grid-1">
        <CommandCenterWidget />
        <Suspense fallback={<ChartSkeleton height="320px" />} >
          <GoalProgressWidget />
        </Suspense>
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
        <Suspense fallback={<ChartSkeleton height="340px" />}>
          <CashFlowChartWidget />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height="340px" />}>
          <MrrEvolutionChartWidget />
        </Suspense>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.03)', margin: '28px 0' }} />

      {/* Seção 4: Pipeline & Donut */}
      <div className="dashboard-grid-2">
        <Suspense fallback={<ChartSkeleton height="340px" />}>
          <RevenueProductChartWidget />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height="340px" />}>
          <FunnelConversionChartWidget />
        </Suspense>
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
