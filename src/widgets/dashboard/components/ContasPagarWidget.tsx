import React, { useEffect, useMemo } from 'react';
import { ArrowUpRight, AlertTriangle } from 'lucide-react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { CardSkeleton } from '../../skeletons/WidgetSkeletons';

export const ContasPagarWidget: React.FC = () => {
  const { transactions, loading, fetchTransactions } = useFinanceiroStore();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const parseDate = (dStr: string) => {
    const parts = dStr.split('/');
    if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    return new Date();
  };

  const getPaymentStatus = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = parseDate(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'atrasado';
    if (diffDays === 0) return 'hoje';
    if (diffDays === 1) return 'amanha';
    return 'normal';
  };

  const despesasPendentes = transactions.filter(t => t.type === 'expense' && (t.status === 'Pendente' || t.status === 'Atrasado'));

  const overdueCount = useMemo(() => {
    return despesasPendentes.filter(t => getPaymentStatus(t.dueDate) === 'atrasado').length;
  }, [despesasPendentes]);

  if (loading && transactions.length === 0) {
    return <CardSkeleton height="100%" />;
  }

  const sortedDespesas = despesasPendentes.sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime()).slice(0, 5);

  const total = despesasPendentes.reduce((acc, curr) => acc + curr.value, 0);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
          <ArrowUpRight size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contas a Pagar</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total a pagar pendente</div>
        
        {overdueCount > 0 && (
          <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚠️ Você possui {overdueCount} {overdueCount === 1 ? 'conta atrasada' : 'contas atrasadas'}!</span>
          </div>
        )}
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        {sortedDespesas.map((t) => {
          const status = getPaymentStatus(t.dueDate);
          
          let borderStyle = '1px solid var(--border-color)';
          let bgStyle = 'rgba(255,255,255,0.01)';
          let valueColor = 'var(--color-danger)';

          if (status === 'atrasado') {
            borderStyle = '1px solid rgba(239, 68, 68, 0.2)';
            bgStyle = 'rgba(239, 68, 68, 0.05)';
            valueColor = '#ef4444';
          }

          return (
            <div 
              key={t.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px', 
                backgroundColor: bgStyle, 
                borderRadius: '6px', 
                border: borderStyle,
                transition: 'all 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>{t.description}</div>
                  
                  {status === 'atrasado' && (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '3px', 
                      fontSize: '0.6rem', 
                      fontWeight: 700, 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      color: '#ef4444', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      borderRadius: '4px', 
                      padding: '2px 6px',
                      textTransform: 'uppercase'
                    }}>
                      <AlertTriangle size={10} />
                      ATRASADO
                    </span>
                  )}
                  {status === 'hoje' && (
                    <span className="animate-pulse" style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      fontSize: '0.6rem', 
                      fontWeight: 700, 
                      backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                      color: '#f59e0b', 
                      border: '1px solid rgba(245, 158, 11, 0.2)', 
                      borderRadius: '4px', 
                      padding: '2px 6px',
                      textTransform: 'uppercase'
                    }}>
                      VENCE HOJE
                    </span>
                  )}
                  {status === 'amanha' && (
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      fontSize: '0.6rem', 
                      fontWeight: 700, 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                      color: '#3b82f6', 
                      border: '1px solid rgba(59, 130, 246, 0.2)', 
                      borderRadius: '4px', 
                      padding: '2px 6px',
                      textTransform: 'uppercase'
                    }}>
                      VENCE AMANHÃ
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Venc: {t.dueDate}</div>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: valueColor }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
              </div>
            </div>
          );
        })}
        {sortedDespesas.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Nenhuma conta a pagar pendente.
          </div>
        )}
      </div>
    </div>
  );
};

export default ContasPagarWidget;
