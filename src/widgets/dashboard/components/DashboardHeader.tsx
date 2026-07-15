import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../../entities/usuario/model/store';
import { supabaseNotifications } from '../../../lib/supabaseService';

interface DashboardHeaderProps {
  children?: React.ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = useAuthStore((state) => state.notifications);
  const userEmail = useAuthStore((state) => state.userEmail);
  const userProfile = useAuthStore((state) => state.userProfile);
  const markNotificationAsRead = useAuthStore((state) => state.markNotificationAsRead);
  const markAllNotificationsAsRead = useAuthStore((state) => state.markAllNotificationsAsRead);
  const clearNotifications = useAuthStore((state) => state.clearNotifications);

  const handleMarkAsRead = async (id: string) => {
    markNotificationAsRead(id);
    try {
      await supabaseNotifications.markAsRead(id);
    } catch (e) {
      console.error('Erro ao marcar notificação como lida no Supabase:', e);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllNotificationsAsRead();
    if (userEmail) {
      try {
        await supabaseNotifications.markAllAsRead(userEmail);
      } catch (err) {
        console.error('Erro ao marcar todas as notificações como lidas:', err);
      }
    }
  };

  const handleClearNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotifications();
    if (userEmail) {
      try {
        await supabaseNotifications.deleteAll(userEmail);
      } catch (err) {
        console.error('Erro ao limpar notificações:', err);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <style>
        {`
          @keyframes spin-refresh {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .icon-btn.refreshing svg {
            animation: spin-refresh 1s linear infinite;
            color: var(--color-primary);
          }
        `}
      </style>
      <header 
        className="flex flex-row justify-between items-center w-full"
        style={{ 
          display: 'flex', 
          flexDirection: 'row',
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '8px', /* Decreased space between header and cards */
          width: '100%',
          gap: '16px',
          padding: '0 12px', /* Matches react-grid-layout margin */
          boxSizing: 'border-box'
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center' }}>
          Dashboard
        </h1>

        <div className="flex flex-row items-center gap-4" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
          
          {children}

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

          <button 
            className="icon-btn flex items-center justify-center"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ position: 'relative', border: '1px solid var(--border-color)', cursor: 'pointer', background: 'transparent', color: 'var(--text-secondary)' }}
            title="Notificações"
          >
            <Bell size={16} />
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
              <div className="notification-panel" onClick={(e) => e.stopPropagation()} style={{ 
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '320px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 100,
                textAlign: 'left'
              }}>
                <div className="notification-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Notificações</span>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>{unreadCount} pendentes</span>
                  )}
                </div>
                <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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
                        borderBottom: '1px solid var(--border-color)',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : 'rgba(45, 140, 255, 0.05)'}
                    >
                      <p style={{ margin: 0, color: '#fff', fontSize: '0.8rem', lineHeight: 1.4 }}>{notif.text}</p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Nenhuma notificação nova.
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <button onClick={handleMarkAllAsRead} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(45, 140, 255, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Marcar Lidas
                    </button>
                    <button onClick={handleClearNotifications} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '4px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      Limpar
                    </button>
                  </div>
                )}
              </div>
            )}
          </button>

          {userProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px', marginLeft: '8px' }}>
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{userProfile.name}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{userProfile.role || 'Usuário'}</span>
              </div>
            </div>
          )}

        </div>
      </header>
    </>
  );
};
