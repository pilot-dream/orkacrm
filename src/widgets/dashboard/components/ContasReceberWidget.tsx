import React, { useEffect } from 'react';
import { ArrowDownRight, TrendingUp } from 'lucide-react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { CardSkeleton } from '../../skeletons/WidgetSkeletons';

export const ContasReceberWidget: React.FC = () => {
  const { transactions, loading, fetchTransactions } = useFinanceiroStore();

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading && transactions.length === 0) {
    return <CardSkeleton height="100%" />;
  }

  const receitasPendentes = transactions.filter(t => t.type === 'income' && t.status === 'Pendente');

  const parseDate = (dStr: string) => {
    const parts = dStr.split('/');
    if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    return new Date();
  };

  const sortedReceitas = receitasPendentes.sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime()).slice(0, 5);

  const total = receitasPendentes.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
          <ArrowDownRight size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contas a Receber</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total a receber pendente</div>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        {sortedReceitas.map((t) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{t.description}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Venc: {t.dueDate}</div>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
            </div>
          </div>
        ))}
        {sortedReceitas.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Nenhuma conta a receber pendente.
          </div>
        )}
      </div>
    </div>
  );
};

export default ContasReceberWidget;
