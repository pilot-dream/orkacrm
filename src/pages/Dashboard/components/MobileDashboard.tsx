import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Target, FolderKanban, DollarSign, Expand, MoreVertical, RotateCw, Copy, Maximize2, EyeOff, Trash2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useProjectStore } from '../../../entities/projeto/model/store';
import { useLeadStore } from '../../../entities/lead/model/store';
import { useFilterStore, isDateInRange } from '../../../entities/dashboard/model/filterStore';
import { useDashboardStore } from '../../../entities/dashboard/model/store';
import { TaskListWidget } from '../../../widgets/dashboard/components/TaskListWidget';

import { queryClient } from '../../../shared/api/queryClient';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MobileKpiCardProps {
  id: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  isEditMode?: boolean;
  onRemove?: () => void;
  onDuplicate?: () => void;
  isDragging?: boolean;
}

const SortableMobileWidget: React.FC<{ id: string; isEditMode?: boolean; onRemove?: () => void; onDuplicate?: () => void; data?: any }> = ({ id, isEditMode, onRemove, onDuplicate, data }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id, disabled: !isEditMode });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : (isMenuOpen ? 50 : 1),
    opacity: isDragging ? 0.6 : 1,
    position: 'relative' as const,
  };

  const baseId = id.split('_copy')[0];
  const isTaskList = baseId === 'TaskListWidget';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
    >
      {isEditMode && (
        <>
          <div 
            {...listeners} 
            {...attributes}
            style={{
              position: 'absolute',
              top: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'grab',
              touchAction: 'none',
              zIndex: 60
            }}
          >
            <Expand size={14} color="var(--text-secondary)" />
          </div>

          <div 
            style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 60, cursor: 'pointer', padding: '6px', background: 'var(--bg-card)', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          >
            <MoreVertical size={16} color="var(--text-secondary)" />
          </div>
        </>
      )}

      {isMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '46px',
          right: '12px',
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '8px 0',
          zIndex: 100,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          minWidth: '180px',
          display: 'flex',
          flexDirection: 'column'
        }}
        onPointerDown={(e) => e.stopPropagation()}
        >
          <button style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); queryClient.invalidateQueries(); }}>
            <RotateCw size={14} /> Atualizar Dados
          </button>
          <button style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); if(onDuplicate) onDuplicate(); }}>
            <Copy size={14} /> Duplicar Widget
          </button>
          <button style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); document.documentElement.requestFullscreen().catch(() => {}); }}>
            <Maximize2 size={14} /> Tela Cheia
          </button>
          <button style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'transparent', border: 'none', color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); if(onRemove) onRemove(); }}>
            <EyeOff size={14} /> Ocultar
          </button>
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '4px 0' }}></div>
          <button style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', width: '100%', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }} onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); if(onRemove) onRemove(); }}>
            <Trash2 size={14} /> Remover da Dashboard
          </button>
        </div>
      )}

      <div style={{ transition: 'all 0.2s', filter: isEditMode ? 'brightness(0.9)' : 'none', border: isEditMode ? '2px dashed rgba(59,130,246,0.5)' : 'none', borderRadius: '12px', boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : 'none' }}>
        {isTaskList ? (
          <div style={{ pointerEvents: isEditMode ? 'none' : 'auto' }}><TaskListWidget /></div>
        ) : (
          data ? <MobileKpiCard {...data} isEditMode={isEditMode} isDragging={isDragging} /> : <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', color: '#fff' }}>Widget não encontrado: {baseId}</div>
        )}
      </div>
    </div>
  );
};

