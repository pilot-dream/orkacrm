import { supabase, isSupabaseActive } from './supabaseClient';
import type { Lead } from '../components/PipelineView';
import type { Receita, Despesa, Proposal, Contract, Payment } from '../components/FinancialView';
import type { Agent } from '../components/AgentsView';
import type { AutomationFlow, WebhookRegistry } from '../components/AutomationsView';
import type { Customer } from '../components/CustomersView';
import type { TeamMember } from '../components/SettingsView';
import { useAuthStore } from '../entities/usuario/model/store';

export interface Profile {
  email: string;
  name: string;
  role: string;
  avatar: string;
  details: string;
}

export interface Notification {
  id: string;
  userEmail: string;
  text: string;
  time: string;
  read: boolean;
}
import type { Project } from '../components/ProjectsView';
import type { Task } from '../components/TasksView';

// ====================================================================
// LEADS DATA MAPPER & CRUD
// ====================================================================
export const mapLeadFromDb = (db: any): Lead => ({
  id: db.id,
  company: db.company,
  contactName: db.contact_name,
  value: Number(db.value),
  stage: db.stage,
  aiScore: db.ai_score,
  aiInsights: db.ai_insights,
  dateAdded: db.date_added,
  email: db.email,
  needs: db.needs,
  phone: db.phone,
  whatsapp: db.whatsapp,
  source: db.source,
  owner: db.owner,
  observations: db.observations || [],
  history: db.history || [],
  timeline: db.timeline || []
});

export const mapLeadToDb = (lead: Lead) => ({
  id: lead.id,
  company: lead.company,
  contact_name: lead.contactName,
  value: lead.value,
  stage: lead.stage,
  ai_score: lead.aiScore,
  ai_insights: lead.aiInsights,
  date_added: lead.dateAdded,
  email: lead.email,
  needs: lead.needs,
  phone: lead.phone,
  whatsapp: lead.whatsapp,
  source: lead.source,
  owner: lead.owner,
  observations: lead.observations,
  history: lead.history,
  timeline: lead.timeline
});

export const supabaseLeads = {
  fetch: async (): Promise<Lead[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar leads no Supabase:', error);
      return [];
    }
    return (data || []).map(mapLeadFromDb);
  },
  insert: async (lead: Lead): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('leads').insert([mapLeadToDb(lead)]);
    if (error) console.error('Erro ao inserir lead no Supabase:', error);
    return !error;
  },
  update: async (lead: Lead): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('leads').update(mapLeadToDb(lead)).eq('id', lead.id);
    if (error) console.error('Erro ao atualizar lead no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) console.error('Erro ao deletar lead no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// FINANCIAL DATA CRUD
// ====================================================================
export const mapReceitaFromDb = (db: any): Receita => ({
  id: db.id,
  description: db.description,
  value: Number(db.value),
  dueDate: db.due_date,
  receivedDate: db.payment_date,
  category: db.category,
  status: db.status,
  client: db.party
});

export const mapDespesaFromDb = (db: any): Despesa => ({
  id: db.id,
  description: db.description,
  value: Number(db.value),
  dueDate: db.due_date,
  paymentDate: db.payment_date,
  category: db.category,
  status: db.status,
  supplier: db.party
});

export const supabaseTransactions = {
  fetchIncomes: async (): Promise<Receita[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('transactions').select('*').eq('type', 'income').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar receitas no Supabase:', error);
      return [];
    }
    return (data || []).map(mapReceitaFromDb);
  },
  fetchExpenses: async (): Promise<Despesa[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('transactions').select('*').eq('type', 'expense').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar despesas no Supabase:', error);
      return [];
    }
    return (data || []).map(mapDespesaFromDb);
  },
  insertIncome: async (inc: Receita): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('transactions').insert([{
      id: inc.id,
      type: 'income',
      description: inc.description,
      value: inc.value,
      due_date: inc.dueDate,
      payment_date: inc.receivedDate,
      category: inc.category,
      status: inc.status,
      party: inc.client
    }]);
    return !error;
  },
  insertExpense: async (exp: Despesa): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('transactions').insert([{
      id: exp.id,
      type: 'expense',
      description: exp.description,
      value: exp.value,
      due_date: exp.dueDate,
      payment_date: exp.paymentDate,
      category: exp.category,
      status: exp.status,
      party: exp.supplier
    }]);
    return !error;
  },
  updateIncome: async (inc: Receita): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('transactions').update({
      description: inc.description,
      value: inc.value,
      due_date: inc.dueDate,
      payment_date: inc.receivedDate,
      category: inc.category,
      status: inc.status,
      party: inc.client
    }).eq('id', inc.id);
    return !error;
  },
  updateExpense: async (exp: Despesa): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('transactions').update({
      description: exp.description,
      value: exp.value,
      due_date: exp.dueDate,
      payment_date: exp.paymentDate,
      category: exp.category,
      status: exp.status,
      party: exp.supplier
    }).eq('id', exp.id);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    return !error;
  }
};

