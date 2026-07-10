import { create } from 'zustand';
import type { DashboardConfig, DashboardLayoutItem } from './types';
import { dashboardService } from '../api/service';
import { useAuthStore } from '../../usuario/model/store';

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutItem[] = [
  // Top Row: Principais KPIs do CRM
  { i: 'kpi_revenue', x: 0, y: 0, w: 2, h: 3, widgetId: 'PremiumKpiRow_Revenue' },
  { i: 'kpi_mrr', x: 2, y: 0, w: 2, h: 3, widgetId: 'PremiumKpiRow_MRR' },
  { i: 'kpi_clients', x: 4, y: 0, w: 3, h: 3, widgetId: 'PremiumKpiRow_Clients' },
  { i: 'kpi_projects', x: 7, y: 0, w: 3, h: 3, widgetId: 'PremiumKpiRow_Projects' },
  { i: 'kpi_leads', x: 10, y: 0, w: 2, h: 3, widgetId: 'PremiumKpiRow_Leads' },
  
  // Middle Row: Gráficos Principais
  { i: 'cashflow_chart', x: 0, y: 3, w: 6, h: 9, widgetId: 'RevenueForecastChartWidget' },
  { i: 'mrr_chart', x: 6, y: 3, w: 6, h: 9, widgetId: 'MrrEvolutionChartWidget' },
  
  // Bottom Row: Resumos e Funil
  { i: 'funnel_widget', x: 0, y: 12, w: 4, h: 10, widgetId: 'FunnelWidget' },
  { i: 'finance_summary', x: 4, y: 12, w: 4, h: 10, widgetId: 'FinanceSummaryWidget' },
  { i: 'task_list', x: 8, y: 12, w: 4, h: 10, widgetId: 'TaskListWidget' },
];

interface DashboardState {
  dashboards: DashboardConfig[];
  activeDashboard: DashboardConfig | null;
  loading: boolean;
  
