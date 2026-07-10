import React, { useState, useRef, useEffect } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { Bell, RefreshCw, ChevronDown, Settings, Plus } from 'lucide-react';
import { useAuthStore } from '../../entities/usuario/model/store';
import { useFilterStore } from '../../entities/dashboard/model/filterStore';
import { useDashboardConfigQuery } from '../../entities/dashboard/hooks/useDashboardQueries';
import { useDashboardStore } from '../../entities/dashboard/model/store';
import { queryClient } from '../../shared/api/queryClient';
import { Responsive } from 'react-grid-layout';
import { WIDGET_REGISTRY } from '../../widgets/dashboard/core/widgetRegistry';
import { WidgetWrapper } from '../../widgets/dashboard/core/WidgetWrapper';
import { WidgetLibraryDrawer } from '../../widgets/dashboard/components/WidgetLibraryDrawer';
import { MobileDashboard } from './components/MobileDashboard';

const ResponsiveGridLayout = (props: any) => {
  const [width, setWidth] = useState(1200);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <Responsive width={width} {...props} />
    </div>
  );
};

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const notifications = useAuthStore((state) => state.notifications);
  const markNotificationAsRead = useAuthStore((state) => state.markNotificationAsRead);
  const unreadCount = notifications.filter(n => !n.read).length;

  const dateRangeLabel = useFilterStore((state) => state.dateRangeLabel);
  const setDateRange = useFilterStore((state) => state.setDateRange);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboardConfig'] }),
      queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['clientes'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['leads'] }),
      queryClient.invalidateQueries({ queryKey: ['projects'] })
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

  const { isLoading: loadingConfig } = useDashboardConfigQuery();
  const activeDashboard = useDashboardStore((state) => state.activeDashboard);
  const loading = loadingConfig || !activeDashboard;

  const isEditMode = useDashboardStore((state) => state.isEditMode);
  const setIsEditMode = useDashboardStore((state) => state.setIsEditMode);
  const updateLayout = useDashboardStore((state) => state.updateLayout);
  const saveLayout = useDashboardStore((state) => state.saveLayout);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateMobileLayout = (baseLayout: any[]) => {
    if (!Array.isArray(baseLayout)) return [];
    return baseLayout.map((item, index) => ({
      ...item,
      x: 0,
      y: index * 10,
      w: 1,
      minW: 1
    }));
  };

  const layouts = React.useMemo(() => {
    if (!activeDashboard) return { lg: [] };
    
    let baseLayout = Array.isArray(activeDashboard.layout_data) ? activeDashboard.layout_data : [];
    
    return {
      lg: baseLayout,
      md: baseLayout,
      sm: baseLayout,
      xs: generateMobileLayout(baseLayout),
      xxs: generateMobileLayout(baseLayout)
    };
  }, [activeDashboard]);

  const handleLayoutChange = (layout: any, allLayouts: any) => {
    if (!activeDashboard) return;
    
    // Always use the 'lg' layout as the source of truth for saving
    const lgLayout = allLayouts.lg || layout;
    
    const layoutData = Array.isArray(activeDashboard.layout_data) ? activeDashboard.layout_data : [];
    // Map layout back to our format
    const newLayout = layoutData.map(item => {
      const match = lgLayout.find((l: any) => l.i === item.i);
      if (match) {
        return { ...item, x: match.x, y: match.y, w: match.w, h: match.h };
      }
      return item;
    });

    updateLayout(newLayout);
  };

  if (loading) {
    return <PageContainer><div style={{ padding: '40px', color: '#fff' }}>Carregando sua Dashboard...</div></PageContainer>;
  }

  if (!activeDashboard) {
    return <PageContainer><div style={{ padding: '40px', color: '#fff' }}>Nenhuma Dashboard encontrada.</div></PageContainer>;
  }

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

        {/* Toolbar for Dashboard management (hidden on mobile) */}
        {!isMobile && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '16px', padding: '0', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {isEditMode && (
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => {
                  if (window.confirm('Tem certeza que deseja restaurar o layout padrão?')) {
                    // Update is handled automatically by the store forcing reload
                  }
                }}>
                  Restaurar Padrão
                </button>
              )}
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setIsLibraryOpen(true)}>
                <Plus size={14} /> Adicionar Widget
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isEditMode ? 'var(--color-primary)' : 'transparent', border: isEditMode ? 'none' : '1px solid var(--border-color)', color: isEditMode ? '#fff' : 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => {
                if (isEditMode) {
                  saveLayout();
                }
                setIsEditMode(!isEditMode);
              }}>
                <Settings size={14} /> {isEditMode ? 'Concluir' : 'Personalizar'}
              </button>
            </div>
          </div>
        )}

        {isMobile ? (
          <MobileDashboard />
        ) : (
          <ResponsiveGridLayout
            className={`layout ${isEditMode ? 'edit-mode' : ''}`}
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 12, sm: 12, xs: 1, xxs: 1 }}
            rowHeight={40}
            onLayoutChange={handleLayoutChange}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            resizeHandles={['s', 'e', 'se']}
            margin={[20, 20]}
            measureBeforeMount={false}
            useCSSTransforms={true}
            draggableHandle=".widget-drag-handle"
          >
            {(() => {
              const layoutData = Array.isArray(activeDashboard.layout_data) ? activeDashboard.layout_data : [];
              return layoutData.filter(i => !i.isHidden).map(item => {
                const manifest = WIDGET_REGISTRY[item.widgetId];
                if (!manifest) return null;
                
                const WidgetComponent = manifest.component;
                
                return (
                  <div key={item.i} data-grid={{ x: item.x, y: item.y, w: item.w, h: item.h, minW: manifest.minWidth, minH: manifest.minHeight }}>
                    <WidgetWrapper instanceId={item.i} widgetId={item.widgetId} config={item.config} isEditMode={isEditMode}>
                      <React.Suspense fallback={<div style={{ height: '100%', background: 'var(--bg-card)', borderRadius: '12px' }} />}>
                        <WidgetComponent config={item.config} />
                      </React.Suspense>
                    </WidgetWrapper>
                  </div>
                );
              });
            })()}
          </ResponsiveGridLayout>
        )}

        <WidgetLibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />

      </div>
    </PageContainer>
  );
}
