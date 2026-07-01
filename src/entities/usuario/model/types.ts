export interface Profile {
  email: string;
  name: string;
  role: 'Admin' | 'Comercial' | 'Financeiro' | 'Gestor' | 'Desenvolvedor' | 'Gerente' | 'Vendedor' | 'Analista';
  avatar?: string;
  details?: string;
  tenant_id?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Comercial' | 'Financeiro' | 'Gestor' | 'Desenvolvedor' | 'Gerente' | 'Vendedor' | 'Analista';
  status: 'Ativo' | 'Convidado' | 'Suspenso';
  tenant_id?: string;
}

export interface Notification {
  id: string;
  userEmail: string;
  text: string;
  time: string;
  read: boolean;
}
