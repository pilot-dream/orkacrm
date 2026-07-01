export type TaskStatus = 'pendente' | 'em_progresso' | 'revisao' | 'concluida';

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
  projectId?: string; // Associated project id
  projectName?: string; // Display purposes
  assignee?: string; // Assigned user name/email
  priority: 'baixa' | 'media' | 'alta';
  status: TaskStatus;
  checklist?: TaskChecklistItem[];
  comments?: TaskComment[];
  attachments?: any[];
  deadline?: string;
  createdAt?: string;
  tenant_id?: string;
}
