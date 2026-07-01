import React, { useState, useEffect } from 'react';
import { isSupabaseActive } from '../lib/supabaseClient';
import { supabaseProjects, supabaseContracts } from '../lib/supabaseService';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users, 
  Workflow, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  Sparkles, 
  BrainCircuit, 
  Check, 
  Plus, 
  ArrowUpRight, 
  Percent, 
  Star, 
  Lightbulb,
  Briefcase
} from 'lucide-react';
import type { Lead } from './PipelineView';

interface DashboardViewProps {
  leads?: Lead[];
  isNewUser?: boolean;
  userEmail?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ leads = [], isNewUser, userEmail }) => {
  // --- STATE FOR INTERACTIVE TO-DO CHECKLIST ---
  const [todoList, setTodoList] = useState([
    { id: 1, text: 'Enviar proposta final Stripe Brasil', checked: false, priority: 'alta' },
    { id: 2, text: 'Agendar kick-off com Guilherme (Vercel)', checked: true, priority: 'media' },
    { id: 3, text: 'Configurar webhook Slack -> HubSpot', checked: false, priority: 'baixa' },
    { id: 4, text: 'Validar deploy de homologação HypeTech', checked: false, priority: 'alta' }
  ]);

  const toggleTodo = (id: number) => {
    setTodoList(todoList.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  useEffect(() => {
    if (isNewUser) {
      setTodoList([]);
    }
  }, [isNewUser]);

  // --- DYNAMIC PROJECTS LOADER ---
  const [projects, setProjects] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (userEmail) {
        if (isSupabaseActive()) {
          const [dbProjects, dbContracts] = await Promise.all([
            supabaseProjects.fetch(),
            supabaseContracts.fetch()
          ]);
          setProjects(dbProjects);
          setContracts(dbContracts);
        } else {
          // Projects
          const savedProj = localStorage.getItem('orka_projects');
          if (savedProj) {
            setProjects(JSON.parse(savedProj));
          } else {
            const initial = [
              { id: 'proj-1', name: 'Stripe Brasil - Conciliação Fisc.', description: 'Orquestração operacional...', progress: 75, stage: 'validacao', priority: 'alta', deadline: '10/07/2026' },
              { id: 'proj-2', name: 'Notion Sync - Sincronizador Ativo', description: 'Robô cognitivo...', progress: 40, stage: 'desenvolvimento', priority: 'media', deadline: '25/07/2026' },
              { id: 'proj-3', name: 'WhatsApp Bot - Atendente Inteligente', description: 'Treinar atendente...', progress: 10, stage: 'planejamento', priority: 'alta', deadline: '05/08/2026' }
            ];
            setProjects(initial);
          }

          // Contracts
          const savedCont = localStorage.getItem('orka_fin_contracts');
          if (savedCont) {
            setContracts(JSON.parse(savedCont));
          } else {
            const initial = [
              { id: 'cont-1', title: 'Contrato Stripe', value: 10000, status: 'Ativo' },
              { id: 'cont-2', title: 'Contrato Vercel', value: 12000, status: 'Ativo' }
            ];
            setContracts(initial);
          }
        }
      }
    };
    loadDashboardData();
  }, [userEmail]);

  // --- DYNAMIC DATA CALCULATIONS ---
  const totalLeadsCount = leads.length;
  const activeLeadsCount = leads.filter(l => l.stage !== 'contrato').length;
  const closedDealsCount = leads.filter(l => l.stage === 'contrato').length;
  
  // Total pipeline value
  const pipelineValue = leads.reduce((acc, curr) => acc + curr.value, 0);
  
  // Contracts based MRR & Clientes Ativos calculation
  const activeContracts = contracts.filter(c => c.status === 'Ativo');
  const calculatedMRR = activeContracts.reduce((sum, c) => sum + c.value, 0);
  const activeClientsCount = activeContracts.length;
  
  // Projects count
  const projectsCount = projects.length;
  
  // Formatting Helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // KPI Cards Configuration
  const kpiData = [
    { 
      title: 'Receita Mensal (MRR)', 
      value: formatCurrency(calculatedMRR), 
      trend: '+14.8%', 
      isUp: true, 
      period: 'vs mês passado', 
      icon: DollarSign,
      accent: 'var(--color-primary)'
    },
    { 
      title: 'Leads Ativos', 
      value: `${activeLeadsCount} Leads`, 
      trend: `+${leads.filter(l => l.stage === 'contato').length} novos`, 
      isUp: true, 
      period: 'esta semana', 
      icon: Users,
      accent: '#C084FC'
    },
    { 
      title: 'Projetos em Andamento', 
      value: `${projectsCount} Projetos`, 
      trend: '+2 esta semana', 
      isUp: true, 
      period: 'em entrega ativa', 
      icon: Workflow,
      accent: 'var(--color-success)'
    },
    { 
      title: 'Conversão Comercial', 
      value: isNewUser ? '0.0%' : '24.8%', 
      trend: isNewUser ? '0%' : '+2.1%', 
      isUp: !isNewUser, 
      period: 'últimos 30 dias', 
      icon: Percent,
      accent: 'var(--color-warning)'
    },
    { 
      title: 'Clientes Ativos', 
      value: `${activeClientsCount} Contas`, 
      trend: isNewUser ? '+0 este mês' : `+${closedDealsCount} este mês`, 
      isUp: !isNewUser, 
      period: 'contratos ativos', 
      icon: Star,
      accent: '#F472B6'
    }
  ];

  // Pipeline stages breakdown
  const stagesList = [
    { id: 'contato', label: 'Contato', color: '#60A5FA' },
    { id: 'qualificacao', label: 'Qualificação', color: '#A78BFA' },
    { id: 'proposta', label: 'Proposta', color: '#F472B6' },
    { id: 'negociacao', label: 'Negociação', color: '#FBBF24' },
    { id: 'contrato', label: 'Contrato', color: '#34D399' }
  ];

  // Recent Projects
  const recentProjects = projects.slice(0, 4).map(p => ({
    name: p.name,
    desc: p.description,
    progress: p.progress,
    status: p.stage === 'planejamento' ? 'Planejamento' :
            p.stage === 'desenvolvimento' ? 'Desenvolvimento' :
            p.stage === 'validacao' ? 'Validação' : 'Concluído',
    value: p.priority === 'alta' ? 18500 : p.priority === 'media' ? 12000 : 7500,
    type: p.stage === 'concluido' ? 'completed' : 'active'
  }));

  // Agenda of the day
  const dailyAgenda = isNewUser ? [] : [
    { time: '09:30', title: 'Sync de Onboarding', details: 'HypeTech Corp (Felipe Dias)', type: 'onboarding' },
    { time: '11:00', title: 'Demonstração de QA', details: 'Vercel Inc (Guilherme Ramos)', type: 'demo' },
    { time: '14:30', title: 'Review de Escopo & Contrato', details: 'Stripe Brasil (Beatriz Santos)', type: 'review' },
    { time: '16:00', title: 'Brainstorming de IA Interno', details: 'ORKA Brain Engine v2.0', type: 'internal' }
  ];

  // System audit activities log
  const systemActivities = isNewUser ? [] : [
    { icon: Check, text: 'Contrato assinado por HypeTech Corp. Onboarding iniciado.', time: 'Há 12 min', color: 'var(--color-success)' },
    { icon: Sparkles, text: 'Lead "Notion Space" analisado e qualificado pela IA (Score: 78%).', time: 'Há 45 min', color: '#8B5CF6' },
    { icon: Plus, text: 'Novo lead cadastrado no Funil: "Linear Systems" via webhook.', time: 'Há 2 horas', color: 'var(--color-primary)' },
    { icon: Activity, text: 'Webhook de logs: Integração WhatsApp respondeu 14 conversas.', time: 'Há 4 horas', color: 'var(--color-warning)' }
  ];

  const salesHistory = isNewUser ? [] : [
    { month: 'Jan', revenue: 75, target: 80 },
    { month: 'Fev', revenue: 90, target: 85 },
    { month: 'Mar', revenue: 110, target: 95 },
    { month: 'Abr', revenue: 115, target: 110 },
    { month: 'Mai', revenue: 130, target: 120 },
    { month: 'Jun', revenue: 142, target: 130 }
  ];

  return (
    <div className="content-wrapper animate-slide-up" style={{ paddingBottom: '40px' }}>
      
      {/* 1. GREETING AND DAY SUMMARY */}
      <div className="exec-greeting-container">
        <h1 className="exec-greeting-title">{isNewUser ? 'Bom dia! 👋' : 'Bom dia, Orka Admin 👋'}</h1>
        <p className="exec-greeting-desc">
          Resumo do dia: <b>{activeLeadsCount} negócios ativos</b> no funil de vendas, faturamento recorrente estimado em <b>{formatCurrency(calculatedMRR)}</b> e <b>{projectsCount} projetos operacionais</b> em andamento.
        </p>
      </div>

      {/* MAIN TWO-COLUMN LAYOUT: DASHBOARD (LEFT) & ORKA AI (RIGHT) */}
      <div className="exec-dashboard-layout">
        
        {/* LEFT COLUMN: ALL WIDGETS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', minWidth: 0 }}>
          
          {/* KPI CARDS (5 COLUMNS GRID) */}
          <div className="exec-kpi-grid">
            {kpiData.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div key={idx} className="card" style={{ padding: '20px' }}>
                  <div className="metric-header" style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.title}</span>
                    <div className="metric-icon-wrapper" style={{ color: kpi.accent, padding: '6px', borderRadius: '8px' }}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="metric-value" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>{kpi.value}</div>
                  <div className="metric-footer" style={{ fontSize: '0.72rem' }}>
                    <span className={kpi.isUp ? 'metric-trend-up' : 'metric-trend-down'} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                      {kpi.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {kpi.trend}
                    </span>
                    <span className="metric-period" style={{ marginLeft: '4px' }}>{kpi.period}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GROWTH CHART & SALES PIPELINE (ROW 1) */}
          <div className="exec-grow-grid">
            
            {/* GROWTH CHART */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Gráfico de Crescimento</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Faturamento Mensal (Milhares) - Meta vs Realizado</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
                    <span>Realizado</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-purple)' }}></span>
                    <span>Meta</span>
                  </div>
                </div>
              </div>

              {/* PREMIUM SVG AREA LINE CHART */}
              <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 600 220" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="glow-blue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="svg-shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--color-primary)" floodOpacity="0.15" />
                    </filter>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  <line x1="60" y1="30" x2="570" y2="30" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="60" y1="72" x2="570" y2="72" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="60" y1="115" x2="570" y2="115" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="60" y1="157" x2="570" y2="157" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="60" y1="200" x2="570" y2="200" stroke="var(--border-color)" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="50" y="34" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ 160k</text>
                  <text x="50" y="76" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ 120k</text>
                  <text x="50" y="119" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ 80k</text>
                  <text x="50" y="161" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ 40k</text>
                  <text x="50" y="204" fill="var(--text-muted)" fontSize="9" textAnchor="end">R$ 0</text>

                  {/* Area Fill Gradient for Realizado */}
                  {!isNewUser && (
                    <path 
                      d="M 70 200 L 70 120 L 170 104 L 270 83 L 370 78 L 470 62 L 570 49 L 570 200 Z" 
                      fill="url(#glow-blue)" 
                    />
                  )}

                  {/* Realizado Line (Blue) */}
                  {!isNewUser && (
                    <path 
                      d="M 70 120 L 170 104 L 270 83 L 370 78 L 470 62 L 570 49" 
                      fill="none" 
                      stroke="var(--color-primary)" 
                      strokeWidth="3.5" 
                      strokeLinecap="round"
                      filter="url(#svg-shadow)"
                    />
                  )}

                  {/* Meta Line (Purple) */}
                  {!isNewUser && (
                    <path 
                      d="M 70 115 L 170 110 L 270 99 L 370 83 L 470 73 L 570 62" 
                      fill="none" 
                      stroke="var(--color-purple)" 
                      strokeWidth="2" 
                      strokeDasharray="5 5" 
                      strokeLinecap="round"
                    />
                  )}

                  {/* Dots & Values */}
                  {salesHistory.map((pt, i) => {
                    const x = 70 + i * 100;
                    // Formula mapping values
                    const y = 200 - (pt.revenue / 160) * 170;
                    return (
                      <g key={i}>
                        <circle 
                          cx={x} 
                          cy={y} 
                          r="4.5" 
                          fill="var(--bg-card)" 
                          stroke="var(--color-primary)" 
                          strokeWidth="2.5" 
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        />
                        <text x={x} y={y - 10} fill="var(--text-main)" fontSize="9" fontWeight="600" textAnchor="middle">
                          R$ {pt.revenue}k
                        </text>
                      </g>
                    );
                  })}

                  {/* X Axis Labels */}
                  {salesHistory.map((pt, i) => {
                    const x = 70 + i * 100;
                    return (
                      <text key={i} x={x} y="218" fill="var(--text-secondary)" fontSize="10" textAnchor="middle" fontWeight="500">
                        {pt.month}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* SALES PIPELINE */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Pipeline de Vendas</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distribuição e valor dos negócios por estágio</p>
              </div>

              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
                {stagesList.map((stg) => {
                  const stageLeads = leads.filter(l => l.stage === stg.id);
                  const stageValue = stageLeads.reduce((acc, curr) => acc + curr.value, 0);
                  const percentage = pipelineValue > 0 ? (stageValue / pipelineValue) * 100 : 0;

                  return (
                    <div key={stg.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stg.color }}></span>
                          <span style={{ fontWeight: 600 }}>{stg.label}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({stageLeads.length} {stageLeads.length === 1 ? 'negócio' : 'negócios'})</span>
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(stageValue)}</span>
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            backgroundColor: stg.color, 
                            width: `${Math.max(percentage, stageLeads.length > 0 ? 5 : 0)}%`,
                            borderRadius: '999px',
                            boxShadow: `0 0 10px ${stg.color}40`,
                            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Valor Total Operacional</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{formatCurrency(pipelineValue)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* RECENT PROJECTS & OPERATIONAL AGENDA / LOGS (ROW 2) */}
          <div className="exec-grow-grid">
            
            {/* RECENT PROJECTS TABLE */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Projetos Recentes</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status da entrega e desenvolvimento do escopo</p>
                </div>
                <div style={{ padding: '4px 8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)', fontSize: '0.7rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={12} />
                  <span>4 Projetos Monitorados</span>
                </div>
              </div>

              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {recentProjects.map((proj, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>{proj.name}</h4>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{proj.desc}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: proj.type === 'active' ? 'var(--color-primary-hover)' : 'var(--color-purple)' }}>
                          {proj.status}
                        </span>
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          {formatCurrency(proj.value)}/mês
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                      <div style={{ height: '4px', flexGrow: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${proj.progress}%`, 
                            background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-purple) 100%)',
                            borderRadius: '999px'
                          }} 
                        />
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, width: '28px', textAlign: 'right' }}>
                        {proj.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AGENDA DO DIA & ULTIMAS ATIVIDADES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* AGENDA WIDGET */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Agenda do Dia</h3>
                </div>

                <div className="agenda-list">
                  {dailyAgenda.map((agenda, index) => (
                    <div key={index} className="agenda-item">
                      <span className="agenda-time">{agenda.time}</span>
                      <span className="agenda-divider"></span>
                      <div className="agenda-details">
                        <span className="agenda-title">{agenda.title}</span>
                        <span className="agenda-location">{agenda.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LATEST ACTIVITIES LOGS */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <Activity size={16} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Últimas Atividades</h3>
                </div>

                <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {systemActivities.map((act, index) => {
                    const ActIcon = act.icon;
                    return (
                      <div key={index} className="activity-item" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.78rem' }}>
                        <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.03)', color: act.color, marginTop: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <ActIcon size={12} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <p style={{ margin: 0, color: 'var(--text-main)', lineHeight: '1.4' }}>{act.text}</p>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{act.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: ORKA AI SIDEBAR PANEL */}
        <aside className="orka-ai-panel">
          
          {/* LOGO HEADER */}
          <div className="orka-ai-header">
            <BrainCircuit size={20} style={{ color: '#A78BFA' }} />
            <h2 className="orka-ai-logo-text">ORKA AI</h2>
            <div className="sidebar-tag" style={{ marginLeft: 'auto', fontSize: '0.6rem', padding: '1px 5px', borderColor: 'rgba(167, 139, 250, 0.4)', color: '#C084FC', background: 'rgba(167, 139, 250, 0.1)' }}>
              Copiloto
            </div>
          </div>

          {/* 1. RESUMO INTELIGENTE */}
          <div className="orka-ai-section">
            <span className="orka-ai-section-title">
              <Sparkles size={12} style={{ color: '#A78BFA' }} />
              Resumo Inteligente
            </span>
            <div className="orka-ai-summary-box">
              O pipeline comercial está aquecido com <b>{formatCurrency(pipelineValue)}</b> em volume de negócios (<b>{totalLeadsCount} leads</b> cadastrados). O foco de hoje deve ser a revisão final do contrato da <b>Stripe Brasil</b> (Score 98%) e a preparação da demo para o Guilherme (Vercel).
            </div>
          </div>

          {/* 2. PENDÊNCIAS */}
          <div className="orka-ai-section">
            <span className="orka-ai-section-title">
              <AlertTriangle size={12} style={{ color: 'var(--color-warning)' }} />
              Pendências Críticas
            </span>
            <div className="orka-ai-pill-list">
              <div className="orka-ai-pill-item" style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '4px', height: '16px', borderRadius: '4px', backgroundColor: 'var(--color-danger)' }}></span>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: 600 }}>Assinatura Stripe Brasil</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Proposta comercial aguardando retorno</div>
                </div>
                <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="orka-ai-pill-item" style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '4px', height: '16px', borderRadius: '4px', backgroundColor: 'var(--color-warning)' }}></span>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: 600 }}>Retornar Notion Space</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Amanda Melo solicitou nova chamada</div>
                </div>
                <ArrowUpRight size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {/* 3. CLIENTES PRIORITÁRIOS */}
          <div className="orka-ai-section">
            <span className="orka-ai-section-title">
              <Star size={12} style={{ color: '#FBBF24' }} />
              Clientes Prioritários
            </span>
            <div className="orka-ai-pill-list">
              {leads.filter(l => l.aiScore >= 90).slice(0, 2).map((ld, i) => (
                <div key={i} className="orka-ai-pill-item">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{ld.company}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>POC: {ld.contactName}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(167, 139, 250, 0.1)', color: '#A78BFA', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Sparkles size={10} />
                    {ld.aiScore}%
                  </span>
                </div>
              ))}
              {leads.filter(l => l.aiScore >= 90).length === 0 && (
                <div className="orka-ai-pill-item" style={{ color: 'var(--text-muted)', justifyContent: 'center' }}>
                  Nenhum cliente prioritário identificado.
                </div>
              )}
            </div>
          </div>

          {/* 4. SUGESTÕES DA IA */}
          <div className="orka-ai-section">
            <span className="orka-ai-section-title">
              <Lightbulb size={12} style={{ color: '#FBBF24' }} />
              Sugestões da IA
            </span>
            <ul className="ai-bullet-list">
              <li>Disparar proposta automatizada via WhatsApp para Karina Silva (Linear Co) aproveitando o score de 89%.</li>
              <li>Apresentar orquestrador de automações de reuniões na call com Notion Space.</li>
            </ul>
          </div>

          {/* 5. ALERTAS */}
          <div className="orka-ai-section">
            <span className="orka-ai-section-title">
              <AlertTriangle size={12} style={{ color: 'var(--color-danger)' }} />
              Alertas Operacionais
            </span>
            <div className="orka-ai-pill-list">
              <div className="orka-ai-pill-item alert-item">
                <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Lead sem interação</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Notion Space • 4 dias</span>
              </div>
              <div className="orka-ai-pill-item alert-item">
                <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Latência Webhook</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Média: 540ms (Alta)</span>
              </div>
            </div>
          </div>

          {/* 6. PRÓXIMAS AÇÕES (INTERACTIVE CHECKLIST) */}
          <div className="orka-ai-section">
            <span className="orka-ai-section-title">
              <Check size={12} style={{ color: 'var(--color-success)' }} />
              Próximas Ações
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {todoList.map((todo) => (
                <label 
                  key={todo.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    backgroundColor: todo.checked ? 'rgba(255,255,255,0.01)' : 'var(--bg-card)', 
                    border: '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    transition: 'all 0.2s',
                    opacity: todo.checked ? 0.6 : 1
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={todo.checked} 
                    onChange={() => toggleTodo(todo.id)}
                    style={{ 
                      accentColor: 'var(--color-success)', 
                      cursor: 'pointer', 
                      width: '14px', 
                      height: '14px' 
                    }} 
                  />
                  <span style={{ textDecoration: todo.checked ? 'line-through' : 'none', flexGrow: 1, color: todo.checked ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    {todo.text}
                  </span>
                  <span style={{ 
                    fontSize: '0.62rem', 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor: todo.priority === 'alta' ? 'rgba(239, 68, 68, 0.1)' : todo.priority === 'media' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: todo.priority === 'alta' ? 'var(--color-danger)' : todo.priority === 'media' ? 'var(--color-warning)' : 'var(--color-success)'
                  }}>
                    {todo.priority}
                  </span>
                </label>
              ))}
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
};
