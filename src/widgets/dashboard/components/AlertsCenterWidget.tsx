import React from 'react';
import { AlertCircle, Clock, ChevronRight, AlertTriangle } from 'lucide-react';

export const AlertsCenterWidget: React.FC = () => {
  const alerts = [
    { id: 1, title: 'Projeto Orion em atraso', desc: 'Fase de design deveria ter sido concluída ontem.', type: 'danger', icon: <Clock size={16} /> },
    { id: 2, title: '2 faturas vencidas', desc: 'Total de R$ 12.500 pendentes de recebimento.', type: 'warning', icon: <AlertTriangle size={16} /> },
    { id: 3, title: 'Lead quente sem contato', desc: 'Acme Corp aguardando retorno há 3 dias.', type: 'info', icon: <AlertCircle size={16} /> },
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} color="var(--color-danger)" />
          Alertas
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '12px' }}>
          3 pendências
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
        {alerts.map(alert => (
          <div key={alert.id} className="alert-item" style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px', 
            padding: '12px', 
            background: 'var(--bg-main)', 
            borderRadius: 'var(--border-radius-md)',
            borderLeft: `2px solid ${
              alert.type === 'danger' ? 'var(--color-danger)' : 
              alert.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)'
            }`
          }}>
            <div style={{ color: alert.type === 'danger' ? 'var(--color-danger)' : alert.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)', marginTop: '2px' }}>
              {alert.icon}
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{alert.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{alert.desc}</div>
            </div>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
              <ChevronRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsCenterWidget;
