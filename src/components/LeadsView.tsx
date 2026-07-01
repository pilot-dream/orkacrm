import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Phone, 
  X, 
  Clock, 
  User
} from 'lucide-react';
import type { Lead } from './PipelineView';
import type { TeamMember } from './SettingsView';

interface LeadsViewProps {
  leads: Lead[];
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (id: string) => void;
  teamMembers: TeamMember[];
  onAddNewLead: (newLead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ 
  leads, 
  onUpdateLead, 
  onDeleteLead,
  teamMembers,
  onAddNewLead 
}) => {
  // --- STATE VARIABLES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'details' | 'timeline'>('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newNote, setNewNote] = useState('');

  // --- EDIT STATE FOR LEAD ---
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState(true);
  const [editEmail, setEditEmail] = useState('');
  const [editSource, setEditSource] = useState('Site');
  const [editOwner, setEditOwner] = useState('Orka Admin');
  const [editValue, setEditValue] = useState('');
  const [editStage, setEditStage] = useState<Lead['stage']>('contato');
  const [editNeeds, setEditNeeds] = useState('');

  // --- FORM STATE FOR NEW LEAD ---
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState(true);
  const [formEmail, setFormEmail] = useState('');
  const [formSource, setFormSource] = useState('Site');
  const [formOwner, setFormOwner] = useState('Orka Admin');
  const [formValue, setFormValue] = useState('');
  const [formStage, setFormStage] = useState<Lead['stage']>('contato');
  const [formNeeds, setFormNeeds] = useState('');

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  // --- FILTER & SEARCH LOGIC ---
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.stage === statusFilter;
    const matchesOwner = ownerFilter === 'all' || lead.owner === ownerFilter;
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
    
    let matchesScore = true;
    if (scoreFilter === 'high') matchesScore = lead.aiScore >= 90;
    else if (scoreFilter === 'medium') matchesScore = lead.aiScore >= 80 && lead.aiScore < 90;
    else if (scoreFilter === 'low') matchesScore = lead.aiScore < 80;

    return matchesSearch && matchesStatus && matchesOwner && matchesSource && matchesScore;
  });

  // --- HELPER FORMATTING FUNCTIONS ---
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'Site':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', border: '1px solid rgba(59, 130, 246, 0.2)' }}>Site</span>;
      case 'Outbound':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.2)' }}>Outbound</span>;
      case 'Indicação':
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Indicação</span>;
      default:
        return <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#9CA3AF', border: '1px solid rgba(107, 114, 128, 0.2)' }}>{source}</span>;
    }
  };

  const getStatusBadge = (stage: Lead['stage']) => {
    switch (stage) {
      case 'contato':
        return <span className="badge" style={{ backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60A5FA', border: '1px solid rgba(96, 165, 250, 0.2)' }}>Contato</span>;
      case 'qualificacao':
        return <span className="badge" style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#A78BFA', border: '1px solid rgba(167, 139, 250, 0.2)' }}>Qualificação</span>;
      case 'proposta':
        return <span className="badge" style={{ backgroundColor: 'rgba(244, 114, 182, 0.1)', color: '#F472B6', border: '1px solid rgba(244, 114, 182, 0.2)' }}>Proposta</span>;
      case 'negociacao':
        return <span className="badge" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#FBBF24', border: '1px solid rgba(251, 191, 36, 0.2)' }}>Negociação</span>;
      case 'contrato':
        return <span className="badge badge-success">Contrato</span>;
      default:
        return null;
    }
  };

  const getScorePill = (score: number) => {
    let color = 'var(--text-secondary)';
    let bg = 'rgba(255,255,255,0.03)';
    let border = '1px solid var(--border-color)';
    let glow = 'none';

    if (score >= 90) {
      color = '#C084FC';
      bg = 'rgba(139, 92, 246, 0.12)';
      border = '1px solid rgba(139, 92, 246, 0.3)';
      glow = '0 0 10px rgba(139, 92, 246, 0.25)';
    } else if (score >= 80) {
      color = 'var(--color-warning)';
      bg = 'rgba(245, 158, 11, 0.12)';
      border = '1px solid rgba(245, 158, 11, 0.3)';
    }

    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px', 
        padding: '3px 8px', 
        borderRadius: '6px', 
        fontSize: '0.75rem', 
        fontWeight: 700, 
        color, 
        backgroundColor: bg, 
        border,
        boxShadow: glow
      }}>
        <Sparkles size={11} />
        {score}%
      </span>
    );
  };

  // --- ACTIONS HANDLERS ---
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCompany || !formValue) return;

    const computedScore = Math.floor(Math.random() * (99 - 70 + 1)) + 70;
    const newLead: Lead = {
      id: Math.random().toString(),
      contactName: formName,
      company: formCompany,
      phone: formPhone || '(11) 99999-9999',
      whatsapp: formWhatsapp,
      email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '')}@${formCompany.toLowerCase().replace(/\s+/g, '')}.com`,
      source: formSource,
      owner: formOwner,
      value: Number(formValue),
      stage: formStage,
      aiScore: computedScore,
      dateAdded: new Date().toLocaleDateString('pt-BR'),
      needs: formNeeds || 'Dores operacionais gerais, automação fiscal e notificações.',
      aiInsights: `Análise instantânea ORKA Brain para ${formCompany}: Fit comercial excelente (${computedScore}%). Dores concentradas no módulo de automação. Recomendado apresentar case de sucesso de integração nativa do HubSpot com Slack.`,
      observations: [formNeeds || 'Lead criado no sistema.'],
      history: ['Lead cadastrado no CRM.', `IA gerou primeiro score de qualificação: ${computedScore}%`],
      timeline: [
        { date: new Date().toLocaleDateString('pt-BR'), title: 'Lead Cadastrado', desc: `Lead inserido no sistema com estágio inicial em ${formStage}.` }
      ]
    };

    onAddNewLead(newLead);
    setIsModalOpen(false);

    // Reset fields
    setFormName('');
    setFormCompany('');
    setFormPhone('');
    setFormWhatsapp(true);
    setFormEmail('');
    setFormSource('Site');
    setFormOwner('Orka Admin');
    setFormValue('');
    setFormStage('contato');
    setFormNeeds('');
  };

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead) return;

    const currentObs = selectedLead.observations || [];
    const currentHist = selectedLead.history || [];
    const currentTimeline = selectedLead.timeline || [];

    const updatedLead: Lead = {
      ...selectedLead,
      observations: [newNote.trim(), ...currentObs],
      history: [`Nova anotação inserida por Orka Admin: "${newNote.trim()}"`, ...currentHist],
      timeline: [
        { date: new Date().toLocaleDateString('pt-BR'), title: 'Anotação Adicionada', desc: newNote.trim() },
        ...currentTimeline
      ]
    };

    onUpdateLead(updatedLead);
    setNewNote('');
  };

  const handleAiAnalysis = () => {
    if (!selectedLead) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const generatedScore = Math.floor(Math.random() * (99 - 85 + 1)) + 85; // higher score on re-analysis
      const insightsList = [
        `ORKA Brain recalculou o fit comercial da ${selectedLead.company} com novas diretrizes. Score otimizado para ${generatedScore}%.`,
        `Identificado gargalo crítico de latência em canais de prospecção. Recomendado acionar o WhatsApp automatizado imediatamente.`,
        `O contato principal (${selectedLead.contactName}) demonstra alto nível de decisão técnica. Direcionar o foco do pitch em integrações APIs.`
      ];

      const currentHist = selectedLead.history || [];
      const currentTimeline = selectedLead.timeline || [];

      const updatedLead: Lead = {
        ...selectedLead,
        aiScore: generatedScore,
        aiInsights: insightsList.join(' '),
        history: ['Análise de IA Avançada disparada manualmente.', `Score recalculado de ${selectedLead.aiScore}% para ${generatedScore}%`, ...currentHist],
        timeline: [
          { date: new Date().toLocaleDateString('pt-BR'), title: 'Análise de IA Avançada', desc: `Re-escalado score comercial para ${generatedScore}% com novos insights operacionais.` },
          ...currentTimeline
        ]
      };

      onUpdateLead(updatedLead);
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleSaveLeadEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    const updated: Lead = {
      ...selectedLead,
      contactName: editName,
      company: editCompany,
      phone: editPhone,
      whatsapp: editWhatsapp,
      email: editEmail,
      source: editSource,
      owner: editOwner,
      value: Number(editValue),
      stage: editStage,
      needs: editNeeds
    };
    onUpdateLead(updated);
    setIsEditing(false);
  };

  return (
    <>
      <div className="content-wrapper animate-slide-up" style={{ position: 'relative' }}>
      
      {/* 1. CONTROL HEADER BAR (SEARCH & FILTERS & ADD BUTTON) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          {/* Search Box */}
          <div className="search-box" style={{ width: '100%', maxWidth: '360px' }}>
            <Search size={16} className="text-secondary" />
            <input 
              type="text" 
              placeholder="Buscar por nome, empresa, e-mail ou telefone..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Novo Lead</span>
          </button>
        </div>

        {/* Filters Grid Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '16px', 
          padding: '16px', 
          borderRadius: 'var(--border-radius-lg)', 
          border: '1px solid var(--border-color)', 
          backgroundColor: 'rgba(255,255,255,0.01)'
        }}>
          {/* Status Filter */}
          <div className="input-group">
            <span className="input-label">Status</span>
            <select 
              className="form-select" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="contato">Contato Inicial</option>
              <option value="qualificacao">Qualificação</option>
              <option value="proposta">Proposta Enviada</option>
              <option value="negociacao">Negociação</option>
              <option value="contrato">Contrato Assinado</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div className="input-group">
            <span className="input-label">Responsável</span>
            <select 
              className="form-select" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="input-group">
            <span className="input-label">Origem</span>
            <select 
              className="form-select" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="Site">Site</option>
              <option value="Outbound">Outbound</option>
              <option value="Indicação">Indicação</option>
            </select>
          </div>

          {/* AI Score Filter */}
          <div className="input-group">
            <span className="input-label">Qualificação (Score)</span>
            <select 
              className="form-select" 
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="high">Alta Prioridade (&ge; 90%)</option>
              <option value="medium">Média Prioridade (80-89%)</option>
              <option value="low">Baixa Prioridade (&lt; 80%)</option>
            </select>
          </div>
        </div>

      </div>

      <div 
        className={selectedLead ? "leads-drawer-grid" : ""} 
        style={{ 
          display: selectedLead ? undefined : 'block', 
          transition: 'all 0.3s ease', 
          alignItems: 'start' 
        }}
      >
        
        {/* WIDESCREEN TABLE */}
        <div className="table-container">
          <table className="customer-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '14px 16px' }}>Nome</th>
                <th style={{ padding: '14px 16px' }}>Empresa</th>
                <th style={{ padding: '14px 16px' }}>Contato</th>
                <th style={{ padding: '14px 16px' }}>WhatsApp</th>
                <th style={{ padding: '14px 16px' }}>Origem</th>
                <th style={{ padding: '14px 16px' }}>Responsável</th>
                <th style={{ padding: '14px 16px' }}>Score IA</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const initials = lead.contactName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                return (
                  <tr 
                    key={lead.id} 
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedLeadId(selectedLeadId === lead.id ? null : lead.id)}
                    className={selectedLeadId === lead.id ? 'active-row' : ''}
                  >
                    {/* Name column with avatar initials */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#FFF'
                        }}>
                          {initials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{lead.contactName}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lead.email}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{lead.company}</td>
                    
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={10} /> {lead.phone}
                        </span>
                      </div>
                    </td>

                    {/* WhatsApp column */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {lead.whatsapp ? (
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '999px', 
                          backgroundColor: 'rgba(16, 185, 129, 0.08)', 
                          color: 'var(--color-success)', 
                          border: '1px solid rgba(16, 185, 129, 0.2)', 
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-success)' }}></span>
                          Sim
                        </span>
                      ) : (
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '999px', 
                          backgroundColor: 'rgba(255,255,255,0.02)', 
                          color: 'var(--text-muted)', 
                          border: '1px solid var(--border-color)', 
                          fontSize: '0.7rem'
                        }}>
                          Não
                        </span>
                      )}
                    </td>
                    
                    <td style={{ padding: '14px 16px' }}>{getSourceBadge(lead.source)}</td>
                    
                    <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={12} style={{ color: 'var(--color-primary)' }} />
                        <span>{lead.owner}</span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '14px 16px' }}>{getScorePill(lead.aiScore)}</td>
                    
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(lead.stage)}</td>
                    
                    <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lead.dateAdded}</td>
                  </tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Nenhum lead correspondente aos filtros foi encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. SIDE-DRAWER DETAILS PANEL */}
        {selectedLead && (
          <aside className="orka-ai-panel" style={{ padding: '20px', gap: '20px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFF' }}>{selectedLead.company}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ficha de Qualificação</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {!isEditing && (
                  <button 
                    className="outline-btn" 
                    style={{ fontSize: '0.65rem', padding: '3px 8px' }}
                    onClick={() => {
                      setIsEditing(true);
                      setEditName(selectedLead.contactName);
                      setEditCompany(selectedLead.company);
                      setEditPhone(selectedLead.phone);
                      setEditWhatsapp(selectedLead.whatsapp);
                      setEditEmail(selectedLead.email);
                      setEditSource(selectedLead.source);
                      setEditOwner(selectedLead.owner);
                      setEditValue(String(selectedLead.value));
                      setEditStage(selectedLead.stage);
                      setEditNeeds(selectedLead.needs || '');
                    }}
                  >
                    Editar
                  </button>
                )}
                <button 
                  className="outline-btn" 
                  style={{ fontSize: '0.65rem', padding: '3px 8px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={() => {
                    onDeleteLead(selectedLead.id);
                    setSelectedLeadId(null);
                    setIsEditing(false);
                  }}
                >
                  Excluir
                </button>
                <button 
                  className="close-btn" 
                  style={{ fontSize: '0.8rem', padding: '4px', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedLeadId(null);
                    setIsEditing(false);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveLeadEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <div className="input-group">
                  <span className="input-label">Nome do Contato</span>
                  <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <span className="input-label">Empresa</span>
                  <input type="text" className="form-input" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} required />
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">E-mail</span>
                    <input type="email" className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Telefone</span>
                    <input type="text" className="form-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.78rem' }}>
                  <input type="checkbox" checked={editWhatsapp} onChange={(e) => setEditWhatsapp(e.target.checked)} />
                  <span>Telefone é WhatsApp Ativo?</span>
                </label>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Origem</span>
                    <select className="form-select" value={editSource} onChange={(e) => setEditSource(e.target.value)}>
                      <option value="Site">Site</option>
                      <option value="Outbound">Outbound</option>
                      <option value="Indicação">Indicação</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <span className="input-label">Responsável</span>
                    <select className="form-select" value={editOwner} onChange={(e) => setEditOwner(e.target.value)}>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Valor Estimado (R$)</span>
                    <input type="number" className="form-input" value={editValue} onChange={(e) => setEditValue(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Estágio Atual</span>
                    <select className="form-select" value={editStage} onChange={(e) => setEditStage(e.target.value as any)}>
                      <option value="contato">Contato Inicial</option>
                      <option value="qualificacao">Qualificação</option>
                      <option value="proposta">Proposta Enviada</option>
                      <option value="negociacao">Negociação</option>
                      <option value="contrato">Contrato Assinado</option>
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <span className="input-label">Necessidades do Lead</span>
                  <textarea className="form-input" style={{ minHeight: '60px', resize: 'none', fontFamily: 'inherit' }} value={editNeeds} onChange={(e) => setEditNeeds(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" className="outline-btn" style={{ fontSize: '0.75rem' }} onClick={() => setIsEditing(false)}>Cancelar</button>
                  <button type="submit" className="primary-btn" style={{ fontSize: '0.75rem' }}>Salvar Alterações</button>
                </div>
              </form>
            ) : (
              <>
                {/* Navigation Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px' }}>
              <button
                style={{ 
                  flexGrow: 1, 
                  background: 'none', 
                  border: 'none', 
                  color: activeDrawerTab === 'details' ? 'var(--color-primary)' : 'var(--text-secondary)', 
                  fontWeight: activeDrawerTab === 'details' ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '8px 12px',
                  borderBottom: activeDrawerTab === 'details' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveDrawerTab('details')}
              >
                Ficha & IA
              </button>
              <button
                style={{ 
                  flexGrow: 1, 
                  background: 'none', 
                  border: 'none', 
                  color: activeDrawerTab === 'timeline' ? 'var(--color-primary)' : 'var(--text-secondary)', 
                  fontWeight: activeDrawerTab === 'timeline' ? 700 : 500,
                  fontSize: '0.78rem',
                  padding: '8px 12px',
                  borderBottom: activeDrawerTab === 'timeline' ? '2px solid var(--color-primary)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveDrawerTab('timeline')}
              >
                Timeline & Notas
              </button>
            </div>

            {/* TAB CONTENT 1: DETAILS & IA */}
            {activeDrawerTab === 'details' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Profile Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Nome:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{selectedLead.contactName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>E-mail:</span>
                    <span style={{ fontWeight: 500, color: 'var(--color-primary-hover)' }}>{selectedLead.email}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Telefone:</span>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{selectedLead.phone}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Origem:</span>
                    <span>{selectedLead.source}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Responsável:</span>
                    <span style={{ fontWeight: 600 }}>{selectedLead.owner}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Valor Estimado:</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(selectedLead.value)}</span>
                  </div>
                </div>

                {/* AI Score Circular Card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'linear-gradient(135deg, rgba(139,92,246,0.03) 0%, rgba(45,140,255,0.03) 100%)' }}>
                  <div style={{ 
                    width: '54px', 
                    height: '54px', 
                    borderRadius: '50%', 
                    border: '3px solid rgba(139, 92, 246, 0.4)', 
                    borderTopColor: 'var(--color-purple)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 800, 
                    fontSize: '1rem', 
                    color: '#C084FC',
                    boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)'
                  }}>
                    {selectedLead.aiScore}%
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: '#FFF' }}>
                      <Sparkles size={12} style={{ color: '#C084FC' }} />
                      ORKA Brain Score
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      Fit operacional calculado em tempo real
                    </span>
                  </div>
                </div>

                {/* ORKA Brain Insights */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Insight do Copiloto
                  </span>
                  <div style={{ padding: '12px', border: '1px dashed rgba(139, 92, 246, 0.25)', borderRadius: '8px', backgroundColor: 'rgba(139,92,246,0.02)', fontSize: '0.78rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                    {selectedLead.aiInsights}
                  </div>
                </div>

                {/* AI Analysis trigger button */}
                <button 
                  className="primary-btn" 
                  style={{ 
                    justifyContent: 'center', 
                    background: 'linear-gradient(90deg, var(--color-purple) 0%, var(--color-primary) 100%)', 
                    border: 'none',
                    padding: '12px',
                    width: '100%',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.25)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="status-dot" style={{ backgroundColor: '#fff', animation: 'pulse-glow 1s infinite' }}></span>
                      <span>Analisando com IA...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} />
                      <span>Analisar com IA</span>
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* TAB CONTENT 2: TIMELINE & OBSERVATIONS */}
            {activeDrawerTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Note Taking observations form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Adicionar Observação</span>
                  <form onSubmit={handleAddObservation} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea 
                      placeholder="Descreva observações, follow-ups ou minutas de reuniões..." 
                      className="form-input"
                      style={{ fontSize: '0.78rem', minHeight: '60px', resize: 'none', fontFamily: 'inherit' }}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      required
                    />
                    <button type="submit" className="outline-btn" style={{ fontSize: '0.72rem', padding: '6px 12px', justifyContent: 'center' }}>
                      <span>Salvar Nota</span>
                    </button>
                  </form>
                </div>

                {/* Timeline display */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Timeline do Lead</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '18px', borderLeft: '1px solid var(--border-color)', marginLeft: '8px' }}>
                    {selectedLead.timeline?.map((item, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        {/* Dot indicator */}
                        <div style={{ 
                          position: 'absolute', 
                          left: '-23px', 
                          top: '3px', 
                          width: '9px', 
                          height: '9px', 
                          borderRadius: '50%', 
                          backgroundColor: idx === 0 ? 'var(--color-primary)' : 'var(--border-color)',
                          border: idx === 0 ? '2.5px solid var(--bg-card)' : '1px solid var(--border-color)',
                          boxShadow: idx === 0 ? '0 0 8px var(--color-primary)' : 'none'
                        }}></div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{item.title}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.date}</span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{item.desc}</span>
                        </div>
                      </div>
                    ))}
                    {(!selectedLead.timeline || selectedLead.timeline.length === 0) && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sem registros de timeline.</span>
                    )}
                  </div>
                </div>

                {/* Historical records */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Histórico Operacional</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                    {selectedLead.history?.map((log, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', fontSize: '0.7rem', padding: '6px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)' }}>
                        <Clock size={10} style={{ marginTop: '2px', color: 'var(--text-muted)' }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Anotações Salvas ({selectedLead.observations?.length || 0})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedLead.observations?.map((obs, idx) => (
                      <div key={idx} style={{ padding: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: '1.4' }}>{obs}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          <span>Anotado por Orka Admin</span>
                          <span>Nota #{selectedLead.observations!.length - idx}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
        )}

      </div>
    </div>

      {/* 4. MODAL OVERLAY FOR NEW LEAD CREATION */}
      {isModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', padding: '24px 0' }}>
          <div className="card animate-slide-up" style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Cadastrar Novo Lead no Funil</h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Contact Name & Company */}
              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Nome Completo</span>
                  <input 
                    type="text" 
                    placeholder="Ex: Beatriz Santos" 
                    className="form-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <span className="input-label">Nome da Empresa</span>
                  <input 
                    type="text" 
                    placeholder="Ex: Stripe Brasil" 
                    className="form-input"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">E-mail Corporativo</span>
                  <input 
                    type="email" 
                    placeholder="Ex: beatriz@stripe.com" 
                    className="form-input"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <span className="input-label">Telefone de Contato</span>
                  <input 
                    type="text" 
                    placeholder="Ex: (11) 98765-4321" 
                    className="form-input"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Whatsapp Active & Origem */}
              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Canal Origem</span>
                  <select 
                    value={formSource} 
                    onChange={(e) => setFormSource(e.target.value)}
                    className="form-select"
                  >
                    <option value="Site">Site</option>
                    <option value="Outbound">Outbound</option>
                    <option value="Indicação">Indicação</option>
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Responsável</span>
                  <select 
                    value={formOwner} 
                    onChange={(e) => setFormOwner(e.target.value)}
                    className="form-select"
                  >
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Valor Estimado & Estágio Inicial */}
              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Valor do Negócio (R$)</span>
                  <input 
                    type="number" 
                    placeholder="Ex: 45000" 
                    className="form-input"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <span className="input-label">Estágio Inicial</span>
                  <select 
                    value={formStage} 
                    onChange={(e) => setFormStage(e.target.value as Lead['stage'])}
                    className="form-select"
                  >
                    <option value="contato">Contato Inicial</option>
                    <option value="qualificacao">Qualificação</option>
                    <option value="proposta">Proposta Enviada</option>
                    <option value="negociacao">Negociação</option>
                    <option value="contrato">Contrato Assinado</option>
                  </select>
                </div>
              </div>

              {/* Row 5: WhatsApp Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', userSelect: 'none' }}>
                <input 
                  type="checkbox" 
                  checked={formWhatsapp} 
                  onChange={(e) => setFormWhatsapp(e.target.checked)} 
                  style={{ accentColor: 'var(--color-success)', width: '15px', height: '15px' }}
                />
                <span>O telefone acima é WhatsApp Ativo?</span>
              </label>

              {/* Needs & Observations */}
              <div className="input-group">
                <span className="input-label">Necessidades & Observações Iniciais</span>
                <textarea 
                  placeholder="Quais são as principais dores operacionais e automações requisitadas pelo lead?" 
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'none', fontFamily: 'inherit' }}
                  value={formNeeds}
                  onChange={(e) => setFormNeeds(e.target.value)}
                />
              </div>

              {/* Sparkle Banner */}
              <div className="ai-analysis-box" style={{ padding: '12px', fontSize: '0.75rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Sparkles size={14} style={{ color: '#C084FC' }} />
                <span>
                  Ao salvar, a IA do <b>ORKA Brain</b> efetuará a triagem do score e gerará as diretrizes de prospecção automaticamente.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  <span>Adicionar Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