// ====================================================================
// AGENTS DATA CRUD
// ====================================================================
export const mapAgentFromDb = (db: any): Agent => ({
  id: db.id,
  name: db.name,
  objective: db.objective,
  model: db.model,
  status: db.status,
  lastRun: db.last_run || '-',
  tokensUsed: Number(db.tokens_used),
  cost: Number(db.cost),
  category: db.category
});

export const mapAgentToDb = (a: Agent) => ({
  id: a.id,
  name: a.name,
  objective: a.objective,
  model: a.model,
  status: a.status,
  last_run: a.lastRun,
  tokens_used: a.tokensUsed,
  cost: a.cost,
  category: a.category
});

export const supabaseAgents = {
  fetch: async (): Promise<Agent[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar agentes:', error);
      return [];
    }
    return (data || []).map(mapAgentFromDb);
  },
  insert: async (a: Agent): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('agents').insert([mapAgentToDb(a)]);
    return !error;
  },
  update: async (a: Agent): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('agents').update(mapAgentToDb(a)).eq('id', a.id);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('agents').delete().eq('id', id);
    return !error;
  }
};

// ====================================================================
// AUTOMATIONS & WEBHOOKS CRUD
// ====================================================================
export const mapFlowFromDb = (db: any): AutomationFlow => ({
  id: db.id,
  name: db.name,
  trigger: db.trigger,
  action: db.action,
  runs: Number(db.runs),
  errorRate: Number(db.error_rate),
  active: db.active,
  nodes: db.nodes || []
});

export const mapFlowToDb = (f: AutomationFlow) => ({
  id: f.id,
  name: f.name,
  trigger: f.trigger,
  action: f.action,
  runs: f.runs,
  error_rate: f.errorRate,
  active: f.active,
  nodes: f.nodes
});

export const supabaseAutomations = {
  fetchFlows: async (): Promise<AutomationFlow[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('automations').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar fluxos:', error);
      return [];
    }
    return (data || []).map(mapFlowFromDb);
  },
  insertFlow: async (f: AutomationFlow): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('automations').insert([mapFlowToDb(f)]);
    return !error;
  },
  updateFlow: async (f: AutomationFlow): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('automations').update(mapFlowToDb(f)).eq('id', f.id);
    return !error;
  },
  deleteFlow: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('automations').delete().eq('id', id);
    return !error;
  },
  
  // Webhooks
  fetchWebhooks: async (): Promise<WebhookRegistry[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('webhooks').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar webhooks:', error);
      return [];
    }
    return (data || []).map(wh => ({
      id: wh.id,
      name: wh.name,
      url: wh.url,
      method: wh.method,
      associatedFlow: wh.associated_flow,
      status: wh.status,
      latency: wh.latency
    }));
  },
  insertWebhook: async (wh: WebhookRegistry): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('webhooks').insert([{
      id: wh.id,
      name: wh.name,
      url: wh.url,
      method: wh.method,
      associated_flow: wh.associatedFlow,
      status: wh.status,
      latency: wh.latency
    }]);
    return !error;
  },
  updateWebhook: async (wh: WebhookRegistry): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('webhooks').update({
      name: wh.name,
      url: wh.url,
      method: wh.method,
      associated_flow: wh.associatedFlow,
      status: wh.status,
      latency: wh.latency
    }).eq('id', wh.id);
    return !error;
  },
  deleteWebhook: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('webhooks').delete().eq('id', id);
    return !error;
  }
};

// ====================================================================
// CUSTOMERS DATA CRUD
// ====================================================================
export const mapCustomerFromDb = (db: any): Customer => ({
  id: db.id,
  name: db.name,
  abbr: db.abbr || db.name.substring(0, 2).toUpperCase(),
  plan: db.plan || 'ORKA Pro AI',
  automationsCount: Number(db.automations_count || 0),
  monthlySpend: Number(db.monthly_spend || 0),
  status: (db.status || 'active') as any,
  startDate: db.start_date || '',
  poc: db.poc || '',
  projects: [],
  financial: [],
  files: [],
  contracts: [],
  conversations: [],
  aiPanel: {
    summary: 'Cliente ativo sincronizado do banco de dados.',
    interactions: ['Sincronizado.'],
    nextAction: 'Revisar status e fluxos operacionais.',
    churnRisk: 15,
    opportunities: []
  },
  timelineEvents: []
});

export const mapCustomerToDb = (c: Customer) => ({
  id: c.id,
  name: c.name,
  abbr: c.abbr,
  plan: c.plan,
  automations_count: c.automationsCount,
  monthly_spend: c.monthlySpend,
  status: c.status,
  start_date: c.startDate,
  poc: c.poc
});

