import React, { useState, useEffect, useRef } from 'react';
import { isSupabaseActive } from '../lib/supabaseClient';
import { supabaseAgents } from '../lib/supabaseService';
import { 
  Sparkles, 
  Cpu, 
  Play, 
  Trash2, 
  Plus, 
  Search, 
  Bot, 
  Clock, 
  Coins, 
  CheckCircle, 
  Terminal
} from 'lucide-react';

export interface Agent {
  id: string;
  name: string;
  objective: string;
  model: string;
  status: 'Ativo' | 'Inativo' | 'Falhou';
  lastRun: string;
  tokensUsed: number;
  cost: number;
  category: 'Vendas' | 'Suporte' | 'QA' | 'Operações';
}

export const initialAgents: Agent[] = [
  { id: 'agt-1', name: 'ORKA Lead Scorer', objective: 'Classificar e qualificar leads a partir de conversas e formulários em tempo real.', model: 'Claude 3.5 Sonnet', status: 'Ativo', lastRun: 'Há 2 min', tokensUsed: 412500, cost: 6.18, category: 'Vendas' },
  { id: 'agt-2', name: 'WhatsApp Bot Responder', objective: 'Responder a mensagens de WhatsApp corporativo e propor links de demonstração.', model: 'GPT-4o mini', status: 'Ativo', lastRun: 'Há 12 min', tokensUsed: 288000, cost: 0.43, category: 'Suporte' },
  { id: 'agt-3', name: 'QA Auto-Tester Agent', objective: 'Orquestrar rotinas automáticas de testes e logs em pós-deploy do Vercel.', model: 'GPT-4o', status: 'Inativo', lastRun: 'Há 1 dia', tokensUsed: 920000, cost: 13.80, category: 'QA' },
  { id: 'agt-4', name: 'Notion Meeting Summarizer', objective: 'Transcrever minutas comerciais e criar checklists de tarefas automáticas.', model: 'Llama 3.1 70B', status: 'Ativo', lastRun: 'Há 1 hora', tokensUsed: 125000, cost: 0.15, category: 'Operações' },
  { id: 'agt-5', name: 'Linear Bug Triager', objective: 'Analisar logs de erro em produção e criar issues categorizadas no Linear.', model: 'Claude 3.5 Sonnet', status: 'Falhou', lastRun: 'Há 3 horas', tokensUsed: 82000, cost: 1.23, category: 'QA' },
];

