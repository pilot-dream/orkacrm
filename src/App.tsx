import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes/AppRoutes';
import { useInitializeAuth } from './entities/usuario/hooks/useInitializeAuth';
import { useAuthStore } from './entities/usuario/model/store';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './shared/api/queryClient';
import './index.css';

import { useEffect } from 'react';

const SplashLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-app)' }}>
    <div className="animate-pulse" style={{ width: '60px', height: '60px', backgroundColor: 'var(--color-primary)', borderRadius: '12px', marginBottom: '24px' }}></div>
    <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem' }}>ORKA CRM</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>Carregando sessão...</p>
  </div>
);

function AppContent() {
  useInitializeAuth();
  const isInitialized = useAuthStore(state => state.isInitialized);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('orka_theme');
    if (savedTheme === 'orka') {
      document.documentElement.classList.add('theme-orka');
    } else if (savedTheme === 'light') {
      document.documentElement.style.setProperty('--bg-main', '#F3F4F6');
      document.documentElement.style.setProperty('--bg-sidebar', '#FFFFFF');
      document.documentElement.style.setProperty('--bg-card', '#FFFFFF');
      document.documentElement.style.setProperty('--bg-card-hover', '#F9FAFB');
      document.documentElement.style.setProperty('--text-main', '#111827');
      document.documentElement.style.setProperty('--text-secondary', '#4B5563');
      document.documentElement.style.setProperty('--text-muted', '#9CA3AF');
      document.documentElement.style.setProperty('--border-color', '#E5E7EB');
    }
  }, []);

  if (!isInitialized) return <SplashLoader />;
  
  return <AppRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
