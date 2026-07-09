import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../../entities/projeto/model/store';
import { AlertTriangle, RefreshCw, AlertCircle, Plus } from 'lucide-react';

export default function CriticalProjectsWidget() {
  const navigate = useNavigate();
  const { projects, loading, error, fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchProjects(true);
  };

  const handleCreateProject = () => {
    navigate('/projetos');
  };

  const critical = projects.filter(p => p.priority === 'alta' && p.stage !== 'concluido');

  const status = (loading && projects.length === 0)
    ? 'loading'
    : error
      ? 'error'
      : critical.length > 0
        ? 'success'
        : 'empty';

  if (status === 'loading') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ width: '150px', height: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} className="skeleton-pulse"></div>
          <div style={{ width: '20px', height: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} className="skeleton-pulse"></div>
        </div>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: '56px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }} className="skeleton-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <AlertCircle size={32} color="var(--color-danger)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Falha ao carregar projetos críticos.</span>
        <button onClick={handleRefresh} className="outline-btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Recarregar</button>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
          <AlertTriangle size={32} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, display: 'block' }}>Nenhum projeto crítico ativo</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Tudo sob controle operacional! Nenhum projeto em alta prioridade.</span>
        </div>
        <button onClick={handleCreateProject} className="primary-btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
          <Plus size={12} /> Novo Projeto
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
          <AlertTriangle size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Projetos Críticos Ativos</span>
        </div>
        <button 
          onClick={handleRefresh} 
          style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} 
          title="Recarregar projetos críticos"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
        {critical.map((proj) => (
          <div 
            key={proj.id} 
            onClick={() => navigate('/projetos')}
            style={{ 
              padding: '12px', 
              backgroundColor: 'rgba(239, 68, 68, 0.02)', 
              borderRadius: '6px', 
              border: '1px solid rgba(239, 68, 68, 0.1)',
              cursor: 'pointer'
            }}
            title="Clique para ir ao quadro de Projetos"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{proj.name}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600 }}>ALTA</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Fase: <span style={{ textTransform: 'capitalize' }}>{proj.stage}</span> • Prazo: {proj.deadline || '-'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <div style={{ flexGrow: 1, height: '4px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${proj.progress || 0}%`, height: '100%', backgroundColor: 'var(--color-danger)' }}></div>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-danger)' }}>{proj.progress || 0}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
