import React, { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { useAuthStore } from '../../entities/usuario/model/store';
import { supabaseNotifications } from '../../lib/supabaseService';

export const Navbar: React.FC = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = useAuthStore((state) => state.notifications);
  const userProfile = useAuthStore((state) => state.userProfile);
  const markNotificationAsRead = useAuthStore((state) => state.markNotificationAsRead);

  const handleMarkAsRead = async (id: string) => {
    markNotificationAsRead(id);
    try {
      await supabaseNotifications.markAsRead(id);
    } catch (e) {
      console.error('Erro ao marcar notificação como lida no Supabase:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="search-box" style={{ display: 'none' }}>
          <Search size={16} className="text-secondary" />
          <input 
            type="text" 
            placeholder="Pesquisar negócios, logs ou clientes..." 
            className="search-input" 
          />
        </div>
      </div>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          className="icon-btn"
          onClick={() => setShowNotifications(!showNotifications)}
          style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="btn-badge" style={{ 
              position: 'absolute', 
              top: '-4px', 
              right: '-4px', 
              backgroundColor: 'var(--color-danger)', 
              color: '#fff', 
              borderRadius: '50%', 
              width: '14px', 
              height: '14px', 
              fontSize: '0.6rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 700
            }}>
              {unreadCount}
            </span>
          )}
          
          {showNotifications && (
            <div className="notification-panel" onClick={(e) => e.stopPropagation()} style={{ zIndex: 100 }}>
              <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notificações Recentes</span>
                {unreadCount > 0 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-primary-hover)' }}>{unreadCount} pendentes</span>
                )}
              </div>
              <div className="notification-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className="notification-item" 
                    onClick={() => handleMarkAsRead(notif.id)}
                    style={{ 
                      opacity: notif.read ? 0.6 : 1, 
                      cursor: 'pointer', 
                      transition: 'opacity 0.2s',
                      backgroundColor: notif.read ? 'transparent' : 'rgba(45, 140, 255, 0.05)',
                      borderLeft: notif.read ? 'none' : '3px solid var(--color-primary)',
                      paddingLeft: notif.read ? '12px' : '9px'
                    }}
                  >
                    <p style={{ margin: 0, color: '#fff', fontSize: '0.78rem' }}>{notif.text}</p>
                    <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{notif.time}</span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Nenhuma notificação nova.
                  </div>
                )}
              </div>
            </div>
          )}
        </button>

        {userProfile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '12px' }}>
            {userProfile.avatar ? (
              <img src={userProfile.avatar} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
            ) : (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{userProfile.name}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{userProfile.role}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
