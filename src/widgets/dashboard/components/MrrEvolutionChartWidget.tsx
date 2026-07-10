import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useClientesQuery } from '../../../entities/dashboard/hooks/useDashboardQueries';
import { ChartSkeleton } from '../../skeletons/WidgetSkeletons';

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

import { runInWorker } from '../../../shared/lib/workerHelper';

export const MrrEvolutionChartWidget = React.memo(() => {
  const { data: clientes = [], isLoading: loadingClientes } = useClientesQuery();
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loadingWorker, setLoadingWorker] = React.useState(true);
  
  const runMrrFallback = (clientesList: any[]) => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        mrr: 0,
        date: d
      });
    }

    months.forEach(month => {
      const eom = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);
      const mrrForMonth = clientesList.reduce((acc: number, client: any) => {
        const clientStart = client.startDate || client.createdAt || client.conversionDate;
        if (!clientStart) return acc;
        
        let sd: Date;
        if (clientStart.includes('/')) {
          const parts = clientStart.split('/');
          sd = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else {
          sd = new Date(clientStart);
        }
        
        if (sd <= eom && client.status === 'active') {
          return acc + (client.mrrValue || client.monthlySpend || client.monthlyRevenue || 0);
        }
        return acc;
      }, 0);
      month.mrr = mrrForMonth;
    });
    return months;
  };

  React.useEffect(() => {
    if (clientes.length === 0) {
      const months = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
          mrr: 0
        });
      }
      setChartData(months);
      setLoadingWorker(false);
      return;
    }

    setLoadingWorker(true);
    runInWorker<any, any>('COMPUTE_MRR_EVOLUTION', { clientes })
      .then((res) => {
        setChartData(res);
        setLoadingWorker(false);
      })
      .catch((err) => {
        console.error('Error running MRR calculation in Web Worker, running fallback:', err);
        const fallbackData = runMrrFallback(clientes);
        setChartData(fallbackData);
        setLoadingWorker(false);
      });
  }, [clientes]);

  const isInitialLoading = loadingClientes || loadingWorker;

  if (isInitialLoading) {
    return <ChartSkeleton height="340px" />;
  }

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>MRR (Receita Recorrente)</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px' }}>
          Últimos 6 meses
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
});
