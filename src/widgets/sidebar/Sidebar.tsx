import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Plus,
  LogOut,
  UserCheck,
  Briefcase,
  CheckSquare,
  DollarSign,
  Settings
} from 'lucide-react';
import orkaLogo from '../../assets/orka_logo.png';
import { useAuthStore } from '../../entities/usuario/model/store';

interface SidebarProps {
  onNewLeadClick?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onNewLeadClick = () => {},
  isOpen = false,
  onClose = () => {}
}) => {
  const navigate = useNavigate();
  const userProfile = useAuthStore((state) => state.userProfile);
  const logout = useAuthStore((state) => state.logout);

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'leads', label: 'Leads', icon: UserCheck, path: '/leads' },
    { id: 'projects', label: 'Projetos', icon: Briefcase, path: '/projetos' },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, path: '/tarefas' },
    { id: 'financial', label: 'Financeiro', icon: DollarSign, path: '/financeiro' },
    { id: 'customers', label: 'Clientes', icon: Users, path: '/clientes' },
    { id: 'products', label: 'Produtos', icon: Settings, path: '/produtos' }, // Settings icons for product config
    { id: 'settings', label: 'Configurações', icon: Settings, path: '/configuracoes' },
  ];

  const profileName = userProfile?.name || 'Orka Admin';
  const profileRole = userProfile?.role || 'Sócio Fundador';
  const profileAvatar = userProfile?.avatar || '';
  const initials = profileName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
    onClose();
  };

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
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div style={{ marginTop: '24px', padding: '0 4px' }}>
          <button 
            className="primary-btn" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              onNewLeadClick();
              onClose();
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
            style={{ width: '28px', height: '28px', border: 'none', color: 'var(--text-secondary)', background: 'none', cursor: 'pointer' }}
            onClick={handleLogoutClick}
            title="Sair do Sistema"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
