import React from 'react';
import { Calendar, Filter, RefreshCw } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  return (
    <header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      marginBottom: '32px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          Visão geral da operação em tempo real.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="outline-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}>
          <Calendar size={16} />
          <span>Este Mês</span>
        </button>
        <button className="outline-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}>
          <Filter size={16} />
          <span>Filtros</span>
        </button>
        <button className="icon-btn" style={{ border: '1px solid var(--border-color)' }}>
          <RefreshCw size={16} />
        </button>
      </div>
    </header>
  );
};
