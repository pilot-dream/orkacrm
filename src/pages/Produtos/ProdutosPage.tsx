import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useProductStore } from '../../entities/produto/model/store';
import type { Product } from '../../entities/produto/model/types';
import { PageContainer } from '../../shared/components/PageContainer';
import { SearchBar } from '../../shared/components/SearchBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';

const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function ProdutosPage() {
  const { products, loading, error, fetchProducts, addProduct, updateProduct, deleteProduct } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formSetup, setFormSetup] = useState('');
  const [formMrr, setFormMrr] = useState('');
  const [formPercentual, setFormPercentual] = useState('');
  const [formStatus, setFormStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Error and Toast States
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome || !formSetup || !formMrr) return;

    const newProd: Product = {
      id: generateUUID(),
      nome: formNome,
      categoria: formCategoria,
      descricao: formDescricao,
      setup: Number(formSetup),
      mrr: Number(formMrr),
      percentual: Number(formPercentual || 0),
      status: formStatus
    };

    try {
      setModalError(null);
      const success = await addProduct(newProd);
      if (success) {
        setIsAddModalOpen(false);
        resetForm();
        showToast('Produto cadastrado com sucesso! 🎉');
      } else {
        setModalError(error || 'Erro ao adicionar produto no Supabase. Verifique se o migration.sql foi executado.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Erro ao adicionar produto.');
    }
  };

  const handleEditClick = (p: Product) => {
    setModalError(null);
    setSelectedProduct(p);
    setFormNome(p.nome);
    setFormCategoria(p.categoria || '');
    setFormDescricao(p.descricao || '');
    setFormSetup(String(p.setup));
    setFormMrr(String(p.mrr));
    setFormPercentual(String(p.percentual));
    setFormStatus(p.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const updatedProd: Product = {
      ...selectedProduct,
      nome: formNome,
      categoria: formCategoria,
      descricao: formDescricao,
      setup: Number(formSetup),
      mrr: Number(formMrr),
      percentual: Number(formPercentual || 0),
      status: formStatus
    };

    try {
      setModalError(null);
      const success = await updateProduct(updatedProd);
      if (success) {
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        resetForm();
        showToast('Produto atualizado com sucesso! 🎉');
      } else {
        setModalError(error || 'Erro ao atualizar produto no Supabase.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Erro ao atualizar produto.');
    }
  };

  const handleDeleteClick = (id: string) => {
    setProductToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDeleteId) {
      try {
        const success = await deleteProduct(productToDeleteId);
        if (success) {
          showToast('Produto excluído com sucesso! 🗑️');
        } else {
          alert('Erro ao excluir produto no Supabase.');
        }
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir produto.');
      }
    }
    setIsDeleteConfirmOpen(false);
    setProductToDeleteId(null);
  };

  const resetForm = () => {
    setFormNome('');
    setFormCategoria('');
    setFormDescricao('');
    setFormSetup('');
    setFormMrr('');
    setFormPercentual('');
    setFormStatus('ativo');
    setModalError(null);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Produtos & Serviços</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Tabela mestre de precificação de soluções ORKA</p>
        </div>
        <button className="primary-btn" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus size={16} />
          <span>Cadastrar Produto</span>
        </button>
      </header>

      {/* Filter bar */}
      <section style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar produtos pelo nome ou categoria..." />
        
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: '160px', padding: '6px 12px' }}
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </section>

      {loading && <LoadingOverlay active={true} message="Carregando produtos..." />}
      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Product List/Grid */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Nome</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Categoria</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Setup</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>MRR (Recorrência)</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Percentual (%)</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition-smooth)' }} className="table-row-hover">
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{p.nome}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px' }}>{p.descricao || 'Sem descrição.'}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.categoria || 'Não Categorizado'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{formatCurrency(p.setup)}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(p.mrr)}</td>
                <td style={{ padding: '12px 16px' }}>{p.percentual}%</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: p.status === 'ativo' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    color: p.status === 'ativo' ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '12px' }}>
                    <button 
                      className="icon-btn" 
                      style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => handleEditClick(p)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="icon-btn" 
                      style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => handleDeleteClick(p.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum produto cadastrado.</div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Novo Produto</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)', marginBottom: '14px' }}>
                {modalError}
              </div>
            )}
            
            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Produto *</span>
                <input type="text" className="form-input" value={formNome} onChange={(e) => setFormNome(e.target.value)} required placeholder="Ex: Onboarding AI Integration" />
              </div>
              <div className="input-group">
                <span className="input-label">Categoria</span>
                <input type="text" className="form-input" value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)} placeholder="Ex: Automação / Inteligência" />
              </div>
              <div className="input-group">
                <span className="input-label">Descrição</span>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'none' }} value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} placeholder="Descrição resumida..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Taxa de Setup *</span>
                  <input type="number" className="form-input" value={formSetup} onChange={(e) => setFormSetup(e.target.value)} required placeholder="Ex: 5000" />
                </div>
                <div className="input-group">
                  <span className="input-label">Mensalidade (MRR) *</span>
                  <input type="number" className="form-input" value={formMrr} onChange={(e) => setFormMrr(e.target.value)} required placeholder="Ex: 1200" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Percentual (%)</span>
                  <input type="number" className="form-input" value={formPercentual} onChange={(e) => setFormPercentual(e.target.value)} placeholder="Ex: 5" />
                </div>
                <div className="input-group">
                  <span className="input-label">Status</span>
                  <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Editar Produto</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsEditModalOpen(false)}>✕</button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)', marginBottom: '14px' }}>
                {modalError}
              </div>
            )}
            
            <form onSubmit={handleUpdateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Produto *</span>
                <input type="text" className="form-input" value={formNome} onChange={(e) => setFormNome(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-label">Categoria</span>
                <input type="text" className="form-input" value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)} />
              </div>
              <div className="input-group">
                <span className="input-label">Descrição</span>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'none' }} value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Taxa de Setup *</span>
                  <input type="number" className="form-input" value={formSetup} onChange={(e) => setFormSetup(e.target.value)} required />
                </div>
                <div className="input-group">
                  <span className="input-label">Mensalidade (MRR) *</span>
                  <input type="number" className="form-input" value={formMrr} onChange={(e) => setFormMrr(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Percentual (%)</span>
                  <input type="number" className="form-input" value={formPercentual} onChange={(e) => setFormPercentual(e.target.value)} />
                </div>
                <div className="input-group">
                  <span className="input-label">Status</span>
                  <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        title="Excluir Produto?"
        message="Isto removerá o produto de forma permanente do cadastro geral de preços da empresa. Continuar?"
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: '#10B981',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1100,
          fontWeight: 600,
          animation: 'slideIn 0.3s ease-out'
        }}>
          {toastMessage}
        </div>
      )}
    </PageContainer>
  );
}
