import { TrendingUp, TrendingDown, LayoutDashboard } from 'lucide-react';

export default function SectionHeaderWidget({ config }: any) {
  const { title = 'Sessão', icon = 'layout', color = 'var(--text-secondary)' } = config || {};
  
  const getIcon = () => {
    switch (icon) {
      case 'trending-up': return <TrendingUp size={14} color={color} />;
      case 'trending-down': return <TrendingDown size={14} color={color} />;
      default: return <LayoutDashboard size={14} color={color} />;
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'flex-end', // align bottom so it sits nicely above widgets
      padding: '0 4px 8px 4px'
    }}>
      <h4 style={{ 
        fontSize: '0.8rem', 
        fontWeight: 700, 
        color: 'var(--text-secondary)', 
        letterSpacing: '0.06em', 
        textTransform: 'uppercase', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        margin: 0
      }}>
        {getIcon()}
        <span>{title}</span>
      </h4>
    </div>
  );
}
