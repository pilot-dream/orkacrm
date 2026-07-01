import { Calendar, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '../../../entities/projeto/model/store';

export default function AgendaWidget() {
  const projects = useProjectStore((state) => state.projects);

  // Group upcoming deadlines
  const upcomingDeadlines = projects
    .filter(p => p.stage !== 'concluido' && p.deadline)
    .slice(0, 4);

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', marginBottom: '12px' }}>
        <Calendar size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Agenda & Próximos Compromissos</span>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        {/* Project Deadlines */}
        {upcomingDeadlines.map((proj) => (
          <div key={proj.id} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-danger)', minWidth: '45px', textAlign: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '10px' }}>
              Prazo<br/>{proj.deadline?.split('/')[0]}/{proj.deadline?.split('/')[1] || ''}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {proj.name} {proj.priority === 'alta' && <AlertTriangle size={10} color="var(--color-danger)" />}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Entrega do estágio: {proj.stage}</span>
            </div>
          </div>
        ))}
        {upcomingDeadlines.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Nenhum prazo de entrega pendente.
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
        📅 Sincronizado automaticamente com prazos de Projetos.
      </div>
    </div>
  );
}
