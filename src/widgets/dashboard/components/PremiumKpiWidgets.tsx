import React, { useEffect } from 'react';
import { DollarSign, TrendingUp, Users, FolderKanban, Target } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

// Real Stores
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useProjectStore } from '../../../entities/projeto/model/store';
import { useLeadStore } from '../../../entities/lead/model/store';
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
}> = ({ title, value, trend, isPositive, icon, color, config, loading, onClick }) => {
  return (
    <div 
      className="card premium-kpi-card" 
      onClick={onClick}
      style={{ padding: '16px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px', height: '100%', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.80rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{config?.customTitle || title}</span>
        </div>
      </div>
      
      <div style={{ zIndex: 1 }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
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

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45px', opacity: 0.4 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[{v: Math.random()*10},{v: Math.random()*20},{v: Math.random()*15},{v: Math.random()*30},{v: Math.random()*25}]}>
            <defs>
              <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
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
};

export const RevenueKpiWidget = ({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { transactions, loading, fetchTransactions } = useFinanceiroStore();
  const { startDate, endDate } = useFilterStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  const receitasRealizadas = transactions
    .filter(t => t.type === 'income' && t.status === 'Pago' && isDateInRange(t.dueDate, startDate, endDate))
    .reduce((acc, curr) => acc + curr.value, 0);

  return (
    <KpiCard 
      title="Receita Líquida" 
      value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitasRealizadas)} 
      icon={<DollarSign size={16} />} 
      color="var(--color-success)" 
      config={config} 
      loading={loading}
      onClick={onClick}
    />
  );
};

export const MrrKpiWidget = ({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { loading, fetchTransactions } = useFinanceiroStore();
  
  useEffect(() => { fetchTransactions(); }, []);
  
  // Exemplo simplificado: transações recorrentes ou apenas uma métrica aproximada. 
  // Sem dados fictícios, se não temos MRR flag no banco, exibimos 0 ou placeholder.
  const mrr = 0; // Se houver campo recorrente usaríamos aqui.
  
  return (
    <KpiCard 
      title="MRR" 
      value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr)} 
      icon={<TrendingUp size={16} />} 
      color="var(--color-primary)" 
      config={config} 
      loading={loading}
      onClick={onClick}
    />
  );
};

export const ClientsKpiWidget = ({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { clientes, loading, fetchClientes } = useClienteStore();
  
  useEffect(() => { fetchClientes(); }, []);
  
  return (
    <KpiCard 
      title="Clientes Ativos" 
      value={clientes.length} 
      icon={<Users size={16} />} 
      color="var(--color-purple)" 
      config={config} 
      loading={loading}
      onClick={onClick}
    />
  );
};

export const ProjectsKpiWidget = ({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { projects, loading, fetchProjects } = useProjectStore();
  
  useEffect(() => { fetchProjects(); }, []);
  
  const ativos = projects.filter(p => p.stage === 'desenvolvimento').length;

  return (
    <KpiCard 
      title="Projetos Ativos" 
      value={ativos} 
      icon={<FolderKanban size={16} />} 
      color="var(--color-warning)" 
      config={config} 
      loading={loading}
      onClick={onClick}
    />
  );
};

export const LeadsKpiWidget = ({ config, onClick }: { config?: any, onClick?: () => void }) => {
  const { leads, loading, fetchLeads } = useLeadStore();
  
  useEffect(() => { fetchLeads(); }, []);

  return (
    <KpiCard 
      title="Leads no Funil" 
      value={leads.length} 
      icon={<Target size={16} />} 
      color="#ec4899" 
      config={config} 
      loading={loading}
      onClick={onClick}
    />
  );
};

export const PremiumKpiRow = () => {
  const navigate = useNavigate();

  return (
    <>
      <RevenueKpiWidget config={{}} onClick={() => navigate('/app/financeiro')} />
      <MrrKpiWidget config={{}} onClick={() => navigate('/app/financeiro')} />
      <ClientsKpiWidget config={{}} onClick={() => navigate('/app/clientes')} />
      <ProjectsKpiWidget config={{}} onClick={() => navigate('/app/projetos')} />
      <LeadsKpiWidget config={{}} onClick={() => navigate('/app/leads')} />
    </>
  );
};
