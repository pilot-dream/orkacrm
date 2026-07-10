import { useMemo } from 'react';
import { Wallet, DollarSign, Activity, CircleAlert } from 'lucide-react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useFilterStore, isDateInRange } from '../../../entities/dashboard/model/filterStore';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
};

export const FinanceSummaryWidget = () => {
  const { transactions } = useFinanceiroStore();
  const { startDate, endDate, dateRangeLabel, setDateRange } = useFilterStore();
  const navigate = useNavigate();
  const { receitas, despesas, lucro } = useMemo(() => {
    const validTransactions = transactions.filter(t => isDateInRange(t.dueDate, startDate, endDate));
    const rec = validTransactions.filter(t => t.type === 'income' && t.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
    const desp = validTransactions.filter(t => t.type === 'expense' && t.status === 'Pago').reduce((acc, curr) => acc + curr.value, 0);
    return { receitas: rec, despesas: desp, lucro: rec - desp };
  }, [transactions, startDate, endDate]);

  const contasAPagar = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return transactions
      .filter(t => t.type === 'expense' && t.status === 'Pendente')
      .map(t => {
        const dueDateStr = t.dueDate?.includes('T') ? t.dueDate : `${t.dueDate}T00:00:00`;
        const dueDate = new Date(dueDateStr);
        let days = 0;
        if (!isNaN(dueDate.getTime())) {
          const diffTime = dueDate.getTime() - today.getTime();
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return { name: t.description, value: t.value, days, isOverdue: days < 0 };
      })
      .sort((a, b) => a.days - b.days)
      .slice(0, 3); // top 3
  }, [transactions]);

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Financeiro</h3>
        <select 
          value={dateRangeLabel}
          onChange={(e) => setDateRange(e.target.value as any)}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', padding: '6px', borderRadius: '6px' }}><DollarSign size={16} /></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receitas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{formatCurrency(receitas)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '6px', borderRadius: '6px' }}><Wallet size={16} /></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Despesas</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{formatCurrency(despesas)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-purple)', padding: '6px', borderRadius: '6px' }}><Activity size={16} /></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lucro Líquido</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{formatCurrency(lucro)}</span>
          </div>
        </div>

      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Contas a Pagar</h4>
          <span 
            style={{ fontSize: '0.75rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => navigate('/app/financeiro')}
          >
            Ver todas
          </span>
        </div>

        {contasAPagar.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contasAPagar.map((conta, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx % 2 === 0 ? 'var(--color-primary)' : 'var(--color-success)' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{conta.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vence em {conta.days} dias</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{formatCurrency(conta.value)}</span>
                  <span style={{ fontSize: '0.7rem', color: conta.isOverdue ? 'var(--color-danger)' : 'var(--color-warning)' }}>{conta.isOverdue ? 'Atrasada' : 'A vencer'}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)', gap: '8px' }}>
            <CircleAlert size={24} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '0.85rem' }}>Nenhuma conta a pagar.</span>
            <span style={{ fontSize: '0.75rem' }}>Sua operação está organizada.</span>
          </div>
        )}
      </div>

    </div>
  );
};
