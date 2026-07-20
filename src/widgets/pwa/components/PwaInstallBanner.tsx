import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Verificar se já fechou antes (salvo no localStorage)
    const hasDismissed = localStorage.getItem('orka_pwa_dismissed');
    if (hasDismissed) return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent);
    
    setIsIos(ios);

    const standalone = 
      (window.navigator as any).standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches;

    if (isMobile && !standalone) {
      // Exibe banner após 1 segundo para não assustar no primeiro carregamento, mas ser visível rápido
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } else {
      // Android mas sem o evento (talvez firefox ou cache)
      alert("Para instalar, toque no menu do navegador (3 pontinhos) e selecione 'Adicionar à tela inicial' ou 'Instalar aplicativo'.");
    }
  };

  const handleClose = () => {
    localStorage.setItem('orka_pwa_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px', 
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        width: '380px',
        maxWidth: 'calc(100vw - 32px)',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#fff',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
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
      >
        <X size={16} />
      </button>

      {!showIosGuide ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Download size={22} className="animate-bounce" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Baixar App Orka CRM</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.4 }}>
                Instale o aplicativo para uma experiência mais rápida, fluida e com notificações.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button 
              onClick={handleInstall}
              style={{
                flex: 1,
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
            >
              Instalar App
            </button>
            <button 
              onClick={handleClose}
              style={{
                background: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Recusar
            </button>
          </div>
        </div>
      ) : (
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
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Instale no iPhone</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                Siga estes 2 passos simples:
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
              gap: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700 }}>1</span>
              <span>Toque no ícone de <strong>Compartilhar</strong> <Share size={12} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle' }} /> do Safari</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700 }}>2</span>
              <span>Selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare size={12} style={{ display: 'inline', margin: '0 2px', verticalAlign: 'middle' }} /></span>
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
              cursor: 'pointer'
            }}
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
};
