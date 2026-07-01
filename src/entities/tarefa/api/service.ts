import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Task, TaskStatus } from '../model/types';
import { useAuthStore } from '../../usuario/model/store';

export const mapTaskFromDb = (db: any): Task => ({
  id: db.id,
  title: db.title,
  description: db.description || '',
  status: db.status as TaskStatus,
  priority: db.priority as 'baixa' | 'media' | 'alta',
  assignee: db.assignee || '',
  deadline: db.deadline || '',
  projectId: db.project_id || undefined,
  checklist: db.checklist || [],
  comments: db.comments || [],
  attachments: db.attachments || [],
  createdAt: db.created_at,
  tenant_id: db.tenant_id
});

export const mapTaskToDb = (t: Task) => ({
  id: t.id,
  title: t.title,
  description: t.description || null,
  status: t.status,
  priority: t.priority,
  assignee: t.assignee || null,
  deadline: t.deadline || null,
  project_id: t.projectId || null,
  checklist: t.checklist || [],
  comments: t.comments || [],
  attachments: t.attachments || [],
  tenant_id: t.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
});

export const tarefaService = {
  fetch: async (): Promise<Task[]> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_tasks');
      const list: Task[] = saved ? JSON.parse(saved) : [];
      return list.filter(item => item.tenant_id === tenant);
    }
    const { data, error } = await supabase.from('tasks').select('*').eq('tenant_id', tenant).order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar tarefas no Supabase:', error);
      return [];
    }
    return (data || []).map(mapTaskFromDb);
  },
  
  insert: async (t: Task): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_tasks');
      const list = saved ? JSON.parse(saved) : [];
      list.push(t);
      localStorage.setItem('orka_tasks', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('tasks').insert([mapTaskToDb(t)]);
    if (error) {
      console.error('Erro ao inserir tarefa no Supabase:', error);
      throw new Error(error.message || 'Erro ao inserir tarefa no Supabase');
    }
    return true;
  },
  
  update: async (t: Task): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_tasks');
      let list: Task[] = saved ? JSON.parse(saved) : [];
      list = list.map(item => item.id === t.id ? t : item);
      localStorage.setItem('orka_tasks', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('tasks').update(mapTaskToDb(t)).eq('id', t.id);
    if (error) {
      console.error('Erro ao atualizar tarefa no Supabase:', error);
      throw new Error(error.message || 'Erro ao atualizar tarefa no Supabase');
    }
    return true;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_tasks');
      let list: Task[] = saved ? JSON.parse(saved) : [];
      list = list.filter(item => item.id !== id);
      localStorage.setItem('orka_tasks', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar tarefa no Supabase:', error);
      throw new Error(error.message || 'Erro ao deletar tarefa no Supabase');
    }
    return true;
  }
};
