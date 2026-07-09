import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderWidgetProps {
  title: string;
}

export const PlaceholderWidget: React.FC<PlaceholderWidgetProps> = ({ title }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      color: 'var(--text-secondary)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <Construction size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
      <h3 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '8px', fontWeight: 600 }}>{title}</h3>
      <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Este widget estrutural receberá dados reais em breve.</p>
    </div>
  );
};
