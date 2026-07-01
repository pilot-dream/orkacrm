import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  User
} from 'lucide-react';
import { useClienteStore } from '../../entities/cliente/model/store';
import type { Cliente } from '../../entities/cliente/model/types';
import { PageContainer } from '../../shared/components/PageContainer';
import { SearchBar } from '../../shared/components/SearchBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { isSupabaseActive, supabase } from '../../shared/api/supabaseClient';

export default function ClientesPage() {
  const { clientes, loading, error, fetchClientes, addCliente, deleteCliente } = useClienteStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Modals / Drawer
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customerToDeleteId, setCustomerToDeleteId] = useState<string | null>(null);

  // Tab State inside Profile Drawer
  const [activeProfileTab, setActiveProfileTab] = useState<'resumo' | 'projetos' | 'financeiro' | 'contratos' | 'arquivos' | 'timeline' | 'equipe' | 'observacoes'>('resumo');

  // Form states for creating Customer
  const [formName, setFormName] = useState('');
  const [formPlan, setFormPlan] = useState('ORKA Enterprise AI');
  const [formMonthlySpend, setFormMonthlySpend] = useState('');
  const [formPoc, setFormPoc] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formStartDate, setFormStartDate] = useState('');

  // Associated entities state (fetched dynamically when customer is selected)
  const [associatedProjects, setAssociatedProjects] = useState<any[]>([]);
  const [associatedTransactions, setAssociatedTransactions] = useState<any[]>([]);
  const [associatedContracts, setAssociatedContracts] = useState<any[]>([]);
  const [associatedFiles, setAssociatedFiles] = useState<any[]>([]);
  const [associatedTimeline, setAssociatedTimeline] = useState<any[]>([]);
  const [obsText, setObsText] = useState('');

  const selectedCustomer = clientes.find(c => c.id === selectedCustomerId);

  useEffect(() => {
    fetchClientes();
  }, []);

  // Fetch associated customer details when selectedCustomerId changes
  useEffect(() => {
    if (selectedCustomerId && selectedCustomer) {
      fetchCustomerAssociations(selectedCustomer);
      setActiveProfileTab('resumo');
    }
  }, [selectedCustomerId]);

  const fetchCustomerAssociations = async (cust: Cliente) => {
    if (isSupabaseActive()) {
      try {
        // Associated Projects: where description or name matches the client name, or in DB matching
        const { data: projs } = await supabase
          .from('projects')
          .select('*')
          .ilike('name', `%${cust.name}%`);
        setAssociatedProjects(projs || []);

        // Associated Transactions: where party matches
        const { data: trxs } = await supabase
          .from('transactions')
          .select('*')
          .eq('party', cust.name)
          .order('due_date', { ascending: false });
        setAssociatedTransactions(trxs || []);

        // Associated Contracts: where client matches
        const { data: conts } = await supabase
          .from('contracts')
          .select('*')
          .eq('client', cust.name);
        setAssociatedContracts(conts || []);

        // Associated Timeline: from atividades where relationship matches customer id
        const { data: acts } = await supabase
          .from('atividades')
          .select('*')
          .eq('relacionamento_id', cust.id)
          .order('created_at', { ascending: false });
        setAssociatedTimeline(acts || []);

        // Associated Files: from arquivos where relationship matches customer id
        const { data: files } = await supabase
          .from('arquivos')
          .select('*')
          .eq('relacionamento_id', cust.id);
        setAssociatedFiles(files || []);

      } catch (err) {
        console.error('Error fetching customer associations:', err);
      }
    } else {
      // Mocked local values
      setAssociatedProjects([
        { id: '1', name: `Implementação - ${cust.name}`, stage: 'desenvolvimento', deadline: '25/08/2026', progress: 45 }
      ]);
      setAssociatedTransactions([
        { id: '1', type: 'income', description: 'Taxa Setup Orquestração', value: cust.monthlySpend ? cust.monthlySpend * 3 : 15000, due_date: cust.startDate || '15/06/2026', status: 'Recebido' }
      ]);
      setAssociatedContracts([
        { id: '1', title: `Contrato Guarda-Chuva - ${cust.name}`, value: (cust.monthlySpend || 5000) * 12, start_date: cust.startDate || '15/06/2026', status: 'Vigente' }
      ]);
      setAssociatedFiles([
        { id: '1', nome: 'Minuta_Acordo_Orka_SaaS.pdf', tamanho: 2450, url: '#' }
      ]);
      setAssociatedTimeline([
        { id: '1', titulo: 'Cliente Integrado', descricao: 'Onboarding iniciado pela equipe comercial.', date: cust.startDate || '15/06/2026' }
      ]);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newCust: Cliente = {
      id: `cust-${Date.now()}`,
      name: formName,
      abbr: formName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2),
      plan: formPlan,
      automationsCount: 0,
      monthlySpend: formMonthlySpend ? Number(formMonthlySpend) : 0,
      status: formStatus,
      startDate: formStartDate || new Date().toLocaleDateString('pt-BR'),
      poc: formPoc
    };

    const success = await addCliente(newCust);
    if (success) {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (customerToDeleteId) {
      await deleteCliente(customerToDeleteId);
    }
    setIsDeleteConfirmOpen(false);
    setCustomerToDeleteId(null);
  };

  const resetForm = () => {
    setFormName('');
    setFormPlan('ORKA Enterprise AI');
    setFormMonthlySpend('');
    setFormPoc('');
    setFormStatus('active');
    setFormStartDate('');
  };

  const filteredCustomers = clientes.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.poc && c.poc.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPlan = planFilter === 'all' || c.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <PageContainer>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Diretório de Clientes</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Gestão de Contas Ativas e Receitas Recorrentes (MRR)</p>
        </div>
        <button className="primary-btn" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus size={16} />
          <span>Cadastrar Cliente</span>
        </button>
      </header>

      {/* Filter and Search */}
      <section style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar clientes por empresa ou ponto de contato..." />
        
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end' }}>
          <select 
            value={planFilter} 
            onChange={(e) => setPlanFilter(e.target.value)}
            className="form-select"
            style={{ width: '200px', padding: '6px 12px' }}
          >
            <option value="all">Todos os Planos</option>
            <option value="ORKA Enterprise AI">ORKA Enterprise AI</option>
            <option value="ORKA Team Core">ORKA Team Core</option>
            <option value="Plano Customizado ORKA">Plano Customizado</option>
          </select>
        </div>
      </section>

      {loading && <LoadingOverlay active={true} message="Carregando clientes..." />}
      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Table of customers */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Cliente</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Pessoa de Contato</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Plano Contratado</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Faturamento Mensal (MRR)</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Data Início</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
              <tr 
                key={c.id} 
                onClick={() => {
                  setSelectedCustomerId(c.id);
                  setIsDetailDrawerOpen(true);
                }}
                style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition-smooth)' }} 
                className="table-row-hover"
              >
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(45, 140, 255, 0.1)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {c.abbr || c.name.charAt(0).toUpperCase()}
                    </div>
                    {c.name}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>{c.poc || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{c.plan || 'Plano Básico'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(c.monthlySpend || 0)}</td>
                <td style={{ padding: '12px 16px' }}>{c.startDate || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: c.status === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    color: c.status === 'active' ? 'var(--color-success)' : 'var(--color-danger)'
                  }}>
                    {c.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="icon-btn" 
                    onClick={(e) => handleDeleteClick(c.id, e)}
                    style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCustomers.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum cliente cadastrado.</div>
        )}
      </div>

      {/* Profile Detail Drawer (Complete 360 Customer Profile) */}
      {isDetailDrawerOpen && selectedCustomer && (
        <div className="drawer-overlay" onClick={() => setIsDetailDrawerOpen(false)} style={{ zIndex: 900 }}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ width: '640px', backgroundColor: 'var(--bg-sidebar)', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'fixed', right: 0, top: 0, zIndex: 901, boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{selectedCustomer.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Perfil Completo do Cliente</span>
              </div>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsDetailDrawerOpen(false)}>✕</button>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {([
                { id: 'resumo', label: 'Resumo' },
                { id: 'projetos', label: 'Projetos' },
                { id: 'financeiro', label: 'Financeiro' },
                { id: 'contratos', label: 'Contratos' },
                { id: 'arquivos', label: 'Arquivos' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'equipe', label: 'Equipe' },
                { id: 'observacoes', label: 'Obs' }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProfileTab(tab.id)}
                  style={{
                    padding: '8px 10px',
                    border: 'none',
                    background: 'none',
                    color: activeProfileTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                    borderBottom: activeProfileTab === tab.id ? '2px solid var(--color-primary)' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Drawer Content */}
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {activeProfileTab === 'resumo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Plano Atual</span>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>{selectedCustomer.plan || 'Plano Customizado'}</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Faturamento Mensal (MRR)</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>{formatCurrency(selectedCustomer.monthlySpend || 0)}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Pessoa de Contato (POC)</span>
                      <div className="form-input" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>{selectedCustomer.poc || 'Não informado'}</div>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Data de Onboarding</span>
                      <div className="form-input" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>{selectedCustomer.startDate || 'Não informada'}</div>
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-label">Automações Ativas</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>
                        {selectedCustomer.automationsCount || 0}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>integrações rodando no back-end</span>
                    </div>
                  </div>

                  {/* Traceabilidade HubSpot / Salesforce style */}
                  <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary, #60A5FA)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🔗 Traceabilidade e Origem (CRM)
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.78rem' }}>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted, #64748B)' }}>Lead Original</span>
                        <strong style={{ color: '#fff' }}>{selectedCustomer.originalLead || selectedCustomer.name}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted, #64748B)' }}>Data de Conversão</span>
                        <strong style={{ color: '#fff' }}>{selectedCustomer.conversionDate || selectedCustomer.startDate || 'Manual'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted, #64748B)' }}>Conversão Realizada por</span>
                        <strong style={{ color: '#fff' }}>{selectedCustomer.convertedBy || selectedCustomer.owner || 'Comercial'}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-muted, #64748B)' }}>Responsável Atual</span>
                        <strong style={{ color: '#fff' }}>{selectedCustomer.owner || 'Sem responsável'}</strong>
                      </div>
                    </div>

                    {selectedCustomer.cnpj && (
                      <div style={{ borderTop: '1px solid rgba(51, 65, 85, 0.4)', paddingTop: '8px', fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-muted, #64748B)' }}>CNPJ: </span>
                        <strong style={{ color: '#fff' }}>{selectedCustomer.cnpj}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeProfileTab === 'projetos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Projetos Operacionais</h4>
                  {associatedProjects.map((p, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{p.name}</span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: p.stage === 'concluido' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(45, 140, 255, 0.1)',
                          color: p.stage === 'concluido' ? 'var(--color-success)' : 'var(--color-primary)'
                        }}>
                          {p.stage.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Prazo de Entrega: <b>{p.deadline || '-'}</b></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                        <div style={{ flexGrow: 1, height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${p.progress || 0}%`, height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                  {associatedProjects.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      Nenhum projeto de onboarding configurado.
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'financeiro' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Histórico de Lançamentos</h4>
                  {associatedTransactions.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{t.description}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Vencimento: {t.due_date}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(t.value)}</div>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: t.status === 'Recebido' || t.status === 'Pago' ? 'var(--color-success)' : 'var(--color-warning)'
                        }}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                  {associatedTransactions.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      Nenhum lançamento financeiro registrado.
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'contratos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Contratos e Acordos</h4>
                  {associatedContracts.map((c, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-card)', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>{c.title}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>{c.status}</span>
                      </div>
                      <div>Valor do Contrato: <b>{formatCurrency(c.value)}</b></div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Início de Vigência: {c.start_date}</div>
                    </div>
                  ))}
                  {associatedContracts.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      Nenhum contrato ativo.
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'arquivos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Anexos e Documentos</h4>
                  {associatedFiles.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{f.nome}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(f.tamanho / 1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                  {associatedFiles.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                      Nenhum documento anexado.
                    </div>
                  )}
                </div>
              )}

              {activeProfileTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Linha do Tempo de Atividades</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid var(--border-color)', paddingLeft: '16px', marginLeft: '8px' }}>
                    {associatedTimeline.map((item, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-22px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{item.titulo}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{item.descricao}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.created_at ? new Date(item.created_at).toLocaleString('pt-BR') : item.date}
                        </div>
                      </div>
                    ))}
                    {associatedTimeline.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhum log de timeline.</div>
                    )}
                  </div>
                </div>
              )}

              {activeProfileTab === 'equipe' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Responsáveis pela Conta</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>Orka Admin</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gerente de Contas Principal</span>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'observacoes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Observações Gerais</h4>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: '120px', resize: 'none' }} 
                    placeholder="Anotações comerciais ou operacionais sobre o cliente..."
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                  />
                  <button className="primary-btn" style={{ alignSelf: 'flex-end' }}>Salvar Notas</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Cadastrar Cliente Ativo</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome da Empresa / Cliente *</span>
                <input type="text" className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="Ex: Stripe Brasil" />
              </div>
              <div className="input-group">
                <span className="input-label">Plano Contratado</span>
                <select className="form-select" value={formPlan} onChange={(e) => setFormPlan(e.target.value)}>
                  <option value="ORKA Enterprise AI">ORKA Enterprise AI</option>
                  <option value="ORKA Team Core">ORKA Team Core</option>
                  <option value="Plano Customizado ORKA">Plano Customizado ORKA</option>
                </select>
              </div>
              <div className="input-group">
                <span className="input-label">Gasto Mensal (MRR) (R$)</span>
                <input type="number" className="form-input" value={formMonthlySpend} onChange={(e) => setFormMonthlySpend(e.target.value)} placeholder="Ex: 5000" />
              </div>
              <div className="input-group">
                <span className="input-label">Pessoa de Contato (POC)</span>
                <input type="text" className="form-input" value={formPoc} onChange={(e) => setFormPoc(e.target.value)} placeholder="Ex: Beatriz Santos" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Data de Início</span>
                  <input type="text" className="form-input" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} placeholder="Ex: 01 Fev 2026" />
                </div>
                <div className="input-group">
                  <span className="input-label">Status</span>
                  <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Cadastrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        title="Remover Cliente?"
        message="Esta ação é permanente e removerá os dados de faturamento associados a este cliente. Deseja continuar?"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />

    </PageContainer>
  );
}
