import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Task, TaskStatus, TaskType, TaskReminder } from '../model/types';
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
  tenant_id: db.tenant_id,
  // New fields
  time: db.time || '',
  taskType: (db.task_type as TaskType) || 'outro',
  reminder: (db.reminder as TaskReminder) || 'sem_lembrete',
  locationLink: db.location_link || '',
  notificationSent: db.notification_sent ?? false,
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
  tenant_id: t.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai',
  // New fields
  time: t.time || null,
  task_type: t.taskType || 'outro',
  reminder: t.reminder || 'sem_lembrete',
  location_link: t.locationLink || null,
  // FUTURE_WORKER: Este campo será atualizado para true quando a notificação for enviada
  notification_sent: t.notificationSent ?? false,
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
      const tWithTenant = {
        ...t,
        tenant_id: t.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
      };
      list.push(tWithTenant);
      localStorage.setItem('orka_tasks', JSON.stringify(list));
      console.log('✅ Tarefa criada (offline):', tWithTenant);
      return true;
    }
    const { error } = await supabase.from('tasks').insert([mapTaskToDb(t)]);
    if (error) {
      console.error('❌ Erro ao criar tarefa:', error.message);
      throw new Error(error.message || 'Erro ao inserir tarefa no Supabase');
    }
    console.log('✅ Tarefa criada:', t);
    return true;
  },

  update: async (t: Task): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_tasks');
      let list: Task[] = saved ? JSON.parse(saved) : [];
      list = list.map(item => item.id === t.id ? t : item);
      localStorage.setItem('orka_tasks', JSON.stringify(list));
      console.log('✅ Tarefa atualizada (offline):', t);
      return true;
    }
    const { error } = await supabase.from('tasks').update(mapTaskToDb(t)).eq('id', t.id);
    if (error) {
      console.error('❌ Erro ao atualizar tarefa:', error.message);
      throw new Error(error.message || 'Erro ao atualizar tarefa no Supabase');
    }
    console.log('✅ Tarefa atualizada:', t);
    return true;
  },

  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_tasks');
      let list: Task[] = saved ? JSON.parse(saved) : [];
      list = list.filter(item => item.id !== id);
      localStorage.setItem('orka_tasks', JSON.stringify(list));
      console.log('✅ Tarefa deletada (offline):', id);
      return true;
    }
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('❌ Erro ao excluir tarefa:', error.message);
      throw new Error(error.message || 'Erro ao deletar tarefa no Supabase');
    }
    console.log('✅ Tarefa deletada:', id);
    return true;
  }
};
