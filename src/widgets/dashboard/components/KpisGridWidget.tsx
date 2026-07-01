import { TrendingUp, Users, Briefcase, Activity } from 'lucide-react';
import { useLeadStore } from '../../../entities/lead/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useProjectStore } from '../../../entities/projeto/model/store';

export default function KpisGridWidget() {
  const leads = useLeadStore((state) => state.leads);
  const clientes = useClienteStore((state) => state.clientes);
  const projects = useProjectStore((state) => state.projects);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // KPIs
  const mrrTotal = clientes.reduce((acc, c) => acc + (c.monthlySpend || 0), 0);
  const activeClientesCount = clientes.filter(c => c.status === 'active').length;
  const activeLeadsCount = leads.filter(l => l.stage !== 'fechado' && l.stage !== 'perdido').length;
  const ongoingProjectsCount = projects.filter(p => p.stage !== 'concluido').length;

  // Mini sparklines SVG path generator
  const renderSparkline = (points: number[], color: string) => {
    const width = 80;
    const height = 24;
    const maxVal = Math.max(...points, 1);
    const minVal = Math.min(...points, 0);
    const range = maxVal - minVal;

    const coords = points.map((p, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((p - minVal) / range) * height;
      return `${x},${y}`;
    });

    return (
      <svg width={width} height={height} style={{ overflow: 'visible', color }}>
        <path
          d={`M ${coords.join(' L ')}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const kpis = [
    {
      id: 'mrr',
      label: 'MRR ACUMULADO',
      value: formatCurrency(mrrTotal),
      subtext: 'Receita Recorrente',
      icon: TrendingUp,
      color: '#C084FC',
      trend: [10000, 11500, 11000, 13000, 15000, 18500, mrrTotal]
    },
    {
      id: 'clientes',
      label: 'CLIENTES ATIVOS',
      value: activeClientesCount,
      subtext: 'Contas Recorrentes',
      icon: Users,
      color: '#10B981',
      trend: [2, 3, 3, 4, 4, 5, activeClientesCount]
    },
    {
      id: 'leads',
      label: 'LEADS NO FUNIL',
      value: activeLeadsCount,
      subtext: 'Pipeline Comercial',
      icon: Briefcase,
      color: '#2D8CFF',
      trend: [5, 4, 6, 8, 7, 6, activeLeadsCount]
    },
    {
      id: 'projetos',
      label: 'PROJETOS ATIVOS',
      value: ongoingProjectsCount,
      subtext: 'Em Implantação',
      icon: Activity,
      color: '#FBBF24',
      trend: [1, 2, 2, 3, 3, 2, ongoingProjectsCount]
    }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {kpis.map((kpi) => {
        const IconComponent = kpi.icon;
        return (
          <div
            key={kpi.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                {kpi.label}
              </span>
              <IconComponent size={14} color={kpi.color} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '16px' }}>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  {kpi.value}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  {kpi.subtext}
                </span>
              </div>
              <div style={{ paddingBottom: '4px' }}>
                {renderSparkline(kpi.trend, kpi.color)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