  fetchDashboards: () => Promise<void>;
  setActiveDashboard: (id: string) => Promise<void>;
  updateLayout: (newLayout: DashboardLayoutItem[]) => void;
  saveLayout: () => Promise<void>;
  addWidget: (widgetId: string) => void;
  removeWidget: (instanceId: string) => void;
  updateWidgetConfig: (instanceId: string, config: any) => void;
  createDashboard: (name: string, layoutOption?: 'empty' | 'default') => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  isEditMode: boolean;
  setIsEditMode: (isEditMode: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboards: [],
  activeDashboard: null,
  loading: false,
  isEditMode: false,
  setIsEditMode: (isEditMode) => set({ isEditMode }),

  fetchDashboards: async () => {
    const userEmail = useAuthStore.getState().userEmail;
    if (!userEmail) return;

    set({ loading: true });
    
    try {
      const data = await dashboardService.getUserDashboards(userEmail);
      
      if (data.length === 0) {
        // Create default dashboard
        const newDash = await dashboardService.createDashboard({
          user_email: userEmail,
          name: 'Dashboard Padrão',
          layout_data: DEFAULT_DASHBOARD_LAYOUT,
          is_active: true
        });
        
        if (newDash) {
          set({ dashboards: [newDash], activeDashboard: newDash, loading: false });
        } else {
          // Fallback to memory
          const memDash: DashboardConfig = {
            id: 'default',
            user_email: userEmail,
            name: 'Dashboard Padrão',
            layout_data: DEFAULT_DASHBOARD_LAYOUT,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          set({ dashboards: [memDash], activeDashboard: memDash, loading: false });
        }
      } else {
        const active = data.find(d => d.is_active) || data[0];
        
        // Força todos os usuários que ainda têm a dashboard padrão antiga (com os widgets removidos)
        // a migrarem para o novo layout enxuto.
        if (active.name === 'Dashboard Padrão') {
          const hasOldWidget = active.layout_data.some((w: any) => w.widgetId === 'FinKpi_MrrContratado' || w.widgetId === 'CashFlowChartWidget' || w.widgetId === 'FunnelConversionChartWidget');
          const isMissingV3Widgets = !active.layout_data.some((w: any) => w.widgetId === 'RevenueForecastChartWidget' || w.widgetId === 'FunnelWidget');
          
          if (hasOldWidget || isMissingV3Widgets) {
            active.layout_data = DEFAULT_DASHBOARD_LAYOUT;
            dashboardService.updateDashboardLayout(active.id, DEFAULT_DASHBOARD_LAYOUT).catch(console.error);
          }
        }

        set({ dashboards: data, activeDashboard: active, loading: false });
      }
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  setActiveDashboard: async (id: string) => {
    const { dashboards, activeDashboard } = get();
    if (activeDashboard?.id === id) return;

    const newActive = dashboards.find(d => d.id === id);
    if (!newActive) return;

    set({ activeDashboard: newActive });

    // Update in DB
    if (activeDashboard && activeDashboard.id !== 'default') {
      await dashboardService.updateDashboard(activeDashboard.id, { is_active: false });
    }
    if (id !== 'default') {
      await dashboardService.updateDashboard(id, { is_active: true });
    }
    
    const userEmail = useAuthStore.getState().userEmail;
    if (userEmail) {
      const data = await dashboardService.getUserDashboards(userEmail);
      set({ dashboards: data });
    }
  },

  updateLayout: (newLayout: DashboardLayoutItem[]) => {
    const { activeDashboard } = get();
    if (!activeDashboard) return;

    const updatedDashboard = { ...activeDashboard, layout_data: newLayout };
    set({ activeDashboard: updatedDashboard });
  },

  saveLayout: async () => {
    const { activeDashboard } = get();
    if (!activeDashboard || activeDashboard.id === 'default') return;

    await dashboardService.updateDashboardLayout(activeDashboard.id, activeDashboard.layout_data);
  },

  addWidget: (widgetId: string, defaultW = 4, defaultH = 6) => {
    const { activeDashboard } = get();
    if (!activeDashboard) return;

    const newId = `${widgetId}_${Date.now()}`;
    const maxY = Math.max(0, ...activeDashboard.layout_data.map(l => l.y + l.h));
    
    const newItem: DashboardLayoutItem = {
      i: newId,
      x: 0,
      y: maxY,
      w: defaultW, 
      h: defaultH, 
      widgetId: widgetId
    };

    const newLayout = [...activeDashboard.layout_data, newItem];
    set({ activeDashboard: { ...activeDashboard, layout_data: newLayout } });
    get().saveLayout();
  },

  removeWidget: (instanceId: string) => {
    const { activeDashboard } = get();
    if (!activeDashboard) return;

    const newLayout = activeDashboard.layout_data.filter(l => l.i !== instanceId);
    set({ activeDashboard: { ...activeDashboard, layout_data: newLayout } });
    get().saveLayout();
  },

  updateWidgetConfig: (instanceId: string, config: any) => {
    const { activeDashboard } = get();
    if (!activeDashboard) return;

    const newLayout = activeDashboard.layout_data.map(l => {
      if (l.i === instanceId) {
        return { ...l, config: { ...l.config, ...config } };
      }
      return l;
    });

    set({ activeDashboard: { ...activeDashboard, layout_data: newLayout } });
    get().saveLayout();
  },

  createDashboard: async (name: string, layoutOption: 'empty' | 'default' = 'empty') => {
    const userEmail = useAuthStore.getState().userEmail;
    if (!userEmail) return;

    const layoutData = layoutOption === 'default' ? DEFAULT_DASHBOARD_LAYOUT : [];

    const newDash = await dashboardService.createDashboard({
      user_email: userEmail,
      name,
      layout_data: layoutData,
      is_active: false
    });

    if (newDash) {
      set((state) => ({ dashboards: [...state.dashboards, newDash] }));
      await get().setActiveDashboard(newDash.id);
    }
  },

  deleteDashboard: async (id: string) => {
    const { dashboards, activeDashboard } = get();
    
    // Prevent deleting the last dashboard
    if (dashboards.length <= 1) return;

    const success = await dashboardService.deleteDashboard(id);
    
    if (success) {
      const newDashboards = dashboards.filter(d => d.id !== id);
      set({ dashboards: newDashboards });
      
      if (activeDashboard?.id === id) {
        await get().setActiveDashboard(newDashboards[0].id);
      }
    }
  }
}));
