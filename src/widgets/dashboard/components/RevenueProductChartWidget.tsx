import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { Layers } from 'lucide-react';

import { useEffect } from 'react';
import { ChartSkeleton } from '../../skeletons/WidgetSkeletons';

export default function RevenueProductChartWidget() {
  const navigate = useNavigate();
  const transactions = useFinanceiroStore((state) => state.transactions);
  const loading = useFinanceiroStore((state) => state.loading);
  const fetchTransactions = useFinanceiroStore((state) => state.fetchTransactions);

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading && transactions.length === 0) {
    return <ChartSkeleton height="340px" />;
  }

  // Group incomes by category
  const incomes = transactions.filter(t => t.type === 'income');
  const groups: Record<string, number> = {};
  
  incomes.forEach(inc => {
    groups[inc.category] = (groups[inc.category] || 0) + inc.value;
  });

  const COLORS = ['#2D8CFF', '#8B5CF6', '#10B981', '#FBBF24', '#F472B6'];

  const data = Object.keys(groups).map((name, index) => ({
    name,
    value: groups[name],
    color: COLORS[index % COLORS.length]
  }));

  const displayData = data;

  const handleCellClick = (entry: any) => {
    navigate(`/financeiro?category=${entry.name}`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '340px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '12px' }}>
        <Layers size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Distribuição de Receita por Categoria</span>
      </div>

      <div style={{ flexGrow: 1, width: '100%', height: '70%', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              {displayData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke="none" 
                  onClick={() => handleCellClick(entry)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ fontSize: '11px', color: '#fff' }}
              formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
        💡 Clique em qualquer fatia para filtrar os lançamentos no painel Financeiro.
      </div>
    </div>
  );
}
