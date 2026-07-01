import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'primary' | 'warning';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'primary'
}) => {
  if (!isOpen) return null;

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'primary-btn danger-bg'; // customizable
      case 'warning': return 'primary-btn warning-bg';
      default: return 'primary-btn';
    }
  };

  return (
    <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
      <div className="card animate-slide-up" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>{message}</p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button className="outline-btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button 
            className={getButtonClass()} 
            style={type === 'danger' ? { backgroundColor: 'var(--color-danger)' } : {}}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
