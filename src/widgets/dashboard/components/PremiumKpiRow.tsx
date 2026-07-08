import React from 'react';
import { DollarSign, TrendingUp, Users, FolderKanban, Target, HeartPulse } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const dummySparklineData = [
  { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }, { value: 28 }, { value: 40 }, { value: 38 }
];

const KpiCard: React.FC<{ 
  title: string; 
  value: string; 
  trend: string; 
  isPositive: boolean; 
  icon: React.ReactNode; 
  color: string 
}> = ({ title, value, trend, isPositive, icon, color }) => {
  return (
    <div className="card premium-kpi-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{title}</span>
        </div>
      </div>
      
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>{value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            color: isPositive ? 'var(--color-success)' : 'var(--color-danger)',
            background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            {trend}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>vs último mês</span>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', opacity: 0.3 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dummySparklineData}>
            <defs>
              <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} fillOpacity={1} fill={`url(#color-${title.replace(/\s+/g, '')})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const PremiumKpiRow: React.FC = () => {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '20px', 
      marginBottom: '24px' 
    }}>
      <KpiCard title="Receita Líquida" value="R$ 145.200" trend="+12.5%" isPositive={true} icon={<DollarSign size={18} />} color="var(--color-success)" />
      <KpiCard title="MRR" value="R$ 42.500" trend="+8.2%" isPositive={true} icon={<TrendingUp size={18} />} color="var(--color-primary)" />
      <KpiCard title="Clientes Ativos" value="128" trend="+3" isPositive={true} icon={<Users size={18} />} color="var(--color-purple)" />
      <KpiCard title="Projetos Ativos" value="24" trend="-2" isPositive={false} icon={<FolderKanban size={18} />} color="var(--color-warning)" />
      <KpiCard title="Leads no Funil" value="312" trend="+18.4%" isPositive={true} icon={<Target size={18} />} color="#ec4899" />
      <KpiCard title="Health Score" value="98%" trend="+1%" isPositive={true} icon={<HeartPulse size={18} />} color="#14b8a6" />
    </div>
  );
};

export default PremiumKpiRow;
