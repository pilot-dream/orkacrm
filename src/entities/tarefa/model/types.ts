export type TaskStatus = 'pendente' | 'em_progresso' | 'revisao' | 'concluida';

export type TaskType =
  | 'reuniao'
  | 'ligacao'
  | 'followup'
  | 'desenvolvimento'
  | 'implantacao'
  | 'suporte'
  | 'financeiro'
  | 'comercial'
  | 'outro';

export type TaskReminder =
  | 'no_horario'
  | '5_min'
  | '10_min'
  | '15_min'
  | '30_min'
  | '1_hora'
  | '2_horas'
  | '1_dia'
  | 'sem_lembrete';

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  reuniao: 'Reunião',
  ligacao: 'Ligação',
  followup: 'Follow-up',
  desenvolvimento: 'Desenvolvimento',
  implantacao: 'Implantação',
  suporte: 'Suporte',
  financeiro: 'Financeiro',
  comercial: 'Comercial',
  outro: 'Outro',
};

export const TASK_REMINDER_LABELS: Record<TaskReminder, string> = {
  no_horario: 'No horário da tarefa',
  '5_min': '5 minutos antes',
  '10_min': '10 minutos antes',
  '15_min': '15 minutos antes',
  '30_min': '30 minutos antes',
  '1_hora': '1 hora antes',
  '2_horas': '2 horas antes',
  '1_dia': '1 dia antes',
  sem_lembrete: 'Sem lembrete',
};

export const TASK_TYPE_ICONS: Record<TaskType, string> = {
  reuniao: '📅',
  ligacao: '📞',
  followup: '🔄',
  desenvolvimento: '💻',
  implantacao: '🚀',
  suporte: '🛠️',
  financeiro: '💰',
  comercial: '🤝',
  outro: '📌',
};

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskComment {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  assignees?: string[];
  priority: 'baixa' | 'media' | 'alta';
  status: TaskStatus;
  deadline?: string;
  // New fields
  time?: string;             // ex: "14:30"
  taskType?: TaskType;       // ex: 'reuniao'
  reminder?: TaskReminder;   // ex: '30_min'
  locationLink?: string;     // ex: "https://meet.google.com/..." or "Av. Paulista, 100"
  // Notification architecture (FUTURE_WORKER)
  notificationSent?: boolean;
  // Existing fields
  checklist?: TaskChecklistItem[];
  comments?: TaskComment[];
  attachments?: any[];
  createdAt?: string;
  tenant_id?: string;
}
