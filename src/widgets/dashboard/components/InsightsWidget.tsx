import React from 'react';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';

export const InsightsWidget: React.FC = () => {
  return (
    <div className="card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: 'linear-gradient(145deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.03) 100%)',
      border: '1px solid rgba(59, 130, 246, 0.1)'
    }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
          <Sparkles size={18} />
          Insights
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '6px', marginTop: '2px' }}>
            <Zap size={14} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Renegociação Contratual</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '8px' }}>
              O cliente TechFlow Corp está há 12 meses sem reajuste. Oportunidade de +R$ 1.200/mês.
            </div>
            <button style={{ 
              background: 'none', border: 'none', color: 'var(--color-primary)', 
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              Ver detalhes <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 0 }} />

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ padding: '6px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', borderRadius: '6px', marginTop: '2px' }}>
            <Zap size={14} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Risco de Churn</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '8px' }}>
              Engajamento da conta GlobalRetail caiu 40% nas últimas 2 semanas.
            </div>
            <button style={{ 
              background: 'none', border: 'none', color: 'var(--color-primary)', 
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              Ver plano de ação <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsWidget;
