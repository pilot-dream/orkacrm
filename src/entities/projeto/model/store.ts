import { create } from 'zustand';
import type { Project, ProjectStage } from './types';
import { projetoService } from '../api/service';
import { notifyUserByName } from '../../usuario/api/notificationHelper';

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  isRefreshing: boolean;
  lastFetch: number;
  abortController: AbortController | null;
  
  fetchProjects: (force?: boolean) => Promise<void>;
  addProject: (p: Project) => Promise<boolean>;
  updateProject: (p: Project) => Promise<boolean>;
  updateProjectStage: (projectId: string, newStage: ProjectStage, oldStage: ProjectStage) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  isRefreshing: false,
  lastFetch: 0,
  abortController: null,
  
  fetchProjects: async (force = false) => {
    const { projects, lastFetch, abortController, loading } = get();
    const now = Date.now();
    const TTL = 5 * 60 * 1000;

    if (!force && loading) return;

    if (!force && projects.length > 0 && (now - lastFetch) < TTL) {
      return;
    }

    if (abortController) {
      abortController.abort();
    }
    const newAbortController = new AbortController();
    set({ abortController: newAbortController });

    const isInitialLoad = projects.length === 0;
    if (isInitialLoad) {
      set({ loading: true, error: null });
    } else {
      set({ isRefreshing: true, error: null });
    }

    try {
      const data = await projetoService.fetch();
      
      if (newAbortController.signal.aborted) return;

      set({ projects: data, loading: false, isRefreshing: false, lastFetch: Date.now(), abortController: null });
    } catch (err: any) {
      if (newAbortController.signal.aborted) return;
      set({ error: err.message || 'Erro ao carregar projetos', loading: false, isRefreshing: false, abortController: null });
    }
  },
  
  addProject: async (p) => {
    set({ loading: true, error: null });
    try {
      const success = await projetoService.insert(p);
      if (success) {
        set((state) => ({ projects: [p, ...state.projects], loading: false }));
        notifyUserByName(`📂 Novo projeto criado: "${p.name}"`, p.team && p.team.length > 0 ? p.team[0] : undefined);
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao adicionar projeto', loading: false });
      throw err;
    }
  },
  
  updateProject: async (p) => {
    set({ loading: true, error: null });
    try {
      const success = await projetoService.update(p);
      if (success) {
        set((state) => ({
          projects: state.projects.map((item) => (item.id === p.id ? p : item)),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar projeto', loading: false });
      return false;
    }
  },

  updateProjectStage: async (projectId, newStage, oldStage) => {
    // 1. Optimistically update local state
    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? { ...p, stage: newStage } : p))
    }));

    try {
      const targetProj = get().projects.find((p) => p.id === projectId);
      if (!targetProj) {
        throw new Error('Projeto não encontrado.');
      }
      
      const success = await projetoService.update(targetProj);
      if (!success) {
        throw new Error('Falha ao atualizar estágio do projeto no Supabase.');
      }
      return true;
    } catch (err: any) {
      // 2. Rollback to original state on failure
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? { ...p, stage: oldStage } : p)),
        error: err.message || 'Erro ao persistir mudança de estágio'
      }));
      throw err;
    }
  },
  
  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await projetoService.delete(id);
      if (success) {
        set((state) => ({
          projects: state.projects.filter((item) => item.id !== id),
          loading: false
        }));
        return true;
      }
      set({ loading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar projeto', loading: false });
      return false;
    }
  }
}));
