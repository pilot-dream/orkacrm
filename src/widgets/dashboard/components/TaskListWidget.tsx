import { useTaskStore } from '../../../entities/tarefa/model/store';
import { CheckSquare } from 'lucide-react';

export default function TaskListWidget() {
  const { tasks, updateTask } = useTaskStore();

  const pendingTasks = tasks.filter(t => t.status === 'pendente' || t.status === 'em_progresso');

  const handleToggleTaskStatus = async (task: any) => {
    const updated = {
      ...task,
      status: task.status === 'concluida' ? 'pendente' : 'concluida'
    };
    await updateTask(updated);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '360px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '12px' }}>
        <CheckSquare size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Minhas Tarefas Pendentes</span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
        {pendingTasks.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <input 
              type="checkbox" 
              checked={t.status === 'concluida'} 
              onChange={() => handleToggleTaskStatus(t)}
              style={{ cursor: 'pointer' }}
            />
            <div style={{ flexGrow: 1 }}>
              <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{t.title}</div>
              {t.projectName && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📁 {t.projectName}</span>}
            </div>
            <span style={{
              fontSize: '0.68rem',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: t.priority === 'alta' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
              color: t.priority === 'alta' ? 'var(--color-danger)' : 'var(--text-secondary)'
            }}>{t.priority.toUpperCase()}</span>
          </div>
        ))}
        {pendingTasks.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Sem tarefas pendentes no momento!
          </div>
        )}
      </div>
    </div>
  );
}
