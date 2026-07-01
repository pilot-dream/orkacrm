import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../../widgets/sidebar/Sidebar';
import { Navbar } from '../../widgets/navbar/Navbar';
import { useAuthStore } from '../../entities/usuario/model/store';
import { useTaskStore } from '../../entities/tarefa/model/store';
import { useProjectStore } from '../../entities/projeto/model/store';
import { checkOverdueItems } from '../../entities/usuario/api/notificationHelper';

export const MainLayout: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useProjectStore((state) => state.projects);

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
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
        <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '1.5px', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
          ORKA <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: 'rgba(45, 140, 255, 0.15)', border: '1px solid rgba(45, 140, 255, 0.3)' }}>CRM</span>
        </div>
        <div style={{ width: '28px' }}></div>
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
      />

      <div className="main-canvas">
        <Navbar />
        <main style={{ flexGrow: 1, backgroundColor: 'var(--bg-main)' }}>
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
    </div>
  );
};
