export type ProjectStage = 'escopo' | 'fila' | 'desenvolvimento' | 'homologacao' | 'concluido';

export interface ProjectChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ProjectComment {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  stage: ProjectStage;
  deadline?: string;
  priority: 'baixa' | 'media' | 'alta';
  progress: number;
  team?: string[]; // Member names or IDs
  checklist?: ProjectChecklistItem[];
  comments?: ProjectComment[];
  files?: ProjectFile[];
  aiSummary?: string;
  createdAt?: string;
  tenant_id?: string;
}