export const supabaseCustomers = {
  fetch: async (): Promise<Customer[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar clientes no Supabase:', error);
      return [];
    }
    return (data || []).map(mapCustomerFromDb);
  },
  insert: async (c: Customer): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('customers').insert([mapCustomerToDb(c)]);
    if (error) console.error('Erro ao inserir cliente no Supabase:', error);
    return !error;
  },
  update: async (c: Customer): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('customers').update(mapCustomerToDb(c)).eq('id', c.id);
    if (error) console.error('Erro ao atualizar cliente no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error('Erro ao deletar cliente no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// PROJECTS DATA CRUD
// ====================================================================
export const mapProjectFromDb = (db: any): Project => ({
  id: db.id,
  name: db.name,
  description: db.description || '',
  stage: db.stage || 'planejamento',
  deadline: db.deadline || '',
  priority: db.priority || 'media',
  progress: Number(db.progress || 0),
  team: db.team || [],
  checklist: db.checklist || [],
  comments: db.comments || [],
  files: db.files || [],
  aiSummary: db.ai_summary || ''
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
  ai_summary: p.aiSummary
});

export const supabaseProjects = {
  fetch: async (): Promise<Project[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar projetos no Supabase:', error);
      return [];
    }
    return (data || []).map(mapProjectFromDb);
  },
  insert: async (p: Project): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('projects').insert([mapProjectToDb(p)]);
    if (error) console.error('Erro ao inserir projeto no Supabase:', error);
    return !error;
  },
  update: async (p: Project): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('projects').update(mapProjectToDb(p)).eq('id', p.id);
    if (error) console.error('Erro ao atualizar projeto no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) console.error('Erro ao deletar projeto no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// TASKS DATA CRUD
// ====================================================================
export const mapTaskFromDb = (db: any): Task => ({
  id: db.id,
  title: db.title,
  description: db.description || '',
  status: db.status || 'pendente',
  priority: db.priority || 'media',
  assignee: db.assignee || '',
  deadline: db.deadline || ''
});

export const mapTaskToDb = (t: Task) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  assignee: t.assignee,
  deadline: t.deadline
});

