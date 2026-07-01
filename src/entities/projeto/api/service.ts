import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import type { Project, ProjectStage } from '../model/types';
import { useAuthStore } from '../../usuario/model/store';

export const mapProjectFromDb = (db: any): Project => ({
  id: db.id,
  name: db.name,
  description: db.description || '',
  stage: db.stage as ProjectStage,
  deadline: db.deadline || '',
  priority: db.priority as 'baixa' | 'media' | 'alta',
  progress: Number(db.progress || 0),
  team: db.team || [],
  checklist: db.checklist || [],
  comments: db.comments || [],
  files: db.files || [],
  aiSummary: db.ai_summary || '',
  tenant_id: db.tenant_id
});

export const mapProjectToDb = (p: Project) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  stage: p.stage,
  deadline: p.deadline,
  priority: p.priority,
  progress: p.progress,
  team: p.team,
  checklist: p.checklist,
  comments: p.comments,
  files: p.files,
  ai_summary: p.aiSummary,
  tenant_id: p.tenant_id || useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai'
});

export const projetoService = {
  fetch: async (): Promise<Project[]> => {
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_projects');
      const list: Project[] = saved ? JSON.parse(saved) : [];
      return list.filter(item => item.tenant_id === tenant);
    }
    const { data, error } = await supabase.from('projects').select('*').eq('tenant_id', tenant).order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar projetos no Supabase:', error);
      return [];
    }
    return (data || []).map(mapProjectFromDb);
  },
  
  insert: async (p: Project): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_projects');
      const list = saved ? JSON.parse(saved) : [];
      list.push(p);
      localStorage.setItem('orka_projects', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('projects').insert([mapProjectToDb(p)]);
    if (error) console.error('Erro ao inserir projeto no Supabase:', error);
    return !error;
  },
  
  update: async (p: Project): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_projects');
      let list: Project[] = saved ? JSON.parse(saved) : [];
      list = list.map(item => item.id === p.id ? p : item);
      localStorage.setItem('orka_projects', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('projects').update(mapProjectToDb(p)).eq('id', p.id);
    if (error) console.error('Erro ao atualizar projeto no Supabase:', error);
    return !error;
  },
  
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) {
      const saved = localStorage.getItem('orka_projects');
      let list: Project[] = saved ? JSON.parse(saved) : [];
      list = list.filter(item => item.id !== id);
      localStorage.setItem('orka_projects', JSON.stringify(list));
      return true;
    }
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) console.error('Erro ao deletar projeto no Supabase:', error);
    return !error;
  }
};
