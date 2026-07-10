import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeadsQuery } from '../../../entities/dashboard/hooks/useDashboardQueries';
import { useFilterStore, isDateInRange } from '../../../entities/dashboard/model/filterStore';

export const FunnelWidget = React.memo(() => {
  const navigate = useNavigate();
  const { data: leads = [] } = useLeadsQuery();
  const startDate = useFilterStore((s) => s.startDate);
  const endDate = useFilterStore((s) => s.endDate);
  const dateRangeLabel = useFilterStore((s) => s.dateRangeLabel);
  const setDateRange = useFilterStore((s) => s.setDateRange);

  const funnelData = useMemo(() => {
    const filteredLeads = leads.filter((l: any) => isDateInRange(l.createdAt || l.dateAdded || '', startDate, endDate));
    
    const countStage = (stage: string) => filteredLeads.filter((l: any) => l.stage === stage).length;
    
    const prospeccao = countStage('prospeccao');
    const qualificacao = countStage('qualificacao');
    const negociacao = countStage('negociacao');
    const contrato = countStage('contrato');
    const fechado = countStage('fechado');
    
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
    const filteredLeads = leads.filter((l: any) => isDateInRange(l.createdAt || l.dateAdded || '', startDate, endDate));
    const closed = filteredLeads.filter((l: any) => l.stage === 'fechado').length;
    const total = filteredLeads.length;
    return total > 0 ? ((closed / total) * 100).toFixed(1) : '0.0';
  }, [leads, startDate, endDate]);

  return (
    <div className="card" onClick={() => navigate('/leads')} style={{ cursor: 'pointer', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Funil de Vendas</h3>
        <select 
          value={dateRangeLabel}
          onChange={(e) => setDateRange(e.target.value as any)}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            appearance: 'none', 
            WebkitAppearance: 'none', 
            border: 'none', 
            outline: 'none',
            cursor: 'pointer',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: '6px',
            fontFamily: 'inherit',
            textAlign: 'right'
          }}
        >
          <option value="Este Mês">Este Mês</option>
          <option value="Mês Passado">Mês Passado</option>
          <option value="Últimos 30 Dias">Últimos 30 Dias</option>
          <option value="Este Ano">Este Ano</option>
          <option value="Últimos 12 Meses">Últimos 12 Meses</option>
          <option value="Todo o Período">Todo o Período</option>
        </select>
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
});
