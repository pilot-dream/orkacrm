import { useState, useEffect } from 'react';
import { isSupabaseActive, supabase } from '../../../shared/api/supabaseClient';
import { Activity, Clock } from 'lucide-react';

import { CardSkeleton } from '../../skeletons/WidgetSkeletons';

export default function ActivityTimelineWidget() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      setLoading(true);
      if (isSupabaseActive()) {
        try {
          const { data } = await supabase
            .from('atividades')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
          setActivities(data || []);
        } catch (err) {
          console.error(err);
        }
      } else {
        setActivities([]);
      }
      setLoading(false);
    };
    loadTimeline();
  }, []);

  if (loading) {
    return <CardSkeleton height="360px" />;
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '12px' }}>
        <Activity size={16} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Atividades Recentes (Timeline de Logs)</span>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
        {activities.map((act) => (
          <div key={act.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              marginTop: '4px',
              flexShrink: 0
            }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{act.titulo}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{act.descricao}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Clock size={10} /> {act.created_at ? new Date(act.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : act.date}
              </span>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '40px' }}>
            Nenhuma atividade registrada no sistema.
          </div>
        )}
      </div>
    </div>
  );
}
