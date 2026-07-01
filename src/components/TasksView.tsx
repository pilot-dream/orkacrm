import React, { useState, useMemo, useEffect, useRef } from 'react';
import { isSupabaseActive } from '../lib/supabaseClient';
import { supabaseTasks } from '../lib/supabaseService';
import { 
  Calendar as CalendarIcon, 
  List, 
  LayoutGrid, 
  Plus, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  Sparkles, 
  CheckCircle,
  ArrowRight,
  Info,
  Trash2,
  Edit2
} from 'lucide-react';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pendente' | 'em_progresso' | 'concluido';
  priority: 'alta' | 'media' | 'baixa';
  assignee: string; // 'Orka Admin' | 'Mariana Costa' | 'Lucas Silva'
  deadline: string; // YYYY-MM-DD
}

interface AiSuggestion {
  taskId: string;
  suggestedPriority: 'alta' | 'media' | 'baixa';
  rationale: string;
}

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Notion Sync - Sincronizar Minutas',
    description: 'Sincronizar as minutas de reuniões com as tarefas ativas do workspace Notion. Mapear Webhooks Notion API.',
    status: 'pendente',
    priority: 'baixa',
    assignee: 'Lucas Silva',
    deadline: '2026-06-27'
  },
  {
    id: 'task-2',
    title: 'Stripe Conciliação - Subir Testes de Carga',
    description: 'Subir testes de carga e validar conciliação de chargebacks fiscais em ambiente de homologação e sandbox.',
    status: 'em_progresso',
    priority: 'media',
    assignee: 'Orka Admin',
    deadline: '2026-07-02'
  },
  {
    id: 'task-3',
    title: 'WhatsApp Bot - Treinar Tom de Voz',
    description: 'Treinar atendente cognitivo do WhatsApp em tom de voz institucional para disparar mensagens ativas e engajar novos leads.',
    status: 'em_progresso',
    priority: 'alta',
    assignee: 'Mariana Costa',
    deadline: '2026-07-15'
  },
  {
    id: 'task-4',
    title: 'HubSpot Webhook Setup',
    description: 'Configurar mapeamento de webhooks e logs comerciais, disparando alertas diretamente no Slack corporativo.',
    status: 'concluido',
    priority: 'media',
    assignee: 'Lucas Silva',
    deadline: '2026-06-25'
  },
  {
    id: 'task-5',
    title: 'Vercel QA Deploy Integration',
    description: 'Ajustar webhook de deploy integrado com ORKA Brain para agentes cognitivos realizarem varredura de quebras visuais.',
    status: 'pendente',
    priority: 'alta',
    assignee: 'Mariana Costa',
    deadline: '2026-07-05'
  },
  {
    id: 'task-6',
    title: 'Linear Co - Triagem Automatizada',
    description: 'Integrar modelo de LLM para classificar severidade e abrir bugs automaticamente no Linear.',
    status: 'pendente',
    priority: 'media',
    assignee: 'Lucas Silva',
    deadline: '2026-07-10'
  }
];

import type { TeamMember } from './SettingsView';

