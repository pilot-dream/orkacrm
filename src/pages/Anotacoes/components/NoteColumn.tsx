import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Edit2, Check, X, GripHorizontal } from 'lucide-react';
import type { KanbanColumnItem, KanbanCardItem, CategoryTag } from '../AnotacoesPage';
import { NoteCard } from './NoteCard';

interface NoteColumnProps {
  column: KanbanColumnItem;
  cards: KanbanCardItem[];
  categories: CategoryTag[];
  onAddCard: (columnId: string) => void;
  onEditCard: (card: KanbanCardItem) => void;
  onDeleteCard: (cardId: string, e: React.MouseEvent) => void;
  onUpdateColumnTitle: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const NoteColumn: React.FC<NoteColumnProps> = ({
  column,
  cards,
  categories,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onUpdateColumnTitle,
  onDeleteColumn,
}) => {
  const { isOver, setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  });

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: `col-drag-${column.id}`,
    data: { column },
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDroppableRef(node);
    setDraggableRef(node);
  };

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);

  const handleSaveTitle = () => {
    if (titleValue.trim()) {
      onUpdateColumnTitle(column.id, titleValue.trim());
    } else {
      setTitleValue(column.title);
    }
    setIsEditingTitle(false);
  };

  const getCategory = (catId: string) => {
    return categories.find((c) => c.id === catId) || categories[5];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-column ${isOver ? 'is-over' : ''} ${isDragging ? 'is-dragging' : ''}`}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="kanban-column-title-area">
          {/* Handle de Arraste da Coluna */}
          <div
            {...listeners}
            {...attributes}
            style={{ display: 'flex', alignItems: 'center', cursor: 'grab', paddingRight: '2px' }}
            title="Arrastar coluna"
          >
            <GripHorizontal size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          </div>

          <div
            className="kanban-column-dot"
            style={{ backgroundColor: column.color || 'var(--color-primary)' }}
          />

          {isEditingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
              <input
                type="text"
                className="kanban-column-title-input"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitleValue(column.title);
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
              />
              <button
                className="kanban-icon-btn"
                onClick={handleSaveTitle}
                title="Salvar"
              >
                <Check size={14} className="text-emerald-400" />
              </button>
              <button
                className="kanban-icon-btn"
                onClick={() => {
                  setTitleValue(column.title);
                  setIsEditingTitle(false);
                }}
                title="Cancelar"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <span
                className="kanban-column-title"
                onClick={() => setIsEditingTitle(true)}
                title="Clique para renomear a coluna"
              >
                {column.title}
              </span>
              <span className="kanban-column-count">{cards.length}</span>
            </>
          )}
        </div>

        {!isEditingTitle && (
          <div className="kanban-column-actions">
            <button
              className="kanban-icon-btn"
              onClick={() => setIsEditingTitle(true)}
              title="Renomear coluna"
            >
              <Edit2 size={13} />
            </button>
            <button
              className="kanban-icon-btn danger"
              onClick={() => onDeleteColumn(column.id)}
              title="Excluir coluna"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Cards List */}
      <div className="kanban-column-cards">
        {cards.map((card) => (
          <NoteCard
            key={card.id}
            card={card}
            category={getCategory(card.categoryId)}
            onEditCard={onEditCard}
            onDeleteCard={onDeleteCard}
          />
        ))}

        {cards.length === 0 && (
          <div
            style={{
              padding: '24px 12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              border: '1px dashed rgba(255,255,255,0.06)',
              borderRadius: 'var(--border-radius-md)',
            }}
          >
            Arraste ou crie um card aqui
          </div>
        )}
      </div>

      {/* Column Footer */}
      <div className="kanban-column-footer">
        <button
          className="add-card-btn"
          onClick={() => onAddCard(column.id)}
        >
          <Plus size={14} />
          <span>Adicionar Card</span>
        </button>
      </div>
    </div>
  );
};
