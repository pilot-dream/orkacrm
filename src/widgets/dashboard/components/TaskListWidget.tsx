import React, { useEffect } from 'react';
import { useTaskStore } from '../../../entities/tarefa/model/store';
import { CheckSquare, CircleCheck } from 'lucide-react';
import { CardSkeleton } from '../../skeletons/WidgetSkeletons';
import { useNavigate } from 'react-router-dom';

export const TaskListWidget = ({ config }: { config?: any }) => {
  const { tasks, fetchTasks, loading } = useTaskStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading && tasks.length === 0) {
    return <CardSkeleton height="360px" />;
  }

  const pendingTasks = tasks
    .filter(t => t.status !== 'concluida')
    .sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
      return dateA - dateB;
    })
    .slice(0, 5);

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
          onClick={() => navigate('/app/tarefas')}
        >
          Ver todas
        </span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {pendingTasks.length > 0 ? (
          pendingTasks.map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(t.status) }}></div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{t.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>{t.projectName || 'Geral'}</span>
                    <span>•</span>
                    <span style={{ color: getPriorityColor(t.priority) }}>{t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Hoje</span>
                <span style={{ color: getStatusColor(t.status) }}>{t.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)', gap: '8px' }}>
            <CircleCheck size={24} style={{ color: 'var(--color-success)', opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem' }}>Nenhuma tarefa pendente.</span>
            <span style={{ fontSize: '0.75rem' }}>Tudo em dia!</span>
            <button 
              className="primary-btn" 
              style={{ marginTop: '8px', padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={() => navigate('/app/tarefas')}
            >
              Criar tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
