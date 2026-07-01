import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Paperclip
} from 'lucide-react';

import { useProjectStore } from '../../entities/projeto/model/store';
import { useAuthStore } from '../../entities/usuario/model/store';
import type { Project, ProjectStage } from '../../entities/projeto/model/types';
import { PageContainer } from '../../shared/components/PageContainer';
import { SearchBar } from '../../shared/components/SearchBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { ProjectKanbanBoard } from './components/ProjectKanbanBoard';

const STAGES: { id: ProjectStage; label: string; color: string }[] = [
  { id: 'escopo', label: 'Escopo', color: '#60A5FA' },
  { id: 'fila', label: 'Fila', color: '#9CA3AF' },
  { id: 'desenvolvimento', label: 'Desenvolvimento', color: '#8B5CF6' },
  { id: 'homologacao', label: 'Homologação', color: '#F472B6' },
  { id: 'concluido', label: 'Concluído', color: '#10B981' }
];

export default function ProjetosPage() {
  const { projects, loading, error, fetchProjects, addProject, updateProject, updateProjectStage, deleteProject } = useProjectStore();
  const teamMembers = useAuthStore((state) => state.teamMembers);

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  const userProfile = useAuthStore((state) => state.userProfile);

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modals / Drawer
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDeleteId, setProductToDeleteId] = useState<string | null>(null);

  // Active tab inside project drawer
  const [activeTab, setActiveTab] = useState<'resumo' | 'checklist' | 'equipe' | 'comentarios' | 'arquivos'>('resumo');

  // Form states for creating Project
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStage, setFormStage] = useState<ProjectStage>('fila');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPriority, setFormPriority] = useState<'baixa' | 'media' | 'alta'>('media');

  // Edit fields
  const [editFields, setEditFields] = useState<Partial<Project>>({});
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  useEffect(() => {
    if (selectedProject) {
      setEditFields({ ...selectedProject });
    }
  }, [selectedProjectId, projects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: formName,
      description: formDescription,
      stage: formStage,
      deadline: formDeadline || undefined,
      priority: formPriority,
      progress: 0,
      team: [],
      checklist: [],
      comments: [],
      files: []
    };

    const success = await addProject(newProject);
    if (success) {
      setIsAddModalOpen(false);
      resetAddForm();
    }
  };

  const resetAddForm = () => {
    setFormName('');
    setFormDescription('');
    setFormStage('fila');
    setFormDeadline('');
    setFormPriority('media');
  };

  const handleSaveEdits = async () => {
    if (!selectedProject || !editFields.name) return;

    const updatedProject: Project = {
      ...selectedProject,
      ...editFields
    } as Project;

    await updateProject(updatedProject);
  };

  // Drag and Drop optimistic stage update
  const handleProjectMove = async (projectId: string, targetStage: ProjectStage) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const oldStage = proj.stage;

    try {
      await updateProjectStage(projectId, targetStage, oldStage);
      showToast(`Estágio do projeto atualizado! 🚀`);
    } catch (err: any) {
      alert(`Falha ao salvar estágio do projeto: ${err.message || 'Erro de conexão.'}`);
    }
  };

  // Checklist Actions
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItemText.trim() || !selectedProject) return;

    const list = selectedProject.checklist ? [...selectedProject.checklist] : [];
    list.push({
      id: `chk-${Date.now()}`,
      text: newChecklistItemText,
      done: false
    });

    const progress = Math.round((list.filter(i => i.done).length / list.length) * 100) || 0;
    
    const updated = { ...selectedProject, checklist: list, progress };
    await updateProject(updated);
    setEditFields({ ...editFields, checklist: list, progress });
    setNewChecklistItemText('');
  };

  const handleToggleChecklistItem = async (itemId: string, done: boolean) => {
    if (!selectedProject || !selectedProject.checklist) return;

    const list = selectedProject.checklist.map(item => 
      item.id === itemId ? { ...item, done } : item
    );

    const progress = Math.round((list.filter(i => i.done).length / list.length) * 100) || 0;

    const updated = { ...selectedProject, checklist: list, progress };
    await updateProject(updated);
    setEditFields({ ...editFields, checklist: list, progress });
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!selectedProject || !selectedProject.checklist) return;

    const list = selectedProject.checklist.filter(item => item.id !== itemId);
    const progress = list.length > 0 ? Math.round((list.filter(i => i.done).length / list.length) * 100) : 0;

    const updated = { ...selectedProject, checklist: list, progress };
    await updateProject(updated);
    setEditFields({ ...editFields, checklist: list, progress });
  };

  // Comment Actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedProject) return;

    const list = selectedProject.comments ? [...selectedProject.comments] : [];
    list.push({
      id: `comm-${Date.now()}`,
      user: userProfile?.name || 'Membro do Time',
      text: newCommentText,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - Hoje'
    });

    const updated = { ...selectedProject, comments: list };
    await updateProject(updated);
    setEditFields({ ...editFields, comments: list });
    setNewCommentText('');
  };

  // Team Actions
  const handleToggleTeamMember = async (memberName: string) => {
    if (!selectedProject) return;

    let team = selectedProject.team ? [...selectedProject.team] : [];
    if (team.includes(memberName)) {
      team = team.filter(m => m !== memberName);
    } else {
      team.push(memberName);
    }

    const updated = { ...selectedProject, team };
    await updateProject(updated);
    setEditFields({ ...editFields, team });
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProductToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (projectToDeleteId) {
      const success = await deleteProject(projectToDeleteId);
      if (success) {
        setSelectedProjectId(null);
        setIsDetailDrawerOpen(false);
      }
    }
    setIsDeleteConfirmOpen(false);
    setProductToDeleteId(null);
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStage = stageFilter === 'all' || p.stage === stageFilter;
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;

    return matchesSearch && matchesStage && matchesPriority;
  });

  return (
    <PageContainer>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Projetos Operacionais</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Acompanhamento de onboarding e implantações operacionais da ORKA</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
            <button 
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              style={{ padding: '6px 12px', border: 'none', background: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => setViewMode('kanban')}
            >
              Pipeline Kanban
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              style={{ padding: '6px 12px', border: 'none', background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => setViewMode('list')}
            >
              Lista
            </button>
          </div>
          <button className="primary-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Criar Projeto</span>
          </button>
        </div>
      </header>

      {/* Filter and Search */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar projetos por nome..." />
        
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <select 
            value={stageFilter} 
            onChange={(e) => setStageFilter(e.target.value)}
            className="form-select"
            style={{ width: '160px', padding: '6px 12px' }}
          >
            <option value="all">Todos os Estágios</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select"
            style={{ width: '160px', padding: '6px 12px' }}
          >
            <option value="all">Todas Prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </section>

      {loading && <LoadingOverlay active={true} message="Carregando projetos..." />}
      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <ProjectKanbanBoard
          projects={filteredProjects}
          stages={STAGES}
          onProjectMove={handleProjectMove}
          onProjectClick={(projectId) => {
            setSelectedProjectId(projectId);
            setIsDetailDrawerOpen(true);
          }}
        />
      ) : (
        /* List View */
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Projeto</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Progresso</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Estágio</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Prioridade</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Prazo Limite</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr 
                  key={p.id} 
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setIsDetailDrawerOpen(true);
                  }}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition-smooth)' }} 
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{p.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                      <div style={{ flexGrow: 1, height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${p.progress || 0}%`, height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
                      </div>
                      <span>{p.progress || 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: STAGES.find(s => s.id === p.stage)?.color || '#fff'
                    }}>
                      {STAGES.find(s => s.id === p.stage)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{p.priority}</td>
                  <td style={{ padding: '12px 16px' }}>{p.deadline || '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="icon-btn" 
                      onClick={(e) => handleDeleteClick(p.id, e)}
                      style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum projeto encontrado.</div>
          )}
        </div>
      )}

      {/* Project Detail Drawer */}
      {isDetailDrawerOpen && selectedProject && (
        <div className="drawer-overlay" onClick={() => setIsDetailDrawerOpen(false)} style={{ zIndex: 900 }}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ width: '600px', backgroundColor: 'var(--bg-sidebar)', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'fixed', right: 0, top: 0, zIndex: 901, boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{editFields.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operação & Entrega</span>
              </div>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsDetailDrawerOpen(false)}>✕</button>
            </div>

            {/* Tab selection */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              {([
                { id: 'resumo', label: 'Resumo' },
                { id: 'checklist', label: 'Checklist' },
                { id: 'equipe', label: 'Equipe' },
                { id: 'comentarios', label: 'Comentários' },
                { id: 'arquivos', label: 'Arquivos' }
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '8px 10px',
                    border: 'none',
                    background: 'none',
                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Tab Content */}
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {activeTab === 'resumo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <span className="input-label">Nome do Projeto</span>
                    <input type="text" className="form-input" value={editFields.name || ''} onChange={(e) => setEditFields({ ...editFields, name: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Descrição</span>
                    <textarea className="form-input" style={{ minHeight: '80px', resize: 'none' }} value={editFields.description || ''} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Estágio</span>
                      <select className="form-select" value={editFields.stage || 'fila'} onChange={(e) => setEditFields({ ...editFields, stage: e.target.value as ProjectStage })}>
                        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Prazo</span>
                      <input type="text" className="form-input" placeholder="Ex: 30/07/2026" value={editFields.deadline || ''} onChange={(e) => setEditFields({ ...editFields, deadline: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Prioridade</span>
                      <select className="form-select" value={editFields.priority || 'media'} onChange={(e) => setEditFields({ ...editFields, priority: e.target.value as any })}>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Progresso Atual</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                        <div style={{ flexGrow: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${editFields.progress || 0}%`, height: '100%', backgroundColor: 'var(--color-primary)' }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{editFields.progress || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <button className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }} onClick={handleSaveEdits}>
                    Salvar Alterações
                  </button>
                </div>
              )}

              {activeTab === 'checklist' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Adicionar item de escopo..."
                      value={newChecklistItemText}
                      onChange={(e) => setNewChecklistItemText(e.target.value)}
                    />
                    <button type="submit" className="primary-btn" style={{ padding: '0 16px' }}>Adicionar</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {selectedProject.checklist?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input 
                            type="checkbox" 
                            checked={item.done} 
                            onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.85rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : '#fff' }}>
                            {item.text}
                          </span>
                        </div>
                        <button 
                          className="icon-btn" 
                          style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                          onClick={() => handleDeleteChecklistItem(item.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {(!selectedProject.checklist || selectedProject.checklist.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px' }}>
                        Nenhum item no checklist. Adicione o primeiro acima!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'equipe' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Membros Associados</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {teamMembers.map(m => {
                      const isAssigned = selectedProject.team?.includes(m.name);
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleToggleTeamMember(m.name)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: isAssigned ? 'rgba(45, 140, 255, 0.15)' : 'var(--bg-card)',
                            color: isAssigned ? 'var(--color-primary)' : 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'comentarios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Adicionar nota ou comentário..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <button type="submit" className="primary-btn" style={{ padding: '0 16px' }}>Enviar</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {selectedProject.comments?.map(comm => (
                      <div key={comm.id} style={{ backgroundColor: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', lineHeight: 1.4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 700 }}>{comm.user}</span>
                          <span>{comm.time}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', margin: 0, color: '#fff' }}>{comm.text}</p>
                      </div>
                    ))}
                    {(!selectedProject.comments || selectedProject.comments.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px' }}>
                        Sem comentários operacionais.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'arquivos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Paperclip size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-muted)' }} />
                    Anexar arquivos de implantação/escopo
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedProject.files?.map(f => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{f.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(f.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Criar Projeto Operacional</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>
            
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Nome do Projeto *</span>
                <input type="text" className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="Ex: Onboarding Stripe" />
              </div>
              <div className="input-group">
                <span className="input-label">Descrição</span>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'none' }} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição do escopo..." />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Estágio Inicial</span>
                  <select className="form-select" value={formStage} onChange={(e) => setFormStage(e.target.value as any)}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Prioridade</span>
                  <select className="form-select" value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Prazo de Conclusão</span>
                <input type="text" className="form-input" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} placeholder="Ex: 30/08/2026" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsAddModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={isDeleteConfirmOpen}
        title="Excluir Projeto?"
        message="Esta ação removerá de forma permanente todos os logs operacionais, checklists e comentários deste projeto. Continuar?"
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
