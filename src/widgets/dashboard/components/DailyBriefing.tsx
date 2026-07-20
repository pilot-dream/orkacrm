import React, { useMemo } from 'react';
import { useAuthStore } from '../../../entities/usuario/model/store';
import { useTasksQuery } from '../../../entities/dashboard/hooks/useDashboardQueries';
import { Sunrise } from 'lucide-react';

export const DailyBriefing = React.memo(() => {
  const userProfile = useAuthStore(state => state.userProfile);
  const userEmail = useAuthStore(state => state.userEmail);
  const rawName = userProfile?.name || userEmail.split('@')[0] || 'Usuário';
  const firstName = rawName.split(' ')[0];
  const { data: tasks = [] } = useTasksQuery();

  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      if (t.status === 'concluida') return false;
      if (!t.deadline) return false;
      
      const taskDate = t.deadline.includes('/') 
        ? t.deadline.split('/').reverse().join('-') 
        : t.deadline.split('T')[0];
      return taskDate === todayStr;
    }).sort((a: any, b: any) => {
      const timeA = a.time || '23:59';
      const timeB = b.time || '23:59';
      return timeA.localeCompare(timeB);
    });
  }, [tasks, todayStr]);

  const hasTasks = todayTasks.length > 0;
  const firstTask = hasTasks ? todayTasks[0] : null;

  return (
    <div className="hidden md:flex flex-col gap-2 rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(to right, #0f172a, #020617, #0f172a)', border: '1px solid rgba(30, 41, 59, 0.8)', padding: '24px', borderRadius: '16px', marginBottom: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.5)' }}>
      {/* Decorative subtle background glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '256px', height: '256px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '50%', filter: 'blur(40px)', transform: 'translate(50%, -50%)', pointerEvents: 'none' }} />
      
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 'bold' }}>
        <Sunrise size={20} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>Bom dia, {firstName}!</h2>
      </div>
      
      <p style={{ position: 'relative', zIndex: 10, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0, maxWidth: '800px' }}>
        {hasTasks ? (
          <>
            Hoje você tem <strong style={{ color: '#fff', fontWeight: 600 }}>{todayTasks.length} {todayTasks.length === 1 ? 'tarefa agendada' : 'tarefas agendadas'}</strong>. 
            Seu dia começa às <strong style={{ color: '#fff', fontWeight: 600 }}>{firstTask?.time || '09:00'}</strong> com 
            <em style={{ color: '#93c5fd', fontStyle: 'normal', marginLeft: '4px' }}>'{firstTask?.title}'</em>
            {firstTask?.locationLink && <span style={{ marginLeft: '4px' }}>em <strong style={{ color: '#fff', fontWeight: 600 }}>{firstTask?.locationLink}</strong></span>}. 
            Tenha uma excelente jornada!
          </>
        ) : (
          <>
            Você não tem nenhuma tarefa agendada para hoje. Aproveite o dia para planejar seus próximos passos ou relaxar!
          </>
        )}
      </p>
    </div>
  );
});
