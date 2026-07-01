import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { TrendingUp } from 'lucide-react';

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

export default function MrrEvolutionChartWidget() {
  const clientes = useClienteStore((state) => state.clientes);
  const transactions = useFinanceiroStore((state) => state.transactions);

  const monthsList = getLast6Months();
  const chartData = monthsList.map((m, index) => {
    // Check if it's the current month (last item)
    if (index === monthsList.length - 1) {
      const currentMrr = clientes.reduce((acc, c) => acc + (c.monthlySpend || 0), 0);
      return {
        name: m.label,
        mrr: currentMrr
      };
    }

    // Historical months calculated dynamically from registered Assinatura incomes
    const monthTrx = transactions.filter(t => {
      const parts = t.dueDate.split('/');
      if (parts.length === 3) {
        return parts[1] === m.monthIndex && parts[2] === m.year;
      }
      return false;
    });

    const mrr = monthTrx
      .filter(t => t.type === 'income' && t.category === 'Assinatura')
      .reduce((acc, curr) => acc + curr.value, 0);

    return {
      name: m.label,
      mrr
    };
  });

  const currentMrr = clientes.reduce((acc, c) => acc + (c.monthlySpend || 0), 0);

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
      height: '340px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C084FC', marginBottom: '12px' }}>
        <TrendingUp size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Evolução de Receita Recorrente (MRR)</span>
      </div>

      <div style={{ flexGrow: 1, width: '100%', height: '80%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C084FC" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#C084FC" stopOpacity={0}/>
              </linearGradient>
            </defs>
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
              formatter={(value: any) => [formatCurrency(Number(value || 0)), 'MRR']}
            />
            <Area 
              type="monotone" 
              dataKey="mrr" 
              stroke="#C084FC" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorMrr)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Faturamento Atual: <b>{formatCurrency(currentMrr)}</b></span>
        <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Crescimento Real</span>
      </div>
    </div>
  );
}
