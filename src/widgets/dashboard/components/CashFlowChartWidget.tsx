import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { DollarSign } from 'lucide-react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';

const getLast6Months = () => {
  const months = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthIndex = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const label = `${monthNames[d.getMonth()]}/${String(year).slice(-2)}`;
    months.push({
      label,
      monthIndex,
      year: String(year)
    });
  }
  return months;
};

import { useEffect } from 'react';
import { ChartSkeleton } from '../../skeletons/WidgetSkeletons';

export default function CashFlowChartWidget() {
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

  const monthsList = getLast6Months();
  const chartData = monthsList.map(m => {
    const monthTrx = transactions.filter(t => {
      const parts = t.dueDate.split('/');
      if (parts.length === 3) {
        return parts[1] === m.monthIndex && parts[2] === m.year;
      }
      return false;
    });

    const receita = monthTrx.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.value, 0);
    const despesa = monthTrx.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.value, 0);

    return {
      name: m.label,
      monthIndex: m.monthIndex,
      receita,
      despesa
    };
  });

  const handlePointClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const month = data.activePayload[0].payload.monthIndex;
      navigate(`/financeiro?month=${month}`);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', marginBottom: '12px' }}>
        <DollarSign size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Comparativo Receita x Despesa (6 Meses)</span>
      </div>

      <div style={{ flexGrow: 1, width: '100%', height: '80%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onClick={handlePointClick}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="var(--text-muted)" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `R$ ${v/1000}k`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff', fontWeight: 700, fontSize: '11px' }}
              itemStyle={{ fontSize: '11px', color: '#fff' }}
              formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
            />
            <Line 
              type="monotone" 
              dataKey="receita" 
              name="Receita (Inflows)" 
              stroke="var(--color-success)" 
              strokeWidth={3} 
              dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-card)' }}
              activeDot={{ r: 6, cursor: 'pointer' }}
            />
            <Line 
              type="monotone" 
              dataKey="despesa" 
              name="Despesa (Outflows)" 
              stroke="var(--color-danger)" 
              strokeWidth={3} 
              dot={{ r: 3, strokeWidth: 2, fill: 'var(--bg-card)' }}
              activeDot={{ r: 6, cursor: 'pointer' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
        💡 Clique em qualquer ponto do mês para detalhar os lançamentos no Financeiro.
      </div>
    </div>
  );
}
