import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../api/service';
import { financeiroService } from '../../financeiro/api/service';
import { clienteService } from '../../cliente/api/service';
import { tarefaService } from '../../tarefa/api/service';
import { leadService } from '../../lead/api/service';
import { projetoService } from '../../projeto/api/service';
import { useAuthStore } from '../../usuario/model/store';
import { useDashboardStore, DEFAULT_DASHBOARD_LAYOUT } from '../model/store';
import { useFinanceiroStore } from '../../financeiro/model/store';
import { useClienteStore } from '../../cliente/model/store';
import { useTaskStore } from '../../tarefa/model/store';
import { useLeadStore } from '../../lead/model/store';
import { useProjectStore } from '../../projeto/model/store';

// 1. Dashboard Layout Queries & Mutations
export const useDashboardConfigQuery = () => {
  const userEmail = useAuthStore((s) => s.userEmail);

  return useQuery({
    queryKey: ['dashboardConfig', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const data = await dashboardService.getUserDashboards(userEmail);
      
      let active = null;
      if (data.length === 0) {
        active = await dashboardService.createDashboard({
          user_email: userEmail,
          name: 'Dashboard Padrão',
          layout_data: DEFAULT_DASHBOARD_LAYOUT,
          is_active: true
        });
        if (!active) {
          active = {
            id: 'default',
            user_email: userEmail,
            name: 'Dashboard Padrão',
            layout_data: DEFAULT_DASHBOARD_LAYOUT,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      } else {
        active = data.find(d => d.is_active) || data[0];
        
        // Auto-migration V3 layout
        if (active.name === 'Dashboard Padrão') {
          const hasOldWidget = active.layout_data.some((w: any) => 
            w.widgetId === 'FinKpi_MrrContratado' || 
            w.widgetId === 'CashFlowChartWidget' || 
            w.widgetId === 'FunnelConversionChartWidget'
          );
          const isMissingV3Widgets = !active.layout_data.some((w: any) => 
            w.widgetId === 'RevenueForecastChartWidget' || 
            w.widgetId === 'FunnelWidget'
          );
          
          if (hasOldWidget || isMissingV3Widgets) {
            active.layout_data = DEFAULT_DASHBOARD_LAYOUT;
            await dashboardService.updateDashboardLayout(active.id, DEFAULT_DASHBOARD_LAYOUT);
          }
        }
      }

      // Sync to Zustand for legacy components that still read Zustand
      useDashboardStore.setState({ activeDashboard: active, dashboards: data.length ? data : [active] });
      return active;
    },
    enabled: !!userEmail,
  });
};

export const useUpdateDashboardLayoutMutation = () => {
  const queryClient = useQueryClient();
  const userEmail = useAuthStore((s) => s.userEmail);

  return useMutation({
    mutationFn: async ({ id, layout }: { id: string; layout: any[] }) => {
      if (id === 'default') return true;
      return dashboardService.updateDashboardLayout(id, layout);
    },
    onMutate: async ({ layout }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['dashboardConfig', userEmail] });
      const previousConfig = queryClient.getQueryData(['dashboardConfig', userEmail]);

      queryClient.setQueryData(['dashboardConfig', userEmail], (old: any) => {
        if (!old) return old;
        return { ...old, layout_data: layout };
      });

      // Also sync Zustand optimistically
      const active = useDashboardStore.getState().activeDashboard;
      if (active) {
        useDashboardStore.setState({ activeDashboard: { ...active, layout_data: layout } });
      }

      return { previousConfig };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousConfig) {
        queryClient.setQueryData(['dashboardConfig', userEmail], context.previousConfig);
        useDashboardStore.setState({ activeDashboard: context.previousConfig as any });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardConfig', userEmail] });
    },
  });
};

