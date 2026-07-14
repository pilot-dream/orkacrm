import React, { useState, useRef, useEffect } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { RefreshCw, ChevronDown, Settings, Plus, RotateCcw } from 'lucide-react';
import { useFilterStore } from '../../entities/dashboard/model/filterStore';
import { useDashboardConfigQuery } from '../../entities/dashboard/hooks/useDashboardQueries';
import { useDashboardStore, DEFAULT_DASHBOARD_LAYOUT } from '../../entities/dashboard/model/store';
import { queryClient } from '../../shared/api/queryClient';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { Responsive } from 'react-grid-layout';
import { WIDGET_REGISTRY } from '../../widgets/dashboard/core/widgetRegistry';
import { WidgetWrapper } from '../../widgets/dashboard/core/WidgetWrapper';
import { WidgetLibraryDrawer } from '../../widgets/dashboard/components/WidgetLibraryDrawer';
import { MobileDashboard } from './components/MobileDashboard';
import { DashboardHeader } from '../../widgets/dashboard/components/DashboardHeader';

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
  const [showFilter, setShowFilter] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const dateRangeLabel = useFilterStore((state) => state.dateRangeLabel);
  const setDateRange = useFilterStore((state) => state.setDateRange);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboardConfig'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['clientes'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['leads'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] })
      ]);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
  const resetMobileLayout = useDashboardStore((state) => state.resetMobileLayout);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handleConfirmReset = async () => {
    setIsConfirmResetOpen(false);
    updateLayout(DEFAULT_DASHBOARD_LAYOUT);
    resetMobileLayout();
    await saveLayout();
  };

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
        <style>{`
          @keyframes local-fluid-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        
        {/* Desktop Header */}
        {!isMobile && (
          <DashboardHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              {/* Filter Dropdown */}
              <div ref={filterRef} style={{ width: '210px', height: '36px', position: 'relative', flexShrink: 0 }}>
                <div 
                  onClick={() => !isEditMode && setShowFilter(!showFilter)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', width: '100%', height: '36px', boxSizing: 'border-box', cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Período</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                    {currentFilterLabel} <ChevronDown size={14} />
                  </div>
                </div>
                
                {showFilter && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '100%', minWidth: '200px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', boxShadow: 'var(--shadow-premium)', zIndex: 100 }}>
                    {dateOptions.map(opt => (
                      <div 
                        key={opt.value}
                        onClick={() => { setDateRange(opt.value as any); setShowFilter(false); }}
                        style={{ padding: '8px 10px', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '6px', background: dateRangeLabel === opt.value ? 'var(--color-primary-10)' : 'transparent', color: dateRangeLabel === opt.value ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: dateRangeLabel === opt.value ? 600 : 400 }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Circular Icons Row */}
              <button 
                onClick={handleRefresh}
                title="Atualizar dados"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', width: 'auto', height: '36px', flexShrink: 0, boxSizing: 'border-box', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  animation: isRefreshing ? 'local-fluid-spin 0.8s linear infinite' : 'none',
                  transformOrigin: 'center center'
                }}>
                  <RefreshCw size={14} color="var(--text-secondary)" />
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Atualizar dados</span>
              </button>

              {/* Reset Button (Animated in Edit Mode) */}
              <div style={{
                transition: 'all 0.3s ease-in-out 0.05s',
                width: isEditMode ? '144px' : '0px',
                opacity: isEditMode ? 1 : 0,
                transform: isEditMode ? 'scale(1)' : 'scale(0.95)',
                pointerEvents: isEditMode ? 'auto' : 'none',
                overflow: 'hidden',
                flexShrink: 0,
                marginRight: isEditMode ? '0px' : '-12px'
              }}>
                <button 
                  onClick={() => isEditMode && setIsConfirmResetOpen(true)}
                  title="Restaurar Padrão"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    width: '144px',
                    height: '36px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box'
                  }}
                >
                  <RotateCcw size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Restaurar Padrão</span>
                </button>
              </div>

              <button 
                onClick={() => setIsLibraryOpen(true)}
                title="Adicionar Widget"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', width: 'auto', height: '36px', flexShrink: 0, boxSizing: 'border-box', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <Plus size={14} color="var(--text-secondary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Adicionar Widget</span>
              </button>

              <button 
                onClick={() => {
                  if (isEditMode) saveLayout();
                  setIsEditMode(!isEditMode);
                }}
                style={{
                  background: isEditMode ? 'var(--color-primary)' : 'var(--bg-card)',
                  color: isEditMode ? '#fff' : 'var(--text-secondary)',
                  border: isEditMode ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  height: '36px',
                  width: 'auto',
                  padding: '0 12px',
                  gap: '8px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
                title={isEditMode ? 'Concluir' : 'Personalizar'}
              >
                <Settings size={14} color={isEditMode ? '#fff' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 500, color: isEditMode ? '#fff' : 'var(--text-secondary)' }}>
                  {isEditMode ? 'Concluir' : 'Personalizar'}
                </span>
              </button>
            </div>
          </DashboardHeader>
        )}

        {/* Mobile Header (Compact) */}
        {isMobile && (
          <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', width: '100%' }}>
            <div style={{ width: '100%' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>Dashboard</h1>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', width: '100%', marginTop: '12px' }}>
              {/* Filter Dropdown (Disappears in Edit Mode on Mobile) */}
              <div ref={filterRef} style={{ 
                position: 'relative',
                transition: 'all 0.3s ease-in-out',
                flex: isEditMode ? '0 0 0px' : '1 1 0%',
                minWidth: isEditMode ? '0px' : '140px',
                opacity: isEditMode ? 0 : 1,
                transform: isEditMode ? 'scale(0.95)' : 'scale(1)',
                pointerEvents: isEditMode ? 'none' : 'auto',
                overflow: isEditMode ? 'hidden' : 'visible',
                marginRight: isEditMode ? '-8px' : '0px'
              }}>
                <div 
                  onClick={() => !isEditMode && setShowFilter(!showFilter)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0 12px', width: '100%', height: '36px', boxSizing: 'border-box', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Período</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                    {currentFilterLabel} <ChevronDown size={14} />
                  </div>
                </div>
                {showFilter && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '100%', minWidth: '200px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px', boxShadow: 'var(--shadow-premium)', zIndex: 100 }}>
                    {dateOptions.map(opt => (
                      <div 
                        key={opt.value}
                        onClick={() => { setDateRange(opt.value as any); setShowFilter(false); }}
                        style={{ padding: '8px 10px', fontSize: '0.8125rem', cursor: 'pointer', borderRadius: '6px', background: dateRangeLabel === opt.value ? 'var(--color-primary-10)' : 'transparent', color: dateRangeLabel === opt.value ? 'var(--color-primary)' : 'var(--text-main)', fontWeight: dateRangeLabel === opt.value ? 600 : 400 }}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Refresh Button (Disappears in Edit Mode on Mobile) */}
              <div style={{
                transition: 'all 0.3s ease-in-out',
                width: isEditMode ? '0px' : '36px',
                opacity: isEditMode ? 0 : 1,
                transform: isEditMode ? 'scale(0.95)' : 'scale(1)',
                pointerEvents: isEditMode ? 'none' : 'auto',
                overflow: 'hidden',
                flexShrink: 0,
                marginRight: isEditMode ? '-8px' : '0px'
              }}>
                <button 
                  onClick={handleRefresh}
                  title="Atualizar dados"
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', width: '36px', height: '36px', flexShrink: 0, boxSizing: 'border-box', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    animation: isRefreshing ? 'local-fluid-spin 0.8s linear infinite' : 'none',
                    transformOrigin: 'center center'
                  }}>
                    <RefreshCw size={16} color="var(--text-secondary)" />
                  </span>
                </button>
              </div>
              {/* Reset Button (Animated in Edit Mode) */}
              <div style={{
                transition: 'all 0.3s ease-in-out 0.05s',
                width: isEditMode ? '144px' : '0px',
                opacity: isEditMode ? 1 : 0,
                transform: isEditMode ? 'scale(1)' : 'scale(0.95)',
                pointerEvents: isEditMode ? 'auto' : 'none',
                overflow: 'hidden',
                flexShrink: 0,
                marginRight: isEditMode ? '0px' : '-8px'
              }}>
                <button 
                  onClick={() => isEditMode && setIsConfirmResetOpen(true)}
                  title="Restaurar Padrão"
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    width: '144px',
                    height: '36px',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxSizing: 'border-box'
                  }}
                >
                  <RotateCcw size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Restaurar Padrão</span>
                </button>
              </div>
              <button 
                onClick={() => setIsLibraryOpen(true)}
                title="Adicionar Widget"
                style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', width: '36px', height: '36px', boxSizing: 'border-box', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Plus size={16} color="var(--text-secondary)" />
              </button>
              <button 
                onClick={() => {
                  if (isEditMode) saveLayout();
                  setIsEditMode(!isEditMode);
                }}
                style={{
                  background: isEditMode ? 'var(--color-primary)' : 'transparent',
                  color: isEditMode ? '#fff' : 'var(--text-secondary)',
                  border: isEditMode ? 'none' : '1px solid var(--border-color)',
                  borderRadius: '8px',
                  height: '36px',
                  flex: isEditMode ? 1 : '0 0 auto',
                  width: isEditMode ? 'auto' : '36px',
                  padding: isEditMode ? '0 16px' : '0',
                  gap: isEditMode ? '8px' : '0',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  overflow: 'hidden'
                }}
                title={isEditMode ? 'Concluir' : 'Personalizar'}
              >
                <Settings size={16} color={isEditMode ? '#fff' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
                {isEditMode && (
                  <span style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: 600 }}>
                    Concluir
                  </span>
                )}
              </button>
            </div>
          </header>
        )}

        {isMobile ? (
          <MobileDashboard isEditMode={isEditMode} />
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
            margin={[12, 12]}
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

        <ConfirmDialog 
          isOpen={isConfirmResetOpen}
          title="Restaurar Layout Padrão"
          message="Tem certeza que deseja restaurar o layout padrão da sua Dashboard? Suas personalizações atuais serão perdidas."
          onConfirm={handleConfirmReset}
          onCancel={() => setIsConfirmResetOpen(false)}
        />

      </div>
    </PageContainer>
  );
}
