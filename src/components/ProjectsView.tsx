import React, { useState, useEffect, useRef } from 'react';
import { isSupabaseActive } from '../lib/supabaseClient';
import { supabaseProjects } from '../lib/supabaseService';
import { 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  Sparkles, 
  X, 
  Plus, 
  Download,
  Edit2,
  Trash2,
  Save
} from 'lucide-react';

interface ProjectMember {
  name: string;
  initials: string;
  role: string;
}

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

interface CommentItem {
  id: number;
  author: string;
  text: string;
  date: string;
}

interface FileItem {
  id: number;
  name: string;
  size: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  stage: 'planejamento' | 'desenvolvimento' | 'validacao' | 'concluido';
  team: ProjectMember[];
  checklist: ChecklistItem[];
  comments: CommentItem[];
  files: FileItem[];
  deadline: string;
  priority: 'alta' | 'media' | 'baixa';
  progress: number; // dynamically computed in render or updated
  aiSummary?: string;
}

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Stripe Brasil - Conciliação Fisc.',
    description: 'Orquestração comercial e operacional para conciliar transações e estornos do Stripe via webhook e enviar relatórios consolidados diretamente no Slack.',
    stage: 'validacao',
    deadline: '10/07/2026',
    priority: 'alta',
    progress: 75,
    team: [
      { name: 'Lucas Silva', initials: 'LS', role: 'Dev Ops' },
      { name: 'Mariana Costa', initials: 'MC', role: 'IA Eng' }
    ],
    checklist: [
      { id: 1, text: 'Mapear Webhooks Stripe API', completed: true },
      { id: 2, text: 'Desenvolver Algoritmo de Conciliação', completed: true },
      { id: 3, text: 'Formatar Relatório Slack Blocks', completed: true },
      { id: 4, text: 'Realizar Teste de Estresse em Sandbox', completed: false }
    ],
    comments: [
      { id: 1, author: 'Lucas Silva', text: 'Stripe webhook mapeado e homologado com sucesso.', date: 'Há 2 horas' }
    ],
    files: [
      { id: 1, name: 'stripe_api_mapping.json', size: '12 KB' }
    ]
  },
  {
    id: 'proj-2',
    name: 'Notion Sync - Sincronizador Ativo',
    description: 'Robô cognitivo responsável por varrer minutas de reuniões no Notion de clientes, catalogar pendências e convertê-las em cartões no Kanban.',
    stage: 'desenvolvimento',
    deadline: '25/07/2026',
    priority: 'media',
    progress: 40,
    team: [
      { name: 'Lucas Silva', initials: 'LS', role: 'Dev Ops' }
    ],
    checklist: [
      { id: 1, text: 'Mapear Bancos de Dados de Minutas no Notion', completed: true },
      { id: 2, text: 'Configurar LLM para Classificação de Ações', completed: false },
      { id: 3, text: 'Desenvolver Interface de Logs do Bot', completed: false }
    ],
    comments: [],
    files: []
  },
  {
    id: 'proj-3',
    name: 'WhatsApp Bot - Atendente Inteligente',
    description: 'Treinar atendente cognitivo para responder em tom institucional da empresa, qualificar novos leads ativamente e registrá-los no CRM.',
    stage: 'planejamento',
    deadline: '05/08/2026',
    priority: 'alta',
    progress: 10,
    team: [
      { name: 'Mariana Costa', initials: 'MC', role: 'IA Eng' }
    ],
    checklist: [
      { id: 1, text: 'Carregar Base Vetorial de Conhecimento RAG', completed: false },
      { id: 2, text: 'Treinar modelo em tom de voz institucional', completed: false },
      { id: 3, text: 'Iniciar testes alfa com equipe comercial restrita', completed: false }
    ],
    comments: [
      { id: 1, author: 'Mariana Costa', text: 'Estruturando a base de dados vetorial para carregar o briefing comercial.', date: 'Há 1 dia' }
    ],
    files: [
      { id: 1, name: 'briefing_comercial_hypetech.pdf', size: '3.1 MB' }
    ]
  }
];

import type { TeamMember } from './SettingsView';

interface ProjectsViewProps {
  userEmail?: string;
  teamMembers: TeamMember[];
  onAddNotification: (email: string, text: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ userEmail, teamMembers, onAddNotification }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const isLoadedRef = useRef(false);