export const AgentsView: React.FC<{ isNewUser?: boolean; userEmail?: string }> = ({ userEmail }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (userEmail) {
      const key = 'orka_agents';
      const saved = localStorage.getItem(key);
      setAgents(saved ? JSON.parse(saved) : []);
      isLoadedRef.current = true;
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && isLoadedRef.current) {
      localStorage.setItem('orka_agents', JSON.stringify(agents));
    }
  }, [agents, userEmail]);

  useEffect(() => {
    const loadAgents = async () => {
      if (userEmail) {
        if (isSupabaseActive()) {
          const dbAgents = await supabaseAgents.fetch();
          setAgents(dbAgents);
        } else {
          const key = 'orka_agents';
          const saved = localStorage.getItem(key);
          if (saved) {
            setAgents(JSON.parse(saved));
          } else {
            setAgents([]);
            localStorage.setItem(key, JSON.stringify([]));
          }
        }
      }
    };
    loadAgents();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && !isSupabaseActive()) {
      localStorage.setItem('orka_agents', JSON.stringify(agents));
    }
  }, [agents, userEmail]);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentObj, setNewAgentObj] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('Claude 3.5 Sonnet');
  const [newAgentCat, setNewAgentCat] = useState<Agent['category']>('Vendas');
  const [newAgentStatus, setNewAgentStatus] = useState<Agent['status']>('Ativo');
  
  // Stats
  const totalTokens = agents.reduce((sum, a) => sum + a.tokensUsed, 0);
  const totalCost = agents.reduce((sum, a) => sum + a.cost, 0);
  const activeCount = agents.filter(a => a.status === 'Ativo').length;
  const successRate = 98.4; // constant static metric for AI nodes health

  // Mock execution
  const handleRunAgent = (id: string) => {
    setRunningAgentId(id);
    
    setTimeout(() => {
      let updated: Agent | null = null;
      setAgents(prevAgents => {
        const next = prevAgents.map(a => {
          if (a.id === id) {
            const addedTokens = Math.floor(Math.random() * (4500 - 800 + 1)) + 800; // 800 to 4500 tokens
            // cost rates in R$ per 1k tokens
            let costPer1k = 0.015; // default Claude
            if (a.model.includes('mini')) costPer1k = 0.0015;
            else if (a.model.includes('GPT-4o')) costPer1k = 0.015;
            else if (a.model.includes('Llama')) costPer1k = 0.0012;
            
            const addedCost = (addedTokens / 1000) * costPer1k;

            updated = {
              ...a,
              tokensUsed: a.tokensUsed + addedTokens,
              cost: Number((a.cost + addedCost).toFixed(2)),
              lastRun: 'Agora mesmo',
              status: a.status === 'Falhou' ? 'Ativo' : a.status
            };
            return updated;
          }
          return a;
        });

        if (updated && isSupabaseActive()) {
          supabaseAgents.update(updated);
        }
        return next;
      });
      setRunningAgentId(null);
    }, 1200);
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentObj) return;

    const newAgent: Agent = {
      id: `agt-${Math.random().toString().substring(2, 7)}`,
      name: newAgentName,
      objective: newAgentObj,
      model: newAgentModel,
      status: newAgentStatus,
      lastRun: 'Nunca executado',
      tokensUsed: 0,
      cost: 0.00,
      category: newAgentCat
    };

    setAgents([newAgent, ...agents]);
    if (isSupabaseActive()) {
      supabaseAgents.insert(newAgent);
    }
    setIsModalOpen(false);

    // reset
    setNewAgentName('');
    setNewAgentObj('');
    setNewAgentModel('Claude 3.5 Sonnet');
    setNewAgentCat('Vendas');
    setNewAgentStatus('Ativo');
  };

  // Filter logic
  const filteredAgents = agents.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.objective.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* High-tech Header stats */}
      <div className="metrics-grid">
        <div className="card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="metric-title">Tokens Processados (Mês)</span>
              <h2 className="metric-value" style={{ color: 'var(--text-main)', fontSize: '1.65rem' }}>
                {totalTokens.toLocaleString('pt-BR')} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>tkn</span>
              </h2>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(45, 140, 255, 0.1)', color: 'var(--color-primary)' }}>
              <Cpu size={20} />
            </div>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-up">↑ 18.2%</span>
            <span className="metric-period">vs semana passada</span>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--color-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="metric-title">Custo Acumulado da Operação</span>
              <h2 className="metric-value" style={{ color: 'var(--color-purple)' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost)}
              </h2>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-purple)' }}>
              <Coins size={20} />
            </div>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-down" style={{ color: 'var(--color-success)' }}>↓ R$ 0,85/dia</span>
            <span className="metric-period">otimização ativa</span>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="metric-title">Agentes Ativos em Produção</span>
              <h2 className="metric-value" style={{ color: 'var(--color-success)' }}>
                {activeCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {agents.length}</span>
              </h2>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
              <Bot size={20} />
            </div>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-up">99.9% Uptime</span>
            <span className="metric-period">de nós de linguagem</span>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '3px solid var(--color-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="metric-title">Taxa de Sucesso Cognitivo</span>
              <h2 className="metric-value" style={{ color: 'var(--color-success)' }}>{successRate}%</h2>
            </div>
            <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="metric-footer">
            <span className="metric-trend-up">↑ 0.4%</span>
            <span className="metric-period">redução de alucinações</span>
          </div>
        </div>
      </div>

      {/* Modern UI graphs section */}
      <div className="agents-layout-grid">
        
        {/* Token usage over time SVG line graph */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Consumo de Tokens Diário (Últimos 7 dias)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Uso volumétrico processado pelos agentes em chamadas API (Milhares)</p>
            </div>
            <div className="system-status">
              <span className="status-dot"></span>
              <span>Monitoramento Ativo</span>
            </div>
          </div>

          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 500 180" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <defs>
                <linearGradient id="area-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="110" x2="480" y2="110" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="150" x2="480" y2="150" stroke="var(--border-color)" strokeWidth="1" />

              {/* Y Axis labels */}
              <text x="30" y="34" fill="var(--text-muted)" fontSize="8" textAnchor="end">300k</text>
              <text x="30" y="74" fill="var(--text-muted)" fontSize="8" textAnchor="end">200k</text>
              <text x="30" y="114" fill="var(--text-muted)" fontSize="8" textAnchor="end">100k</text>
              <text x="30" y="154" fill="var(--text-muted)" fontSize="8" textAnchor="end">0</text>

              {/* Area path */}
              <path 
                d="M 50 150 L 50 110 L 120 90 L 190 120 L 260 70 L 330 60 L 400 45 L 470 35 L 470 150 Z" 
                fill="url(#area-glow)" 
              />

              {/* Line path */}
              <path 
                d="M 50 110 L 120 90 L 190 120 L 260 70 L 330 60 L 400 45 L 470 35" 
                fill="none" 
                stroke="var(--color-primary)" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              {/* X Axis Labels */}
              <text x="50" y="170" fill="var(--text-muted)" fontSize="8" textAnchor="middle">20/06</text>
              <text x="120" y="170" fill="var(--text-muted)" fontSize="8" textAnchor="middle">21/06</text>
              <text x="190" y="170" fill="var(--text-muted)" fontSize="8" textAnchor="middle">22/06</text>
              <text x="260" y="170" fill="var(--text-muted)" fontSize="8" textAnchor="middle">23/06</text>
              <text x="330" y="170" fill="var(--text-muted)" fontSize="8" textAnchor="middle">24/06</text>
              <text x="400" y="170" fill="var(--text-muted)" fontSize="8" textAnchor="middle">25/06</text>
              <text x="470" y="170" fill="var(--text-muted)" fontSize="8" textAnchor="middle">Hoje</text>
            </svg>
          </div>
        </div>

        {/* Cost distribution by Model SVG Columns graph */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Divisão de Custos por Modelo</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Custos acumulados (R$) no período atual</p>
          </div>

          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
            <svg viewBox="0 0 300 150" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              <line x1="30" y1="20" x2="280" y2="20" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="30" y1="60" x2="280" y2="60" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="280" y2="100" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="30" y1="120" x2="280" y2="120" stroke="var(--border-color)" strokeWidth="1" />

              <text x="25" y="24" fill="var(--text-muted)" fontSize="8" textAnchor="end">R$ 15</text>
              <text x="25" y="64" fill="var(--text-muted)" fontSize="8" textAnchor="end">R$ 10</text>
              <text x="25" y="104" fill="var(--text-muted)" fontSize="8" textAnchor="end">R$ 5</text>
              <text x="25" y="124" fill="var(--text-muted)" fontSize="8" textAnchor="end">0</text>

              {/* Claude Bar */}
              <rect x="55" y="61" width="30" height="59" fill="var(--color-primary)" rx="3">
                <title>Claude: R$ 7,41</title>
              </rect>
              <text x="70" y="136" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">Claude</text>

              {/* GPT-4o Bar */}
              <rect x="135" y="21" width="30" height="99" fill="var(--color-purple)" rx="3">
                <title>GPT-4o: R$ 14,23</title>
              </rect>
              <text x="150" y="136" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">GPT-4o</text>

              {/* Llama Bar */}
              <rect x="215" y="118" width="30" height="2" fill="var(--color-success)" rx="1">
                <title>Llama: R$ 0,15</title>
              </rect>
              <text x="230" y="136" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">Llama</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Modern Filter panel and Agent List Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Filtering Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', flexGrow: 1, maxWidth: '600px' }}>
            <div className="search-box" style={{ flexGrow: 1, maxWidth: '280px' }}>
              <Search size={16} className="text-secondary" />
              <input 
                type="text" 
                placeholder="Pesquisar agentes ou objetivos..."
                className="search-input" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="form-select"
              style={{ width: '130px', padding: '0 12px', height: '36px', fontSize: '0.78rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Status (Todos)</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Falhou">Falhou</option>
            </select>

            <select 
              className="form-select"
              style={{ width: '150px', padding: '0 12px', height: '36px', fontSize: '0.78rem' }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Categoria (Todas)</option>
              <option value="Vendas">Vendas</option>
              <option value="Suporte">Suporte</option>
              <option value="QA">QA</option>
              <option value="Operações">Operações</option>
            </select>
          </div>

          <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Criar Agente</span>
          </button>
        </div>

        {/* AI Agents Directory Table */}
        <div className="table-container">
          <table className="customer-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Agente IA</th>
                <th>Objetivo Principal (Goal)</th>
                <th>Modelo Base</th>
                <th>Última Execução</th>
                <th>Tokens Consumidos</th>
                <th>Custo Acumulado</th>
                <th>Status</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Painel</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="customer-logo-abbr" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', fontWeight: 800 }}>
                        {a.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.name}</div>
                        <span className="badge" style={{ fontSize: '0.62rem', padding: '1px 5px', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'var(--border-color)', marginTop: '2px', display: 'inline-block' }}>
                          {a.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={a.objective}>
                    {a.objective}
                  </td>
                  
                  <td>
                    <code style={{ fontSize: '0.75rem', color: '#C084FC', backgroundColor: 'rgba(139, 92, 246, 0.08)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                      {a.model}
                    </code>
                  </td>

                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      <span>{a.lastRun}</span>
                    </div>
                  </td>

                  <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    {a.tokensUsed.toLocaleString('pt-BR')} tkn
                  </td>

                  <td style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(a.cost)}
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`status-dot ${a.status === 'Ativo' ? 'pulse' : ''}`} style={{ 
                        backgroundColor: a.status === 'Ativo' ? 'var(--color-success)' : a.status === 'Falhou' ? 'var(--color-danger)' : 'var(--color-warning)'
                      }}></span>
                      <span style={{ fontSize: '0.76rem', fontWeight: 500 }}>{a.status}</span>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        className="outline-btn"
                        style={{ padding: '6px 12px', fontSize: '0.7rem', display: 'inline-flex', gap: '4px', borderColor: runningAgentId === a.id ? 'var(--border-color)' : 'var(--color-success)', color: runningAgentId === a.id ? 'var(--text-muted)' : 'var(--color-success)', height: '28px', minWidth: '85px', justifyContent: 'center' }}
                        disabled={runningAgentId !== null}
                        onClick={() => handleRunAgent(a.id)}
                      >
                        {runningAgentId === a.id ? (
                          <span>Rodando...</span>
                        ) : (
                          <>
                            <Play size={10} fill="currentColor" />
                            <span>Executar</span>
                          </>
                        )}
                      </button>
                      <button
                        className="icon-btn"
                        style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                        title="Remover Agente"
                        onClick={() => setAgents(agents.filter(ag => ag.id !== a.id))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAgents.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Nenhum agente de inteligência artificial cadastrado ou correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI command console note */}
      <div className="ai-analysis-box" style={{ padding: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Terminal size={16} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <b>Console de Execução Cognitiva:</b> Toda execução simula o processamento estruturado do prompt do agente, consumindo tokens de entrada/saída e registrando logs de telemetria no Monitor de Automações.
        </span>
      </div>

      {/* CREATE AGENT MODAL */}
      {isModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '480px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: 'var(--color-purple)' }} />
                Criar Novo Agente Cognitivo
              </h3>
            </div>
            
            <form onSubmit={handleCreateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Agente</span>
                <input 
                  type="text" 
                  placeholder="Ex: Autoresponder Comercial" 
                  className="form-input"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Modelo Cognitivo</span>
                  <select 
                    className="form-select"
                    value={newAgentModel}
                    onChange={(e) => setNewAgentModel(e.target.value)}
                  >
                    <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                    <option value="GPT-4o">GPT-4o</option>
                    <option value="GPT-4o mini">GPT-4o mini</option>
                    <option value="Llama 3.1 70B">Llama 3.1 70B</option>
                  </select>
                </div>

                <div className="input-group">
                  <span className="input-label">Categoria</span>
                  <select 
                    className="form-select"
                    value={newAgentCat}
                    onChange={(e) => setNewAgentCat(e.target.value as Agent['category'])}
                  >
                    <option value="Vendas">Vendas</option>
                    <option value="Suporte">Suporte</option>
                    <option value="QA">QA</option>
                    <option value="Operações">Operações</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Objetivo Principal (System Objective)</span>
                <textarea 
                  placeholder="Descreva detalhadamente a função do agente e o que ele deve retornar..." 
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'none', fontFamily: 'inherit', fontSize: '0.8rem' }}
                  value={newAgentObj}
                  onChange={(e) => setNewAgentObj(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Status Inicial</span>
                <select 
                  className="form-select"
                  value={newAgentStatus}
                  onChange={(e) => setNewAgentStatus(e.target.value as Agent['status'])}
                >
                  <option value="Ativo">Ativo (Em Execução)</option>
                  <option value="Inativo">Inativo (Pausado)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Salvar Agente</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
