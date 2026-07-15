import React, { useState } from 'react';
import { useTasksQuery, useUpdateTaskStatusMutation } from '../../../entities/dashboard/hooks/useDashboardQueries';
import { CircleCheck, Check } from 'lucide-react';
import { CardSkeleton } from '../../skeletons/WidgetSkeletons';
import { useNavigate } from 'react-router-dom';

export const TaskListWidget = React.memo(() => {
  const { data: tasks = [], isLoading } = useTasksQuery();
  const { mutate: updateTaskStatus } = useUpdateTaskStatusMutation();
  const navigate = useNavigate();
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const handleToggleTask = (task: any) => {
    if (task.status === 'concluida' || animatingIds.has(task.id)) return;
    
    // Optimistic UI update instantly for animation
    setAnimatingIds(prev => new Set(prev).add(task.id));
    
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

  const pendingTasks = React.useMemo(() => {
    return tasks
      .filter((t: any) => t.status !== 'concluida' || animatingIds.has(t.id))
      .sort((a: any, b: any) => {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
        return dateA - dateB;
      })
      .slice(0, 5);
  }, [tasks]);

  if (isLoading && tasks.length === 0) {
    return <CardSkeleton height="360px" />;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'var(--color-danger)';
      case 'media': return 'var(--color-warning)';
      case 'baixa': return 'var(--color-success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'var(--text-secondary)';
      case 'em_progresso': return 'var(--color-primary)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Minhas Tarefas</h3>
        <span 
          style={{ fontSize: '0.75rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}
          onClick={() => navigate('/leads')}
        >
          Ver todas
        </span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pendingTasks.length > 0 ? (
          pendingTasks.map((t: any) => {
            const isCompleted = t.status === 'concluida' || animatingIds.has(t.id);
            return (
              <div key={t.id} className={`transition-all duration-300 ease-in-out ${isCompleted ? 'opacity-40' : 'opacity-100'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    onClick={() => handleToggleTask(t)}
                    className={`transition-all duration-300 ease-in-out cursor-pointer flex items-center justify-center shrink-0 border ${isCompleted ? 'bg-blue-500 border-blue-500' : 'border-slate-700 bg-transparent hover:border-blue-500 hover:bg-blue-500/10'}`}
                    style={{ width: '18px', height: '18px', borderRadius: '50%' }}
                  >
                    {isCompleted && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className={`transition-all duration-300 ease-in-out ${isCompleted ? 'line-through' : ''}`} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.title}</span>
                    <div className={`transition-all duration-300 ease-in-out ${isCompleted ? 'line-through' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>{t.projectName || 'Geral'}</span>
                      <span>•</span>
                      <span style={{ color: getPriorityColor(t.priority) }}>{t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {t.deadline ? new Date(t.deadline.includes('T') ? t.deadline : t.deadline + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                  </span>
                  <span style={{ color: getStatusColor(t.status) }}>{t.status.replace('_', ' ').toUpperCase()}</span>
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
              onClick={() => navigate('/leads')}
            >
              Criar tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
