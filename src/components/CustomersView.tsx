import React, { useState, useEffect, useRef } from 'react';
import { isSupabaseActive } from '../lib/supabaseClient';
import { supabaseCustomers } from '../lib/supabaseService';
import { 
  Search, 
  X, 
  FileText, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Download, 
  TrendingUp, 
  User,
  CheckCircle2,
  Plus
} from 'lucide-react';

export interface Customer {
  id: string;
  name: string;
  abbr: string;
  plan: string;
  automationsCount: number;
  monthlySpend: number;
  status: 'active' | 'onboarding' | 'paused';
  startDate: string;
  poc: string; // Point of Contact
  // Extended fields for 7 tabs
  projects: { name: string; progress: number; status: string }[];
  financial: { invoice: string; value: number; date: string; status: 'pago' | 'pendente' }[];
  files: { name: string; size: string; type: string }[];
  contracts: { title: string; status: string; date: string }[];
  conversations: { sender: string; message: string; time: string }[];
  aiPanel: {
    summary: string;
    interactions: string[];
    nextAction: string;
    churnRisk: number; // 0 to 100
    opportunities: string[];
  };
  timelineEvents: { date: string; title: string; type: string }[];
}

export const initialCustomers: Customer[] = [
    { 
      id: '1', 
      name: 'Stripe Brasil', 
      abbr: 'ST', 
      plan: 'ORKA Enterprise AI', 
      automationsCount: 14, 
      monthlySpend: 18500, 
      status: 'active', 
      startDate: '15 Jan 2026', 
      poc: 'Beatriz Santos',
      projects: [
        { name: 'Orquestração Financeira de Conciliação', progress: 92, status: 'Homologação' },
        { name: 'Automação de Disparo WhatsApp Corporativo', progress: 100, status: 'Concluído' },
        { name: 'Triagem e Logs de API no Slack', progress: 40, status: 'Desenvolvimento' }
      ],
      financial: [
        { invoice: 'INV-2026-05', value: 18500, date: '10/06/2026', status: 'pago' },
        { invoice: 'INV-2026-04', value: 18500, date: '10/05/2026', status: 'pago' },
        { invoice: 'INV-2026-03', value: 18500, date: '10/04/2026', status: 'pago' }
      ],
      files: [
        { name: 'briefing_tecnico_integracoes.pdf', size: '1.4 MB', type: 'PDF' },
        { name: 'documentacao_api_final.docx', size: '420 KB', type: 'Word' },
        { name: 'schema_logs_conciliacao.json', size: '12 KB', type: 'JSON' }
      ],
      contracts: [
        { title: 'ORKA-MSA-STRIPE-2026.pdf', status: 'Ativo', date: '15/01/2026' },
        { title: 'ORKA-SLA-ADDENDUM-2026.pdf', status: 'Ativo', date: '16/01/2026' }
      ],
      conversations: [
        { sender: 'Beatriz Santos', message: 'Olá! Conseguimos validar o deploy de homologação fiscal hoje à tarde?', time: 'Ontem, 14:30' },
        { sender: 'Orka Admin (Você)', message: 'Olá, Beatriz! Sim, o bot de conciliação rodou com sucesso. Vou liberar o acesso para vocês testarem.', time: 'Ontem, 14:42' },
        { sender: 'Beatriz Santos', message: 'Maravilha. Aguardo as credenciais!', time: 'Ontem, 14:45' }
      ],
      aiPanel: {
        summary: 'Stripe Brasil é um cliente estratégico de alto ticket. Apresenta volumetria operacional estável e taxa de sucesso nas automações em 99.8%. Engajamento excelente com a POC Beatriz.',
        interactions: [
          'Validação de deploy do bot de conciliação (Ontem)',
          'Sync semanal de acompanhamento comercial (Há 3 dias)'
        ],
        nextAction: 'Liberar credenciais de sandbox e agendar chamada de QBR.',
        churnRisk: 3,
        opportunities: [
          'Up-sell para orquestração fiscal integrada com SAP (Adicional de R$ 6.000/mês).',
          'Sugerir módulo de suporte automático por voz com IA.'
        ]
      },
      timelineEvents: [
        { date: '15 Jan 2026', title: 'Assinatura do Contrato Enterprise', type: 'comercial' },
        { date: '20 Jan 2026', title: 'Setup de Conexão com Webhooks', type: 'tecnico' },
        { date: '15 Fev 2026', title: 'Lançamento do Módulo WhatsApp', type: 'tecnico' },
        { date: '10 Jun 2026', title: 'Fatura de MRR Paga com Sucesso', type: 'financeiro' }
      ]
    },
    { 
      id: '2', 
      name: 'Vercel Inc', 
      abbr: 'VC', 
      plan: 'ORKA Scale AI', 
      automationsCount: 8, 
      monthlySpend: 12000, 
      status: 'active', 
      startDate: '10 Fev 2026', 
      poc: 'Guilherme Ramos',
      projects: [
        { name: 'Agentes Autônomos de QA pós-deploy', progress: 75, status: 'Desenvolvimento' },
        { name: 'Automação de Reports de Latência no Slack', progress: 100, status: 'Concluído' }
      ],
      financial: [
        { invoice: 'INV-2026-08', value: 12000, date: '10/06/2026', status: 'pago' },
        { invoice: 'INV-2026-07', value: 12000, date: '10/05/2026', status: 'pago' }
      ],
      files: [
        { name: 'qa_agent_architecture.pdf', size: '2.1 MB', type: 'PDF' },
        { name: 'security_audit_vercel.pdf', size: '920 KB', type: 'PDF' }
      ],
      contracts: [
        { title: 'ORKA-VITE-SCALE-CONTRACT.pdf', status: 'Ativo', date: '10/02/2026' }
      ],
      conversations: [
        { sender: 'Guilherme Ramos', message: 'Tivemos uma latência acima do comum no webhook de deploy ontem.', time: '24/06, 09:15' },
        { sender: 'Orka Admin (Você)', message: 'Guilherme, investigamos e foi uma instabilidade pontual na AWS. Já normalizado.', time: '24/06, 09:30' }
      ],
      aiPanel: {
        summary: 'Vercel Inc está rodando testes de agentes autônomos de QA em larga escala. Algumas instabilidades de latência foram reportadas, mas o engajamento técnico do Guilherme continua altíssimo.',
        interactions: [
          'Suporte técnico de monitoramento de deploy (Há 2 dias)',
          'Demonstração comercial de QA automático (Há 6 dias)'
        ],
        nextAction: 'Agendar sync técnica para revisar latência de webhook AWS.',
        churnRisk: 14,
        opportunities: [
          'Venda adicional de logs arquivados em cold storage (R$ 1.200/mês).',
          'Apresentar orquestrador de automações de QA integradas.'
        ]
      },
      timelineEvents: [
        { date: '10 Fev 2026', title: 'Início da Parceria Scale AI', type: 'comercial' },
        { date: '12 Fev 2026', title: 'Integração de Webhooks Vercel', type: 'tecnico' },
        { date: '22 Abr 2026', title: 'Deploy do Monitor de Logs', type: 'tecnico' }
      ]
    },
    { 
      id: '3', 
      name: 'Linear Systems', 
      abbr: 'LN', 
      plan: 'ORKA Pro AI', 
      automationsCount: 5, 
      monthlySpend: 7500, 
      status: 'active', 
      startDate: '03 Mar 2026', 
      poc: 'Karina Lopes',
      projects: [
        { name: 'Filtro e Triagem Automática de Bugs', progress: 40, status: 'Desenvolvimento' }
      ],
      financial: [
        { invoice: 'INV-2026-11', value: 7500, date: '10/06/2026', status: 'pago' },
        { invoice: 'INV-2026-10', value: 7500, date: '10/05/2026', status: 'pago' }
      ],
      files: [
        { name: 'triagem_regras_linear.json', size: '8 KB', type: 'JSON' }
      ],
      contracts: [
        { title: 'ORKA-PRO-LINEAR-TERMS.pdf', status: 'Ativo', date: '03/03/2026' }
      ],
      conversations: [
        { sender: 'Karina Lopes', message: 'A categorização de bugs está excelente! Economizamos 10 horas semanais.', time: '20/06, 11:20' }
      ],
      aiPanel: {
        summary: 'Linear Systems está operando com ótima margem de automação. ROI muito claro devido às horas economizadas com triagem automática de bugs. Relacionamento muito saudável.',
        interactions: [
          'Suporte técnico de rotulagem de tags (Há 5 dias)'
        ],
        nextAction: 'Oferecer módulo de alertas SMS para bugs de prioridade máxima.',
        churnRisk: 5,
        opportunities: [
          'Módulo de alertas SMS via Twilio (R$ 800/mês).',
          'Up-sell para plano Scale AI de maior volumetria.'
        ]
      },
      timelineEvents: [
        { date: '03 Mar 2026', title: 'Contratação do Plano Pro AI', type: 'comercial' },
        { date: '15 Mar 2026', title: 'Integração de APIs Concluída', type: 'tecnico' }
      ]
    },
    { 
      id: '4', 
      name: 'HypeTech Corp', 
      abbr: 'HT', 
      plan: 'ORKA Pro AI', 
      automationsCount: 4, 
      monthlySpend: 7500, 
      status: 'onboarding', 
      startDate: '18 Jun 2026', 
      poc: 'Felipe Dias',
      projects: [
        { name: 'Atendente Cognitivo de WhatsApp', progress: 15, status: 'Setup Inicial' }
      ],
      financial: [
        { invoice: 'INV-2026-15', value: 7500, date: '10/07/2026', status: 'pendente' }
      ],
      files: [
        { name: 'briefing_cognitivo_hypetech.pdf', size: '2.5 MB', type: 'PDF' }
      ],
      contracts: [
        { title: 'ORKA-PRO-HYPETECH-MSA.pdf', status: 'Assinatura Jurídica', date: '18/06/2026' }
      ],
      conversations: [
        { sender: 'Felipe Dias', message: 'Olá, quando começamos a rodar os testes do bot cognitivo?', time: '25/06, 17:00' },
        { sender: 'Orka Admin (Você)', message: 'Olá, Felipe! Já finalizamos o mapeamento. Iniciamos os testes na segunda-feira.', time: '25/06, 17:15' }
      ],
      aiPanel: {
        summary: 'HypeTech Corp está em fase inicial de onboarding. Estágio crítico de entrega técnica do bot cognitivo. Requer acompanhamento de perto para garantir satisfação inicial.',
        interactions: [
          'Alinhamento comercial de setup operacional (Ontem)'
        ],
        nextAction: 'Validar testes de homologação do bot de WhatsApp na segunda-feira.',
        churnRisk: 12,
        opportunities: [
          'Venda de pacote de treinamento de LLM customizado (Projeto pontual R$ 15.000).'
        ]
      },
      timelineEvents: [
        { date: '18 Jun 2026', title: 'Assinatura do Onboarding', type: 'comercial' },
        { date: '25 Jun 2026', title: 'Mapeamento de Escopo Concluído', type: 'tecnico' }
      ]
    },
    { 
      id: '5', 
      name: 'Airtable Ltd', 
      abbr: 'AT', 
      plan: 'Custom Integration', 
      automationsCount: 12, 
      monthlySpend: 15000, 
      status: 'paused', 
      startDate: '22 Set 2025', 
      poc: 'Amanda Lima',
      projects: [
        { name: 'Sincronização de Data-Hub', progress: 100, status: 'Pausado' }
      ],
      financial: [
        { invoice: 'INV-2026-01', value: 15000, date: '10/02/2026', status: 'pago' }
      ],
      files: [
        { name: 'airtable_sync_architecture.pdf', size: '1.8 MB', type: 'PDF' }
      ],
      contracts: [
        { title: 'ORKA-CUSTOM-AIRTABLE-2025.pdf', status: 'Pausado', date: '22/09/2025' }
      ],
      conversations: [
        { sender: 'Amanda Lima', message: 'Precisamos congelar as automações por este trimestre devido a corte de orçamento.', time: '01/03, 10:00' }
      ],
      aiPanel: {
        summary: 'Airtable Ltd pausou as automações devido a corte de budget interno. O risco de churn total é altíssimo (62%) caso não haja reengajamento comercial em breve.',
        interactions: [
          'E-mail de verificação de status operacional (Há 1 mês)'
        ],
        nextAction: 'Enviar e-mail para Amanda sugerindo call de reativação com desconto temporário.',
        churnRisk: 62,
        opportunities: [
          'Reativação das automações de sincronização de dados.',
          'Proposta de plano Pro reduzido.'
        ]
      },
      timelineEvents: [
        { date: '22 Set 2025', title: 'Início da Integração Customizada', type: 'comercial' },
        { date: '01 Mar 2026', title: 'Pausa no Projeto solicitada pelo cliente', type: 'comercial' }
      ]
    }
  ];

