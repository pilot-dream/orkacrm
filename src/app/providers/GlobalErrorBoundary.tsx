import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isChunkLoadError = this.state.error?.name === 'ChunkLoadError' || this.state.error?.message?.includes('Failed to fetch dynamically imported module');
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', backgroundColor: 'var(--bg-app, #0f172a)', color: '#fff', textAlign: 'center' }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>
            {isChunkLoadError ? 'Atualização Disponível' : 'Ops! Algo deu errado.'}
          </h1>
          <p style={{ maxWidth: '600px', color: '#94a3b8', marginBottom: '24px' }}>
            {isChunkLoadError 
              ? 'Lançamos uma nova versão do sistema. Por favor, recarregue a página para continuar.'
              : this.state.error?.message?.toString()}
          </p>
          <button 
            onClick={async () => {
              try {
                // Unregister all service workers
                if ('serviceWorker' in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  for (const registration of registrations) {
                    await registration.unregister();
                  }
                }
                // Clear all cache storage
                if ('caches' in window) {
                  const keys = await caches.keys();
                  for (const key of keys) {
                    await caches.delete(key);
                  }
                }
              } catch (e) {
                console.error('Erro ao limpar cache/service worker:', e);
              }
              
              // Force reload bypassing browser cache with a timestamp
              const url = new URL(window.location.href);
              url.searchParams.set('reload', Date.now().toString());
              window.location.href = url.toString();
            }}
            style={{ padding: '12px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
