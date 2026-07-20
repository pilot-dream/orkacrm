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
const AnotacoesPage = lazy(() => import('../../pages/Anotacoes/AnotacoesPage'));
const ConfiguracoesPage = lazy(() => import('../../pages/Configuracoes/ConfiguracoesPage'));
const LoginPage = lazy(() => import('../../pages/Login/LoginPage'));

// Skeleton Components
import { DashboardSkeleton } from '../../widgets/skeletons/DashboardSkeleton';
import { KanbanSkeleton } from '../../widgets/skeletons/KanbanSkeleton';
import { TableSkeleton } from '../../widgets/skeletons/TableSkeleton';
import { SettingsSkeleton } from '../../widgets/skeletons/SettingsSkeleton';
import { TarefasSkeleton } from '../../widgets/skeletons/TarefasSkeleton';

// Simple fallback for Login and root layout if needed
const SimpleLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-primary)' }}>
    <div className="animate-pulse" style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-primary)', borderRadius: '50%' }}></div>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Route */}
      <Route path="/login" element={<Suspense fallback={<SimpleLoader />}><LoginPage /></Suspense>} />

      {/* Protected Routes Layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={
          <Suspense fallback={<DashboardSkeleton />}><DashboardPage /></Suspense>
        } />
        
        <Route path="leads" element={
          <Suspense fallback={<KanbanSkeleton />}><LeadsPage /></Suspense>
        } />
        
        <Route path="clientes" element={
          <Suspense fallback={<TableSkeleton />}><ClientesPage /></Suspense>
        } />
        
        <Route path="produtos" element={
          <Suspense fallback={<TableSkeleton />}><ProdutosPage /></Suspense>
        } />
        
        <Route path="projetos" element={
          <Suspense fallback={<KanbanSkeleton />}><ProjetosPage /></Suspense>
        } />
        
        <Route path="tarefas" element={
          <Suspense fallback={<TarefasSkeleton />}><TarefasPage /></Suspense>
        } />
        
        <Route path="financeiro" element={
          <Suspense fallback={<TableSkeleton />}><FinanceiroPage /></Suspense>
        } />
        
        <Route path="anotacoes" element={
          <Suspense fallback={<TableSkeleton />}><AnotacoesPage /></Suspense>
        } />
        
        <Route path="configuracoes" element={
          <Suspense fallback={<SettingsSkeleton />}><ConfiguracoesPage /></Suspense>
        } />
        
        {/* Catch-all redirects to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
