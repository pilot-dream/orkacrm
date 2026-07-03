import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { Target } from 'lucide-react';

import { useEffect } from 'react';
import { ChartSkeleton } from '../../skeletons/WidgetSkeletons';

export default function GoalProgressWidget() {
  const clientes = useClienteStore((state) => state.clientes);
  const loading = useClienteStore((state) => state.loading);
  const fetchClientes = useClienteStore((state) => state.fetchClientes);

  useEffect(() => {
    fetchClientes();
  }, []);

  if (loading && clientes.length === 0) {
    return <ChartSkeleton height="320px" />;
  }

  const mrrTotal = clientes.reduce((acc, c) => acc + (c.monthlySpend || 0), 0);
  
  const targetMrr = 50000; // Company Target
  const percentage = Math.min(Math.round((mrrTotal / targetMrr) * 100), 100);
  const remaining = Math.max(targetMrr - mrrTotal, 0);

  const data = [
    { name: 'Alcançado', value: mrrTotal, color: '#C084FC' },
    { name: 'Restante', value: remaining, color: 'rgba(255, 255, 255, 0.03)' }
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '320px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C084FC' }}>
        <Target size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Progresso de Metas (MRR)</span>
      </div>

      <div style={{ position: 'relative', height: '180px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{percentage}%</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>da meta atingida</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>REALIZADO</span>
          <span style={{ fontWeight: 700, color: '#fff' }}>{formatCurrency(mrrTotal)}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>META GLOBAL</span>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{formatCurrency(targetMrr)}</span>
        </div>
      </div>
    </div>
  );
}