export const supabaseTasks = {
  fetch: async (): Promise<Task[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar tarefas no Supabase:', error);
      return [];
    }
    return (data || []).map(mapTaskFromDb);
  },
  insert: async (t: Task): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('tasks').insert([mapTaskToDb(t)]);
    if (error) console.error('Erro ao inserir tarefa no Supabase:', error);
    return !error;
  },
  update: async (t: Task): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('tasks').update(mapTaskToDb(t)).eq('id', t.id);
    if (error) console.error('Erro ao atualizar tarefa no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error('Erro ao deletar tarefa no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// PROPOSALS DATA CRUD
// ====================================================================
export const mapProposalFromDb = (db: any): Proposal => ({
  id: db.id,
  title: db.title,
  client: db.client,
  value: Number(db.value),
  date: db.date,
  validUntil: db.valid_until,
  status: db.status
});

export const mapProposalToDb = (p: Proposal) => ({
  id: p.id,
  title: p.title,
  client: p.client,
  value: p.value,
  date: p.date,
  valid_until: p.validUntil,
  status: p.status
});

export const supabaseProposals = {
  fetch: async (): Promise<Proposal[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar propostas no Supabase:', error);
      return [];
    }
    return (data || []).map(mapProposalFromDb);
  },
  insert: async (p: Proposal): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('proposals').insert([mapProposalToDb(p)]);
    if (error) console.error('Erro ao inserir proposta no Supabase:', error);
    return !error;
  },
  update: async (p: Proposal): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('proposals').update(mapProposalToDb(p)).eq('id', p.id);
    if (error) console.error('Erro ao atualizar proposta no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('proposals').delete().eq('id', id);
    if (error) console.error('Erro ao deletar proposta no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// CONTRACTS DATA CRUD
// ====================================================================
export const mapContractFromDb = (db: any): Contract => ({
  id: db.id,
  title: db.title,
  client: db.client,
  value: Number(db.value),
  startDate: db.start_date,
  endDate: db.end_date,
  status: db.status
});

export const mapContractToDb = (c: Contract) => ({
  id: c.id,
  title: c.title,
  client: c.client,
  value: c.value,
  start_date: c.startDate,
  end_date: c.endDate,
  status: c.status
});

export const supabaseContracts = {
  fetch: async (): Promise<Contract[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar contratos no Supabase:', error);
      return [];
    }
    return (data || []).map(mapContractFromDb);
  },
  insert: async (c: Contract): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('contracts').insert([mapContractToDb(c)]);
    if (error) console.error('Erro ao inserir contrato no Supabase:', error);
    return !error;
  },
  update: async (c: Contract): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('contracts').update(mapContractToDb(c)).eq('id', c.id);
    if (error) console.error('Erro ao atualizar contrato no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) console.error('Erro ao deletar contrato no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// PAYMENTS DATA CRUD
// ====================================================================
export const mapPaymentFromDb = (db: any): Payment => ({
  id: db.id,
  description: db.description,
  value: Number(db.value),
  dueDate: db.due_date,
  paymentDate: db.payment_date,
  method: db.method,
  status: db.status,
  client: db.client
});

export const mapPaymentToDb = (p: Payment) => ({
  id: p.id,
  description: p.description,
  value: p.value,
  due_date: p.dueDate,
  payment_date: p.paymentDate,
  method: p.method,
  status: p.status,
  client: p.client
});

export const supabasePayments = {
  fetch: async (): Promise<Payment[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar cobranças no Supabase:', error);
      return [];
    }
    return (data || []).map(mapPaymentFromDb);
  },
  insert: async (p: Payment): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('payments').insert([mapPaymentToDb(p)]);
    if (error) console.error('Erro ao inserir cobrança no Supabase:', error);
    return !error;
  },
  update: async (p: Payment): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('payments').update(mapPaymentToDb(p)).eq('id', p.id);
    if (error) console.error('Erro ao atualizar cobrança no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('payments').delete().eq('id', id);
    if (error) console.error('Erro ao deletar cobrança no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// PROFILES DATA CRUD
// ====================================================================
export const mapProfileFromDb = (db: any): Profile => ({
  email: db.email,
  name: db.name,
  role: db.role,
  avatar: db.avatar || '',
  details: db.details || ''
});

export const supabaseProfiles = {
  fetch: async (email: string): Promise<Profile | null> => {
    if (!isSupabaseActive()) return null;
    const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    if (error) {
      console.error('Erro ao buscar perfil no Supabase:', error);
      return null;
    }
    return data ? mapProfileFromDb(data) : null;
  },
  upsert: async (p: Profile): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('profiles').upsert([{
      email: p.email,
      name: p.name,
      role: p.role,
      avatar: p.avatar,
      details: p.details
    }]);
    if (error) console.error('Erro ao salvar perfil no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// TEAM MEMBERS DATA CRUD
// ====================================================================
export const mapTeamMemberFromDb = (db: any): TeamMember => ({
  id: db.id,
  name: db.name,
  email: db.email,
  role: db.role,
  status: db.status
});

export const supabaseTeam = {
  fetch: async (): Promise<TeamMember[]> => {
    if (!isSupabaseActive()) return [];
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    const { data, error } = await supabase.from('team_members').select('*').eq('tenant_id', tenant).order('created_at', { ascending: true });
    if (error) {
      console.error('Erro ao buscar membros do time no Supabase:', error);
      return [];
    }
    return (data || []).map(mapTeamMemberFromDb);
  },
  insert: async (member: TeamMember): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    const { error } = await supabase.from('team_members').insert([{
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      tenant_id: tenant
    }]);
    if (error) console.error('Erro ao inserir membro do time no Supabase:', error);
    return !error;
  },
  update: async (member: TeamMember): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const tenant = useAuthStore.getState().userProfile?.tenant_id || useAuthStore.getState().userEmail.split('@')[1] || 'orka.ai';
    const { error } = await supabase.from('team_members').update({
      name: member.name,
      email: member.email,
      role: member.role,
      status: member.status,
      tenant_id: tenant
    }).eq('id', member.id);
    if (error) console.error('Erro ao atualizar membro do time no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('team_members').delete().eq('id', id);
    if (error) console.error('Erro ao deletar membro do time no Supabase:', error);
    return !error;
  }
};

// ====================================================================
// NOTIFICATIONS DATA CRUD
// ====================================================================
export const mapNotificationFromDb = (db: any): Notification => ({
  id: db.id,
  userEmail: db.user_email,
  text: db.text,
  time: db.time,
  read: db.read
});

export const supabaseNotifications = {
  fetch: async (email: string): Promise<Notification[]> => {
    if (!isSupabaseActive()) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar notificações no Supabase:', error);
      return [];
    }
    return (data || []).map(mapNotificationFromDb);
  },
  insert: async (n: Notification): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('notifications').insert([{
      id: n.id,
      user_email: n.userEmail,
      text: n.text,
      time: n.time,
      read: n.read
    }]);
    if (error) console.error('Erro ao criar notificação no Supabase:', error);
    return !error;
  },
  markAsRead: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) console.error('Erro ao marcar notificação como lida no Supabase:', error);
    return !error;
  },
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseActive()) return false;
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) console.error('Erro ao deletar notificação no Supabase:', error);
    return !error;
  }
};
