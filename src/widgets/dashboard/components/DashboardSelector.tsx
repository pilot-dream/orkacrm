import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, Trash2, Check } from 'lucide-react';
import { useDashboardStore } from '../../../entities/dashboard/model/store';

export const DashboardSelector: React.FC = () => {
  const { 
    dashboards, 
    activeDashboard, 
    setActiveDashboard, 
    createDashboard, 
    deleteDashboard 
  } = useDashboardStore();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeDashboard) {
      setSelectedId(activeDashboard.id);
    }
  }, [isOpen, activeDashboard]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [newDashboardType, setNewDashboardType] = useState<'empty' | 'default'>('empty');

  if (!activeDashboard) return null;

  const handleApply = () => {
    if (selectedId) {
      setActiveDashboard(selectedId);
      setIsOpen(false);
    }
  };

  const handleDoubleClick = (id: string) => {
    setActiveDashboard(id);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDashboardToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (dashboardToDelete) {
      deleteDashboard(dashboardToDelete);
      setIsDeleteModalOpen(false);
      setDashboardToDelete(null);
    }
  };

  const handleCreate = () => {
    setIsCreateModalOpen(true);
    setNewDashboardName('');
    setNewDashboardType('empty');
  };

  const confirmCreate = () => {
    if (newDashboardName && newDashboardName.trim()) {
      createDashboard(newDashboardName.trim(), newDashboardType);
      setIsCreateModalOpen(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'transparent', 
          border: 'none', 
          color: '#fff', 
          fontWeight: 600, 
          fontSize: '1rem',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '6px'
        }}
        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        {activeDashboard.name}
        <ChevronDown size={16} color="var(--text-secondary)" />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '8px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          width: '280px',
          zIndex: 9999,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suas Dashboards
            </span>
            <button 
              onClick={handleCreate}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              <Plus size={14} /> Criar
            </button>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '8px' }}>
            {dashboards.map(d => (
              <div 
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                onDoubleClick={() => handleDoubleClick(d.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: selectedId === d.id ? 'rgba(45, 140, 255, 0.1)' : 'transparent',
                  border: `1px solid ${selectedId === d.id ? 'var(--color-primary)' : 'transparent'}`,
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                    {activeDashboard.id === d.id && <Check size={14} color="var(--color-primary)" />}
                  </div>
                  <span style={{ color: selectedId === d.id ? 'var(--color-primary)' : '#fff', fontWeight: selectedId === d.id ? 600 : 400, fontSize: '0.85rem' }}>
                    {d.name}
                  </span>
                </div>
                
                {dashboards.length > 1 && d.id !== 'default' && (
                  <button 
                    onClick={(e) => handleDelete(e, d.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Excluir Dashboard"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ padding: '12px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
            <button 
              onClick={handleApply}
              disabled={!selectedId || selectedId === activeDashboard.id}
              className="primary-btn"
              style={{ width: '100%', padding: '8px', opacity: (!selectedId || selectedId === activeDashboard.id) ? 0.5 : 1 }}
            >
              Selecionar
            </button>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Criar Nova Dashboard</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Nome da Dashboard
              </label>
              <input 
                type="text" 
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                placeholder="Ex: Minha Visão Geral"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: '#fff',
                  outline: 'none'
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmCreate();
                  if (e.key === 'Escape') setIsCreateModalOpen(false);
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Tipo de Layout
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div 
                  onClick={() => setNewDashboardType('empty')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${newDashboardType === 'empty' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: newDashboardType === 'empty' ? 'rgba(45, 140, 255, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, color: newDashboardType === 'empty' ? 'var(--color-primary)' : '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>
                    Dashboard Limpo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Crie sua visão do zero.
                  </div>
                </div>

                <div 
                  onClick={() => setNewDashboardType('default')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: `1px solid ${newDashboardType === 'default' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    background: newDashboardType === 'default' ? 'rgba(45, 140, 255, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, color: newDashboardType === 'default' ? 'var(--color-primary)' : '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>
                    Dashboard Pré-programado
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Cópia do layout padrão.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="outline-btn"
                style={{ padding: '8px 16px' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmCreate}
                className="primary-btn"
                style={{ padding: '8px 16px' }}
                disabled={!newDashboardName.trim()}
              >
                Criar Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#fff' }}>Excluir Dashboard</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              Tem certeza de que deseja excluir esta dashboard? Esta ação não poderá ser desfeita.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="outline-btn"
                style={{ padding: '8px 16px' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                style={{ padding: '8px 16px', backgroundColor: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