  // Project Edit/Delete States
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<Project['priority']>('media');
  const [editDeadline, setEditDeadline] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [newProjAssignee, setNewProjAssignee] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      if (userEmail) {
        if (isSupabaseActive()) {
          const dbProjects = await supabaseProjects.fetch();
          setProjects(dbProjects);
        } else {
          const key = 'orka_projects';
          const saved = localStorage.getItem(key);
          if (saved) {
            setProjects(JSON.parse(saved));
          } else {
            setProjects([]);
            localStorage.setItem(key, JSON.stringify([]));
          }
        }
        isLoadedRef.current = true;
      }
    };
    loadProjects();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && isLoadedRef.current && !isSupabaseActive()) {
      localStorage.setItem('orka_projects', JSON.stringify(projects));
    }
  }, [projects, userEmail]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjPriority, setNewProjPriority] = useState<'alta' | 'media' | 'baixa'>('media');
  const [newProjDeadline, setNewProjDeadline] = useState('');
  const [newProjStage, setNewProjStage] = useState<'planejamento' | 'desenvolvimento' | 'validacao' | 'concluido'>('planejamento');

  const [commentInput, setCommentInput] = useState('');

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleToggleChecklist = (projectId: string, itemId: number) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const updatedChecklist = proj.checklist.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    const completedCount = updatedChecklist.filter(t => t.completed).length;
    const totalCount = updatedChecklist.length;
    const computedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const updated: Project = {
      ...proj,
      checklist: updatedChecklist,
      progress: computedProgress
    };

    setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? updated : p));
    if (isSupabaseActive()) {
      supabaseProjects.update(updated);
    }
  };

  const handleStageChange = (projectId: string, newStage: Project['stage']) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const updated: Project = { ...proj, stage: newStage };
    setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? updated : p));
    if (isSupabaseActive()) {
      supabaseProjects.update(updated);
    }
  };

  const handleAddComment = (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const newComment: CommentItem = {
      id: Math.random(),
      author: 'Orka Admin (Você)',
      text: commentInput.trim(),
      date: 'Agora mesmo'
    };

    const updated: Project = {
      ...proj,
      comments: [newComment, ...proj.comments]
    };

    setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? updated : p));
    if (isSupabaseActive()) {
      supabaseProjects.update(updated);
    }
    setCommentInput('');
  };

  const handleGenerateAiSummary = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    setIsGeneratingAi(true);

    setTimeout(() => {
      let statusText = 'Status estável.';
      if (proj.priority === 'alta') {
        statusText = 'Foco prioritário da equipe técnica.';
      }

      const generatedSummary = `Análise ORKA Brain: ${proj.name} está com ${proj.progress}% de conclusão. ${statusText} O escopo de desenvolvimento está estruturado com ${proj.checklist.length} marcos operacionais. Recomenda-se acionar os engenheiros para concluir as pendências antes do prazo final de ${proj.deadline}.`;

      const updated: Project = {
        ...proj,
        aiSummary: generatedSummary
      };

      setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? updated : p));
      if (isSupabaseActive()) {
        supabaseProjects.update(updated);
      }
      setIsGeneratingAi(false);
    }, 1500);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (isSupabaseActive()) {
        supabaseProjects.delete(projectId);
      }
      setSelectedProjectId(null);
      setIsEditing(false);
    }
  };

  const handleSaveProjectEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const chosenMember = teamMembers.find(m => m.name === editAssignee);
    const newTeam = chosenMember 
      ? [{ name: chosenMember.name, initials: chosenMember.name.substring(0, 2).toUpperCase(), role: chosenMember.role }]
      : selectedProject.team;

    // Send notification if assignee changed
    const oldAssignee = selectedProject.team[0]?.name || '';
    if (chosenMember && chosenMember.name !== oldAssignee) {
      onAddNotification(chosenMember.email, `🚀 Você foi designado como responsável pelo projeto: "${editName}"`);
    }

    const updated: Project = {
      ...selectedProject,
      name: editName,
      description: editDesc,
      priority: editPriority,
      deadline: editDeadline,
      team: newTeam
    };

    setProjects(prev => prev.map(p => p.id === selectedProject.id ? updated : p));
    if (isSupabaseActive()) {
      supabaseProjects.update(updated);
    }
    setIsEditing(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjDesc) return;

    const chosenMember = teamMembers.find(m => m.name === newProjAssignee) || teamMembers[0];
    const projectTeam = chosenMember 
      ? [{ name: chosenMember.name, initials: chosenMember.name.substring(0, 2).toUpperCase(), role: chosenMember.role }]
      : [];

    if (chosenMember) {
      onAddNotification(chosenMember.email, `🚀 Novo projeto atribuído a você: "${newProjName}"`);
    }

    const newProj: Project = {
      id: `proj-${Math.random().toString().substring(2, 9)}`,
      name: newProjName,
      description: newProjDesc,
      stage: newProjStage,
      priority: newProjPriority,
      deadline: newProjDeadline || '30/07/2026',
      progress: 0,
      team: projectTeam,
      checklist: [
        { id: 1, text: 'Definir escopo inicial do projeto com o cliente', completed: false },
        { id: 2, text: 'Criar webhooks e infraestrutura básica', completed: false },
        { id: 3, text: 'Homologar testes alfa internos', completed: false }
      ],
      comments: [],
      files: []
    };

    setProjects([...projects, newProj]);
    if (isSupabaseActive()) {
      supabaseProjects.insert(newProj);
    }
    setIsNewProjectModalOpen(false);

    setNewProjName('');
    setNewProjDesc('');
    setNewProjPriority('media');
    setNewProjDeadline('');
    setNewProjStage('planejamento');
    setNewProjAssignee('');
  };

  const getPriorityBadge = (priority: Project['priority']) => {
    switch (priority) {
      case 'alta':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}>Alta</span>;
      case 'media':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>Média</span>;
      case 'baixa':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>Baixa</span>;
      default:
        return null;
    }
  };

  // --- KANBAN COLUMNS METADATA ---
  const columnsList = [
    { id: 'planejamento', label: 'Planejamento', color: '#60A5FA' },
    { id: 'desenvolvimento', label: 'Desenvolvimento', color: '#A78BFA' },
    { id: 'validacao', label: 'Validação', color: '#FBBF24' },
    { id: 'concluido', label: 'Concluído', color: '#34D399' }
  ] as const;

  return (
    <div className="content-wrapper animate-slide-up" style={{ paddingBottom: '40px' }}>
      
      {/* 1. KANBAN CONTROL HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Painel Operacional Kanban</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Acompanhe o status e progressos de desenvolvimento</p>
        </div>
        <button className="primary-btn" onClick={() => setIsNewProjectModalOpen(true)}>
          <Plus size={16} />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* 2. KANBAN BOARD */}
      <div className="kanban-grid">
        {columnsList.map((col) => {
          const columnProjects = projects.filter(p => p.stage === col.id);

          return (
            <div key={col.id} style={{ 
              backgroundColor: 'var(--bg-card)', 
              borderRadius: 'var(--border-radius-lg)', 
              border: '1px solid var(--border-color)', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              minHeight: '500px'
            }}>
              {/* Column Title Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }}></span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF' }}>{col.label}</span>
                </div>
                <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                  {columnProjects.length}
                </span>
              </div>

              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {columnProjects.map((proj) => (
                  <div 
                    key={proj.id} 
                    className="card"
                    style={{ 
                      padding: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px',
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'rgba(255,255,255,0.01)'
                    }}
                    onClick={() => setSelectedProjectId(proj.id)}
                  >
                    {/* Top tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {getPriorityBadge(proj.priority)}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} />
                        {proj.deadline}
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>{proj.name}</h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {proj.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Progresso</span>
                        <span style={{ color: 'var(--color-primary-hover)' }}>{proj.progress}%</span>
                      </div>
                      <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${proj.progress}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-purple))' }}></div>
                      </div>
                    </div>

                    {/* Footer indicators (Equipe, files, comments, tasks) */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {/* Avatar list overlapping */}
                      <div style={{ display: 'flex', paddingLeft: '4px' }}>
                        {proj.team.slice(0, 3).map((member, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              backgroundColor: 'var(--bg-main)', 
                              border: '1.5px solid var(--bg-card)', 
                              fontSize: '0.6rem', 
                              fontWeight: 700, 
                              color: '#FFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: idx > 0 ? '-6px' : '0',
                              zIndex: 10 - idx
                            }}
                            title={`${member.name} - ${member.role}`}
                          >
                            {member.initials}
                          </div>
                        ))}
                      </div>

                      {/* Counters */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Tarefas Concluídas">
                          <CheckSquare size={10} />
                          {proj.checklist.filter(t => t.completed).length}/{proj.checklist.length}
                        </span>
                        {proj.comments.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Comentários">
                            <MessageSquare size={10} />
                            {proj.comments.length}
                          </span>
                        )}
                        {proj.files.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }} title="Arquivos">
                            <Paperclip size={10} />
                            {proj.files.length}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
                {columnProjects.length === 0 && (
                  <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    Nenhum projeto
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. DETAILED PROJECT MODAL (POPUP) */}
      {selectedProject && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{selectedProject.name}</h3>
                  {getPriorityBadge(selectedProject.priority)}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Prazo Limite: <b>{selectedProject.deadline}</b></p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  className="outline-btn" 
                  style={{ fontSize: '0.7rem', padding: '5px 10px', gap: '4px' }} 
                  onClick={() => {
                    setIsEditing(true);
                    setEditName(selectedProject.name);
                    setEditDesc(selectedProject.description);
                    setEditPriority(selectedProject.priority);
                    setEditDeadline(selectedProject.deadline);
                    setEditAssignee(selectedProject.team[0]?.name || '');
                  }}
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button 
                  className="outline-btn" 
                  style={{ fontSize: '0.7rem', padding: '5px 10px', gap: '4px', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} 
                  onClick={() => handleDeleteProject(selectedProject.id)}
                >
                  <Trash2 size={12} /> Excluir
                </button>
                <button className="close-btn" onClick={() => { setSelectedProjectId(null); setIsEditing(false); }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* INLINE EDIT FORM */}
            {isEditing && (
              <form onSubmit={handleSaveProjectEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--color-primary)', borderRadius: '10px' }}>
                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Nome do Projeto</span>
                    <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Prazo</span>
                    <input type="text" className="form-input" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <span className="input-label">Descrição</span>
                  <textarea className="form-input" style={{ minHeight: '60px', resize: 'none', fontFamily: 'inherit' }} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} required />
                </div>
                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Prioridade</span>
                    <select className="form-select" value={editPriority} onChange={(e) => setEditPriority(e.target.value as Project['priority'])}>
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <span className="input-label">Responsável</span>
                    <select className="form-select" value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)}>
                      <option value="">-- Selecione --</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="outline-btn" style={{ fontSize: '0.75rem' }} onClick={() => setIsEditing(false)}>Cancelar</button>
                  <button type="submit" className="primary-btn" style={{ fontSize: '0.75rem', gap: '4px' }}><Save size={13} /> Salvar Alterações</button>
                </div>
              </form>
            )}

            {/* Main content grid split (Left: details, checklist, team; Right: comments, files, AI) */}
            {!isEditing && (
            <div className="split-layout">
              
              {/* LEFT COLUMN: ABOUT, CHECKLIST, TEAM */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Description */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Descrição do Escopo</h4>
                  <p style={{ fontSize: '0.78rem', color: '#fff', lineHeight: '1.5', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                    {selectedProject.description}
                  </p>
                </div>

                {/* Change Column Stage Dropdown */}
                <div className="input-group">
                  <span className="input-label" style={{ textTransform: 'uppercase' }}>Estágio Operacional</span>
                  <select 
                    value={selectedProject.stage} 
                    onChange={(e) => handleStageChange(selectedProject.id, e.target.value as Project['stage'])}
                    className="form-select"
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    <option value="planejamento">Planejamento</option>
                    <option value="desenvolvimento">Desenvolvimento</option>
                    <option value="validacao">Validação</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>

                {/* Team members */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Equipe Responsável</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedProject.team.map((member, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                        <div style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>{member.initials}</div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>{member.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Checklist widget */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Checklist de Atividades</h4>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-hover)' }}>{selectedProject.progress}% Concluído</span>
                  </div>
                  <div style={{ height: '4px', width: '100%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${selectedProject.progress}%`, background: 'linear-gradient(90deg, var(--color-primary), var(--color-purple))' }}></div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    {selectedProject.checklist.map((item) => (
                      <label 
                        key={item.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '10px 12px', 
                          borderRadius: '6px', 
                          backgroundColor: item.completed ? 'rgba(255,255,255,0.01)' : 'var(--bg-main)', 
                          border: '1px solid var(--border-color)', 
                          cursor: 'pointer',
                          fontSize: '0.76rem',
                          transition: 'all 0.2s',
                          opacity: item.completed ? 0.6 : 1
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={item.completed} 
                          onChange={() => handleToggleChecklist(selectedProject.id, item.id)}
                          style={{ 
                            accentColor: 'var(--color-success)', 
                            cursor: 'pointer', 
                            width: '14px', 
                            height: '14px' 
                          }} 
                        />
                        <span style={{ textDecoration: item.completed ? 'line-through' : 'none', flexGrow: 1, color: item.completed ? 'var(--text-muted)' : '#fff' }}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: AI INTEL, COMMENTS, FILES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ORKA AI Project Intelligence Summary */}
                <div style={{ 
                  backgroundColor: 'rgba(139, 92, 246, 0.02)', 
                  border: '1px dashed rgba(139, 92, 246, 0.25)', 
                  borderRadius: '8px', 
                  padding: '14px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(139, 92, 246, 0.15)', paddingBottom: '8px' }}>
                    <Sparkles size={14} style={{ color: '#A78BFA' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C084FC' }}>ORKA Brain Status</span>
                  </div>

                  {selectedProject.aiSummary ? (
                    <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
                      {selectedProject.aiSummary}
                    </p>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nenhum resumo de IA gerado ainda para esta entrega.</span>
                  )}

                  <button 
                    className="outline-btn" 
                    style={{ 
                      fontSize: '0.7rem', 
                      padding: '6px 12px', 
                      justifyContent: 'center', 
                      backgroundColor: 'rgba(139, 92, 246, 0.08)',
                      borderColor: 'rgba(139, 92, 246, 0.25)',
                      color: '#C084FC'
                    }}
                    onClick={() => handleGenerateAiSummary(selectedProject.id)}
                    disabled={isGeneratingAi}
                  >
                    {isGeneratingAi ? (
                      <span>Gerando resumo...</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} />
                        <span>Gerar Resumo IA</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Comments Section */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Comentários ({selectedProject.comments.length})</h4>
                  
                  {/* Add comment form */}
                  <form onSubmit={(e) => handleAddComment(e, selectedProject.id)} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      placeholder="Adicione notas ou informes..." 
                      className="form-input" 
                      style={{ fontSize: '0.75rem', padding: '6px 10px', flexGrow: 1 }}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                    />
                    <button type="submit" className="outline-btn" style={{ fontSize: '0.7rem', padding: '6px 10px' }}>
                      Enviar
                    </button>
                  </form>

                  {/* Comments list feed */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                    {selectedProject.comments.map((comm) => (
                      <div key={comm.id} style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', fontSize: '0.72rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontWeight: 600 }}>
                          <span style={{ color: '#fff' }}>{comm.author}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{comm.date}</span>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.35' }}>{comm.text}</p>
                      </div>
                    ))}
                    {selectedProject.comments.length === 0 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sem comentários.</span>
                    )}
                  </div>
                </div>

                {/* Files Section */}
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Arquivos e Anexos ({selectedProject.files.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedProject.files.map((file) => (
                      <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', fontSize: '0.72rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{file.name}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{file.size}</span>
                        </div>
                        <button className="icon-btn" style={{ width: '24px', height: '24px', border: 'none' }} title="Baixar arquivo">
                          <Download size={10} />
                        </button>
                      </div>
                    ))}
                    {selectedProject.files.length === 0 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sem arquivos anexados.</span>
                    )}
                  </div>
                </div>

              </div>

            </div>
            )}

          </div>
        </div>
      )}

      {/* 4. MODAL OVERLAY FOR NEW PROJECT CREATION */}
      {isNewProjectModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Cadastrar Novo Projeto</h3>
              <button className="close-btn" onClick={() => setIsNewProjectModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Projeto</span>
                <input 
                  type="text" 
                  placeholder="Ex: Stripe Brasil - Conciliação Fisc." 
                  className="form-input"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Descrição do Escopo</span>
                <textarea 
                  placeholder="Descreva as tarefas centrais, integrações e dores do projeto..." 
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'none', fontFamily: 'inherit' }}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Prioridade</span>
                  <select 
                    value={newProjPriority} 
                    onChange={(e) => setNewProjPriority(e.target.value as Project['priority'])}
                    className="form-select"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Estágio Inicial</span>
                  <select 
                    value={newProjStage} 
                    onChange={(e) => setNewProjStage(e.target.value as Project['stage'])}
                    className="form-select"
                  >
                    <option value="planejamento">Planejamento</option>
                    <option value="desenvolvimento">Desenvolvimento</option>
                    <option value="validacao">Validação</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Prazo de Entrega</span>
                <input 
                  type="text" 
                  placeholder="Ex: 30/07/2026" 
                  className="form-input"
                  value={newProjDeadline}
                  onChange={(e) => setNewProjDeadline(e.target.value)}
                />
              </div>

              <div className="input-group">
                <span className="input-label">Responsável</span>
                <select 
                  className="form-select" 
                  value={newProjAssignee} 
                  onChange={(e) => setNewProjAssignee(e.target.value)}
                >
                  <option value="">-- Selecione um membro da equipe --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsNewProjectModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  <span>Criar Projeto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