// 2. Financeiro Queries
export const useFinanceiroQuery = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      // Process recurring expenses first
      try {
        const activeRecurring = await recurringExpenseServiceFetch();
        const todayStr = new Date().toISOString().split('T')[0];
        const parseDate = (dStr: string) => {
          const parts = dStr.split('/');
          if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
          return dStr;
        };
        
        let exchangeRate = 1;
        let fetchedRate = false;

        for (const rec of activeRecurring) {
          if (rec.status !== 'Ativa') continue;
          
          const nextGen = parseDate(rec.nextGenerationDate);
          if (nextGen <= todayStr) {
            if (rec.currency === 'USD' && !fetchedRate) {
              try {
                const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
                const data = await res.json();
                exchangeRate = parseFloat(data.USDBRL.ask);
                fetchedRate = true;
              } catch(e) {
                exchangeRate = 5.0;
              }
            }
            
            const rateToUse = rec.currency === 'USD' ? exchangeRate : 1;
            const convertedValue = rec.originalValue * rateToUse;
            const [yy, mm] = nextGen.split('-');
            const dueDateStr = `${String(rec.dueDay).padStart(2, '0')}/${mm}/${yy}`;
            
            const newTx = {
              id: `trx-rec-${Math.random().toString(36).substr(2,9)}`,
              type: 'expense' as const,
              description: rec.name,
              value: convertedValue,
              dueDate: dueDateStr,
              category: rec.category,
              status: 'Pendente' as const,
              party: 'Assinatura',
              originalValue: rec.originalValue,
              currency: rec.currency,
              exchangeRate: rateToUse,
              recurringExpenseId: rec.id
            };
            
            await financeiroService.insert(newTx);
            
            const dateObj = new Date(`${nextGen}T00:00:00`);
            if (rec.frequency === 'Anual') {
              dateObj.setFullYear(dateObj.getFullYear() + 1);
            } else {
              dateObj.setMonth(dateObj.getMonth() + 1);
            }
            const nextDateStr = dateObj.toISOString().split('T')[0];
            await supabaseUpdateRecurringDate(rec.id, nextDateStr);
          }
        }
      } catch (e) {
        console.error('Error processing recurring expenses in QueryFn:', e);
      }

      const data = await financeiroService.fetch();
      const todayStr = new Date().toISOString().split('T')[0];
      const parseDate = (dStr: string) => {
        const parts = dStr.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dStr;
      };

      const updatedData = await Promise.all(data.map(async (t) => {
        if (t.status === 'Pendente') {
          if (!t.dueDate) return t;
          const parsedDue = parseDate(t.dueDate);
          if (parsedDue < todayStr) {
            const updated = { ...t, status: 'Atrasado' as const };
            await financeiroService.update(updated);
            return updated;
          }
        }
        return t;
      }));

      // Sync to Zustand
      useFinanceiroStore.setState({ transactions: updatedData, lastFetch: Date.now() });
      return updatedData;
    },
  });
};

// Supporting helpers for Query processing to bypass store imports looping
import { supabase } from '../../../shared/api/supabaseClient';
async function recurringExpenseServiceFetch() {
  const { data, error } = await supabase.from('recurring_expenses').select('*');
  if (error) throw error;
  return data || [];
}
async function supabaseUpdateRecurringDate(id: string, nextDate: string) {
  await supabase.from('recurring_expenses').update({ next_generation_date: nextDate }).eq('id', id);
}

// 3. Clientes Query
export const useClientesQuery = () => {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const data = await clienteService.fetch();
      useClienteStore.setState({ clientes: data, lastFetch: Date.now() });
      return data;
    },
  });
};

// 4. Tasks Query & Mutation
export const useTasksQuery = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const data = await tarefaService.fetch();
      useTaskStore.setState({ tasks: data, lastFetch: Date.now() });
      return data;
    },
  });
};

export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: any }) => {
      const tasks = queryClient.getQueryData<any[]>(['tasks']) || [];
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      const updatedTask = { ...task, status: newStatus };
      const success = await tarefaService.update(updatedTask);
      if (!success) throw new Error('Failed to update task status');
      return updatedTask;
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: any[] | undefined) => {
        if (!old) return [];
        return old.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      });

      // Sync to Zustand store optimistically
      const storeTasks = useTaskStore.getState().tasks;
      useTaskStore.setState({
        tasks: storeTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      });

      return { previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
        useTaskStore.setState({ tasks: context.previousTasks as any[] });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// 5. Leads Query
export const useLeadsQuery = () => {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const data = await leadService.fetch();
      useLeadStore.setState({ leads: data, lastFetch: Date.now() });
      return data;
    },
  });
};

// 6. Projects Query
export const useProjectsQuery = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const data = await projetoService.fetch();
      useProjectStore.setState({ projects: data, lastFetch: Date.now() });
      return data;
    },
  });
};
