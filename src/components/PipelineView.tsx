import React, { useState } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  User, 
  X 
} from 'lucide-react';

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  value: number;
  stage: 'contato' | 'qualificacao' | 'proposta' | 'negociacao' | 'contrato';
  aiScore: number;
  aiInsights: string;
  dateAdded: string;
  email: string;
  needs: string;
  phone: string;
  whatsapp: boolean;
  source: string;
  owner: string;
  observations?: string[];
  history?: string[];
  timeline?: { date: string; title: string; desc: string }[];
}

interface PipelineViewProps {
  leads: Lead[];
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (id: string) => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  leads,
  onUpdateLead,
  onDeleteLead,
  selectedLeadId,
  setSelectedLeadId
}) => {
  const [selectedTab, setSelectedTab] = useState<'info' | 'ai' | 'notes'>('info');

  const stages = [
    { id: 'contato', label: 'Contato Inicial' },
    { id: 'qualificacao', label: 'Qualificação' },
    { id: 'proposta', label: 'Proposta Enviada' },
    { id: 'negociacao', label: 'Negociação' },
    { id: 'contrato', label: 'Contrato Assinado' }
  ];

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  const moveLeadStage = (lead: Lead, newStage: Lead['stage']) => {
    onUpdateLead({
      ...lead,
      stage: newStage
    });
  };

  return (
    <div className="content-wrapper animate-slide-up" style={{ position: 'relative' }}>
      
      {/* Pipeline Stages Grid */}
      <div className="pipeline-board">
        {stages.map((stage) => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          const stageTotal = stageLeads.reduce((acc, curr) => acc + curr.value, 0);

          return (
            <div key={stage.id} className="pipeline-column">
              <div className="column-header">
                <span className="column-title">
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: stage.id === 'contrato' ? 'var(--color-success)' : 'var(--color-primary)' 
                  }}></span>
                  {stage.label}
                </span>
                <span className="column-count">{stageLeads.length}</span>
              </div>
              
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total: {formatCurrency(stageTotal)}
              </div>

              <div className="column-cards-wrapper">
                {stageLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className={`lead-card ${selectedLeadId === lead.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <div className="lead-card-header">
                      <span className="lead-company">{lead.company}</span>
                      <span className="lead-ai-score">
                        <Sparkles size={10} />
                        {lead.aiScore}%
                      </span>
                    </div>

                    <div className="lead-value">
                      {formatCurrency(lead.value)}
                    </div>

                    <div className="lead-footer">
                      <span>{lead.contactName}</span>
                      <span className="lead-tag">AI OK</span>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div style={{ 
                    border: '1px dashed var(--border-color)', 
                    borderRadius: 'var(--border-radius-md)', 
                    padding: '24px 12px', 
                    textAlign: 'center', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)' 
                  }}>
                    Sem negócios ativos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-out Drawer */}
      {selectedLead && (
        <div className="drawer-overlay" onClick={() => setSelectedLeadId(null)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            
            <div className="drawer-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedLead.company}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cadastrado em {selectedLead.dateAdded}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="outline-btn" 
                  style={{ fontSize: '0.65rem', padding: '3px 8px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  onClick={() => {
                    onDeleteLead(selectedLead.id);
                    setSelectedLeadId(null);
                  }}
                >
                  Excluir
                </button>
                <button className="close-btn" onClick={() => setSelectedLeadId(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* AI Score Badge in Drawer Header */}
            <div className="ai-analysis-box" style={{ padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ai-analysis-title">
                  <Sparkles size={14} style={{ color: '#C084FC' }} />
                  <span className="ai-sparkle-text">ORKA AI Lead Scoring</span>
                </span>
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: 800, 
                  color: '#C084FC',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>{selectedLead.aiScore}%</span>
              </div>
            </div>

            <div className="drawer-tabs">
              <span 
                className={`drawer-tab ${selectedTab === 'info' ? 'active' : ''}`}
                onClick={() => setSelectedTab('info')}
              >
                Informações
              </span>
              <span 
                className={`drawer-tab ${selectedTab === 'ai' ? 'active' : ''}`}
                onClick={() => setSelectedTab('ai')}
              >
                Análise de IA
              </span>
              <span 
                className={`drawer-tab ${selectedTab === 'notes' ? 'active' : ''}`}
                onClick={() => setSelectedTab('notes')}
              >
                Necessidades
              </span>
            </div>

            {selectedTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                
                <div className="drawer-section">
                  <span className="section-label">Estágio do Funil</span>
                  <select 
                    value={selectedLead.stage} 
                    onChange={(e) => moveLeadStage(selectedLead, e.target.value as Lead['stage'])}
                    className="form-select"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="drawer-field-grid">
                  <div className="drawer-section">
                    <span className="section-label">Valor Projetado</span>
                    <div className="drawer-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700 }}>
                      <DollarSign size={16} />
                      <input 
                        type="number"
                        value={selectedLead.value}
                        onChange={(e) => onUpdateLead({ ...selectedLead, value: Number(e.target.value) })}
                        style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'inherit', outline: 'none', width: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="drawer-section">
                    <span className="section-label">Contato</span>
                    <div className="drawer-field" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} className="text-secondary" />
                      <span>{selectedLead.contactName}</span>
                    </div>
                  </div>
                </div>

                <div className="drawer-section">
                  <span className="section-label">E-mail Corporativo</span>
                  <div className="drawer-field">
                    <span>{selectedLead.email}</span>
                  </div>
                </div>

              </div>
            )}

            {selectedTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                <div className="ai-analysis-box">
                  <span className="ai-analysis-title">
                    <Sparkles size={14} style={{ color: '#5AA9FF' }} />
                    <span className="ai-sparkle-text">Relatório Cognitivo Orka Brain</span>
                  </span>
                  <p className="ai-analysis-text">
                    {selectedLead.aiInsights}
                  </p>
                </div>

                <div className="drawer-section">
                  <span className="section-label">Sugestões de Próximo Passo</span>
                  <ul style={{ paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Agendar reunião de alinhamento focando em automação de CRM.</li>
                    <li>Apresentar demonstrativo funcional do orquestrador de agents.</li>
                    <li>Oferecer plano corporativo com 15% de desconto de onboarding.</li>
                  </ul>
                </div>
              </div>
            )}

            {selectedTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
                <div className="drawer-section">
                  <span className="section-label">Requisitos do Projeto</span>
                  <textarea
                    className="drawer-field"
                    style={{ 
                      minHeight: '150px', 
                      resize: 'none', 
                      fontFamily: 'inherit', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-main)', 
                      outline: 'none',
                      lineHeight: 1.6
                    }}
                    value={selectedLead.needs}
                    onChange={(e) => onUpdateLead({ ...selectedLead, needs: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', gap: '12px' }}>
              <button 
                className="outline-btn" 
                style={{ flexGrow: 1, justifyContent: 'center' }}
                onClick={() => setSelectedLeadId(null)}
              >
                Salvar & Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
