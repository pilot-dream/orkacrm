import React, { useState } from 'react';
import { useTasksQuery, useUpdateTaskStatusMutation } from '../../../entities/dashboard/hooks/useDashboardQueries';
import { CircleCheck, Check, Video, Calendar, Phone, Mail, FileText, SquareCheck, Clock, MapPin } from 'lucide-react';
import { CardSkeleton } from '../../skeletons/WidgetSkeletons';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

export const TaskListWidget = React.memo(() => {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const { mutate: updateTaskStatus } = useUpdateTaskStatusMutation();
  const navigate = useNavigate();
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [taskToComplete, setTaskToComplete] = useState<any | null>(null);
  const [filterDate, setFilterDate] = useState<'hoje' | 'amanha' | 'semana' | 'todas'>('todas');


  const confirmCompleteTask = () => {
    if (!taskToComplete) return;
    const task = taskToComplete;
    
    // Optimistic UI update instantly for animation
    setAnimatingIds(prev => new Set(prev).add(task.id));
    setTaskToComplete(null);
    
    // Wait for animation to finish before updating global state and removing from list
    setTimeout(() => {
      updateTaskStatus({ taskId: task.id, newStatus: 'concluida' });
      setAnimatingIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }, 300);
  };

  const allFilteredTasksForDisplay = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    return tasks
      .filter((t: any) => t.status !== 'concluida' || animatingIds.has(t.id))
      .filter((t: any) => {
        if (filterDate === 'todas') return true;
        if (!t.deadline) return false;
        
        const taskDate = t.deadline.includes('/') 
          ? t.deadline.split('/').reverse().join('-') 
          : t.deadline.split('T')[0];
          
        if (filterDate === 'hoje') return taskDate === todayStr;
        if (filterDate === 'amanha') return taskDate === tomorrowStr;
        if (filterDate === 'semana') return taskDate >= todayStr && taskDate <= next7DaysStr;
        return true;
      });
  }, [tasks, filterDate, animatingIds]);

  const filteredCount = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = next7Days.toISOString().split('T')[0];

    return tasks
      .filter((t: any) => t.status !== 'concluida' && !animatingIds.has(t.id))
      .filter((t: any) => {
        if (filterDate === 'todas') return true;
        if (!t.deadline) return false;
        
        const taskDate = t.deadline.includes('/') 
          ? t.deadline.split('/').reverse().join('-') 
          : t.deadline.split('T')[0];
          
        if (filterDate === 'hoje') return taskDate === todayStr;
        if (filterDate === 'amanha') return taskDate === tomorrowStr;
        if (filterDate === 'semana') return taskDate >= todayStr && taskDate <= next7DaysStr;
        return true;
      }).length;
  }, [tasks, filterDate, animatingIds]);

  const badgeText = React.useMemo(() => {
    switch (filterDate) {
      case 'hoje': return 'PARA HOJE';
      case 'amanha': return 'AMANHÃ';
      case 'semana': return 'ESTA SEMANA';
      default: return 'NO TOTAL';
    }
  }, [filterDate]);

  const pendingTasks = React.useMemo(() => {
    return [...allFilteredTasksForDisplay]
      .sort((a: any, b: any) => {
        const dateA = a.deadline ? new Date(a.deadline.includes('/') ? a.deadline.split('/').reverse().join('-') : a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline.includes('/') ? b.deadline.split('/').reverse().join('-') : b.deadline).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [allFilteredTasksForDisplay]);

  if (isLoading && tasks.length === 0) {
    return <CardSkeleton height="360px" />;
  }

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'alta': return { bg: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)' };
      case 'media': return { bg: 'rgba(245, 158, 11, 0.1)', color: 'rgb(245, 158, 11)' };
      case 'baixa': return { bg: 'rgba(59, 130, 246, 0.1)', color: 'rgb(59, 130, 246)' };
      default: return { bg: 'rgba(100, 116, 139, 0.1)', color: 'rgb(148, 163, 184)' };
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={14} color="var(--text-secondary)" />;
      case 'reuniao': return <Calendar size={14} color="var(--text-secondary)" />;
      case 'ligacao': return <Phone size={14} color="var(--text-secondary)" />;
      case 'email': return <Mail size={14} color="var(--text-secondary)" />;
      case 'documento': return <FileText size={14} color="var(--text-secondary)" />;
      default: return <SquareCheck size={14} color="var(--text-secondary)" />;
    }
  };

  return (
    <>
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Minhas Tarefas</h3>
            
            {/* Compact Horizontal Badge */}
            <div className="transition-all duration-200" style={{ 
              borderRadius: '8px', 
              border: '1px solid rgba(30, 41, 59, 0.8)', 
              backgroundColor: 'rgba(2, 6, 23, 0.4)', 
              padding: '4px 8px', 
              display: 'flex', 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: '6px',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>{filteredCount}</span>
              <span style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {badgeText}
              </span>
            </div>
          </div>
          
          <span 
            style={{ fontSize: '0.75rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
            onClick={() => navigate('/tarefas')}
          >
            Ver todas
          </span>
        </div>


        {/* Date Filter Tabs */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
            {(['hoje', 'amanha', 'semana', 'todas'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterDate(f)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: filterDate === f ? 'var(--color-primary)' : 'transparent',
                  color: filterDate === f ? '#fff' : 'var(--text-secondary)',
                  textAlign: 'center'
                }}
              >
                {f === 'hoje' ? 'Hoje' : f === 'amanha' ? 'Amanhã' : f === 'semana' ? 'Semana' : 'Todas'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingTasks.length > 0 ? (
            pendingTasks.map((t: any) => {
              const isCompleted = t.status === 'concluida' || animatingIds.has(t.id);
              const priorityStyle = getPriorityStyles(t.priority);
              
              return (
                <div 
                  key={t.id} 
                  onClick={() => !isCompleted && setTaskToComplete(t)}
                  className={`transition-all duration-300 ease-in-out cursor-pointer ${isCompleted ? 'opacity-40' : 'opacity-100 hover:bg-slate-800/50'}`} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    {/* Checkbox */}
                    <div 
                      className={`transition-all duration-300 ease-in-out flex items-center justify-center shrink-0 border ${isCompleted ? 'bg-blue-500 border-blue-500' : 'border-slate-700 bg-transparent'}`}
                      style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                    >
                      {isCompleted && <Check size={12} color="#fff" strokeWidth={3} />}
                    </div>
                    
                    {/* Type Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                      {getTaskTypeIcon(t.task_type || '')}
                    </div>

                    {/* Title and Project/Priority */}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, gap: '4px' }}>
                      <span className={`transition-all duration-300 ease-in-out truncate ${isCompleted ? 'line-through' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.title}</span>
                      <div className={`transition-all duration-300 ease-in-out ${isCompleted ? 'line-through' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px 8px', fontSize: '0.7rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }} className="truncate max-w-[120px]">{t.projectName || 'Geral'}</span>
                        <span style={{ 
                          backgroundColor: priorityStyle.bg, 
                          color: priorityStyle.color, 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}>
                          {t.priority}
                        </span>
                        {t.locationLink && (
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <MapPin size={10} style={{ flexShrink: 0 }} />
                            <span className="truncate">{t.locationLink}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Date and Time on the right */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', fontSize: '0.75rem', gap: '4px', minWidth: '70px', marginLeft: '12px' }}>
                    <div style={{ color: 'var(--text-main)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {t.deadline ? new Date(t.deadline.includes('T') ? t.deadline : t.deadline + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'Sem data'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      <Clock size={12} />
                      <span>{t.time || '--:--'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)', gap: '8px' }}>
              <CircleCheck size={24} style={{ color: 'var(--color-success)', opacity: 0.8 }} />
              <span style={{ fontSize: '0.85rem' }}>Nenhuma tarefa pendente.</span>
              <span style={{ fontSize: '0.75rem' }}>Tudo em dia!</span>
              <button 
                className="primary-btn" 
                style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.75rem' }}
                onClick={() => navigate('/tarefas')}
              >
                Criar tarefa
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={!!taskToComplete}
        title="Concluir Tarefa?"
        message={`Você tem certeza que deseja marcar a tarefa "${taskToComplete?.title}" como concluída?`}
        confirmLabel="Sim, Concluir"
        cancelLabel="Cancelar"
        onConfirm={confirmCompleteTask}
        onCancel={() => setTaskToComplete(null)}
        type="primary"
      />
    </>
  );
});
