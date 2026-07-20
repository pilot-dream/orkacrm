import React, { useState, useEffect } from 'react';
import { X, Trash2, Tag, LayoutList, FileText, Eye, Edit3, Save } from 'lucide-react';
import type { KanbanCardItem, KanbanColumnItem, CategoryTag } from '../AnotacoesPage';
import { renderFormattedContent } from './NoteCard';

interface NoteModalProps {
  isOpen: boolean;
  card: KanbanCardItem | null;
  columns: KanbanColumnItem[];
  categories: CategoryTag[];
  onClose: () => void;
  onSave: (updatedCard: KanbanCardItem) => void;
  onDelete: (cardId: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  card,
  columns,
  categories,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !card) return null;

  const [title, setTitle] = useState(card.title);
  const [body, setBody] = useState(card.body);
  const [categoryId, setCategoryId] = useState(card.categoryId);
  const [columnId, setColumnId] = useState(card.columnId);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    setTitle(card.title);
    setBody(card.body);
    setCategoryId(card.categoryId);
    setColumnId(card.columnId);
  }, [card]);

  const handleSave = () => {
    onSave({
      ...card,
      title: title.trim() || 'Sem título',
      body,
      categoryId,
      columnId,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="kanban-modal-overlay" onClick={onClose}>
      <div className="kanban-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="kanban-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} className="text-blue-400" />
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Editar Card / Anotação
            </span>
          </div>
          <button className="kanban-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="kanban-modal-body">
          {/* Título Input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Título do Card
            </label>
            <input
              type="text"
              className="kanban-input"
              placeholder="Digite o título..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Coluna e Categoria (Side by Side) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <LayoutList size={13} />
                Coluna no Kanban
              </label>
              <select
                className="kanban-input"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id} style={{ background: '#0f172a' }}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <Tag size={13} />
                Etiqueta / Categoria
              </label>
              <select
                className="kanban-input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: '#0f172a' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Badges de Atributo da Categoria */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selecionar cor:</span>
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className="category-badge"
                  style={{
                    backgroundColor: cat.bgLight,
                    color: cat.color,
                    border: `1px solid ${cat.borderColor}`,
                    cursor: 'pointer',
                    opacity: isSelected ? 1 : 0.4,
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Editor Tabs & Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Descrição & Links
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('edit')}
                  style={{
                    background: activeTab === 'edit' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: 'none',
                    color: activeTab === 'edit' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={11} className="inline mr-1" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  style={{
                    background: activeTab === 'preview' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: 'none',
                    color: activeTab === 'preview' ? 'var(--color-primary)' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={11} className="inline mr-1" />
                  Visualizar Links
                </button>
              </div>
            </div>

            {activeTab === 'edit' ? (
              <textarea
                className="kanban-textarea"
                placeholder="Escreva livremente sua anotação... Links como https://exemplo.com serão formatados automaticamente!"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            ) : (
              <div
                className="kanban-textarea"
                style={{ overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {renderFormattedContent(body) || (
                  <span style={{ color: 'var(--text-muted)' }}>Nenhum conteúdo para visualizar.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="kanban-modal-footer">
          <button
            type="button"
            onClick={() => {
              onDelete(card.id);
              onClose();
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '8px 14px',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Trash2 size={14} />
            <span>Excluir Card</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Save size={14} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
