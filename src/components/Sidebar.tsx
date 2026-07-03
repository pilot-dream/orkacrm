import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Workflow, 
  BrainCircuit, 
  TrendingUp, 
  Plus,
  LogOut,
  UserCheck,
  Briefcase,
  CheckSquare,
  DollarSign,
  Bot,
  Settings
} from 'lucide-react';
import type { Profile } from '../lib/supabaseService';
import orkaLogo from '../assets/orka_logo.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewLeadClick: () => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  userProfile?: Profile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onNewLeadClick,
  onLogout,
  isOpen,
  onClose,
  userProfile
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: UserCheck },
    { id: 'projects', label: 'Projetos', icon: Briefcase },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'pipeline', label: 'Pipeline de Vendas', icon: TrendingUp },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'automations', label: 'Automações & Logs', icon: Workflow },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'agents', label: 'Agentes IA', icon: Bot },
    { id: 'ai-hub', label: 'AI Hub', icon: BrainCircuit },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const profileName = userProfile?.name || 'Orka Admin';
  const profileRole = userProfile?.role || 'Sócio Fundador';
  const profileAvatar = userProfile?.avatar || '';
  const initials = profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src={orkaLogo} 
          alt="Orka CRM" 
          style={{ 
            height: '28px', 
            width: 'auto',
            objectFit: 'contain'
          }} 
        />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose?.();
              }}
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div style={{ marginTop: '24px', padding: '0 4px' }}>
          <button 
            className="primary-btn" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              onNewLeadClick();
              onClose?.();
            }}
          >
            <Plus size={16} />
            <span>Novo Lead</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {profileAvatar ? (
              <img 
                src={profileAvatar} 
                alt={profileName}
                style={{ 
                  width: '34px', 
                  height: '34px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '2px solid var(--border-color)'
                }} 
              />
            ) : (
              <div className="user-avatar">
                {initials}
              </div>
            )}
            <div className="user-info">
              <span className="user-name">{profileName}</span>
              <span className="user-role">{profileRole}</span>
            </div>
          </div>
          <button 
            className="icon-btn" 
            style={{ width: '28px', height: '28px', border: 'none', color: 'var(--text-secondary)' }}
            onClick={() => {
              onLogout();
              onClose?.();
            }}
            title="Sair do Sistema"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
