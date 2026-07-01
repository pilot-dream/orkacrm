import React from 'react';

interface LoadingOverlayProps {
  active: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ active, message = 'Carregando...' }) => {
  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(9, 9, 11, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      transition: 'opacity 0.2s ease-in-out'
    }}>
      <div className="animate-spin" style={{
        width: '48px',
        height: '48px',
        border: '4px solid rgba(45, 140, 255, 0.15)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%'
      }}></div>
      <p style={{ marginTop: '16px', color: '#fff', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.5px' }}>{message}</p>
    </div>
  );
};
