import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ExternalLink, Edit2, Trash2, Clock, GripVertical } from 'lucide-react';
import type { KanbanCardItem, CategoryTag } from '../AnotacoesPage';

interface NoteCardProps {
  card: KanbanCardItem;
  category: CategoryTag;
  onEditCard: (card: KanbanCardItem) => void;
  onDeleteCard: (cardId: string, e: React.MouseEvent) => void;
}

export const renderFormattedContent = (text: string) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="note-auto-link inline-flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          {part}
          <ExternalLink size={11} className="inline ml-0.5" />
        </a>
      );
    }
    return part;
  });
};

export const NoteCard: React.FC<NoteCardProps> = ({
  card,
  category,
  onEditCard,
  onDeleteCard,
}) => {
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: card.id,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`kanban-card ${isDragging ? 'is-dragging' : ''}`}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEditCard(card);
      }}
    >
      {/* Indicator Sidebar Color */}
      <div
        className="kanban-card-side-bar"
        style={{ backgroundColor: category.color }}
      />

      <div className="kanban-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GripVertical size={13} style={{ color: 'var(--text-muted)', cursor: 'grab', opacity: 0.5 }} />
          <span className="kanban-card-title">{card.title || 'Sem título'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="kanban-icon-btn"
            title="Editar card"
            onClick={(e) => {
              e.stopPropagation();
              onEditCard(card);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Edit2 size={13} />
          </button>
          <button
            className="kanban-icon-btn danger"
            title="Excluir card"
            onClick={(e) => onDeleteCard(card.id, e)}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {card.body && (
        <div className="kanban-card-body">
          {renderFormattedContent(card.body)}
        </div>
      )}

      <div className="kanban-card-footer">
        <span
          className="category-badge"
          style={{
            backgroundColor: category.bgLight,
            color: category.color,
            border: `1px solid ${category.borderColor}`,
          }}
        >
          {category.name}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} />
          {formatDate(card.updatedAt)}
        </span>
      </div>
    </div>
  );
};
