import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './app/routes/AppRoutes';
import { useInitializeAuth } from './entities/usuario/hooks/useInitializeAuth';
import './index.css';

function AppContent() {
  useInitializeAuth();
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
