
import { ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FunnelWidget = () => {
  const navigate = useNavigate();
  const funnelData = [
    { label: 'Novos Leads', value: 250, percent: '100%', width: '100%' },
    { label: 'Qualificados', value: 128, percent: '51%', width: '80%' },
    { label: 'Proposta', value: 64, percent: '25%', width: '60%' },
    { label: 'Negociação', value: 23, percent: '9%', width: '40%' },
    { label: 'Fechados', value: 12, percent: '5%', width: '20%' },
  ];

  return (
    <div className="card" onClick={() => navigate('/app/leads')} style={{ cursor: 'pointer', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Funil de Vendas</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          Este Mês <ChevronDown size={14} />
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
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-success)' }}>4,8%</span>
      </div>
    </div>
  );
};
