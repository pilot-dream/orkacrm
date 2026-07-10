import { useState } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { Bell, RefreshCw, ChevronDown } from 'lucide-react';
import { PremiumKpiRow } from '../../widgets/dashboard/components/PremiumKpiWidgets';
import { useAuthStore } from '../../entities/usuario/model/store';
import { MrrEvolutionChartWidget } from '../../widgets/dashboard/components/MrrEvolutionChartWidget';
import { TaskListWidget } from '../../widgets/dashboard/components/TaskListWidget';
// Future imports for charts and widgets
import { RevenueForecastChartWidget } from '../../widgets/dashboard/components/RevenueForecastChartWidget';
import { FunnelWidget } from '../../widgets/dashboard/components/FunnelWidget';
import { FinanceSummaryWidget } from '../../widgets/dashboard/components/FinanceSummaryWidget';

export default function DashboardPage() {
  const userProfile = useAuthStore(state => state.userProfile);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <PageContainer>
      <div className="dashboard-v3-container">
        
        {/* V3 Minimalist Header */}
        <header className="dashboard-v3-header">
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Visão geral da operação em tempo real.</p>
          </div>
          
          <div className="dashboard-v3-header-right">
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', gap: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Período</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Este Mês <ChevronDown size={14} />
              </div>
            </div>

            <button 
              className="outline-btn" 
              onClick={handleRefresh}
              style={{ padding: '8px 16px', gap: '8px' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
              <span>Atualizar dados</span>
            </button>

            <button className="icon-btn" style={{ position: 'relative' }}>
              <Bell size={18} />
              <span className="btn-badge"></span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px', paddingLeft: '16px', borderLeft: '1px solid var(--border-color)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                {userProfile?.name ? userProfile.name.substring(0, 2).toUpperCase() : 'JV'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{userProfile?.name || 'João Vitor'}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{userProfile?.role || 'Admin'}</span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-secondary)', marginLeft: '4px', cursor: 'pointer' }} />
            </div>
          </div>
        </header>

        {/* Row 1: KPIs */}
        <div className="dashboard-v3-row-1">
          <PremiumKpiRow />
        </div>

        {/* Row 2: Charts */}
        <div className="dashboard-v3-row-2">
          <RevenueForecastChartWidget />
          
          <MrrEvolutionChartWidget />
        </div>

        {/* Row 3: Widgets */}
        <div className="dashboard-v3-row-3">
          <FunnelWidget />
          <FinanceSummaryWidget />
          <TaskListWidget />
        </div>

      </div>
    </PageContainer>
  );
}
