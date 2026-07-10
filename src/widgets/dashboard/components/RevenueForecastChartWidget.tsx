import React, { useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { ChevronDown } from 'lucide-react';

export const RevenueForecastChartWidget = ({ config }: { config?: any }) => {
  const { loading, fetchTransactions } = useFinanceiroStore();
  
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Fake data based on the requested visual
  const data = [
    { name: '01 Mai', previsto: 4000, realizado: 4000 },
    { name: '05 Mai', previsto: 10000, realizado: 9500 },
    { name: '10 Mai', previsto: 18000, realizado: 17800 },
    { name: '15 Mai', previsto: 25000, realizado: 26000 },
    { name: '20 Mai', previsto: 35000, realizado: 34500 },
    { name: '25 Mai', previsto: 45000, realizado: null }, // Future
    { name: '30 Mai', previsto: 50000, realizado: null }, // Future
  ];

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Receita: Previsto vs Realizado</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          Este Mês <ChevronDown size={14} />
        </div>
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
        {loading ? (
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
};
