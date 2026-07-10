import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Dot
} from 'recharts';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { ChevronDown } from 'lucide-react';
import { useEffect } from 'react';
import { ChartSkeleton } from '../../skeletons/WidgetSkeletons';

const getLast6Months = () => {
  const months = [];
  const monthNames = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
  // Hardcoded for visual matching for now, would be dynamic
  return monthNames.map(m => ({ label: m }));
};

const CustomDot = (props: any) => {
  const { cx, cy, index, dataLength, value } = props;
  if (index === dataLength - 1) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill="#7c3aed" stroke="var(--bg-card)" strokeWidth={2} />
        <rect x={cx - 30} y={cy - 25} width={60} height={20} rx={4} fill="#7c3aed" />
        <text x={cx} y={cy - 12} fill="#fff" fontSize={10} fontWeight="bold" textAnchor="middle">
          R$ {value / 1000}k
        </text>
      </g>
    );
  }
  return null;
};

export const MrrEvolutionChartWidget = ({ config }: { config?: any }) => {
  const { loading: loadingClientes, fetchClientes } = useClienteStore();
  const { loading: loadingFinanceiro, fetchTransactions } = useFinanceiroStore();

  useEffect(() => {
    fetchClientes();
    fetchTransactions();
  }, []);

  const isInitialLoading = loadingClientes || loadingFinanceiro;

  if (isInitialLoading) {
    return <ChartSkeleton height="340px" />;
  }

  const chartData = [
    { name: 'Dez', mrr: 10000 },
    { name: 'Jan', mrr: 14000 },
    { name: 'Fev', mrr: 18000 },
    { name: 'Mar', mrr: 22000 },
    { name: 'Abr', mrr: 26000 },
    { name: 'Mai', mrr: 32480 },
  ];

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>MRR (Receita Recorrente)</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          Últimos 6 meses <ChevronDown size={14} />
        </div>
      </div>

      <div style={{ flexGrow: 1, width: '100%', minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-muted)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `R$ ${v/1000}k`}
              ticks={[0, 10000, 20000, 30000, 40000]}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff', fontWeight: 700, fontSize: '11px' }}
              itemStyle={{ fontSize: '11px', color: '#fff' }}
              formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'MRR']}
            />
            <Area 
              type="monotone" 
              dataKey="mrr" 
              stroke="#7c3aed" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorMrr)"
              activeDot={{ r: 6, fill: '#7c3aed', stroke: 'var(--bg-card)', strokeWidth: 2 }}
              dot={<CustomDot dataLength={chartData.length} />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
