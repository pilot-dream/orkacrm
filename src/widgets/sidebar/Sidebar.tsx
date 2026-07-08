import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  UserCheck,
  Briefcase,
  CheckSquare,
  DollarSign,
  Settings,
  Pin,
  Package
} from 'lucide-react';
import orkaLogo from '../../assets/orka_logo.png';
import orkaLogoIcon from '../../assets/orka_logo_icon.png';
import { useAuthStore } from '../../entities/usuario/model/store';

interface SidebarProps {
  onNewLeadClick?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isExpanded: boolean;
  isPinned: boolean;
  onPinToggle: () => void;
  onHoverChange: (hovering: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = false,
  onClose = () => {},
  isExpanded,
  isPinned,
  onPinToggle,
  onHoverChange
}) => {
  const effectiveExpanded = isOpen || isExpanded;

  const navigate = useNavigate();
  const userProfile = useAuthStore((state) => state.userProfile);
  const logout = useAuthStore((state) => state.logout);

  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'leads', label: 'Leads', icon: UserCheck, path: '/leads' },
    { id: 'customers', label: 'Clientes', icon: Users, path: '/clientes' },
    { id: 'products', label: 'Produtos', icon: Package, path: '/produtos' },
    { id: 'projects', label: 'Projetos', icon: Briefcase, path: '/projetos' },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, path: '/tarefas' },
    { id: 'financial', label: 'Financeiro', icon: DollarSign, path: '/financeiro' },
    { id: 'settings', label: 'Configurações', icon: Settings, path: '/configuracoes' },
  ];

  const prefetchModule = (moduleId: string) => {
    switch (moduleId) {
      case 'dashboard': import('../../pages/Dashboard/DashboardPage'); break;
      case 'leads': import('../../pages/Leads/LeadsPage'); break;
      case 'customers': import('../../pages/Clientes/ClientesPage'); break;
      case 'products': import('../../pages/Produtos/ProdutosPage'); break;
      case 'projects': import('../../pages/Projetos/ProjetosPage'); break;
      case 'tasks': import('../../pages/Tarefas/TarefasPage'); break;
      case 'financial': import('../../pages/Financeiro/FinanceiroPage'); break;
      case 'settings': import('../../pages/Configuracoes/ConfiguracoesPage'); break;
    }
  };

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
    <aside 
      className={`sidebar ${isOpen ? 'open' : ''} ${effectiveExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="sidebar-header" style={{ padding: '0 14px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: effectiveExpanded ? 'space-between' : 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        {effectiveExpanded ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src={orkaLogo} 
              alt="Orka CRM" 
              style={{ 
                height: '24px', 
                width: 'auto',
                objectFit: 'contain'
              }} 
            />
          </div>
        ) : (
          <img 
            src={orkaLogoIcon} 
            alt="Orka CRM Icon" 
            style={{ 
              height: '32px', 
              width: 'auto',
              objectFit: 'contain'
            }} 
          />
        )}
        {effectiveExpanded && (
          <button
            type="button"
            className="hide-on-mobile"
            onClick={onPinToggle}
            style={{
              background: 'none',
              border: 'none',
              color: isPinned ? 'var(--color-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              opacity: isPinned ? 1 : 0.6,
              transition: 'opacity 0.2s, color 0.2s'
            }}
            title={isPinned ? "Desafixar Sidebar" : "Fixar Sidebar"}
          >
            <Pin size={14} style={{ transform: isPinned ? 'rotate(0deg)' : 'rotate(-45deg)' }} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav" style={{ padding: '0 4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onMouseEnter={() => prefetchModule(item.id)}
                onClick={() => onClose()}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title={!effectiveExpanded ? item.label : undefined}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                <div className="nav-link-text-wrapper">
                  <span className="nav-link-text">{item.label}</span>
                </div>
                {!effectiveExpanded && (
                  <span className="sidebar-tooltip">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="sidebar-footer" style={{ padding: '16px 0 0 0', borderTop: '1px solid var(--border-color)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <NavLink 
          to="/configuracoes" 
          onClick={() => onClose()}
          onMouseEnter={() => prefetchModule('settings')}
          className="nav-link" 
          style={{ padding: '10px 12px' }}
          title={!effectiveExpanded ? "Meu Perfil" : undefined}
        >
          <div style={{ position: 'relative', flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%', overflow: 'hidden', marginLeft: '-3px' }}>
            {profileAvatar ? (
              <img src={profileAvatar} alt={profileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-primary-dark)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {initials}
              </div>
            )}
          </div>
          <div className="nav-link-text-wrapper">
            <div className="nav-link-text" style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{profileName}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{profileRole}</span>
            </div>
          </div>
          {!effectiveExpanded && <span className="sidebar-tooltip">Meu Perfil</span>}
        </NavLink>
        
        <button 
          className="nav-link" 
          onClick={handleLogoutClick}
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', padding: '10px 12px' }}
        >
          <LogOut size={18} style={{ flexShrink: 0 }} />
          <div className="nav-link-text-wrapper">
            <span className="nav-link-text">Sair da Conta</span>
          </div>
          {!effectiveExpanded && <span className="sidebar-tooltip">Sair da Conta</span>}
        </button>
      </div>
    </aside>
  );
};
