import { useNavigate } from 'react-router-dom';
import { useLeadStore } from '../../../entities/lead/model/store';
import { useFilterStore, isDateInRange } from '../../../entities/dashboard/model/filterStore';
import { useMemo } from 'react';

export const FunnelWidget = () => {
  const navigate = useNavigate();
  const { leads } = useLeadStore();
  const { startDate, endDate, dateRangeLabel } = useFilterStore();

  const funnelData = useMemo(() => {
    const filteredLeads = leads.filter(l => isDateInRange(l.createdAt || l.dateAdded || '', startDate, endDate));
    
    const countStage = (stage: string) => filteredLeads.filter(l => l.stage === stage).length;
    
    // Funnel logic: each step usually contains the sum of itself and subsequent successful steps, or just strictly its own if we just want raw numbers. 
    // Usually in CRM, funnel shows how many passed through that stage. Let's do a strict count for simplicity and visual matching.
    const prospeccao = countStage('prospeccao');
    const qualificacao = countStage('qualificacao');
    const negociacao = countStage('negociacao');
    const contrato = countStage('contrato');
    const fechado = countStage('fechado');
    
    // To avoid zero-width bars, we calculate width relative to max, or minimum 5%
    const max = Math.max(prospeccao, qualificacao, negociacao, contrato, fechado, 1);
    
    return [
      { label: 'Prospecção', value: prospeccao, percent: `${Math.round((prospeccao / max) * 100)}%`, width: `${Math.max((prospeccao / max) * 100, 10)}%` },
      { label: 'Qualificados', value: qualificacao, percent: `${Math.round((qualificacao / max) * 100)}%`, width: `${Math.max((qualificacao / max) * 100, 10)}%` },
      { label: 'Negociação', value: negociacao, percent: `${Math.round((negociacao / max) * 100)}%`, width: `${Math.max((negociacao / max) * 100, 10)}%` },
      { label: 'Contrato', value: contrato, percent: `${Math.round((contrato / max) * 100)}%`, width: `${Math.max((contrato / max) * 100, 10)}%` },
      { label: 'Fechados', value: fechado, percent: `${Math.round((fechado / max) * 100)}%`, width: `${Math.max((fechado / max) * 100, 10)}%` },
    ];
  }, [leads, startDate, endDate]);

  const conversionRate = useMemo(() => {
    const filteredLeads = leads.filter(l => isDateInRange(l.createdAt || l.dateAdded || '', startDate, endDate));
    const closed = filteredLeads.filter(l => l.stage === 'fechado').length;
    const total = filteredLeads.length;
    return total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0';
  }, [leads, startDate, endDate]);
  return (
    <div className="card" onClick={() => navigate('/app/leads')} style={{ cursor: 'pointer', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Funil de Vendas</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
          {dateRangeLabel}
        </div>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'center' }}>
        {funnelData.map((step, idx) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100px' }}>{step.label}</span>
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ 
                width: step.width, 
                height: '32px', 
                background: idx === 0 ? 'rgba(59, 130, 246, 0.4)' : idx === 4 ? 'rgba(59, 130, 246, 0.1)' : `rgba(59, 130, 246, ${0.4 - (idx * 0.08)})`, 
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {step.value}
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-purple)', width: '40px', textAlign: 'right', fontWeight: 600 }}>{step.percent}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Taxa de Conversão</span>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-success)' }}>{conversionRate}%</span>
      </div>
    </div>
  );
};
