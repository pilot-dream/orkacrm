import React, { useState, useEffect } from 'react';
import { Bell, Share, PlusSquare, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuthStore } from '../../../entities/usuario/model/store';

// Função utilitária para converter chave VAPID base64 para Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const PushConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const userEmail = useAuthStore((state) => state.userEmail);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !userEmail) {
      setIsVisible(false);
      return;
    }

    // 1. Verificar suporte a Service Workers e Push
    const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    if (!isPushSupported) {
      console.warn('Este navegador não suporta Notificações Push.');
      return;
    }

    // 2. Verificar se já tem permissão
    if (Notification.permission === 'granted') {
      // Já está ativado, não mostra o banner
      setIsVisible(false);
      return;
    }

    if (Notification.permission === 'denied') {
      // Usuário bloqueou, não incomodar com banner
      setIsVisible(false);
      return;
    }

    // 3. Detectar iOS e PWA Standalone
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(ios);

    const standalone = 
      (window.navigator as any).standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Exibir banner após 3 segundos para não ser intrusivo
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, userEmail]);

  const handleSubscribe = async () => {
    // Caso especial: iOS mas ainda não está rodando como PWA (standalone)
    if (isIos && !isStandalone) {
      setShowIosGuide(true);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // 1. Pedir permissão nativa
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão de notificação negada pelo usuário.');
      }

      // 2. Obter registro do Service Worker
      const registration = await navigator.serviceWorker.ready;
      
      // 3. Pegar chave VAPID pública das variáveis de ambiente
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('Chave VAPID pública não configurada no cliente. Adicione VITE_VAPID_PUBLIC_KEY no seu .env');
      }

      // 4. Registrar inscrição no Push Manager do navegador
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // 5. Enviar subscrição para o Supabase
      const subscriptionJson = subscription.toJSON();
      
      if (!subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) {
        throw new Error('Erro ao gerar dados de chaves do navegador.');
      }

      const deviceInfo = `${navigator.userAgent} (${isStandalone ? 'PWA' : 'Navegador'})`;

      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_email: userEmail,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth,
          device_info: deviceInfo
        },
        { onConflict: 'endpoint' }
      );

      if (error) throw error;

      setStatus('success');
      // Ocultar banner após 3 segundos
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);

    } catch (err: any) {
      console.error('Erro na inscrição do push:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Falha ao ativar notificações.');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#fff',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Botão de Fechar */}
      <button 
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '50%',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <X size={16} />
      </button>

      {!showIosGuide ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={20} className="animate-pulse" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Ativar Notificações</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                Fique sabendo no celular ou computador sempre que tarefas forem atribuídas a você.
              </p>
            </div>
          </div>

          {status === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '8px 12px', borderRadius: '8px', color: '#22c55e', fontSize: '0.75rem' }}>
              <Check size={14} />
              <span>Notificações ativadas com sucesso!</span>
            </div>
          )}

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '8px 12px', borderRadius: '8px', color: '#ef4444', fontSize: '0.75rem' }}>
              <AlertCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {status !== 'success' && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button 
                onClick={handleSubscribe}
                disabled={status === 'loading'}
                style={{
                  flex: 1,
                  background: 'var(--color-primary, #3b82f6)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s'
                }}
              >
                {status === 'loading' ? 'Ativando...' : 'Ativar Alertas'}
              </button>
              <button 
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
              >
                Agora não
              </button>
            </div>
          )}
        </div>
      ) : (
        // Guia de Instalação iOS
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <PlusSquare size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Instale no seu iPhone</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                No iOS, notificações push necessitam que o app esteja adicionado à sua tela de início.
              </p>
            </div>
          </div>

          <div 
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              padding: '12px', 
              borderRadius: '8px',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700 }}>1</span>
              <span>Toque no botão de **Compartilhar** do Safari <Share size={12} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle' }} /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700 }}>2</span>
              <span>Role para baixo e selecione **Adicionar à Tela de Início** <PlusSquare size={12} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle' }} /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700 }}>3</span>
              <span>Abra o app pela Tela de Início para ativar as notificações!</span>
            </div>
          </div>

          <button 
            onClick={() => setShowIosGuide(false)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
};
