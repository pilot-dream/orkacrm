import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useLeadStore } from '../../../entities/lead/model/store';
import { Target } from 'lucide-react';

import { useEffect } from 'react';
import { ChartSkeleton } from '../../skeletons/WidgetSkeletons';

export default function FunnelConversionChartWidget() {
  const navigate = useNavigate();
  const leads = useLeadStore((state) => state.leads);
  const loading = useLeadStore((state) => state.loading);
  const fetchLeads = useLeadStore((state) => state.fetchLeads);

  useEffect(() => {
    fetchLeads();
  }, []);

  if (loading && leads.length === 0) {
    return <ChartSkeleton height="340px" />;
  }

  // Group by stage values
  const stagesList = [
    { id: 'prospeccao', label: 'Prospecção', color: '#60A5FA' },
    { id: 'qualificacao', label: 'Qualificação', color: '#A78BFA' },
    { id: 'negociacao', label: 'Negociação', color: '#FBBF24' },
    { id: 'contrato', label: 'Contrato Enviado', color: '#F472B6' }
  ];

  const data = stagesList.map(st => {
    const stageLeads = leads.filter(l => l.stage === st.id);
    const value = stageLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
    return {
      id: st.id,
      name: st.label,
      value,
      color: st.color
    };
  });

  const handleBarClick = (entry: any) => {
    navigate(`/leads?stage=${entry.id}`);
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', marginBottom: '12px' }}>
        <Target size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Valor do Funil Comercial por Estágio</span>
      </div>

      <div style={{ flexGrow: 1, width: '100%', height: '80%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <XAxis type="number" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v/1000}k`} />
            <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
              itemStyle={{ fontSize: '11px', color: '#fff' }}
              formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Total']}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 4, 4, 0]}
              barSize={16}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  onClick={() => handleBarClick(entry)}
                  style={{ cursor: 'pointer', outline: 'none' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
        💡 Clique nas barras para abrir e filtrar os Leads daquele estágio no Funil.
      </div>
    </div>
  );
}
