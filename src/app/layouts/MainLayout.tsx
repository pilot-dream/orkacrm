import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Sidebar } from '../../widgets/sidebar/Sidebar';
import { useAuthStore } from '../../entities/usuario/model/store';
import { useTaskStore } from '../../entities/tarefa/model/store';
import { useProjectStore } from '../../entities/projeto/model/store';
import { checkOverdueItems } from '../../entities/usuario/api/notificationHelper';
import { PushConsentBanner } from '../../widgets/notifications/components/PushConsentBanner';
import { PwaInstallBanner } from '../../widgets/pwa/components/PwaInstallBanner';
import { supabaseNotifications } from '../../lib/supabaseService';

export const MainLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMobileNotifs, setShowMobileNotifs] = useState(false);
  const navigate = useNavigate();
  
  const userProfile = useAuthStore((state) => state.userProfile);
  const notifications = useAuthStore((state) => state.notifications);
  const markNotificationAsRead = useAuthStore((state) => state.markNotificationAsRead);
  const markAllNotificationsAsRead = useAuthStore((state) => state.markAllNotificationsAsRead);
  const clearNotifications = useAuthStore((state) => state.clearNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    markNotificationAsRead(id);
    if (userProfile?.email) {
      await supabaseNotifications.markAsRead(id);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllNotificationsAsRead();
    if (userProfile?.email) {
      await supabaseNotifications.markAllAsRead(userProfile.email);
    }
  };

  const handleClearNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotifications();
    if (userProfile?.email) {
      await supabaseNotifications.deleteAll(userProfile.email);
    }
  };

  // Sidebar hover & pin states
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-pinned');
    return saved !== 'false'; // default is pinned/expanded (true)
  });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isExpanded = isPinned || isHovered;

  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useProjectStore((state) => state.projects);

  // Track layout transition for smooth grid resize
  const [isLayoutTransitioning, setIsLayoutTransitioning] = useState(false);
  const prevExpanded = useRef(isExpanded);

  useEffect(() => {
    if (prevExpanded.current !== isExpanded) {
      setIsLayoutTransitioning(true);
      const timer = setTimeout(() => setIsLayoutTransitioning(false), 350);
      prevExpanded.current = isExpanded;
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
      fetchProjects();
    }
  }, [isAuthenticated, fetchTasks, fetchProjects]);

  useEffect(() => {
    if (isAuthenticated && tasks.length > 0 && projects.length > 0) {
      checkOverdueItems();
    }
  }, [isAuthenticated, tasks, projects]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024 && isPinned) {
        setIsPinned(false);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPinned]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`app-container ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'} ${isLayoutTransitioning ? 'layout-transitioning' : ''}`}>
      {/* Mobile Header Bar */}
      <div className="mobile-header-bar">
        <button 
          className="icon-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
          style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div style={{ flexGrow: 1 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => setShowMobileNotifs(!showMobileNotifs)}
            style={{ position: 'relative', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--color-danger)', color: '#fff', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
            
            {showMobileNotifs && (
              <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '30px', right: '-10px', width: '280px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-premium)', zIndex: 100, textAlign: 'left' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                  Notificações
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {notifications.map(notif => (
                    <div key={notif.id} onClick={() => handleMarkAsRead(notif.id)} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', opacity: notif.read ? 0.6 : 1, background: notif.read ? 'transparent' : 'rgba(45,140,255,0.05)' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#fff' }}>{notif.text}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nenhuma notificação nova.</div>}
                </div>
                {notifications.length > 0 && (
                  <div onClick={(e) => e.stopPropagation()} style={{ padding: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '8px' }}>
                    <button onClick={handleMarkAllAsRead} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '4px', cursor: 'pointer' }}>
                      Marcar Lidas
                    </button>
                    <button onClick={handleClearNotifications} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '4px', cursor: 'pointer' }}>
                      Limpar Todas
                    </button>
                  </div>
                )}
              </div>
            )}
          </button>
          
          {userProfile && (
            <button 
              onClick={() => navigate('/configuracoes')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" loading="lazy" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Backdrop overlay for mobile menu */}
      <div 
        className={`mobile-menu-backdrop ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <Sidebar 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNewLeadClick={() => setIsModalOpen(true)}
        isExpanded={isExpanded}
        isPinned={isPinned}
        onPinToggle={() => {
          const next = !isPinned;
          setIsPinned(next);
          localStorage.setItem('sidebar-pinned', String(next));
        }}
        onHoverChange={(hovering) => setIsHovered(hovering)}
      />

      {/* Invisible Left-Edge Trigger Boundary for Auto-Reveal */}
      <div 
        className="edge-trigger-zone"
        onMouseEnter={() => setIsHovered(true)}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '18px',
          zIndex: 99,
          pointerEvents: isExpanded ? 'none' : 'auto'
        }}
      />

      <div className="main-canvas">
        <main className="will-change-transform transform-gpu" style={{ flexGrow: 1, backgroundColor: 'var(--bg-main)', position: 'relative' }}>
          <Outlet />
        </main>
      </div>

      {/* Modal / Overlay for New Lead (Fase 2 will build this inside Leads entity / feature) */}
      {isModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', padding: '24px 0', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Cadastrar Novo Lead</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              O formulário de criação de leads será integrado com o Kanban comercial na Fase 2.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button className="outline-btn" onClick={() => setIsModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PWA Push Notification Consent Banner */}
      <PushConsentBanner />
      
      {/* PWA App Install Banner for Mobile Browsers */}
      <PwaInstallBanner />
    </div>
  );
};