interface TasksViewProps {
  userEmail?: string;
  teamMembers: TeamMember[];
  onAddNotification: (email: string, text: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ userEmail, teamMembers, onAddNotification }) => {
  // --- MOCK INITIATED DATA ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    const loadTasks = async () => {
      if (userEmail) {
        if (isSupabaseActive()) {
          const dbTasks = await supabaseTasks.fetch();
          setTasks(dbTasks);
        } else {
          const key = 'orka_tasks';
          const saved = localStorage.getItem(key);
          if (saved) {
            setTasks(JSON.parse(saved));
          } else {
            setTasks([]);
            localStorage.setItem(key, JSON.stringify([]));
          }
        }
        isLoadedRef.current = true;
      }
    };
    loadTasks();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && isLoadedRef.current && !isSupabaseActive()) {
      localStorage.setItem('orka_tasks', JSON.stringify(tasks));
    }
  }, [tasks, userEmail]);

  // --- INTERACTIVE & FILTER STATES ---
  const [activeView, setActiveView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showAiOnly, setShowAiOnly] = useState(false);

  // Calendar Date State (Standard June 2026 baseline matching other dates)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 26)); // June is index 5

  // Modal states
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // New Task Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<Task['status']>('pendente');
  const [newPriority, setNewPriority] = useState<Task['priority']>('media');
  const [newAssignee, setNewAssignee] = useState('Orka Admin');
  const [newDeadline, setNewDeadline] = useState('2026-06-30');

  // Edit Task Form
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState<Task['status']>('pendente');
  const [editPriority, setEditPriority] = useState<Task['priority']>('media');
  const [editAssignee, setEditAssignee] = useState('Orka Admin');
  const [editDeadline, setEditDeadline] = useState('2026-06-30');

  // --- DYNAMIC AI SUGGESTIONS ENGINE ---
  // Calculates priority suggestions based on deadline constraints, text complexity, and status
  const aiSuggestions = useMemo(() => {
    const list: AiSuggestion[] = [];
    const todayDate = new Date(2026, 5, 26); // Baseline today reference matching database records
    tasks.forEach(task => {
      if (task.status === 'concluido') return;

      const deadlineDate = new Date(task.deadline);
      const diffTime = deadlineDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const hasStripeOrHubspot = task.title.toLowerCase().includes('stripe') || 
                                 task.description.toLowerCase().includes('stripe') ||
                                 task.title.toLowerCase().includes('hubspot');
      
      const hasUrgentWords = task.description.toLowerCase().includes('urgente') ||
                             task.description.toLowerCase().includes('fiscais') ||
                             task.description.toLowerCase().includes('deploy');

      // Rule 1: Deadline is tomorrow or past, and priority is not alta
      if (diffDays <= 1 && task.priority !== 'alta') {
        list.push({
          taskId: task.id,
          suggestedPriority: 'alta',
          rationale: `Prazo crítico detectado (${diffDays === 1 ? 'Amanhã' : 'Atrasado'}). A tarefa precisa de atenção prioritária para mitigar riscos de atraso.`
        });
      }
      // Rule 2: High priority terms/integrations, and priority is not alta
      else if ((hasStripeOrHubspot || hasUrgentWords) && task.priority === 'media') {
        list.push({
          taskId: task.id,
          suggestedPriority: 'alta',
          rationale: 'Termos críticos ou integrações financeiras/deploy detectados. Sugere-se elevar prioridade para mitigar gargalos fiscais e de infraestrutura.'
        });
      }
      // Rule 3: Priority is alta, but deadline is far away (> 10 days) and no critical words
      else if (diffDays > 10 && task.priority === 'alta' && !hasStripeOrHubspot && !hasUrgentWords) {
        list.push({
          taskId: task.id,
          suggestedPriority: 'media',
          rationale: `Prazo de entrega confortável (${diffDays} dias) e sem impeditivos de conciliação. A prioridade pode ser reduzida para liberar banda para outras tarefas.`
        });
      }
      // Rule 4: Priority is baixa, but deadline is within 5 days and priority is baixa
      else if (diffDays <= 5 && task.priority === 'baixa') {
        list.push({
          taskId: task.id,
          suggestedPriority: 'media',
          rationale: `Prazo intermediário se aproximando (${diffDays} dias). Recomenda-se elevar de Baixa para Média para garantir fluxo de desenvolvimento regular.`
        });
      }
    });
    return list;
  }, [tasks]);

  // --- HANDLERS ---
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Math.random().toString(36).substr(2, 9)}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Nenhuma descrição detalhada informada.',
      status: newStatus,
      priority: newPriority,
      assignee: newAssignee,
      deadline: newDeadline || '2026-06-30'
    };

    // Send notification to the assignee
    const assigneeMember = teamMembers.find(m => m.name === newAssignee);
    if (assigneeMember) {
      onAddNotification(assigneeMember.email, `📌 Nova tarefa atribuída a você: "${newTitle.trim()}"`);
    }

    setTasks([...tasks, newTask]);
    if (isSupabaseActive()) {
      supabaseTasks.insert(newTask);
    }
    setIsNewTaskModalOpen(false);

    // Reset fields
    setNewTitle('');
    setNewDesc('');
    setNewStatus('pendente');
    setNewPriority('media');
    setNewAssignee('Orka Admin');
    setNewDeadline('2026-06-30');
  };

  const handleOpenEditModal = (task: Task) => {
    setSelectedTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditAssignee(task.assignee);
    setEditDeadline(task.deadline);
  };

  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !editTitle.trim()) return;

    const oldTask = tasks.find(t => t.id === selectedTaskId);

    const updated: Task = {
      id: selectedTaskId,
      title: editTitle.trim(),
      description: editDesc.trim(),
      status: editStatus,
      priority: editPriority,
      assignee: editAssignee,
      deadline: editDeadline
    };

    // Send notification if assignee changed
    if (oldTask && oldTask.assignee !== editAssignee) {
      const newAssigneeMember = teamMembers.find(m => m.name === editAssignee);
      if (newAssigneeMember) {
        onAddNotification(newAssigneeMember.email, `📌 Tarefa reatribuída a você: "${editTitle.trim()}"`);
      }
    }

    setTasks(prevTasks => prevTasks.map(t => t.id === selectedTaskId ? updated : t));
    if (isSupabaseActive()) {
      supabaseTasks.update(updated);
    }

    setSelectedTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
      if (isSupabaseActive()) {
        supabaseTasks.delete(taskId);
      }
      setSelectedTaskId(null);
    }
  };

  const handleApplyAiSuggestion = (taskId: string, suggestedPriority: Task['priority']) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const updated = { ...t, priority: suggestedPriority };
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updated : t));
    if (isSupabaseActive()) {
      supabaseTasks.update(updated);
    }
    
    // If the edit modal is open for this task, sync the priority
    if (selectedTaskId === taskId) {
      setEditPriority(suggestedPriority);
    }
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const nextStatus: Task['status'] = 
      t.status === 'pendente' ? 'em_progresso' : 
      t.status === 'em_progresso' ? 'concluido' : 'pendente';
    
    const updated = { ...t, status: nextStatus };
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updated : t));
    if (isSupabaseActive()) {
      supabaseTasks.update(updated);
    }
  };

  const handleQuickMoveStage = (taskId: string, stage: Task['status']) => {
    const t = tasks.find(x => x.id === taskId);
    if (!t) return;
    const updated = { ...t, status: stage };
    setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updated : t));
    if (isSupabaseActive()) {
      supabaseTasks.update(updated);
    }
  };

  // --- FILTERED TASKS COMPUTATION ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignee.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' || t.assignee === assigneeFilter;
      
      const hasSuggestion = aiSuggestions.some(s => s.taskId === t.id);
      const matchesAi = !showAiOnly || hasSuggestion;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesAi;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, assigneeFilter, showAiOnly, aiSuggestions]);

  // --- CALENDAR METRICS GENERATION ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesPt = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const calendarCells = useMemo(() => {
    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

    const daysInPrev = getDaysInMonth(year, month - 1);
    const daysInCurrent = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month); // 0 = Sun, 1 = Mon...

    const cells = [];

    // Prev month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrev - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateString = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cells.push({ day, dateString, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrent; i++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, dateString, isCurrentMonth: true });
    }

    // Next month days to complete 42 cells
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateString = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, dateString, isCurrentMonth: false });
    }

    return cells;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // --- GRAPHIC PILLS HELPERS ---
  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'alta':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Alta</span>;
      case 'media':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>Média</span>;
      case 'baixa':
        return <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>Baixa</span>;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'pendente':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--color-warning)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>Pendente</span>;
      case 'em_progresso':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(139, 92, 246, 0.08)', color: 'var(--color-purple)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>Em Progresso</span>;
      case 'concluido':
        return <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--color-success)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>Concluído</span>;
    }
  };

  const getAssigneeAvatar = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('');
    return (
      <div 
        style={{ 
          width: '24px', 
          height: '24px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)',
          color: '#fff', 
          fontSize: '0.65rem', 
          fontWeight: 700, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: '1.5px solid var(--bg-card)'
        }}
        title={name}
      >
        {initials}
      </div>
    );
  };

  return (
    <div className="content-wrapper animate-slide-up" style={{ paddingBottom: '40px' }}>
      
      {/* 1. ORKA AI TASK OPTIMIZER BANNER */}
      {aiSuggestions.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(22, 29, 41, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.08)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '20px',
          marginBottom: '24px',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#C084FC', display: 'flex' }}>
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFF' }}>ORKA AI - Task Priority Optimizer</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Identificamos <b>{aiSuggestions.length} oportunidades</b> de otimização de prioridades na fila com base em prazos e complexidade.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aiSuggestions.slice(0, 3).map((suggestion) => {
              const taskObj = tasks.find(t => t.id === suggestion.taskId);
              if (!taskObj) return null;

              return (
                <div key={suggestion.taskId} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  backgroundColor: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  padding: '10px 16px', 
                  borderRadius: '8px',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: '200px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFF' }}>{taskObj.title}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Info size={12} style={{ color: '#A78BFA' }} />
                      {suggestion.rationale}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{taskObj.priority}</span>
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 700, color: '#C084FC', textTransform: 'uppercase' }}>{suggestion.suggestedPriority}</span>
                    </div>

                    <button 
                      className="primary-btn" 
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '0.7rem', 
                        backgroundColor: 'rgba(139, 92, 246, 0.2)', 
                        border: '1px solid rgba(139, 92, 246, 0.4)', 
                        color: '#C084FC',
                        boxShadow: '0 0 10px rgba(139, 92, 246, 0.15)'
                      }}
                      onClick={() => handleApplyAiSuggestion(suggestion.taskId, suggestion.suggestedPriority)}
                    >
                      <Check size={12} />
                      <span>Aplicar IA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CONTROLS HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Fila Operacional de Atividades</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Gerencie e distribua as prioridades técnicas da semana</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Toggler Tabs */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px' }}>
            <button 
              onClick={() => setActiveView('kanban')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === 'kanban' ? 'rgba(45, 140, 255, 0.1)' : 'transparent',
                color: activeView === 'kanban' ? 'var(--color-primary-hover)' : 'var(--text-secondary)'
              }}
            >
              <LayoutGrid size={13} />
              <span>Kanban</span>
            </button>
            <button 
              onClick={() => setActiveView('list')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === 'list' ? 'rgba(45, 140, 255, 0.1)' : 'transparent',
                color: activeView === 'list' ? 'var(--color-primary-hover)' : 'var(--text-secondary)'
              }}
            >
              <List size={13} />
              <span>Lista</span>
            </button>
            <button 
              onClick={() => setActiveView('calendar')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '6px 12px', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeView === 'calendar' ? 'rgba(45, 140, 255, 0.1)' : 'transparent',
                color: activeView === 'calendar' ? 'var(--color-primary-hover)' : 'var(--text-secondary)'
              }}
            >
              <CalendarIcon size={13} />
              <span>Calendário</span>
            </button>
          </div>

          <button className="primary-btn" onClick={() => setIsNewTaskModalOpen(true)}>
            <Plus size={16} />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* 3. FILTER BAR */}
      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 'var(--border-radius-lg)', 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Text Search */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: 'var(--bg-main)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '6px', 
            padding: '6px 12px', 
            gap: '8px',
            flexGrow: 1,
            minWidth: '200px'
          }}>
            <Search size={14} className="text-secondary" />
            <input 
              type="text" 
              placeholder="Pesquisar por título, escopo ou responsável..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.78rem' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select 
            className="form-select" 
            style={{ width: '140px', padding: '6px 10px', fontSize: '0.75rem', backgroundColor: 'var(--bg-main)' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_progresso">Em Progresso</option>
            <option value="concluido">Concluído</option>
          </select>

          {/* Priority Filter */}
          <select 
            className="form-select" 
            style={{ width: '140px', padding: '6px 10px', fontSize: '0.75rem', backgroundColor: 'var(--bg-main)' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">Todas Prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          {/* Assignee Filter */}
          <select 
            className="form-select" 
            style={{ width: '160px', padding: '6px 10px', fontSize: '0.75rem', backgroundColor: 'var(--bg-main)' }}
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="all">Todos Responsáveis</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* AI Suggestions Quick Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showAiOnly}
              onChange={(e) => setShowAiOnly(e.target.checked)}
              style={{ accentColor: 'var(--color-purple)', cursor: 'pointer' }}
            />
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} style={{ color: '#C084FC' }} />
              Mostrar apenas tarefas recomendadas pela IA ({aiSuggestions.length})
            </span>
          </label>
        </div>
      </div>

      {/* 4. RENDER SELECTED VIEW */}
      {activeView === 'kanban' && (
        <div className="kanban-tasks-grid">
          {/* Columns */}
          {['pendente', 'em_progresso', 'concluido'].map((colId) => {
            const colTasks = filteredTasks.filter(t => t.status === colId);
            const colTitle = colId === 'pendente' ? 'Pendente' : colId === 'em_progresso' ? 'Em Progresso' : 'Concluído';
            const colColor = colId === 'pendente' ? 'var(--color-warning)' : colId === 'em_progresso' ? 'var(--color-purple)' : 'var(--color-success)';

            return (
              <div key={colId} style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderRadius: 'var(--border-radius-lg)', 
                border: '1px solid var(--border-color)', 
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                minHeight: '480px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colColor }}></span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFF' }}>{colTitle}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                    {colTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {colTasks.map((t) => {
                    const hasAiSug = aiSuggestions.find(s => s.taskId === t.id);
                    return (
                      <div 
                        key={t.id}
                        className="card"
                        style={{ 
                          padding: '14px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '10px',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255,255,255,0.01)',
                          border: '1px solid var(--border-color)',
                          position: 'relative'
                        }}
                        onClick={() => handleOpenEditModal(t)}
                      >
                        {/* AI Glow effect if task has recommendation */}
                        {hasAiSug && (
                          <div style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            height: '2px', 
                            background: 'linear-gradient(90deg, #A78BFA, #C084FC)',
                            borderRadius: '12px 12px 0 0'
                          }} />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {getPriorityBadge(t.priority)}
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} />
                            {new Date(t.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFF', marginBottom: '4px' }}>{t.title}</h4>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                            {t.description}
                          </p>
                        </div>

                        {/* Footer details */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                          {/* Quick stage controls on card footer */}
                          <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                            <button 
                              className="icon-btn" 
                              style={{ width: '18px', height: '18px', border: 'none', color: t.status === 'concluido' ? 'var(--color-success)' : 'var(--text-muted)' }}
                              onClick={() => handleQuickMoveStage(t.id, t.status === 'concluido' ? 'pendente' : 'concluido')}
                              title={t.status === 'concluido' ? "Desmarcar conclusão" : "Marcar como Concluído"}
                            >
                              <CheckCircle size={12} />
                            </button>
                            
                            <select 
                              value={t.status}
                              onChange={(e) => handleQuickMoveStage(t.id, e.target.value as Task['status'])}
                              style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.65rem', outline: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <option value="pendente">Pendente</option>
                              <option value="em_progresso">Em Progresso</option>
                              <option value="concluido">Concluído</option>
                            </select>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {hasAiSug && (
                              <span 
                                style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.62rem', color: '#C084FC', fontWeight: 700 }}
                                title={hasAiSug.rationale}
                              >
                                <Sparkles size={10} />
                                IA Sugere
                              </span>
                            )}
                            {getAssigneeAvatar(t.assignee)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      Nenhuma tarefa
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeView === 'list' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Tarefa</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Responsável</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Prioridade</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Prazo</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Recomendação IA</th>
                <th style={{ padding: '12px 16px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((t) => {
                const hasAiSug = aiSuggestions.find(s => s.taskId === t.id);
                return (
                  <tr 
                    key={t.id} 
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onClick={() => handleOpenEditModal(t)}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FFF' }}>{t.title}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }}>
                          {t.description}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getAssigneeAvatar(t.assignee)}
                        <span style={{ fontSize: '0.74rem', color: '#FFF' }}>{t.assignee}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(t.status)}</td>
                    <td style={{ padding: '14px 16px' }}>{getPriorityBadge(t.priority)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.74rem', color: '#FFF' }}>
                      {new Date(t.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {hasAiSug ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, backgroundColor: 'rgba(139, 92, 246, 0.12)', color: '#C084FC', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                            <Sparkles size={10} />
                            Mudar para {hasAiSug.suggestedPriority}
                          </span>
                          <button 
                            style={{ 
                              padding: '2px 6px', 
                              fontSize: '0.62rem', 
                              backgroundColor: 'rgba(255,255,255,0.03)', 
                              border: '1px solid var(--border-color)', 
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#fff'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyAiSuggestion(t.id, hasAiSug.suggestedPriority);
                            }}
                          >
                            Aplicar
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Adequada</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          className="icon-btn" 
                          style={{ width: '26px', height: '26px', border: 'none' }}
                          onClick={() => handleToggleTaskStatus(t.id)}
                          title="Alternar Status"
                        >
                          <CheckCircle size={14} style={{ color: t.status === 'concluido' ? 'var(--color-success)' : 'var(--text-muted)' }} />
                        </button>
                        <button 
                          className="icon-btn" 
                          style={{ width: '26px', height: '26px', border: 'none' }}
                          onClick={() => handleOpenEditModal(t)}
                          title="Editar"
                        >
                          <Edit2 size={13} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Nenhuma tarefa encontrada correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'calendar' && (
        <div className="card" style={{ padding: '24px' }}>
          
          {/* Calendar Header with Month Traversal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
              {monthNamesPt[month]} {year}
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="outline-btn" style={{ padding: '6px 12px' }} onClick={handlePrevMonth}>
                <ChevronLeft size={16} />
              </button>
              <button 
                className="outline-btn" 
                style={{ padding: '6px 12px', fontSize: '0.72rem' }} 
                onClick={() => setCurrentDate(new Date(2026, 5, 26))}
              >
                Hoje
              </button>
              <button className="outline-btn" style={{ padding: '6px 12px' }} onClick={handleNextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Titles Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gap: '8px', 
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <span key={day} style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {day}
              </span>
            ))}
          </div>

          {/* 42-cell Month Days Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gridAutoRows: '100px', 
            gap: '8px'
          }}>
            {calendarCells.map((cell, idx) => {
              const cellTasks = tasks.filter(t => t.deadline === cell.dateString);
              const isToday = cell.dateString === '2026-06-26';

              return (
                <div 
                  key={idx} 
                  style={{ 
                    backgroundColor: cell.isCurrentMonth ? 'var(--bg-main)' : 'rgba(255,255,255,0.01)', 
                    border: isToday ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    padding: '8px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                    transition: 'border-color 0.2s'
                  }}
                  onClick={() => {
                    if (cellTasks.length === 0) {
                      setNewDeadline(cell.dateString);
                      setIsNewTaskModalOpen(true);
                    }
                  }}
                  className="calendar-cell-hover"
                >
                  {/* Day number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 700, 
                      color: isToday ? 'var(--color-primary-hover)' : 'var(--text-secondary)',
                      backgroundColor: isToday ? 'rgba(45,140,255,0.1)' : 'transparent',
                      padding: isToday ? '2px 6px' : '0',
                      borderRadius: '4px'
                    }}>
                      {cell.day}
                    </span>
                    {cellTasks.length > 0 && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {cellTasks.length} {cellTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    )}
                  </div>

                  {/* Tasks plot inside day */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', flexGrow: 1 }}>
                    {cellTasks.map(t => {
                      let tagColor = 'var(--color-warning)';
                      if (t.status === 'concluido') tagColor = 'var(--color-success)';
                      else if (t.status === 'em_progresso') tagColor = 'var(--color-purple)';

                      return (
                        <div 
                          key={t.id} 
                          style={{ 
                            fontSize: '0.65rem', 
                            padding: '2px 4px', 
                            borderRadius: '4px', 
                            backgroundColor: 'rgba(255,255,255,0.03)', 
                            borderLeft: `3px solid ${tagColor}`,
                            color: '#FFF',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // prevent opening empty cell click modal
                            handleOpenEditModal(t);
                          }}
                          title={`${t.title} - [${t.priority.toUpperCase()}]`}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MODAL FOR NEW TASK CREATION */}
      {isNewTaskModalOpen && (
        <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="card animate-slide-up" style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Cadastrar Nova Tarefa</h3>
              <button className="close-btn" onClick={() => setIsNewTaskModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <span className="input-label">Título da Tarefa</span>
                <input 
                  type="text" 
                  placeholder="Ex: Notion Sync - Integrar API" 
                  className="form-input"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <span className="input-label">Escopo & Descrição</span>
                <textarea 
                  placeholder="Descreva as especificações, dependências e links técnicos..." 
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'none', fontFamily: 'inherit' }}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Prioridade Inicial</span>
                  <select 
                    value={newPriority} 
                    onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
                    className="form-select"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Status Inicial</span>
                  <select 
                    value={newStatus} 
                    onChange={(e) => setNewStatus(e.target.value as Task['status'])}
                    className="form-select"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_progresso">Em Progresso</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="input-group">
                  <span className="input-label">Responsável</span>
                  <select 
                    value={newAssignee} 
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="form-select"
                  >
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <span className="input-label">Prazo de Entrega (Deadline)</span>
                  <input 
                    type="date" 
                    className="form-input"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="ai-analysis-box" style={{ padding: '10px', fontSize: '0.72rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Sparkles size={14} style={{ color: '#C084FC' }} />
                <span>
                  O Assistente de IA da ORKA analisará o prazo e os termos para sugerir otimização de prioridade.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="outline-btn" onClick={() => setIsNewTaskModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn">
                  <span>Criar Tarefa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL FOR EDITING AND DETAILED VIEW */}
      {selectedTaskId && (() => {
        const tObj = tasks.find(t => t.id === selectedTaskId);
        if (!tObj) return null;

        const hasAiSug = aiSuggestions.find(s => s.taskId === tObj.id);

        return (
          <div className="drawer-overlay" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="card animate-slide-up" style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '20px', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Detalhes da Tarefa</h3>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ID: {tObj.id}</span>
                </div>
                <button className="close-btn" onClick={() => setSelectedTaskId(null)}>
                  <X size={20} />
                </button>
              </div>

              {/* AI Priority suggestions inside Detail Modal */}
              {hasAiSug && (
                <div style={{ 
                  backgroundColor: 'rgba(139, 92, 246, 0.04)', 
                  border: '1px dashed rgba(139, 92, 246, 0.3)', 
                  padding: '12px 16px', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} style={{ color: '#C084FC' }} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#C084FC' }}>ORKA AI - Recomendação Ativa</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {hasAiSug.rationale}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Mudar de <b style={{ textTransform: 'uppercase' }}>{tObj.priority}</b> para <b style={{ color: '#C084FC', textTransform: 'uppercase' }}>{hasAiSug.suggestedPriority}</b>
                    </span>
                    <button 
                      type="button" 
                      className="primary-btn" 
                      style={{ padding: '4px 10px', fontSize: '0.65rem', backgroundColor: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#C084FC' }}
                      onClick={() => handleApplyAiSuggestion(tObj.id, hasAiSug.suggestedPriority)}
                    >
                      Aplicar Recomendação
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveEditTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="input-group">
                  <span className="input-label">Título da Tarefa</span>
                  <input 
                    type="text" 
                    className="form-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <span className="input-label">Descrição</span>
                  <textarea 
                    className="form-input"
                    style={{ minHeight: '80px', resize: 'none', fontFamily: 'inherit' }}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Prioridade</span>
                    <select 
                      value={editPriority} 
                      onChange={(e) => setEditPriority(e.target.value as Task['priority'])}
                      className="form-select"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <span className="input-label">Status</span>
                    <select 
                      value={editStatus} 
                      onChange={(e) => setEditStatus(e.target.value as Task['status'])}
                      className="form-select"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_progresso">Em Progresso</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="input-group">
                    <span className="input-label">Responsável</span>
                    <select 
                      value={editAssignee} 
                      onChange={(e) => setEditAssignee(e.target.value)}
                      className="form-select"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <span className="input-label">Prazo de Entrega</span>
                    <input 
                      type="date" 
                      className="form-input"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button 
                    type="button" 
                    style={{ 
                      padding: '8px 12px', 
                      backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                      color: 'var(--color-danger)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }} 
                    onClick={() => handleDeleteTask(tObj.id)}
                  >
                    <Trash2 size={14} />
                    <span>Excluir Tarefa</span>
                  </button>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" className="outline-btn" onClick={() => setSelectedTaskId(null)}>
                      Cancelar
                    </button>
                    <button type="submit" className="primary-btn">
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

    </div>
  );
};
