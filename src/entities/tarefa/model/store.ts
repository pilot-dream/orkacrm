import { create } from 'zustand';
import type { Task, TaskStatus } from './types';
import { tarefaService } from '../api/service';
import { notifyUserByName } from '../../usuario/api/notificationHelper';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  fetchTasks: () => Promise<void>;
  addTask: (t: Task) => Promise<boolean>;
  updateTask: (t: Task) => Promise<boolean>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, oldStatus: TaskStatus) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const data = await tarefaService.fetch();
      set({ tasks: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar tarefas', loading: false });
    }
  },
  
  addTask: async (t) => {
    set({ loading: true, error: null });
    try {
      const success = await tarefaService.insert(t);
      if (success) {
        set((state) => ({ tasks: [t, ...state.tasks], loading: false }));
        notifyUserByName(`📌 Nova tarefa atribuída a você: "${t.title}"`, t.assignee);
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
        if (t.assignee && oldTask && oldTask.assignee !== t.assignee) {
          notifyUserByName(`📌 Nova tarefa atribuída a você: "${t.title}"`, t.assignee);
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