export const CustomersView: React.FC<{ userEmail?: string }> = ({ userEmail }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'onboarding' | 'paused'>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumo' | 'timeline' | 'projects' | 'financial' | 'files' | 'contracts' | 'conversations'>('resumo');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const isLoadedRef = useRef(false);

  // Modal State for Novo Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPlan, setNewCustPlan] = useState('ORKA Pro AI');
  const [newCustSpend, setNewCustSpend] = useState('');
  const [newCustPoc, setNewCustPoc] = useState('');
  const [newCustStatus, setNewCustStatus] = useState<'active' | 'onboarding' | 'paused'>('active');

  useEffect(() => {
    const loadCustomers = async () => {
      if (userEmail) {
        if (isSupabaseActive()) {
          const dbCustomers = await supabaseCustomers.fetch();
          setCustomers(dbCustomers);
        } else {
          const key = 'orka_customers';
          const saved = localStorage.getItem(key);
          if (saved) {
            setCustomers(JSON.parse(saved));
          } else {
            setCustomers([]);
            localStorage.setItem(key, JSON.stringify([]));
          }
        }
      }
      isLoadedRef.current = true;
    };
    loadCustomers();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && !isSupabaseActive() && isLoadedRef.current) {
      localStorage.setItem('orka_customers', JSON.stringify(customers));
    }
  }, [customers, userEmail]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPoc || !newCustSpend) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      abbr: newCustName.substring(0, 2).toUpperCase(),
      plan: newCustPlan,
      automationsCount: 0,
      monthlySpend: parseFloat(newCustSpend),
      status: newCustStatus,
      startDate: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
      poc: newCustPoc,
      projects: [],
      financial: [],
      files: [],
      contracts: [],
      conversations: [],
      aiPanel: {
        summary: 'Novo cliente registrado via formulário.',
        interactions: ['Cliente registrado no CRM.'],
        nextAction: 'Iniciar alinhamento de onboarding e automações.',
        churnRisk: 10,
        opportunities: ['Oferecer otimização de fluxos adicionais.']
      },
      timelineEvents: [
        { date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }), title: 'Cliente cadastrado no sistema', type: 'comercial' }
      ]
    };

    setCustomers([...customers, newCust]);
    if (isSupabaseActive()) {
      supabaseCustomers.insert(newCust);
    }
    setIsModalOpen(false);
    
    // Reset form
    setNewCustName('');
    setNewCustPoc('');
    setNewCustSpend('');
    setNewCustPlan('ORKA Pro AI');
    setNewCustStatus('active');
  };

  const handleDeleteCustomer = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
      if (isSupabaseActive()) {
        supabaseCustomers.delete(id);
      }
      setSelectedCustomerId(null);
    }
  };

  // --- FILTER & SEARCH LOGIC ---
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = cust.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cust.poc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cust.plan.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cust.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const getStatusBadge = (status: Customer['status']) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Ativo</span>;
      case 'onboarding':
        return <span className="badge badge-primary">Onboarding</span>;
      case 'paused':
        return <span className="badge badge-purple" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>Pausado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="content-wrapper animate-slide-up" style={{ paddingBottom: '40px' }}>
      
      {/* Search & Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 'fit-content' }}>
          <div className="search-box" style={{ width: '100%', maxWidth: '320px' }}>
            <Search size={16} className="text-secondary" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, contato ou plano..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="mobile-scroll-tabs" style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'active', 'onboarding', 'paused'] as const).map((filter) => (
              <button
                key={filter}
                className={`outline-btn ${statusFilter === filter ? 'active' : ''}`}
                style={{ fontSize: '0.75rem', padding: '6px 12px', textTransform: 'capitalize' }}
                onClick={() => setStatusFilter(filter)}
              >
                {filter === 'all' ? 'Todos' : filter === 'active' ? 'Ativos' : filter === 'onboarding' ? 'Onboarding' : 'Pausados'}
              </button>
            ))}
          </div>
        </div>

        <button className="primary-btn" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', gap: '6px', padding: '10px 16px', fontSize: '0.8rem' }}>
          <Plus size={16} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <table className="customer-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contato Principal (POC)</th>
              <th>Automações Ativas</th>
              <th>Plano Contratado</th>
              <th>Faturamento Mensal</th>
              <th>Status</th>
              <th>Data de Início</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((cust) => (
              <tr 
                key={cust.id} 
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSelectedCustomerId(selectedCustomerId === cust.id ? null : cust.id);
                  setActiveTab('resumo');
                }}
                className={selectedCustomerId === cust.id ? 'active-row' : ''}
              >
                <td>
                  <div className="customer-meta">
                    <div className="customer-logo-abbr" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', fontWeight: 800 }}>
                      {cust.abbr}
                    </div>
                    <span style={{ fontWeight: 600 }}>{cust.name}</span>
                  </div>
                </td>
                
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                    <User size={12} className="text-secondary" />
                    <span>{cust.poc}</span>
                  </div>
                </td>
                
                <td style={{ fontWeight: 600 }}>{cust.automationsCount} automações</td>
                
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cust.plan}</td>
                
                <td style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cust.monthlySpend)}
                </td>
                
                <td>{getStatusBadge(cust.status)}</td>
                
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{cust.startDate}</td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhum cliente correspondente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* COCKPIT DETAILED DRAWER (WIDESCREEN 900PX) */}
      {selectedCustomer && (
        <div className="drawer-overlay" onClick={() => setSelectedCustomerId(null)}>
          <div className="drawer-wide animate-slide-in" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#fff'
                  }}>
                    {selectedCustomer.abbr}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF' }}>{selectedCustomer.name}</h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{selectedCustomer.plan}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="outline-btn" 
                  style={{ fontSize: '0.68rem', padding: '4px 10px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(selectedCustomer.id); }}
                >
                  Excluir
                </button>
                <button 
                  className="close-btn" 
                  style={{ padding: '6px', cursor: 'pointer' }}
                  onClick={() => setSelectedCustomerId(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Split Screen Layout: Left Columns (7 tabs) & Right Column (AI Panel) */}
            <div style={{ display: 'flex', gap: '24px', flexGrow: 1, minHeight: 0, overflowY: 'hidden' }}>
              
              {/* LEFT COLUMN: TABS AND CONTENTS */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, overflowY: 'auto', paddingRight: '4px' }}>
                
                {/* Horizontal Tabs Navigator */}
                <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px', overflowX: 'auto', flexShrink: 0 }}>
                  {([
                    { id: 'resumo', label: 'Resumo' },
                    { id: 'timeline', label: 'Timeline' },
                    { id: 'projects', label: 'Projetos' },
                    { id: 'financial', label: 'Financeiro' },
                    { id: 'files', label: 'Arquivos' },
                    { id: 'contracts', label: 'Contratos' },
                    { id: 'conversations', label: 'Conversas' }
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        fontSize: '0.75rem',
                        padding: '8px 12px',
                        borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TABS PANELS CONTENT */}
                <div style={{ flexGrow: 1 }}>
                  
                  {/* TAB 1: RESUMO */}
                  {activeTab === 'resumo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="split-info-grid">
                        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Faturamento Mensal (MRR)</span>
                          <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(selectedCustomer.monthlySpend)}
                          </h4>
                        </div>
                        <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Data de Início</span>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '6px' }}>
                            {selectedCustomer.startDate}
                          </h4>
                        </div>
                      </div>

                      <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px' }}>Sucesso das Automações</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ height: '8px', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '99.8%', backgroundColor: 'var(--color-success)' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>99.82% OK</span>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                          Total de <b>{selectedCustomer.automationsCount} rotinas ativas</b> executadas no último mês.
                        </p>
                      </div>

                      <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Ponto de Contato (POC):</span>
                          <span style={{ fontWeight: 600, color: '#FFF' }}>{selectedCustomer.poc}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Status Operacional:</span>
                          <span>{getStatusBadge(selectedCustomer.status)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TIMELINE */}
                  {activeTab === 'timeline' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '16px', borderLeft: '1px solid var(--border-color)', marginLeft: '8px', position: 'relative' }}>
                      {selectedCustomer.timelineEvents.map((evt, idx) => (
                        <div key={idx} style={{ position: 'relative' }}>
                          {/* Dot indicator */}
                          <div style={{
                            position: 'absolute',
                            left: '-21px',
                            top: '4px',
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: evt.type === 'financeiro' ? 'var(--color-success)' : evt.type === 'tecnico' ? 'var(--color-primary)' : 'var(--color-purple)',
                            border: '2px solid var(--bg-sidebar)'
                          }}></div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF' }}>{evt.title}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{evt.date}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>Segmento: {evt.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 3: PROJETOS */}
                  {activeTab === 'projects' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedCustomer.projects.map((proj, idx) => (
                        <div key={idx} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF' }}>{proj.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>{proj.status}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ height: '4px', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${proj.progress}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-purple))' }}></div>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, width: '28px', textAlign: 'right' }}>{proj.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 4: FINANCEIRO */}
                  {activeTab === 'financial' && (
                    <div className="table-container" style={{ margin: 0 }}>
                      <table className="customer-table" style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Fatura</th>
                            <th>Data Vencimento</th>
                            <th>Valor</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCustomer.financial.map((inv, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600 }}>{inv.invoice}</td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{inv.date}</td>
                              <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(inv.value)}
                              </td>
                              <td>
                                {inv.status === 'pago' ? (
                                  <span className="badge badge-success">Pago</span>
                                ) : (
                                  <span className="badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Pendente</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* TAB 5: ARQUIVOS */}
                  {activeTab === 'files' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedCustomer.files.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#FFF' }}>{file.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{file.type} • {file.size}</span>
                            </div>
                          </div>
                          <button className="icon-btn" style={{ width: '28px', height: '28px', border: 'none' }} title="Baixar arquivo">
                            <Download size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 6: CONTRATOS */}
                  {activeTab === 'contracts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedCustomer.contracts.map((contract, idx) => (
                        <div key={idx} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF' }}>{contract.title}</span>
                            <span style={{ 
                              fontSize: '0.68rem', 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              backgroundColor: contract.status === 'Ativo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: contract.status === 'Ativo' ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>{contract.status}</span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assinado em: {contract.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 7: CONVERSAS */}
                  {activeTab === 'conversations' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedCustomer.conversations.map((chat, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                            <span style={{ fontWeight: 700, color: chat.sender.includes('Você') ? 'var(--color-primary)' : '#FFF' }}>{chat.sender}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{chat.time}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{chat.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>

              {/* RIGHT COLUMN: ORKA AI CUSTOMER DASH PANEL */}
              <aside style={{ 
                width: '300px', 
                flexShrink: 0, 
                backgroundColor: 'rgba(139, 92, 246, 0.02)', 
                border: '1px dashed rgba(139, 92, 246, 0.25)', 
                borderRadius: '8px', 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '18px', 
                height: 'fit-content',
                overflowY: 'auto'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(139, 92, 246, 0.15)', paddingBottom: '10px' }}>
                  <Sparkles size={16} style={{ color: '#A78BFA' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'linear-gradient(90deg, #A78BFA 0%, #2D8CFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>ORKA AI COCKPIT</span>
                </div>

                {/* 1. CHURN RISK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} style={{ color: selectedCustomer.aiPanel.churnRisk > 30 ? 'var(--color-danger)' : 'var(--color-success)' }} />
                      Risco de Churn
                    </span>
                    <span style={{ 
                      fontWeight: 700, 
                      color: selectedCustomer.aiPanel.churnRisk > 50 ? 'var(--color-danger)' : selectedCustomer.aiPanel.churnRisk > 20 ? 'var(--color-warning)' : 'var(--color-success)' 
                    }}>
                      {selectedCustomer.aiPanel.churnRisk}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${selectedCustomer.aiPanel.churnRisk}%`, 
                      backgroundColor: selectedCustomer.aiPanel.churnRisk > 50 ? 'var(--color-danger)' : selectedCustomer.aiPanel.churnRisk > 20 ? 'var(--color-warning)' : 'var(--color-success)',
                      borderRadius: '999px',
                      boxShadow: `0 0 10px ${selectedCustomer.aiPanel.churnRisk > 30 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                    }}></div>
                  </div>
                </div>

                {/* 2. RESUMO INTELIGENTE DO CLIENTE */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resumo IA</span>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', fontSize: '0.72rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
                    {selectedCustomer.aiPanel.summary}
                  </div>
                </div>

                {/* 3. ÚLTIMAS INTERAÇÕES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Histórico IA</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedCustomer.aiPanel.interactions.map((int, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                        <Clock size={10} style={{ marginTop: '2px', color: 'var(--color-primary)' }} />
                        <span>{int}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. PRÓXIMA AÇÃO SUGERIDA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ação Recomendada</span>
                  <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.25)', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                    <CheckCircle2 size={12} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '1px' }} />
                    <span>{selectedCustomer.aiPanel.nextAction}</span>
                  </div>
                </div>

                {/* 5. OPORTUNIDADES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Oportunidades</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCustomer.aiPanel.opportunities.map((opp, idx) => (
                      <div key={idx} style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.15)', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                        <TrendingUp size={12} style={{ color: '#C084FC', flexShrink: 0, marginTop: '1px' }} />
                        <span>{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </aside>

            </div>

          </div>
        </div>
      )}
      {/* NOVO CLIENTE MODAL */}
      {isModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card animate-slide-up" style={{ width: '460px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Cadastrar Novo Cliente</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome da Empresa / Cliente</span>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Ex: Acme Corp"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Pessoa de Contato (POC)</span>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  placeholder="Ex: Carlos Oliveira"
                  value={newCustPoc}
                  onChange={(e) => setNewCustPoc(e.target.value)}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Plano de Assinatura</span>
                <select 
                  className="form-input" 
                  value={newCustPlan}
                  onChange={(e) => setNewCustPlan(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-color)' }}
                >
                  <option value="ORKA Starter AI">ORKA Starter AI (R$ 2.500/mês)</option>
                  <option value="ORKA Pro AI">ORKA Pro AI (R$ 5.000/mês)</option>
                  <option value="ORKA Enterprise AI">ORKA Enterprise AI (R$ 10.000/mês)</option>
                  <option value="Custom AI Plan">Custom AI Plan</option>
                </select>
              </div>

              <div className="input-group">
                <span className="input-label">Investimento Mensal (R$)</span>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  placeholder="Ex: 5000"
                  value={newCustSpend}
                  onChange={(e) => setNewCustSpend(e.target.value)}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Status Inicial</span>
                <select 
                  className="form-input" 
                  value={newCustStatus}
                  onChange={(e) => setNewCustStatus(e.target.value as any)}
                  style={{ backgroundColor: 'var(--bg-card)', color: '#fff', border: '1px solid var(--border-color)' }}
                >
                  <option value="active">Ativo</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="paused">Pausado</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Cadastrar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
