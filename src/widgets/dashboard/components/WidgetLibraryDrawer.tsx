import React, { useState, useMemo } from 'react';
import { X, Plus, Search, Filter } from 'lucide-react';
import { WIDGET_REGISTRY } from '../core/widgetRegistry';
import type { WidgetCategory } from '../core/widgetRegistry';
import { useDashboardStore } from '../../../entities/dashboard/model/store';

interface WidgetLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WidgetLibraryDrawer: React.FC<WidgetLibraryDrawerProps> = ({ isOpen, onClose }) => {
  const addWidget = useDashboardStore((state: any) => state.addWidget);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'Todas'>('Todas');
  
  const categories = ['Todas', ...Array.from(new Set(Object.values(WIDGET_REGISTRY).map(w => w.category)))] as (WidgetCategory | 'Todas')[];

  const filteredWidgets = useMemo(() => {
    return Object.values(WIDGET_REGISTRY).filter(widget => {
      const matchesSearch = widget.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            widget.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || widget.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '450px',
      background: 'var(--bg-main)',
      borderLeft: '1px solid var(--border-color)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.6)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>Biblioteca de Widgets</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Personalize seu Workspace com novos cards</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar widgets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px 12px 10px 36px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              color: '#fff',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--color-primary)' : 'var(--border-color)',
                background: selectedCategory === cat ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: selectedCategory === cat ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredWidgets.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
            <Filter size={32} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>Nenhum widget encontrado.</p>
          </div>
        ) : (
          filteredWidgets.map(widget => (
            <div key={widget.id} style={{ 
              padding: '16px', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '12px',
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px',
              transition: 'transform 0.2s, border-color 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {widget.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{widget.title}</span>
                      {widget.premiumOnly && <span style={{ fontSize: '0.6rem', background: 'linear-gradient(45deg, #FFD700, #FDB931)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.05em' }}>PRO</span>}
                      {widget.beta && <span style={{ fontSize: '0.6rem', background: 'var(--color-primary)', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, letterSpacing: '0.05em' }}>BETA</span>}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', lineHeight: 1.4 }}>{widget.description}</div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{widget.category}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{widget.defaultWidth}x{widget.defaultHeight} Grid</span>
                </div>
                <button 
                  onClick={() => {
                    addWidget(widget.id, widget.defaultWidth, widget.defaultHeight);
                    onClose(); // Fechar a gaveta para o usuário ver o widget recém adicionado
                  }}
                  style={{ 
                    background: 'var(--color-primary)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer' 
                  }}
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