const MobileKpiCard: React.FC<MobileKpiCardProps> = React.memo(({ 
  title, value, icon, color, loading, isEditMode, isDragging
}) => {

  return (
    <div 
      className={`mobile-kpi-card ${isEditMode ? 'edit-mode' : ''}`} 
      style={{ 
        padding: '20px', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        minHeight: '144px', 
        backgroundColor: 'var(--bg-card)', 
        borderRadius: '12px', 
        border: '1px solid var(--border-color)',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1, marginTop: isEditMode ? '12px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        </div>
      </div>
      
      <div style={{ zIndex: 1, marginTop: 'auto', marginBottom: '8px' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em' }}>
          {loading ? '...' : value}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', opacity: 0.5, pointerEvents: 'none', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
        {isDragging ? (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(to top, ${color}40, transparent)` }} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{ v: 10 }, { v: 15 }, { v: 12 }, { v: 22 }, { v: 18 }]}>
              <defs>
                <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip cursor={false} content={<></>} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                fillOpacity={1}
                fill={`url(#color-${title.replace(/\s+/g, '')})`}
                strokeWidth={2}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)', stroke: color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});

export const MobileDashboard: React.FC<{ isEditMode?: boolean }> = ({ isEditMode }) => {
  const { transactions, loading: loadingFin, fetchTransactions } = useFinanceiroStore();
  const { clientes, loading: loadingCli, fetchClientes } = useClienteStore();
  const { projects, loading: loadingProj, fetchProjects } = useProjectStore();
  const { leads, loading: loadingLead, fetchLeads } = useLeadStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { 
    fetchTransactions();
    fetchClientes();
    fetchProjects();
    fetchLeads();
  }, []);
  
  // Calculations
  const receitasRealizadas = transactions
    .filter(t => t.type === 'income' && t.status === 'Pago' && isDateInRange(t.dueDate, startDate, endDate))
    .reduce((acc, curr) => acc + curr.value, 0);

  const mrr = 0; // Se houver campo recorrente usaríamos aqui.
  const ativos = projects.filter(p => p.stage === 'desenvolvimento').length;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const cardData: Record<string, Omit<MobileKpiCardProps, 'id' | 'isEditMode'>> = {
    receita: { title: "Receita Líquida", value: formatCurrency(receitasRealizadas), icon: <DollarSign size={16} />, color: "var(--color-success)", loading: loadingFin },
    mrr: { title: "MRR", value: formatCurrency(mrr), icon: <TrendingUp size={16} />, color: "var(--color-primary)", loading: loadingFin },
    clientes: { title: "Clientes Ativos", value: clientes.length, icon: <Users size={16} />, color: "var(--color-purple)", loading: loadingCli },
    projetos: { title: "Projetos Ativos", value: ativos, icon: <FolderKanban size={16} />, color: "var(--color-warning)", loading: loadingProj },
    leads: { title: "Leads no Funil", value: leads.length, icon: <Target size={16} />, color: "#ec4899", loading: loadingLead }
  };

  const mobileCardOrder = useDashboardStore(state => state.mobileCardOrder);
  const setMobileCardOrder = useDashboardStore(state => state.setMobileCardOrder);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = mobileCardOrder.indexOf(active.id as string);
      const newIndex = mobileCardOrder.indexOf(over.id as string);
      setMobileCardOrder(arrayMove(mobileCardOrder, oldIndex, newIndex));
    }
  };

  const handleRemove = (id: string) => {
    setMobileCardOrder(mobileCardOrder.filter(c => c !== id));
  };

  const handleDuplicate = (id: string) => {
    const newId = `${id.split('_copy')[0]}_copy_${Date.now()}`;
    const idx = mobileCardOrder.indexOf(id);
    const next = [...mobileCardOrder];
    next.splice(idx + 1, 0, newId);
    setMobileCardOrder(next);
  };

  const WIDGET_ID_TO_CARD_KEY: Record<string, string> = {
    'PremiumKpiRow_Revenue': 'receita',
    'PremiumKpiRow_MRR': 'mrr',
    'PremiumKpiRow_Clients': 'clientes',
    'PremiumKpiRow_Projects': 'projetos',
    'PremiumKpiRow_Leads': 'leads'
  };

  const getCardData = (id: string) => {
    const baseId = id.split('_copy')[0];
    const key = WIDGET_ID_TO_CARD_KEY[baseId] || baseId;
    return cardData[key];
  };

  return (
    <div className="mobile-dashboard-layout" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '24px' }}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={mobileCardOrder}
          strategy={verticalListSortingStrategy}
        >
          {mobileCardOrder.map(id => {
            const data = getCardData(id);
            return (
              <SortableMobileWidget 
                key={id} 
                id={id} 
                isEditMode={isEditMode}
                onRemove={() => handleRemove(id)}
                onDuplicate={() => handleDuplicate(id)}
                data={data} 
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
};
