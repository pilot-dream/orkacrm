import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Paperclip
} from 'lucide-react';

import { useTaskStore } from '../../entities/tarefa/model/store';
import { useProjectStore } from '../../entities/projeto/model/store';
import { useAuthStore } from '../../entities/usuario/model/store';
import type { Task, TaskStatus } from '../../entities/tarefa/model/types';
import { PageContainer } from '../../shared/components/PageContainer';
import { SearchBar } from '../../shared/components/SearchBar';
import { ConfirmDialog } from '../../shared/components/ConfirmDialog';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { TaskKanbanBoard } from './components/TaskKanbanBoard';
import { TaskCalendar } from './components/TaskCalendar';

const STATUS_STAGES: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'pendente', label: 'Pendente', color: '#9CA3AF' },
  { id: 'em_progresso', label: 'Em Progresso', color: '#2D8CFF' },
  { id: 'revisao', label: 'Em Revisão', color: '#FBBF24' },
  { id: 'concluida', label: 'Concluída', color: '#10B981' }
];

export default function TarefasPage() {
  const { tasks, loading, error, fetchTasks, addTask, updateTask, updateTaskStatus, deleteTask } = useTaskStore();
  const { projects, fetchProjects } = useProjectStore();
  const teamMembers = useAuthStore((state) => state.teamMembers);
  const userProfile = useAuthStore((state) => state.userProfile);

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Modals / Drawer
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);

  // Active tab inside task drawer
  const [activeTab, setActiveTab] = useState<'resumo' | 'checklist' | 'comentarios' | 'arquivos'>('resumo');

  // Form states for creating Task
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('pendente');
  const [formPriority, setFormPriority] = useState<'baixa' | 'media' | 'alta'>('media');
  const [formAssignee, setFormAssignee] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  // Error and Toast States
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Edit fields
  const [editFields, setEditFields] = useState<Partial<Task>>({});
  const [newChecklistItemText, setNewChecklistItemText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  useEffect(() => {
    if (selectedTask) {
      setEditFields({ ...selectedTask });
    }
  }, [selectedTaskId, tasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    const proj = projects.find(p => p.id === formProjectId);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: formTitle,
      description: formDescription,
      status: formStatus,
      priority: formPriority,
      assignee: formAssignee || undefined,
      projectId: formProjectId || undefined,
      projectName: proj ? proj.name : undefined,
      deadline: formDeadline || undefined,
      checklist: [],
      comments: [],
      attachments: []
    };

    try {
      setModalError(null);
      const success = await addTask(newTask);
      if (success) {
        setIsAddModalOpen(false);
        resetAddForm();
        showToast('Tarefa criada com sucesso! 🎉');
      } else {
        setModalError(error || 'Erro ao criar tarefa no Supabase. Verifique se o migration.sql foi executado.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Erro ao criar tarefa.');
    }
  };

  const resetAddForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormStatus('pendente');
    setFormPriority('media');
    setFormAssignee('');
    setFormProjectId('');
    setFormDeadline('');
    setModalError(null);
  };

  const handleSaveEdits = async () => {
    if (!selectedTask || !editFields.title) return;

    const proj = projects.find(p => p.id === editFields.projectId);

    const updatedTask: Task = {
      ...selectedTask,
      ...editFields,
      projectName: proj ? proj.name : undefined
    } as Task;

    try {
      const success = await updateTask(updatedTask);
      if (success) {
        setIsDetailDrawerOpen(false);
        showToast('Tarefa atualizada com sucesso! 🎉');
      } else {
        alert(error || 'Erro ao atualizar tarefa no Supabase.');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar tarefa.');
    }
  };

  // Drag and Drop optimistic status update
  const handleTaskMove = async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const oldStatus = task.status;

    try {
      await updateTaskStatus(taskId, targetStatus, oldStatus);
      showToast(`Status da tarefa atualizado! 🚀`);
    } catch (err: any) {
      alert(`Falha ao salvar status da tarefa: ${err.message || 'Erro de conexão.'}`);
    }
  };

  // Calendar View Actions
  const handleTaskDateMove = async (taskId: string, newDateStr: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    // Apply date change
    const updated = { ...task, deadline: newDateStr };
    try {
      const success = await updateTask(updated);
      if (success) {
        showToast('Prazo da tarefa atualizado! 📅');
      } else {
        alert('Erro ao atualizar o prazo da tarefa.');
      }
    } catch (err: any) {
      alert(`Falha ao mover tarefa: ${err.message || 'Erro de conexão.'}`);
    }
  };

  const handleDayClick = (dateStr: string) => {
    setFormDeadline(dateStr);
    setIsAddModalOpen(true);
  };

  // Checklist Actions
  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItemText.trim() || !selectedTask) return;

    const list = selectedTask.checklist ? [...selectedTask.checklist] : [];
    list.push({
      id: `chk-${Date.now()}`,
      text: newChecklistItemText,
      done: false
    });

    const updated = { ...selectedTask, checklist: list };
    await updateTask(updated);
    setEditFields({ ...editFields, checklist: list });
    setNewChecklistItemText('');
  };

  const handleToggleChecklistItem = async (itemId: string, done: boolean) => {
    if (!selectedTask || !selectedTask.checklist) return;

    const list = selectedTask.checklist.map(item => 
      item.id === itemId ? { ...item, done } : item
    );

    const updated = { ...selectedTask, checklist: list };
    await updateTask(updated);
    setEditFields({ ...editFields, checklist: list });
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!selectedTask || !selectedTask.checklist) return;

    const list = selectedTask.checklist.filter(item => item.id !== itemId);
    const updated = { ...selectedTask, checklist: list };
    await updateTask(updated);
    setEditFields({ ...editFields, checklist: list });
  };

  // Comment Actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedTask) return;

    const list = selectedTask.comments ? [...selectedTask.comments] : [];
    list.push({
      id: `comm-${Date.now()}`,
      user: userProfile?.name || 'Membro do Time',
      text: newCommentText,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - Hoje'
    });

    const updated = { ...selectedTask, comments: list };
    await updateTask(updated);
    setEditFields({ ...editFields, comments: list });
    setNewCommentText('');
  };

  const handleDeleteClick = (id: string) => {
    setTaskToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDeleteId) {
      try {
        const success = await deleteTask(taskToDeleteId);
        if (success) {
          setSelectedTaskId(null);
          setIsDetailDrawerOpen(false);
          showToast('Tarefa excluída com sucesso! 🗑️');
        } else {
          alert(error || 'Erro ao excluir tarefa no Supabase.');
        }
      } catch (err: any) {
        alert(err.message || 'Erro ao excluir tarefa.');
      }
    }
    setIsDeleteConfirmOpen(false);
    setTaskToDeleteId(null);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || t.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  return (
    <PageContainer>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>Gestão de Tarefas</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Controle e distribuição de tarefas de desenvolvimento e implantação</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              style={{ padding: '6px 12px', border: 'none', background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => setViewMode('list')}
            >
              📋 Lista
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              style={{ padding: '6px 12px', border: 'none', background: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => setViewMode('kanban')}
            >
              🗂️ Kanban
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              style={{ padding: '6px 12px', border: 'none', background: viewMode === 'calendar' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendário
            </button>
          </div>
          <button className="primary-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Criar Tarefa</span>
          </button>
        </div>
      </header>

      {/* Filters and Search */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar tarefas..." />
        
        <div style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <select 
            value={projectFilter} 
            onChange={(e) => setProjectFilter(e.target.value)}
            className="form-select"
            style={{ width: '160px', padding: '6px 12px' }}
          >
            <option value="all">Todos os Projetos</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ width: '140px', padding: '6px 12px' }}
          >
            <option value="all">Todos os Status</option>
            {STATUS_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="form-select"
            style={{ width: '140px', padding: '6px 12px' }}
          >
            <option value="all">Todas Prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </section>

      {loading && <LoadingOverlay active={true} message="Carregando tarefas..." />}
      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Kanban Board / Calendar Board / List Switcher */}
      {viewMode === 'calendar' ? (
        <TaskCalendar
          tasks={filteredTasks}
          onTaskMove={handleTaskDateMove}
          onTaskClick={(taskId) => {
            setSelectedTaskId(taskId);
            setIsDetailDrawerOpen(true);
          }}
          onDayClick={handleDayClick}
        />
      ) : viewMode === 'kanban' ? (
        <TaskKanbanBoard
          tasks={filteredTasks}
          stages={STATUS_STAGES}
          onTaskMove={handleTaskMove}
          onTaskClick={(taskId) => {
            setSelectedTaskId(taskId);
            setIsDetailDrawerOpen(true);
          }}
        />
      ) : (
        /* List View */
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Tarefa</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Projeto</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Responsável</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Prioridade</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Prazo</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr 
                  key={t.id} 
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setIsDetailDrawerOpen(true);
                  }}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition-smooth)' }} 
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{t.title}</td>
                  <td style={{ padding: '12px 16px' }}>{t.projectName || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{t.assignee || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: STATUS_STAGES.find(s => s.id === t.status)?.color || '#fff'
                    }}>
                      {STATUS_STAGES.find(s => s.id === t.status)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{t.priority}</td>
                  <td style={{ padding: '12px 16px' }}>{t.deadline || '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="icon-btn" 
                      onClick={() => handleDeleteClick(t.id)}
                      style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTasks.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma tarefa encontrada.</div>
          )}
        </div>
      )}

      {/* Task Detail Drawer */}
      {isDetailDrawerOpen && selectedTask && (
        <div className="drawer-overlay" onClick={() => setIsDetailDrawerOpen(false)} style={{ zIndex: 900 }}>
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ width: '560px', backgroundColor: 'var(--bg-sidebar)', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'fixed', right: 0, top: 0, zIndex: 901, boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>{editFields.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Detalhes da Tarefa</span>
              </div>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsDetailDrawerOpen(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              {([
                { id: 'resumo', label: 'Resumo' },
                { id: 'checklist', label: 'Checklist' },
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

            {/* Content */}
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {activeTab === 'resumo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <span className="input-label">Título da Tarefa</span>
                    <input type="text" className="form-input" value={editFields.title || ''} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Descrição</span>
                    <textarea className="form-input" style={{ minHeight: '80px', resize: 'none' }} value={editFields.description || ''} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <span className="input-label">Projeto Associado</span>
                      <select className="form-select" value={editFields.projectId || ''} onChange={(e) => setEditFields({ ...editFields, projectId: e.target.value })}>
                        <option value="">Nenhum</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Responsável</span>
                      <select className="form-select" value={editFields.assignee || ''} onChange={(e) => setEditFields({ ...editFields, assignee: e.target.value })}>
                        <option value="">Nenhum</option>
                        {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
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
                      <span className="input-label">Prazo</span>
                      <input type="text" className="form-input" placeholder="Ex: 30/07/2026" value={editFields.deadline || ''} onChange={(e) => setEditFields({ ...editFields, deadline: e.target.value })} />
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-label">Status</span>
                    <select className="form-select" value={editFields.status || 'pendente'} onChange={(e) => setEditFields({ ...editFields, status: e.target.value as TaskStatus })}>
                      {STATUS_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
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
                      placeholder="Adicionar item de checklist..."
                      value={newChecklistItemText}
                      onChange={(e) => setNewChecklistItemText(e.target.value)}
                    />
                    <button type="submit" className="primary-btn" style={{ padding: '0 16px' }}>Adicionar</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {selectedTask.checklist?.map(item => (
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
                    {(!selectedTask.checklist || selectedTask.checklist.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px' }}>
                        Nenhum item no checklist.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comentarios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Adicionar comentário..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                    />
                    <button type="submit" className="primary-btn" style={{ padding: '0 16px' }}>Enviar</button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {selectedTask.comments?.map(comm => (
                      <div key={comm.id} style={{ backgroundColor: 'var(--bg-card)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', lineHeight: 1.4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 700 }}>{comm.user}</span>
                          <span>{comm.time}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', margin: 0, color: '#fff' }}>{comm.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'arquivos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Paperclip size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-muted)' }} />
                    Anexar arquivos a esta tarefa
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedTask.attachments?.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
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

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card animate-slide-up" style={{ width: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Criar Nova Tarefa</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>✕</button>
            </div>

            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--color-danger)', marginBottom: '14px' }}>
                {modalError}
              </div>
            )}
            
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <span className="input-label">Título da Tarefa *</span>
                <input type="text" className="form-input" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required placeholder="Ex: Criar Webhook do Stripe" />
              </div>
              <div className="input-group">
                <span className="input-label">Descrição</span>
                <textarea className="form-input" style={{ minHeight: '60px', resize: 'none' }} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição da tarefa..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Projeto Associado</span>
                  <select className="form-select" value={formProjectId} onChange={(e) => setFormProjectId(e.target.value)}>
                    <option value="">Nenhum</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Responsável</span>
                  <select className="form-select" value={formAssignee} onChange={(e) => setFormAssignee(e.target.value)}>
                    <option value="">Nenhum</option>
                    {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Prioridade</span>
                  <select className="form-select" value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Prazo de Entrega</span>
                  <input type="date" className="form-input" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
                </div>
              </div>

              <div className="input-group">
                <span className="input-label">Status Inicial</span>
                <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as TaskStatus)}>
                  {STATUS_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
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
        title="Excluir Tarefa?"
        message="Esta ação removerá de forma permanente todos os checklists e logs desta tarefa. Continuar?"
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
