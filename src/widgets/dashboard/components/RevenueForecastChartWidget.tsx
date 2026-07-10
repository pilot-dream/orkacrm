import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinanceiroQuery } from '../../../entities/dashboard/hooks/useDashboardQueries';
import { useFilterStore } from '../../../entities/dashboard/model/filterStore';

import { runInWorker } from '../../../shared/lib/workerHelper';

export const RevenueForecastChartWidget = React.memo(() => {
  const { data: transactions = [], isLoading: loading } = useFinanceiroQuery();
  const startDate = useFilterStore((s) => s.startDate);
  const endDate = useFilterStore((s) => s.endDate);
  const dateRangeLabel = useFilterStore((s) => s.dateRangeLabel);
  const setDateRange = useFilterStore((s) => s.setDateRange);
  
  const [data, setData] = React.useState<any[]>([]);
  const [loadingWorker, setLoadingWorker] = React.useState(true);

  React.useEffect(() => {
    if (transactions.length === 0) {
      setData([]);
      setLoadingWorker(false);
      return;
    }

    setLoadingWorker(true);
    runInWorker<any, any>('COMPUTE_REVENUE_FORECAST', { transactions, startDate, endDate })
      .then((res) => {
        setData(res);
        setLoadingWorker(false);
      })
      .catch((err) => {
        console.error('Error running forecast calculation in Web Worker:', err);
        setLoadingWorker(false);
      });
  }, [transactions, startDate, endDate]);

  const isInitialLoading = loading || loadingWorker;

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Receita: Previsto vs Realizado</h3>
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

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <div style={{ width: '12px', height: '3px', background: '#7c3aed', borderStyle: 'dashed' }}></div>
          Previsto
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
          <div style={{ width: '12px', height: '3px', background: '#10b981' }}></div>
          Realizado
        </div>
      </div>

      <div style={{ flexGrow: 1, width: '100%', minHeight: '300px' }}>
        {isInitialLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Carregando dados...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => `R$ ${value / 1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="previsto" 
                stroke="#7c3aed" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none" 
              />
              <Area 
                type="monotone" 
                dataKey="realizado" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRealizado)" 
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
