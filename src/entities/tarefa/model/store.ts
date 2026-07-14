import { create } from 'zustand';
import type { Task, TaskStatus } from './types';
import { tarefaService } from '../api/service';
import { notifyUserByName } from '../../usuario/api/notificationHelper';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  lastFetch: number;
  abortController: AbortController | null;
  
  fetchTasks: (force?: boolean) => Promise<void>;
  addTask: (t: Task) => Promise<boolean>;
  updateTask: (t: Task) => Promise<boolean>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, oldStatus: TaskStatus) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  isRefreshing: false,
  lastFetch: 0,
  abortController: null,
  
  fetchTasks: async (force = false) => {
    const { tasks, lastFetch, abortController } = get();
    const now = Date.now();
    const TTL = 5 * 60 * 1000;

    if (!force && tasks.length > 0 && (now - lastFetch) < TTL) {
      return;
    }

    if (abortController) {
      abortController.abort();
    }
    const newAbortController = new AbortController();
    set({ abortController: newAbortController });

    const isInitialLoad = tasks.length === 0;
    if (isInitialLoad) {
      set({ loading: true, error: null });
    } else {
      set({ isRefreshing: true, error: null });
    }

    try {
      const data = await tarefaService.fetch();
      
      if (newAbortController.signal.aborted) return;

      set({ tasks: data, loading: false, isRefreshing: false, lastFetch: Date.now(), abortController: null });
    } catch (err: any) {
      if (newAbortController.signal.aborted) return;
      set({ error: err.message || 'Erro ao carregar tarefas', loading: false, isRefreshing: false, abortController: null });
    }
  },
  
  addTask: async (t) => {
    set({ loading: true, error: null });
    try {
      const success = await tarefaService.insert(t);
      if (success) {
        set((state) => ({ tasks: [t, ...state.tasks], loading: false }));
        if (t.assignees && t.assignees.length > 0) {
          for (const a of t.assignees) {
            notifyUserByName(`📌 Nova tarefa atribuída a você: "${t.title}"`, a);
          }
        }
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar tarefa', loading: false });
      throw err;
    }
  },
  
  updateTask: async (t) => {
    set({ loading: true, error: null });
    try {
      const oldTask = get().tasks.find((item) => item.id === t.id);
      const success = await tarefaService.update(t);
      if (success) {
        set((state) => ({
          tasks: state.tasks.map((item) => (item.id === t.id ? t : item)),
          loading: false
        }));
        if (t.assignees && oldTask) {
          const oldAssignees = oldTask.assignees || [];
          const newAssignees = t.assignees.filter(a => !oldAssignees.includes(a));
          newAssignees.forEach(assignee => {
            notifyUserByName(`📌 Nova tarefa atribuída a você: "${t.title}"`, assignee);
          });
        }
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar tarefa', loading: false });
      return false;
    }
  },

  updateTaskStatus: async (taskId, newStatus, oldStatus) => {
    // 1. Optimistically update local state
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    }));

    try {
      const targetTask = get().tasks.find((t) => t.id === taskId);
      if (!targetTask) {
        throw new Error('Tarefa não encontrada.');
      }
      
      const success = await tarefaService.update(targetTask);
      if (!success) {
        throw new Error('Falha ao atualizar status da tarefa no Supabase.');
      }
      return true;
    } catch (err: any) {
      // 2. Rollback to original state on failure
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t)),
        error: err.message || 'Erro ao persistir mudança de status'
      }));
      throw err;
    }
  },
  
  deleteTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await tarefaService.delete(id);
      if (success) {
        set((state) => ({
          tasks: state.tasks.filter((item) => item.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar tarefa', loading: false });
      return false;
    }
  }
}));
