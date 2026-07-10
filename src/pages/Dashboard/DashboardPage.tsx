import { useState, useRef, useEffect } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { Bell, RefreshCw, ChevronDown } from 'lucide-react';
import { PremiumKpiRow } from '../../widgets/dashboard/components/PremiumKpiWidgets';
import { useAuthStore } from '../../entities/usuario/model/store';
import { useFilterStore } from '../../entities/dashboard/model/filterStore';
import { useFinanceiroStore } from '../../entities/financeiro/model/store';
import { useClienteStore } from '../../entities/cliente/model/store';
import { useTaskStore } from '../../entities/tarefa/model/store';
import { useLeadStore } from '../../entities/lead/model/store';
import { useProjectStore } from '../../entities/projeto/model/store';
import { MrrEvolutionChartWidget } from '../../widgets/dashboard/components/MrrEvolutionChartWidget';
import { TaskListWidget } from '../../widgets/dashboard/components/TaskListWidget';
// Future imports for charts and widgets
import { RevenueForecastChartWidget } from '../../widgets/dashboard/components/RevenueForecastChartWidget';
import { FunnelWidget } from '../../widgets/dashboard/components/FunnelWidget';
import { FinanceSummaryWidget } from '../../widgets/dashboard/components/FinanceSummaryWidget';

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const notifications = useAuthStore((state) => state.notifications);
  const markNotificationAsRead = useAuthStore((state) => state.markNotificationAsRead);
  const unreadCount = notifications.filter(n => !n.read).length;

  const { dateRangeLabel, setDateRange } = useFilterStore();
  const { fetchTransactions } = useFinanceiroStore();
  const { fetchClientes } = useClienteStore();
  const { fetchTasks } = useTaskStore();
  const { fetchLeads } = useLeadStore();
  const { fetchProjects } = useProjectStore();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchTransactions(),
      fetchClientes(),
      fetchTasks(),
      fetchLeads(),
      fetchProjects()
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateOptions = [
    { value: 'Últimos 7 Dias', label: 'Últimos 7 dias' },
    { value: 'Últimos 30 Dias', label: 'Últimos 30 dias' },
    { value: 'Este Mês', label: 'Este Mês' },
    { value: 'Este Ano', label: 'Este Ano' }
  ];

  const currentFilterLabel = dateOptions.find(o => o.value === dateRangeLabel)?.label || 'Este Mês';

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
            {/* Filter Dropdown */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowFilter(!showFilter)}
                style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', gap: '12px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Período</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                  {currentFilterLabel} <ChevronDown size={14} />
                </div>
              </div>
              
              {showFilter && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '200px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', boxShadow: 'var(--shadow-premium)', zIndex: 100 }}>
                  {dateOptions.map(opt => (
                    <div 
                      key={opt.value}
                      onClick={() => { setDateRange(opt.value as any); setShowFilter(false); }}
                      style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', borderRadius: '4px', background: dateRangeLabel === opt.value ? 'var(--color-primary-10)' : 'transparent', color: dateRangeLabel === opt.value ? 'var(--color-primary)' : 'var(--text-main)' }}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              className="outline-btn" 
              onClick={handleRefresh}
              style={{ padding: '8px 16px', gap: '8px' }}
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
              <span>Atualizar dados</span>
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                onClick={() => setShowNotifs(!showNotifs)}
                style={{ position: 'relative' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="btn-badge">{unreadCount}</span>}
              </button>
              
              {showNotifs && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-premium)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem' }}>
                    Notificações
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Nenhuma notificação nova.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => markNotificationAsRead(notif.id)}
                          style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', opacity: notif.read ? 0.6 : 1, background: notif.read ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.05)' }}
                        >
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>{notif.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
