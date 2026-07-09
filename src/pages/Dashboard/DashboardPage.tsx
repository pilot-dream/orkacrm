import React, { useEffect, useState, useRef } from 'react';
import { Responsive } from 'react-grid-layout';
import { PageContainer } from '../../shared/components/PageContainer';
import { DashboardHeader } from '../../widgets/dashboard/components/DashboardHeader';
import { useDashboardStore } from '../../entities/dashboard/model/store';
import { WIDGET_REGISTRY } from '../../widgets/dashboard/core/widgetRegistry';
import { WidgetWrapper } from '../../widgets/dashboard/core/WidgetWrapper';
import { WidgetLibraryDrawer } from '../../widgets/dashboard/components/WidgetLibraryDrawer';
import { DashboardSelector } from '../../widgets/dashboard/components/DashboardSelector';
import { Settings, Plus } from 'lucide-react';

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
  const { activeDashboard, loading, fetchDashboards, updateLayout, saveLayout } = useDashboardStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleLayoutChange = (layout: any[]) => {
    if (!activeDashboard) return;
    
    // Map layout back to our format
    const newLayout = activeDashboard.layout_data.map(item => {
      const match = layout.find(l => l.i === item.i);
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
        layouts={{ lg: activeDashboard.layout_data }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[20, 20]}
        useCSSTransforms={true}
        draggableHandle=".widget-drag-handle"
      >
        {activeDashboard.layout_data.filter(i => !i.isHidden).map(item => {
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
        })}
      </ResponsiveGridLayout>

      <WidgetLibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
    </PageContainer>
  );
}
