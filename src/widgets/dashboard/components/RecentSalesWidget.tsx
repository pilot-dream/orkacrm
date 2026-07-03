import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { DollarSign, RefreshCw, AlertCircle, ShoppingBag, Plus } from 'lucide-react';

export default function RecentSalesWidget() {
  const navigate = useNavigate();
  const { transactions, loading, error, fetchTransactions } = useFinanceiroStore();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchTransactions(true);
  };

  const handleCreateSale = () => {
    navigate('/financeiro');
  };

  const sales = transactions.filter(t => t.type === 'income').slice(0, 4);

  const status = (loading && transactions.length === 0)
    ? 'loading'
    : error
      ? 'error'
      : sales.length > 0
        ? 'success'
        : 'empty';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  if (status === 'loading') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px',
        height: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '150px', height: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} className="skeleton-pulse"></div>
          <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} className="skeleton-pulse"></div>
        </div>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '56px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }} className="skeleton-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px',
        height: '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <AlertCircle size={32} color="var(--color-danger)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Falha ao carregar vendas recentes.</span>
        <button onClick={handleRefresh} className="outline-btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Recarregar</button>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px',
        height: '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
          <ShoppingBag size={32} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, display: 'block' }}>Nenhuma venda realizada</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Cadastre propostas comerciais para gerar novos faturamentos.</span>
        </div>
        <button onClick={handleCreateSale} className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
          <Plus size={12} /> Registrar Venda
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '360px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
          <DollarSign size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Vendas Recentes</span>
        </div>
        <button 
          onClick={handleRefresh} 
          style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} 
          title="Recarregar vendas recentes"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
        {sales.map((sale) => (
          <div 
            key={sale.id} 
            onClick={() => navigate('/financeiro')}
            style={{ 
              padding: '10px 14px', 
              backgroundColor: 'rgba(16, 185, 129, 0.02)', 
              borderRadius: '6px', 
              border: '1px solid rgba(16, 185, 129, 0.08)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            title="Clique para ir ao Livro Razão Financeiro"
          >
            <div>
              <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{sale.description}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Cliente: {sale.party || '-'} • Data: {sale.dueDate}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(sale.value)}</span>
              <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-muted)' }}>{sale.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
