import { lazy, Suspense } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { ChartSkeleton } from '../../widgets/skeletons/WidgetSkeletons';

// Static widgets (fast, light, no Recharts)
import { DashboardHeader } from '../../widgets/dashboard/components/DashboardHeader';
import { PremiumKpiRow } from '../../widgets/dashboard/components/PremiumKpiRow';
import { AlertsCenterWidget } from '../../widgets/dashboard/components/AlertsCenterWidget';
import { InsightsWidget } from '../../widgets/dashboard/components/InsightsWidget';
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
      <DashboardHeader />

      <PremiumKpiRow />

      {/* Grid Principal: Alertas, Insights e Meta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        <AlertsCenterWidget />
        <InsightsWidget />
        <Suspense fallback={<ChartSkeleton height="320px" />} >
          <GoalProgressWidget />
        </Suspense>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />

      {/* Seção: Financeiro & Receita */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>Financeiro & Receita</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
        <FinancialOverviewWidget />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <Suspense fallback={<ChartSkeleton height="340px" />}>
            <CashFlowChartWidget />
          </Suspense>
          <Suspense fallback={<ChartSkeleton height="340px" />}>
            <MrrEvolutionChartWidget />
          </Suspense>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />

      {/* Seção: Comercial & Pipeline */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>Comercial & Vendas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <Suspense fallback={<ChartSkeleton height="340px" />}>
          <RevenueProductChartWidget />
        </Suspense>
        <Suspense fallback={<ChartSkeleton height="340px" />}>
          <FunnelConversionChartWidget />
        </Suspense>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '32px 0' }} />

      {/* Seção: Operação & Projetos */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: '#fff' }}>Operação & Projetos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <CriticalProjectsWidget />
        <TaskListWidget />
        <AgendaWidget />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <RecentSalesWidget />
        <ActivityTimelineWidget />
      </div>
    </PageContainer>
  );
}
