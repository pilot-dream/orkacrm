import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../entities/usuario/model/store';
import { useLeadStore } from '../../../entities/lead/model/store';
import { useProjectStore } from '../../../entities/projeto/model/store';
import { Sparkles } from 'lucide-react';

export default function CommandCenterWidget() {
  const navigate = useNavigate();
  const userProfile = useAuthStore((state) => state.userProfile);
  const leads = useLeadStore((state) => state.leads);
  const projects = useProjectStore((state) => state.projects);

  const userName = userProfile?.name || 'Gestor';
  
  // Dynamic Calculations
  const hotLeads = leads.filter(l => l.stage === 'negociacao' || l.stage === 'contrato').length;
  const highPriorityLeads = leads.filter(l => l.priority === 'alta' && l.stage !== 'fechado' && l.stage !== 'perdido').length;
  const criticalProjects = projects.filter(p => p.priority === 'alta' && p.stage !== 'concluido').length;
  const projectedRevenue = leads
    .filter(l => l.stage === 'negociacao' || l.stage === 'contrato')
    .reduce((acc, l) => acc + (l.value || 0), 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };


  return (
    <div className="command-center-card">
      {/* Left side: Copilot Command & Counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C084FC' }}>
          <div style={{
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={14} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ORKA AI — Copilot</span>
        </div>

        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 4px 0' }}>
            Bom dia, {userName}.
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
            Sua operação está saudável.<br/>
            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Health Score: 92%</span>
          </p>
        </div>

        {/* Dynamic metrics indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
          <div 
            onClick={() => navigate('/leads?stage=negociacao')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            title="Ir para Leads em Negociação"
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              🔥 {hotLeads === 0 ? 'Nenhum lead quente' : hotLeads === 1 ? '1 lead quente' : `${hotLeads} leads quentes`}
            </span>
          </div>

          <div 
            onClick={() => navigate('/leads')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            title="Ir para Leads de Alta Prioridade"
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              🔴 {highPriorityLeads === 0 ? 'Nenhum lead de alta prioridade' : highPriorityLeads === 1 ? '1 lead de alta prioridade' : `${highPriorityLeads} leads de alta prioridade`}
            </span>
          </div>

          <div 
            onClick={() => navigate('/projetos')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            title="Ir para o quadro de Projetos"
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              ⚠️ {criticalProjects === 0 ? 'Nenhum projeto crítico' : criticalProjects === 1 ? '1 projeto crítico' : `${criticalProjects} projetos críticos`}
            </span>
          </div>

          <div 
            onClick={() => navigate('/financeiro')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            title="Ir para Livro Razão Financeiro"
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              💰 Receita prevista: <b style={{ color: '#fff' }}>{formatCurrency(projectedRevenue)}</b>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', lineHeight: 1.4 }}>
          <span>🤖 <b>Recomendação da IA:</b> Priorize o follow-up do cliente com maior probabilidade de fechamento.</span>
        </div>
      </div>

      {/* Right side: Health Score Card */}
      <div style={{
        borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
        paddingLeft: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%'
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
          HEALTH SCORE OPERACIONAL
        </span>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-success)', lineHeight: 1 }}>
          92%
        </div>
        <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'block', marginTop: '4px' }}>
          Excelente
        </span>

        {/* Visual Progress Bar █████████░ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
          <div style={{
            display: 'flex',
            gap: '2px',
            flexGrow: 1
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => (
              <div 
                key={step} 
                style={{ 
                  height: '10px', 
                  flexGrow: 1, 
                  backgroundColor: step <= 9 ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '1px'
                }} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
