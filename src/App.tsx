import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes/AppRoutes';
import { useInitializeAuth } from './entities/usuario/hooks/useInitializeAuth';
import { useAuthStore } from './entities/usuario/model/store';
import './index.css';

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
  
  if (!isInitialized) return <SplashLoader />;
  
  return <AppRoutes />;
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
