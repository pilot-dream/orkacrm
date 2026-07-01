import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

// Lazy loading components
const DashboardPage = lazy(() => import('../../pages/Dashboard/DashboardPage'));
const LeadsPage = lazy(() => import('../../pages/Leads/LeadsPage'));
const ClientesPage = lazy(() => import('../../pages/Clientes/ClientesPage'));
const ProdutosPage = lazy(() => import('../../pages/Produtos/ProdutosPage'));
const ProjetosPage = lazy(() => import('../../pages/Projetos/ProjetosPage'));
const TarefasPage = lazy(() => import('../../pages/Tarefas/TarefasPage'));
const FinanceiroPage = lazy(() => import('../../pages/Financeiro/FinanceiroPage'));
const ConfiguracoesPage = lazy(() => import('../../pages/Configuracoes/ConfiguracoesPage'));
const LoginPage = lazy(() => import('../../pages/Login/LoginPage'));

// Simple loading indicator
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--color-primary)' }}>
    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(45, 140, 255, 0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="produtos" element={<ProdutosPage />} />
          <Route path="projetos" element={<ProjetosPage />} />
          <Route path="tarefas" element={<TarefasPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          
          {/* Catch-all redirects to Dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
