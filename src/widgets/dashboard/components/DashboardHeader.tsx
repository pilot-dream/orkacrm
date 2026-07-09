import React, { useState } from 'react';
import { Calendar, Filter, RefreshCw, Bell } from 'lucide-react';
import { useFinanceiroStore } from '../../../entities/financeiro/model/store';
import { useClienteStore } from '../../../entities/cliente/model/store';
import { useProjectStore } from '../../../entities/projeto/model/store';
import { useLeadStore } from '../../../entities/lead/model/store';
import { useDashboardStore } from '../../../entities/dashboard/model/store';
import { useFilterStore } from '../../../entities/dashboard/model/filterStore';
import { useAuthStore } from '../../../entities/usuario/model/store';
import { supabaseNotifications } from '../../../lib/supabaseService';

export const DashboardHeader: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = useAuthStore((state) => state.notifications);
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

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        useFinanceiroStore.getState().fetchTransactions(true),
        useClienteStore.getState().fetchClientes(true),
        useProjectStore.getState().fetchProjects(true),
        useLeadStore.getState().fetchLeads(true)
        // Removido o fetchDashboards para não causar unmount/re-render da tela toda
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      // Pequeno atraso para a animação ficar visível mesmo se o load for muito rápido
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

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
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            Visão geral da operação em tempo real.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="outline-btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px' }}
              onClick={() => {
                const el = document.getElementById('date-filter-menu');
                if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
              }}
              onBlur={() => setTimeout(() => {
                const el = document.getElementById('date-filter-menu');
                if (el) el.style.display = 'none';
              }, 200)}
            >
              <Calendar size={16} />
              <span>{useFilterStore().dateRangeLabel}</span>
            </button>
            <div id="date-filter-menu" style={{
              display: 'none', position: 'absolute', top: '100%', left: 0, marginTop: '8px',
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: '8px', padding: '8px', zIndex: 9999, minWidth: '180px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              {(['Este Mês', 'Mês Passado', 'Últimos 30 Dias', 'Este Ano', 'Últimos 12 Meses', 'Todo o Período'] as const).map(label => (
                <button key={label} style={{
                  display: 'block', width: '100%', padding: '8px 12px', background: 'transparent',
                  border: 'none', color: useFilterStore().dateRangeLabel === label ? 'var(--color-primary)' : 'var(--text-secondary)',
                  textAlign: 'left', cursor: 'pointer', borderRadius: '4px',
                  fontWeight: useFilterStore().dateRangeLabel === label ? 600 : 400
                }} onClick={() => {
                  useFilterStore.getState().setDateRange(label);
                  document.getElementById('date-filter-menu')!.style.display = 'none';
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            className={`icon-btn ${isRefreshing ? 'refreshing' : ''}`} 
            style={{ border: '1px solid var(--border-color)' }}
            onClick={handleRefresh}
            title="Atualizar dados"
          >
            <RefreshCw size={16} />
          </button>

          <button 
            className="icon-btn"
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
              </div>
            )}
          </button>
        </div>
      </header>
    </>
  );
};
