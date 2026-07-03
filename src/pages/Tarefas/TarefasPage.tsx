import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Paperclip,
  Clock,
  MapPin,
  Bell,
  List,
  KanbanSquare,
  Calendar as CalendarIcon,
  Pin,
  Users,
  Phone,
  RefreshCcw,
  Code,
  Rocket,
  Wrench,
  DollarSign,
  Briefcase
} from 'lucide-react';

import { useTaskStore } from '../../entities/tarefa/model/store';
import { useProjectStore } from '../../entities/projeto/model/store';
import { useAuthStore } from '../../entities/usuario/model/store';
import type { Task, TaskStatus, TaskType, TaskReminder } from '../../entities/tarefa/model/types';
import { TASK_TYPE_LABELS, TASK_REMINDER_LABELS } from '../../entities/tarefa/model/types';
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

const PRIORITY_COLORS = { alta: '#EF4444', media: '#F59E0B', baixa: '#10B981' };

const renderTaskIcon = (type?: string, size = 14) => {
  switch (type) {
    case 'reuniao': return <Users size={size} />;
    case 'ligacao': return <Phone size={size} />;
    case 'followup': return <RefreshCcw size={size} />;
    case 'desenvolvimento': return <Code size={size} />;
    case 'implantacao': return <Rocket size={size} />;
    case 'suporte': return <Wrench size={size} />;
    case 'financeiro': return <DollarSign size={size} />;
    case 'comercial': return <Briefcase size={size} />;
    case 'outro':
    default: return <Pin size={size} />;
  }
};

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
  const [formTime, setFormTime] = useState('');
  const [formTaskType, setFormTaskType] = useState<TaskType>('outro');
  const [formReminder, setFormReminder] = useState<TaskReminder>('sem_lembrete');
  const [formLocationLink, setFormLocationLink] = useState('');

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
      time: formTime || undefined,
      taskType: formTaskType,
      reminder: formReminder,
      locationLink: formLocationLink || undefined,
      notificationSent: false,
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
        const freshError = useTaskStore.getState().error;
        setModalError(freshError || 'Erro ao criar tarefa no Supabase. Verifique se o migration.sql foi executado.');
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
    setFormTime('');
    setFormTaskType('outro');
    setFormReminder('sem_lembrete');
    setFormLocationLink('');
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

  const handleTaskDateMove = async (taskId: string, newDateStr: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = { ...task, deadline: newDateStr };
    try {
      const success = await updateTask(updated);
      if (success) showToast('Prazo da tarefa atualizado! 📅');
      else alert('Erro ao atualizar o prazo da tarefa.');
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
    list.push({ id: `chk-${Date.now()}`, text: newChecklistItemText, done: false });
    const updated = { ...selectedTask, checklist: list };
    await updateTask(updated);
    setEditFields({ ...editFields, checklist: list });
    setNewChecklistItemText('');
  };

  const handleToggleChecklistItem = async (itemId: string, done: boolean) => {
    if (!selectedTask || !selectedTask.checklist) return;
    const list = selectedTask.checklist.map(item => item.id === itemId ? { ...item, done } : item);
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
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0 }}>Gestão de Tarefas</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} style={{ padding: '6px 12px', border: 'none', background: viewMode === 'list' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setViewMode('list')}>
              <List size={14} /> Lista
            </button>
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} style={{ padding: '6px 12px', border: 'none', background: viewMode === 'kanban' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setViewMode('kanban')}>
              <KanbanSquare size={14} /> Kanban
            </button>
            <button className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} style={{ padding: '6px 12px', border: 'none', background: viewMode === 'calendar' ? 'var(--color-primary)' : 'transparent', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setViewMode('calendar')}>
              <CalendarIcon size={14} /> Calendário
            </button>
          </div>
          <button className="primary-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Criar Tarefa</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', backgroundColor: 'var(--bg-card)', padding: '16px', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', marginBottom: '24px', alignItems: 'center' }}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar tarefas..." />
        <div className="mobile-filters-row" style={{ display: 'flex', gap: '12px', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="form-select" style={{ width: '160px', padding: '6px 12px' }}>
            <option value="all">Todos os Projetos</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ width: '140px', padding: '6px 12px' }}>
            <option value="all">Todos os Status</option>
            {STATUS_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="form-select" style={{ width: '140px', padding: '6px 12px' }}>
            <option value="all">Todas Prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </section>

      {loading && <LoadingOverlay active={true} message="Carregando tarefas..." />}
      {error && <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* View Switcher */}
      {viewMode === 'calendar' ? (
        <TaskCalendar
          tasks={filteredTasks}
          projects={projects}
          onTaskMove={handleTaskDateMove}
          onTaskClick={(taskId) => { setSelectedTaskId(taskId); setIsDetailDrawerOpen(true); }}
          onDayClick={handleDayClick}
        />
      ) : viewMode === 'kanban' ? (
        <TaskKanbanBoard
          tasks={filteredTasks}
          stages={STATUS_STAGES}
          onTaskMove={handleTaskMove}
          onTaskClick={(taskId) => { setSelectedTaskId(taskId); setIsDetailDrawerOpen(true); }}
        />
      ) : (
        /* List View */
        <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Tarefa</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Tipo</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Data</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Horário</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Lembrete</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Responsável</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Prioridade</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'right', whiteSpace: 'nowrap' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr
                  key={t.id}
                  onClick={() => { setSelectedTaskId(t.id); setIsDetailDrawerOpen(true); }}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                  className="table-row-hover"
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{t.title}</div>
                    {t.locationLink && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: 'var(--color-primary)', marginTop: '2px' }}>
                        <MapPin size={10} />
                        <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.locationLink}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
                      {renderTaskIcon(t.taskType, 14)}
                      <span style={{ color: 'var(--text-secondary)' }}>{t.taskType ? TASK_TYPE_LABELS[t.taskType] : 'Outro'}</span>
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {t.deadline ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} /> {t.deadline}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {t.time ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#A78BFA', fontWeight: 600 }}>
                        <Clock size={12} /> {t.time}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {t.reminder && t.reminder !== 'sem_lembrete' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontSize: '0.78rem' }}>
                        <Bell size={11} /> {TASK_REMINDER_LABELS[t.reminder]}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {t.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                          {t.assignee.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.82rem' }}>{t.assignee}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.05)', color: STATUS_STAGES.find(s => s.id === t.status)?.color || '#fff' }}>
                      {STATUS_STAGES.find(s => s.id === t.status)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: `${PRIORITY_COLORS[t.priority]}15`, color: PRIORITY_COLORS[t.priority] }}>
                      {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" onClick={() => handleDeleteClick(t.id)} style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}>
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
          <div className="drawer-panel" onClick={(e) => e.stopPropagation()} style={{ width: '580px', backgroundColor: 'var(--bg-sidebar)', padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', position: 'fixed', right: 0, top: 0, zIndex: 901, boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>{renderTaskIcon(selectedTask.taskType, 20)}</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>{editFields.title}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {selectedTask.taskType && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                      {TASK_TYPE_LABELS[selectedTask.taskType]}
                    </span>
                  )}
                  {selectedTask.time && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#A78BFA' }}>
                      <Clock size={11} /> {selectedTask.time}
                    </span>
                  )}
                  {selectedTask.reminder && selectedTask.reminder !== 'sem_lembrete' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#F59E0B' }}>
                      <Bell size={11} /> {TASK_REMINDER_LABELS[selectedTask.reminder]}
                    </span>
                  )}
                </div>
              </div>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => setIsDetailDrawerOpen(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
              {(['resumo', 'checklist', 'comentarios', 'arquivos'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 10px', border: 'none', background: 'none', color: activeTab === tab ? 'var(--color-primary)' : 'var(--text-secondary)', borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
                  {tab === 'resumo' ? 'Resumo' : tab === 'checklist' ? 'Checklist' : tab === 'comentarios' ? 'Comentários' : 'Arquivos'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {activeTab === 'resumo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="input-group">
                    <span className="input-label">Título da Tarefa</span>
                    <input type="text" className="form-input" value={editFields.title || ''} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <span className="input-label">Descrição</span>
                    <textarea className="form-input" style={{ minHeight: '70px', resize: 'none' }} value={editFields.description || ''} onChange={(e) => setEditFields({ ...editFields, description: e.target.value })} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <span className="input-label">Tipo</span>
                      <select className="form-select" value={editFields.taskType || 'outro'} onChange={(e) => setEditFields({ ...editFields, taskType: e.target.value as TaskType })}>
                        <option value="all">Todos os Tipos</option>
                        {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Status</span>
                      <select className="form-select" value={editFields.status || 'pendente'} onChange={(e) => setEditFields({ ...editFields, status: e.target.value as TaskStatus })}>
                        {STATUS_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <span className="input-label">Data de Entrega</span>
                      <input type="date" className="form-input" value={editFields.deadline || ''} onChange={(e) => setEditFields({ ...editFields, deadline: e.target.value })} />
                    </div>
                    <div className="input-group">
                      <span className="input-label">Horário</span>
                      <input type="time" className="form-input" value={editFields.time || ''} onChange={(e) => setEditFields({ ...editFields, time: e.target.value })} />
                    </div>
                  </div>

                  <div className="input-group">
                    <span className="input-label">Lembrete</span>
                    <select className="form-select" value={editFields.reminder || 'sem_lembrete'} onChange={(e) => setEditFields({ ...editFields, reminder: e.target.value as TaskReminder })}>
                      {Object.entries(TASK_REMINDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <span className="input-label">Prioridade</span>
                      <select className="form-select" value={editFields.priority || 'media'} onChange={(e) => setEditFields({ ...editFields, priority: e.target.value as any })}>
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <span className="input-label">Local / Link da Reunião</span>
                      <input type="text" className="form-input" placeholder="Link ou endereço" value={editFields.locationLink || ''} onChange={(e) => setEditFields({ ...editFields, locationLink: e.target.value })} />
                    </div>
                  </div>

                  {editFields.locationLink && (
                    <div style={{ padding: '10px 14px', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} style={{ color: '#818CF8', flexShrink: 0 }} />
                      {editFields.locationLink.startsWith('http') ? (
                        <a href={editFields.locationLink} target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8', fontSize: '0.82rem', textDecoration: 'none', wordBreak: 'break-all' }}>
                          {editFields.locationLink}
                        </a>
                      ) : (
                        <span style={{ color: '#818CF8', fontSize: '0.82rem' }}>{editFields.locationLink}</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button 
                      type="button"
                      className="outline-btn" 
                      style={{ flex: 1, borderColor: 'var(--color-danger)', color: 'var(--color-danger)', justifyContent: 'center', cursor: 'pointer' }} 
                      onClick={() => handleDeleteClick(selectedTask.id)}
                    >
                      Excluir Tarefa
                    </button>
                    <button 
                      type="button"
                      className="primary-btn" 
                      style={{ flex: 2, justifyContent: 'center', cursor: 'pointer' }} 
                      onClick={handleSaveEdits}
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'checklist' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleAddChecklistItem} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="form-input" placeholder="Adicionar item de checklist..." value={newChecklistItemText} onChange={(e) => setNewChecklistItemText(e.target.value)} />
                    <button type="submit" className="primary-btn" style={{ padding: '0 16px' }}>Adicionar</button>
                  </form>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {selectedTask.checklist?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="checkbox" checked={item.done} onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)} style={{ cursor: 'pointer' }} />
                          <span style={{ fontSize: '0.85rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : '#fff' }}>{item.text}</span>
                        </div>
                        <button className="icon-btn" style={{ color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleDeleteChecklistItem(item.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {(!selectedTask.checklist || selectedTask.checklist.length === 0) && (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px' }}>Nenhum item no checklist.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'comentarios' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="form-input" placeholder="Adicionar comentário..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} />
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
          <div className="card animate-slide-up" style={{ width: '560px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Criar Nova Tarefa</h3>
              <button className="close-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}>✕</button>
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

              {/* Tipo + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group">
                  <span className="input-label">Tipo *</span>
                  <select className="form-select" value={formTaskType} onChange={(e) => setFormTaskType(e.target.value as TaskType)} required>
                      <option value="outro">Selecione...</option>
                      {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Status Inicial</span>
                  <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as TaskStatus)}>
                    {STATUS_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Data + Horário */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group">
                  <span className="input-label">Data de Entrega</span>
                  <input type="date" className="form-input" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
                </div>
                <div className="input-group">
                  <span className="input-label">Horário *</span>
                  <input type="time" className="form-input" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
                </div>
              </div>

              {/* Lembrete */}
              <div className="input-group">
                <span className="input-label">Lembrete</span>
                <select className="form-select" value={formReminder} onChange={(e) => setFormReminder(e.target.value as TaskReminder)}>
                  {Object.entries(TASK_REMINDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              {/* Projeto + Responsável */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

              {/* Prioridade + Local */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="input-group">
                  <span className="input-label">Prioridade</span>
                  <select className="form-select" value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)}>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Local / Link da Reunião</span>
                  <input type="text" className="form-input" placeholder="Link ou endereço" value={formLocationLink} onChange={(e) => setFormLocationLink(e.target.value)} />
                </div>
              </div>

              {/* Preview do local se existir */}
              {formLocationLink && (
                <div style={{ padding: '10px 14px', backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={14} style={{ color: '#818CF8', flexShrink: 0 }} />
                  {formLocationLink.startsWith('http') ? (
                    <a href={formLocationLink} target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8', fontSize: '0.82rem', textDecoration: 'none', wordBreak: 'break-all' }}>
                      {formLocationLink}
                    </a>
                  ) : (
                    <span style={{ color: '#818CF8', fontSize: '0.82rem' }}>{formLocationLink}</span>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="outline-btn" onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}>Cancelar</button>
                <button type="submit" className="primary-btn">Criar Tarefa</button>
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
        <div style={{ position: 'fixed', top: '24px', right: '24px', backgroundColor: '#10B981', color: '#fff', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1100, fontWeight: 600, animation: 'slideIn 0.3s ease-out' }}>
          {toastMessage}
        </div>
      )}
    </PageContainer>
  );
}
