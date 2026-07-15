import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Lead } from '../../../entities/lead/model/types';
import { Calendar, Award, MoreVertical, Trash2 } from 'lucide-react';

interface KanbanCardProps {
  lead: Lead;
  onClick: (id: string) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

const getDaysOld = (dateStr?: string) => {
  if (!dateStr) return 0;
  try {
    let date: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      date = new Date(dateStr);
    }
    const diffTime = Date.now() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) ? 0 : Math.max(0, diffDays);
  } catch {
    return 0;
  }
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
};

export const KanbanCard: React.FC<KanbanCardProps> = React.memo(({ lead, onClick, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: transform ? undefined : 'transform 0.2s ease, box-shadow 0.2s ease',
    userSelect: 'none',
    touchAction: 'none',
    zIndex: isDragging ? 1000 : (isMenuOpen ? 1010 : undefined),
  };

  const daysOld = getDaysOld(lead.dateAdded || lead.createdAt);

  // Responsável avatar letter
  const ownerName = lead.owner || 'Sem Responsável';
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  // Prioridade
  const priority = lead.priority || 'baixa';
  const priorityColors = {
    alta: { bg: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#EF4444', label: '🔴 Alta' },
    media: { bg: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#F59E0B', label: '🟡 Média' },
    baixa: { bg: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', label: '🟢 Baixa' }
  };
  const currentPriority = priorityColors[priority];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Prevent click when dragging
        if (transform) {
          e.preventDefault();
          return;
        }
        if (isMenuOpen) {
          setIsMenuOpen(false);
          return;
        }
        onClick(lead.id);
      }}
      className="kanban-lead-card"
      style={{
        ...style,
        backgroundColor: 'var(--bg-card, #1E293B)',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: isDragging ? '0 12px 24px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.2)';
          e.currentTarget.style.borderColor = 'var(--color-primary, #3B82F6)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
          e.currentTarget.style.borderColor = 'var(--border-color, #334155)';
          setIsMenuOpen(false);
        }
      }}
    >
      {/* Top Section: Company and Expected Close / AI Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
            {lead.company}
          </h4>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #94A3B8)', marginTop: '2px' }}>
            Contato: {lead.contactName}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
          <span style={{
            backgroundColor: currentPriority.bg,
            border: currentPriority.border,
            color: currentPriority.color,
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.68rem',
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            {currentPriority.label}
          </span>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '4px',
            }}
            className="hover-bg"
          >
            <MoreVertical size={16} />
          </button>

          {isMenuOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'var(--bg-sidebar, #0F172A)',
                border: '1px solid var(--border-color, #334155)',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 1020,
                minWidth: '120px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  if (onDelete) onDelete(lead.id, e);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-danger, #EF4444)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
                className="hover-danger-bg"
              >
                <Trash2 size={14} />
                Excluir Lead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mid Section: Products List */}
      {lead.productsNegotiated && lead.productsNegotiated.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {lead.productsNegotiated.map((prod) => (
            <span
              key={prod.productId}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                color: 'var(--color-primary, #60A5FA)',
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              {prod.name}
            </span>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', fontStyle: 'italic' }}>
          Sem produtos associados
        </span>
      )}

      {/* Values Section: Setup & MRR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: 'rgba(15, 23, 42, 0.2)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
        <div>
          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>Setup</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{formatCurrency(lead.value || 0)}</span>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted, #64748B)', textTransform: 'uppercase', fontWeight: 600 }}>Mensal (MRR)</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-success, #10B981)' }}>{formatCurrency(lead.mrrValue || 0)}</span>
        </div>
      </div>

      {/* Bottom info section: Owner Avatar, Probability, Days Old */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        {/* Owner Name / Initial */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary, #3B82F6)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 700,
            border: '1px solid rgba(255,255,255,0.1)'
          }} title={`Responsável: ${ownerName}`}>
            {ownerInitial}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94A3B8)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ownerName}
          </span>
        </div>

        {/* Probability and Days Old */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lead.probability !== undefined && lead.probability > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title={`Probabilidade de fechamento: ${lead.probability}%`}>
              <Award size={12} style={{ color: '#F59E0B' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#F59E0B' }}>{lead.probability}%</span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }} title="Dias neste estágio ou na base">
            <Calendar size={12} style={{ color: daysOld > 15 ? '#EF4444' : 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.72rem', color: daysOld > 15 ? '#EF4444' : 'var(--text-secondary)', fontWeight: daysOld > 15 ? 700 : undefined }}>
              {daysOld}d
            </span>
          </div>
        </div>
      </div>

      {/* Tag List */}
      {lead.tags && lead.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
          {lead.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.62rem',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                padding: '1px 5px',
                borderRadius: '3px'
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
