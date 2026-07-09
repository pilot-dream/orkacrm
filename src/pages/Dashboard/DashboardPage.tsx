import React, { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import { PageContainer } from '../../shared/components/PageContainer';
import { DashboardHeader } from '../../widgets/dashboard/components/DashboardHeader';
import { useDashboardStore } from '../../entities/dashboard/model/store';
import { WIDGET_REGISTRY } from '../../widgets/dashboard/core/widgetRegistry';
import { WidgetWrapper } from '../../widgets/dashboard/core/WidgetWrapper';
import { WidgetLibraryDrawer } from '../../widgets/dashboard/components/WidgetLibraryDrawer';
import { DashboardSelector } from '../../widgets/dashboard/components/DashboardSelector';
import { Settings, Plus } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardPage() {
  const { activeDashboard, loading, fetchDashboards, updateLayout, saveLayout, isEditMode, setIsEditMode } = useDashboardStore();

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    fetchDashboards();
    
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateMobileLayout = (baseLayout: any[]) => {
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
    const baseLayout = activeDashboard.layout_data;
    return {
      lg: baseLayout,
      md: baseLayout,
      sm: baseLayout,
      xs: generateMobileLayout(baseLayout),
      xxs: generateMobileLayout(baseLayout)
    };
  }, [activeDashboard]);

  const handleLayoutChange = (layout: any) => {
    if (!activeDashboard) return;
    
    // Map layout back to our format
    const newLayout = activeDashboard.layout_data.map(item => {
      const match = layout.find((l: any) => l.i === item.i);
      if (match) {
        return { ...item, x: match.x, y: match.y, w: match.w, h: match.h };
      }
      return item;
    });

    updateLayout(newLayout);
    // Only save when drag stops, handled by onDragStop/onResizeStop
  };

  const handleDragStop = () => {
    saveLayout();
  };

  const handleResizeStop = () => {
    saveLayout();
  };

  if (loading) {
    return <PageContainer><div style={{ padding: '40px', color: '#fff' }}>Carregando sua Dashboard...</div></PageContainer>;
  }

  if (!activeDashboard) {
    return <PageContainer><div style={{ padding: '40px', color: '#fff' }}>Nenhuma Dashboard encontrada.</div></PageContainer>;
  }

  return (
    <PageContainer>
      <DashboardHeader />

      {/* Toolbar for Dashboard management */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'var(--bg-card)', padding: '12px 20px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          <DashboardSelector />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setIsLibraryOpen(true)}>
            <Plus size={14} /> Adicionar Widget
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isEditMode ? 'var(--color-primary)' : 'transparent', border: isEditMode ? 'none' : '1px solid var(--border-color)', color: isEditMode ? '#fff' : 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setIsEditMode(!isEditMode)}>
            <Settings size={14} /> {isEditMode ? 'Concluir' : 'Personalizar'}
          </button>
        </div>
      </div>

      <ResponsiveGridLayout
        className={`layout ${isEditMode ? 'edit-mode' : ''}`}
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 1, xxs: 1 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[20, 20]}
        measureBeforeMount={false}
        useCSSTransforms={true}
        draggableHandle={isMobile ? ".widget-wrapper" : ".widget-drag-handle"}
      >
        {activeDashboard.layout_data.filter(i => !i.isHidden).map(item => {
          const manifest = WIDGET_REGISTRY[item.widgetId];
          if (!manifest) return null;
          
          const WidgetComponent = manifest.component;
          
          return (
            <div key={item.i}>
              <WidgetWrapper instanceId={item.i} widgetId={item.widgetId} config={item.config} isEditMode={isEditMode}>
                <React.Suspense fallback={<div style={{ height: '100%', background: 'var(--bg-card)', borderRadius: '12px' }} />}>
                  <WidgetComponent config={item.config} />
                </React.Suspense>
              </WidgetWrapper>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      <WidgetLibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
    </PageContainer>
  );
}
