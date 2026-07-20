import React from 'react';
import { DollarSign, TrendingUp, Users, FolderKanban, Target } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

// TanStack Query Hooks
import { 
  useFinanceiroQuery, 
  useClientesQuery, 
  useProjectsQuery, 
  useLeadsQuery 
} from '../../../entities/dashboard/hooks/useDashboardQueries';
import { useFilterStore, isDateInRange } from '../../../entities/dashboard/model/filterStore';

export const KpiCard: React.FC<{
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  color: string;
  config?: any;
  loading?: boolean;
  onClick?: () => void;
}> = React.memo(({ title, value, trend, isPositive, icon, color, config, loading, onClick }) => {
  return (
    <div
      className="card premium-kpi-card"
      onClick={onClick}
      style={{ padding: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', minHeight: '120px', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config?.customTitle || title}</span>
        </div>
      </div>

      <div style={{ zIndex: 1, marginTop: 'auto', marginBottom: '8px' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.025em' }}>
          {loading ? '...' : value}
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
              background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              padding: '2px 4px',
              borderRadius: '4px'
            }}>
              {trend}
            </span>
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', opacity: 0.5 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[{ v: 10 }, { v: 15 }, { v: 12 }, { v: 22 }, { v: 18 }]}>
            <defs>
              <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip cursor={false} content={<></>} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              fillOpacity={1}
              fill={`url(#color-${title.replace(/\s+/g, '')})`}
              strokeWidth={2}
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)', stroke: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export const RevenueKpiWidget = React.memo(({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { data: transactions = [], isLoading } = useFinanceiroQuery();
  const startDate = useFilterStore((s) => s.startDate);
  const endDate = useFilterStore((s) => s.endDate);

  const receitasRealizadas = React.useMemo(() => {
    return transactions
      .filter((t: any) => t.type === 'income' && t.status === 'Pago' && isDateInRange(t.dueDate, startDate, endDate))
      .reduce((acc: number, curr: any) => acc + curr.value, 0);
  }, [transactions, startDate, endDate]);

  return (
    <KpiCard
      title="Receita Líquida"
      value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitasRealizadas)}
      icon={<DollarSign size={16} />}
      color="var(--color-success)"
      config={config}
      loading={isLoading}
      onClick={onClick}
    />
  );
});

export const MrrKpiWidget = React.memo(({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { data: clientes = [], isLoading } = useClientesQuery();
  const mrr = clientes
    .filter((c: any) => c.status === 'active')
    .reduce((acc: number, c: any) => acc + (c.mrrValue || c.monthlySpend || c.monthlyRevenue || 0), 0);

  return (
    <KpiCard
      title="MRR"
      value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr)}
      icon={<TrendingUp size={16} />}
      color="var(--color-primary)"
      config={config}
      loading={isLoading}
      onClick={onClick}
    />
  );
});

export const ClientsKpiWidget = React.memo(({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { data: clientes = [], isLoading } = useClientesQuery();

  return (
    <KpiCard
      title="Clientes Ativos"
      value={clientes.length}
      icon={<Users size={16} />}
      color="var(--color-purple)"
      config={config}
      loading={isLoading}
      onClick={onClick}
    />
  );
});

export const ProjectsKpiWidget = React.memo(({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { data: projects = [], isLoading } = useProjectsQuery();

  const ativos = React.useMemo(() => {
    return projects.filter((p: any) => p.stage === 'desenvolvimento').length;
  }, [projects]);

  return (
    <KpiCard
      title="Projetos Ativos"
      value={ativos}
      icon={<FolderKanban size={16} />}
      color="var(--color-warning)"
      config={config}
      loading={isLoading}
      onClick={onClick}
    />
  );
});

export const LeadsKpiWidget = React.memo(({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { data: leads = [], isLoading } = useLeadsQuery();

  return (
    <KpiCard
      title="Leads no Funil"
      value={leads.length}
      icon={<Target size={16} />}
      color="#ec4899"
      config={config}
      loading={isLoading}
      onClick={onClick}
    />
  );
});

export const PremiumKpiRow = React.memo(() => {
  const navigate = useNavigate();

  return (
    <>
      <RevenueKpiWidget config={{}} onClick={() => navigate('/financeiro')} />
      <MrrKpiWidget config={{}} onClick={() => navigate('/financeiro')} />
      <ClientsKpiWidget config={{}} onClick={() => navigate('/clientes')} />
      <ProjectsKpiWidget config={{}} onClick={() => navigate('/projetos')} />
      <LeadsKpiWidget config={{}} onClick={() => navigate('/leads')} />
    </>
  );
});
