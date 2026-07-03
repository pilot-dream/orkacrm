import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../entities/usuario/model/store';
import { useLeadStore } from '../../../entities/lead/model/store';
import { useProjectStore } from '../../../entities/projeto/model/store';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { 
  Sparkles, 
  Flame, 
  AlertCircle, 
  AlertTriangle, 
  Bot,
  Coins,
  CheckCircle
} from 'lucide-react';

import { CardSkeleton } from '../../skeletons/WidgetSkeletons';

export default function CommandCenterWidget() {
  const navigate = useNavigate();
  const userProfile = useAuthStore((state) => state.userProfile);
  const leads = useLeadStore((state) => state.leads);
  const projects = useProjectStore((state) => state.projects);
  const { transactions, fetchTransactions, loading: loadingFinanceiro } = useFinanceiroStore();
  
  const fetchLeads = useLeadStore((state) => state.fetchLeads);
  const fetchProjects = useProjectStore((state) => state.fetchProjects);
  const loadingLeads = useLeadStore((state) => state.loading);
  const loadingProjects = useProjectStore((state) => state.loading);

  useEffect(() => {
    fetchTransactions();
    fetchLeads();
    fetchProjects();
  }, []);

  const isInitialLoading = 
    (loadingLeads && leads.length === 0) || 
    (loadingProjects && projects.length === 0) || 
    (loadingFinanceiro && transactions.length === 0);

  if (isInitialLoading) {
    return <CardSkeleton height="320px" />;
  }

  const formatUserName = (raw: string) => {
    if (!raw) return 'Gestor';
    if (raw.toLowerCase().includes('joaovitorfideliscosta')) {
      return 'João Vitor';
    }
    return raw
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  const userName = formatUserName(userProfile?.name || '');
  
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

  // 1. Dynamic Health Score
  let calculatedScore = 100;
  
  const incomeTotal = transactions
    .filter(t => t.type === 'income' && t.status !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.value, 0);

  const expenseTotal = transactions
    .filter(t => t.type === 'expense' && t.status !== 'Cancelado')
    .reduce((acc, curr) => acc + curr.value, 0);

  const overdueExpensesCount = transactions.filter(t => t.type === 'expense' && t.status === 'Atrasado').length;
  const pendingExpensesCount = transactions.filter(t => t.type === 'expense' && t.status === 'Pendente').length;

  const despesasAPagarValue = transactions
    .filter(t => t.type === 'expense' && t.status === 'Pendente')
    .reduce((acc, curr) => acc + curr.value, 0);

  const despesasAtrasadasValue = transactions
    .filter(t => t.type === 'expense' && t.status === 'Atrasado')
    .reduce((acc, curr) => acc + curr.value, 0);

  // Rule 1: if expenses exceed 70% of income, subtract 20 points
  if (incomeTotal > 0 && expenseTotal > incomeTotal * 0.7) {
    calculatedScore -= 20;
  }
  // Rule 2: subtract 5 points per overdue expense
  calculatedScore -= overdueExpensesCount * 5;
  // Rule 3: if expenses exceed total income completely, subtract 15 points
  if (incomeTotal > 0 && expenseTotal > incomeTotal) {
    calculatedScore -= 15;
  }
  // Clamp score between 10% and 100%
  const healthScore = Math.max(10, Math.min(100, calculatedScore));

  let healthStatus = 'Excelente';
  let healthColor = 'var(--color-success)';
  if (healthScore < 50) {
    healthStatus = 'Crítico';
    healthColor = 'var(--color-danger)';
  } else if (healthScore < 80) {
    healthStatus = 'Atenção';
    healthColor = 'var(--color-warning)';
  }

  // 2. ORKA AI Dynamic Insights
  const getAiInsights = () => {
    const insights = [];

    if (overdueExpensesCount > 0) {
      insights.push(`Existem ${overdueExpensesCount} despesas atrasadas (${formatCurrency(despesasAtrasadasValue)} vencidas) aguardando pagamento urgente.`);
    }

    if (pendingExpensesCount > 0) {
      insights.push(`Você possui ${pendingExpensesCount} despesas pendentes totalizando ${formatCurrency(despesasAPagarValue)} a pagar.`);
    }

    const categoriesList = ['Infraestrutura', 'Marketing', 'Salários', 'Impostos', 'Serviços', 'Outros'];
    const expenseByCategory = categoriesList.map(cat => {
      const total = transactions
        .filter(t => t.type === 'expense' && t.category === cat && t.status !== 'Cancelado')
        .reduce((acc, curr) => acc + curr.value, 0);
      return { cat, total };
    }).sort((a, b) => b.total - a.total);

    if (expenseTotal > 0 && expenseByCategory[0].total > 0) {
      const topCat = expenseByCategory[0];
      const pct = Math.round((topCat.total / expenseTotal) * 100);
      insights.push(`Despesas com ${topCat.cat} representam ${pct}% dos custos mensais da operação.`);
    }

    const cashRealized = transactions
      .filter(t => t.type === 'income' && t.status === 'Recebido')
      .reduce((acc, curr) => acc + curr.value, 0);

    if (cashRealized < despesasAPagarValue + despesasAtrasadasValue) {
      insights.push(`Risco de Liquidez: Caixa projetado ficará negativo em 12 dias se despesas forem liquidadas.`);
    } else {
      const profitMargin = incomeTotal > 0 ? Math.round(((incomeTotal - expenseTotal) / incomeTotal) * 100) : 0;
      if (profitMargin > 0) {
        insights.push(`Margem operacional consolidada de ${profitMargin}% neste mês.`);
      }
    }

    return insights.slice(0, 2); // Limit to top 2 insights to prevent visual clutter
  };

  const aiInsightsList = getAiInsights();

  const hasAlerts = hotLeads > 0 || highPriorityLeads > 0 || criticalProjects > 0 || projectedRevenue > 0;

  return (
    <div className="command-center-card">
      {/* Left side: Copilot Command & Counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#C084FC' }}>
          <div style={{
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={12} />
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>ORKA AI — Copilot</span>
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 2px 0' }}>
            Bom dia, {userName}.
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
            Sua operação está mapeada.
            <span style={{ color: healthColor, fontWeight: 600, marginLeft: '6px' }}>Health Score: {healthScore}% ({healthStatus})</span>
          </p>
        </div>

        {/* Dynamic metrics indicators - only rendering active alerts to reduce visual clutter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
          {hotLeads > 0 && (
            <div 
              onClick={() => navigate('/leads?stage=negociacao')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Ir para Leads em Negociação"
            >
              <Flame size={13} color="#FBBF24" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {hotLeads === 1 ? '1 lead quente' : `${hotLeads} leads quentes`} em negociação
              </span>
            </div>
          )}

          {highPriorityLeads > 0 && (
            <div 
              onClick={() => navigate('/leads')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Ir para Leads de Alta Prioridade"
            >
              <AlertCircle size={13} color="#EF4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {highPriorityLeads === 1 ? '1 lead de alta prioridade' : `${highPriorityLeads} leads de alta prioridade`} no funil
              </span>
            </div>
          )}

          {criticalProjects > 0 && (
            <div 
              onClick={() => navigate('/projetos')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Ir para o quadro de Projetos"
            >
              <AlertTriangle size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {criticalProjects === 1 ? '1 projeto crítico ativo' : `${criticalProjects} projetos críticos ativos`}
              </span>
            </div>
          )}

          {projectedRevenue > 0 && (
            <div 
              onClick={() => navigate('/financeiro')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              title="Ir para Livro Razão Financeiro"
            >
              <Coins size={13} color="#10B981" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Previsão de receitas: <b style={{ color: '#fff' }}>{formatCurrency(projectedRevenue)}</b> em negociação
              </span>
            </div>
          )}

          {!hasAlerts && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)' }}>
              <CheckCircle size={13} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Operação estável. Nenhum alerta comercial ou operacional ativo.
              </span>
            </div>
          )}
        </div>

        {/* ORKA AI insights list */}
        {aiInsightsList.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', lineHeight: 1.3 }}>
            {aiInsightsList.map((ins, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <Bot size={12} color="#C084FC" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{ins}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side: Health Score Card */}
      <div style={{
        borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
        paddingLeft: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        minWidth: '180px'
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
          HEALTH SCORE OPERACIONAL
        </span>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: healthColor, lineHeight: 1 }}>
          {healthScore}%
        </div>
        <span style={{ fontSize: '0.75rem', color: healthColor, fontWeight: 700, display: 'block', marginTop: '4px' }}>
          {healthStatus}
        </span>

        {/* Visual Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px' }}>
          <div style={{
            display: 'flex',
            gap: '2px',
            flexGrow: 1
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((step) => {
              const activeSteps = Math.round(healthScore / 10);
              return (
                <div 
                  key={step} 
                  style={{ 
                    height: '10px', 
                    flexGrow: 1, 
                    backgroundColor: step <= activeSteps ? healthColor : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '1px'
                  }} 
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
