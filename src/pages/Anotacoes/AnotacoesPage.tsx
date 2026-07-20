import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../../shared/components/PageContainer';
import { 
  FileText, 
  LayoutGrid, 
  Sparkles, 
  Plus, 
  Search, 
  Trash2,
  Maximize2,
  ExternalLink,
  Edit3,
  X,
  ArrowLeft
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';

import { NoteColumn } from './components/NoteColumn';
import { NoteCard } from './components/NoteCard';
import { NoteModal } from './components/NoteModal';
import { InfiniteCanvas } from './components/InfiniteCanvas';
import type { CanvasNoteItem } from './components/InfiniteCanvas';
import './NotesPage.css';

export interface CategoryTag {
  id: string;
  name: string;
  color: string;
  bgLight: string;
  borderColor: string;
}

export interface KanbanColumnItem {
  id: string;
  title: string;
  color?: string;
  order: number;
}

export interface KanbanCardItem {
  id: string;
  columnId: string;
  title: string;
  body: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardData {
  id: string;
  name: string;
  createdAt: string;
  columns: KanbanColumnItem[];
  cards: KanbanCardItem[];
  canvasNotes: CanvasNoteItem[];
}

export const CATEGORIES: CategoryTag[] = [
  { id: 'ideias', name: 'Ideias', color: '#a855f7', bgLight: 'rgba(168, 85, 247, 0.15)', borderColor: 'rgba(168, 85, 247, 0.3)' },
  { id: 'links', name: 'Links Úteis', color: '#3b82f6', bgLight: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)' },
  { id: 'urgente', name: 'Urgente', color: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  { id: 'pessoal', name: 'Pessoal', color: '#10b981', bgLight: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  { id: 'projeto', name: 'Projeto', color: '#f59e0b', bgLight: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  { id: 'geral', name: 'Geral', color: '#94a3b8', bgLight: 'rgba(148, 163, 184, 0.15)', borderColor: 'rgba(148, 163, 184, 0.3)' },
];

const BOARDS_STORAGE_KEY = 'orka_multi_boards_v5';

const INITIAL_COLUMNS: KanbanColumnItem[] = [
  { id: 'col-todo', title: 'A Fazer / Ideias', color: '#a855f7', order: 0 },
  { id: 'col-links', title: 'Links e Documentação', color: '#3b82f6', order: 1 },
  { id: 'col-done', title: 'Concluído', color: '#10b981', order: 2 },
];

const INITIAL_CARDS: KanbanCardItem[] = [
  {
    id: 'card-1',
    columnId: 'col-todo',
    title: 'Melhorias no Funil de Vendas',
    body: 'Reunião de alinhamento com a equipe:\n- Adicionar automação de e-mail ao mudar status\n- Criar tag de prioridade alta para leads qualificados',
    categoryId: 'ideias',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-2',
    columnId: 'col-links',
    title: 'Documentação da API & Links Úteis',
    body: 'Principais links do projeto:\n- Supabase Docs: https://supabase.com/docs\n- Ícones Lucide: https://lucide.dev',
    categoryId: 'links',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-3',
    columnId: 'col-done',
    title: 'Configurar tema dark e responsividade',
    body: 'Tema dark configurado com sucesso e compatível com dispositivos móveis.',
    categoryId: 'pessoal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_CANVAS_NOTES: CanvasNoteItem[] = [
  {
    id: 'canvas-1',
    x: 100,
    y: 100,
    title: 'Ideia Central',
    body: 'Centralizar notas rápidas, quadro Kanban e Notion num único ecossistema fluido.',
    colorType: 'yellow',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'canvas-2',
    x: 420,
    y: 120,
    title: 'Links do Projeto',
    body: 'Acesse o protótipo no Figma: https://figma.com\nAPI Supabase: https://supabase.com/docs',
    colorType: 'blue',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'canvas-3',
    x: 220,
    y: 300,
    title: 'Lembrete Urgente',
    body: 'Conferir relatórios de fechamento mensal até sexta-feira.',
    colorType: 'purple',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_BOARDS: BoardData[] = [
  {
    id: 'board-main',
    name: 'Quadro Principal',
    createdAt: new Date().toISOString(),
    columns: INITIAL_COLUMNS,
    cards: INITIAL_CARDS,
    canvasNotes: INITIAL_CANVAS_NOTES,
  },
  {
    id: 'board-ideas',
    name: 'Ideias & Projetos',
    createdAt: new Date().toISOString(),
    columns: [
      { id: 'col-ideas-1', title: '💡 Ideias Novas', color: '#8b5cf6', order: 0 },
      { id: 'col-ideas-2', title: '🔗 Links & Refs', color: '#3b82f6', order: 1 },
    ],
    cards: [],
    canvasNotes: [],
  },
];

export default function AnotacoesPage() {
  const [activeMode, setActiveMode] = useState<'editor' | 'kanban' | 'canvas'>('kanban');

  // Controle de Visualização no Mobile (Notion Editor 2-Screen Flow)
  const [mobileNotionView, setMobileNotionView] = useState<'list' | 'editor'>('list');

  // Gerenciamento de Múltiplos Quadros
  const [boards, setBoards] = useState<BoardData[]>(() => {
    try {
      const saved = localStorage.getItem(BOARDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_BOARDS;
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(() => {
    return boards[0]?.id || 'board-main';
  });

  const activeBoard = useMemo(() => {
    return boards.find((b) => b.id === activeBoardId) || boards[0];
  }, [boards, activeBoardId]);

  const columns = activeBoard.columns;
  const cards = activeBoard.cards;
  const canvasNotes = activeBoard.canvasNotes;

  // Modais de Quadro no tema do sistema
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState('');
  const [boardToDeleteId, setBoardToDeleteId] = useState<string | null>(null);

  const setColumns = (newCols: KanbanColumnItem[] | ((prev: KanbanColumnItem[]) => KanbanColumnItem[])) => {
    setBoards((prevBoards) =>
      prevBoards.map((b) => {
        if (b.id === activeBoardId) {
          const updatedCols = typeof newCols === 'function' ? newCols(b.columns) : newCols;
          return { ...b, columns: updatedCols };
        }
        return b;
      })
    );
  };

  const setCards = (newCards: KanbanCardItem[] | ((prev: KanbanCardItem[]) => KanbanCardItem[])) => {
    setBoards((prevBoards) =>
      prevBoards.map((b) => {
        if (b.id === activeBoardId) {
          const updatedCards = typeof newCards === 'function' ? newCards(b.cards) : newCards;
          return { ...b, cards: updatedCards };
        }
        return b;
      })
    );
  };

  const setCanvasNotes = (newNotes: CanvasNoteItem[] | ((prev: CanvasNoteItem[]) => CanvasNoteItem[])) => {
    setBoards((prevBoards) =>
      prevBoards.map((b) => {
        if (b.id === activeBoardId) {
          const updatedNotes = typeof newNotes === 'function' ? newNotes(b.canvasNotes) : newNotes;
          return { ...b, canvasNotes: updatedNotes };
        }
        return b;
      })
    );
  };

  useEffect(() => {
    try {
      localStorage.setItem(BOARDS_STORAGE_KEY, JSON.stringify(boards));
    } catch {}
  }, [boards]);

  const [activeNotionCardId, setActiveNotionCardId] = useState<string | null>(null);
  const [notionTab, setNotionTab] = useState<'write' | 'preview'>('write');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCardItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } })
  );

  const handleSelectBoard = (boardId: string) => {
    setActiveBoardId(boardId);
  };

  const handleOpenCreateBoardModal = () => {
    setBoardNameInput(`Novo Quadro ${boards.length + 1}`);
    setIsBoardModalOpen(true);
  };

  const handleConfirmCreateBoard = () => {
    if (!boardNameInput.trim()) return;

    const newBoard: BoardData = {
      id: `board-${Date.now()}`,
      name: boardNameInput.trim(),
      createdAt: new Date().toISOString(),
      columns: [
        { id: `col-${Date.now()}-1`, title: 'A Fazer / Ideias', color: '#a855f7', order: 0 },
        { id: `col-${Date.now()}-2`, title: 'Em Progresso', color: '#3b82f6', order: 1 },
        { id: `col-${Date.now()}-3`, title: 'Concluído', color: '#10b981', order: 2 },
      ],
      cards: [],
      canvasNotes: [],
    };

    setBoards((prev) => [...prev, newBoard]);
    setActiveBoardId(newBoard.id);
    setIsBoardModalOpen(false);
  };

  const handleOpenDeleteBoardModal = (boardId: string) => {
    if (boards.length <= 1) return;
    setBoardToDeleteId(boardId);
  };

  const handleConfirmDeleteBoard = () => {
    if (!boardToDeleteId) return;
    const remaining = boards.filter((b) => b.id !== boardToDeleteId);
    setBoards(remaining);
    if (remaining.length > 0) {
      setActiveBoardId(remaining[0].id);
    }
    setBoardToDeleteId(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over) return;
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeIdStr === overIdStr) return;

    // 1. Reordenação de Colunas
    if (activeIdStr.startsWith('col-drag-')) {
      const activeColId = activeIdStr.replace('col-drag-', '');
      const overColId = overIdStr.replace('col-drag-', '');

      const oldIndex = columns.findIndex((c) => c.id === activeColId);
      const newIndex = columns.findIndex((c) => c.id === overColId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setColumns((prev) => {
          const updated = [...prev];
          const [movedCol] = updated.splice(oldIndex, 1);
          updated.splice(newIndex, 0, movedCol);
          return updated;
        });
      }
      return;
    }

    // 2. Movimentação de Cards entre colunas ou sobre outro card
    const targetColumn = columns.find((c) => c.id === overIdStr || `col-drag-${c.id}` === overIdStr);
    if (targetColumn) {
      setCards((prev) =>
        prev.map((c) => (c.id === activeIdStr ? { ...c, columnId: targetColumn.id, updatedAt: new Date().toISOString() } : c))
      );
      return;
    }

    const targetCard = cards.find((c) => c.id === overIdStr);
    if (targetCard && targetCard.columnId) {
      setCards((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === activeIdStr);
        const newIndex = prev.findIndex((c) => c.id === overIdStr);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const updated = [...prev];
        const [movedCard] = updated.splice(oldIndex, 1);
        movedCard.columnId = targetCard.columnId;
        movedCard.updatedAt = new Date().toISOString();

        updated.splice(newIndex, 0, movedCard);
        return updated;
      });
    }
  };

  const handleAddCard = (columnId: string) => {
    const newCard: KanbanCardItem = {
      id: `card-${Date.now()}`,
      columnId,
      title: 'Nova Anotação',
      body: '',
      categoryId: 'geral',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCards((prev) => [...prev, newCard]);
    setEditingCard(newCard);
  };

  const handleSaveCard = (updatedCard: KanbanCardItem) => {
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleDeleteCard = (cardId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleCreateColumn = () => {
    if (!newColumnTitle.trim()) return;
    const newCol: KanbanColumnItem = {
      id: `col-${Date.now()}`,
      title: newColumnTitle.trim(),
      color: '#3b82f6',
      order: columns.length,
    };
    setColumns((prev) => [...prev, newCol]);
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const handleUpdateColumnTitle = (columnId: string, newTitle: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, title: newTitle } : col))
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    if (columns.length <= 1) {
      alert('Você precisa ter pelo menos 1 coluna no quadro.');
      return;
    }
    const hasCards = cards.some((c) => c.columnId === columnId);
    if (hasCards && !window.confirm('Esta coluna possui cards. Deseja realmente excluí-la?')) return;
    setColumns((prev) => prev.filter((col) => col.id !== columnId));
    setCards((prev) => prev.filter((c) => c.columnId !== columnId));
  };

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.toLowerCase();
    return cards.filter((c) => c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q));
  }, [cards, searchQuery]);

  const activeCardObj = cards.find((c) => c.id === activeCardId);
  const activeCardCategory = activeCardObj ? CATEGORIES.find((cat) => cat.id === activeCardObj.categoryId) || CATEGORIES[5] : CATEGORIES[5];

  const activeColId = activeCardId && activeCardId.startsWith('col-drag-') ? activeCardId.replace('col-drag-', '') : null;
  const activeColumnObj = activeColId ? columns.find((c) => c.id === activeColId) : null;

  const selectedNotionCard = useMemo(() => {
    if (!activeNotionCardId && cards.length > 0) return cards[0];
    return cards.find((c) => c.id === activeNotionCardId) || cards[0] || null;
  }, [cards, activeNotionCardId]);

  return (
    <PageContainer>
      <div className="notes-page-container">
        {/* Header Superior */}
        <div className="notes-header">
          <div className="notes-title-group">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.3)',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Anotações & Hub Criativo
              </h1>
            </div>
          </div>

          {/* 3-Mode Tab Selector */}
          <div className="notes-mode-selector">
            <button
              className={`notes-mode-btn ${activeMode === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveMode('editor')}
            >
              <FileText size={16} />
              <span>Editor (Notion)</span>
            </button>
            <button
              className={`notes-mode-btn ${activeMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveMode('kanban')}
            >
              <LayoutGrid size={16} />
              <span>Quadro (Trello)</span>
            </button>
            <button
              className={`notes-mode-btn ${activeMode === 'canvas' ? 'active' : ''}`}
              onClick={() => setActiveMode('canvas')}
            >
              <Maximize2 size={16} />
              <span>Quadro Branco (Canva)</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="notes-main-area">
          {/* MODE 1: NOTION SIDE-BY-SIDE EDITOR */}
          {activeMode === 'editor' && (
            <div style={{ display: 'flex', width: '100%', height: '100%' }}>
              <div className={`notion-sidebar ${mobileNotionView === 'editor' ? 'mobile-hidden' : ''}`}>
                <div className="notion-sidebar-header">
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="kanban-input"
                      style={{ paddingLeft: '32px', fontSize: '0.8rem' }}
                      placeholder="Buscar notas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="primary-btn"
                    style={{ width: '100%', padding: '8px', fontSize: '0.82rem', justifyContent: 'center' }}
                    onClick={() => {
                      handleAddCard(columns[0]?.id || 'col-todo');
                      setMobileNotionView('editor');
                    }}
                  >
                    <Plus size={14} />
                    <span>Nova Nota</span>
                  </button>
                </div>

                <div className="notion-notes-list">
                  {filteredCards.map((card) => {
                    const isSelected = selectedNotionCard?.id === card.id;
                    const cat = CATEGORIES.find((c) => c.id === card.categoryId) || CATEGORIES[5];
                    return (
                      <div
                        key={card.id}
                        className={`notion-note-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setActiveNotionCardId(card.id);
                          setMobileNotionView('editor');
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            {card.title || 'Sem título'}
                          </span>
                          <span
                            className="category-badge"
                            style={{ backgroundColor: cat.bgLight, color: cat.color, border: `1px solid ${cat.borderColor}` }}
                          >
                            {cat.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {card.body || 'Sem conteúdo adicional...'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Editor central */}
              <div className={`notion-editor-right ${mobileNotionView === 'list' ? 'mobile-hidden' : ''}`}>
                {selectedNotionCard ? (
                  <>
                    <div className="notion-editor-toolbar">
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {/* Botão de Voltar exclusivo no Mobile */}
                        <button
                          className="notes-mode-btn mobile-only-back-btn"
                          onClick={() => setMobileNotionView('list')}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          <ArrowLeft size={13} />
                          <span>Notas</span>
                        </button>

                        <button
                          className={`notes-mode-btn ${notionTab === 'write' ? 'active' : ''}`}
                          onClick={() => setNotionTab('write')}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          <Edit3 size={13} />
                          <span>Escrever</span>
                        </button>
                        <button
                          className={`notes-mode-btn ${notionTab === 'preview' ? 'active' : ''}`}
                          onClick={() => setNotionTab('preview')}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          <ExternalLink size={13} />
                          <span>Visualizar Auto-Links</span>
                        </button>
                      </div>

                      <button
                        className="kanban-icon-btn danger"
                        onClick={() => handleDeleteCard(selectedNotionCard.id)}
                        title="Excluir nota"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="notion-editor-body">
                      <input
                        type="text"
                        className="notion-title-input"
                        value={selectedNotionCard.title}
                        onChange={(e) => handleSaveCard({ ...selectedNotionCard, title: e.target.value })}
                        placeholder="Título da Anotação..."
                      />

                      {notionTab === 'write' ? (
                        <textarea
                          className="notion-textarea"
                          value={selectedNotionCard.body}
                          onChange={(e) => handleSaveCard({ ...selectedNotionCard, body: e.target.value })}
                          placeholder="Digite seu texto, cole links (https://...), crie listas e organize suas ideias..."
                        />
                      ) : (
                        <div
                          style={{
                            padding: '16px',
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            lineHeight: '1.6',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {selectedNotionCard.body ? (
                            selectedNotionCard.body.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                              part.match(/^https?:\/\//) ? (
                                <a
                                  key={i}
                                  href={part}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="note-auto-link"
                                >
                                  {part}
                                </a>
                              ) : (
                                part
                              )
                            )
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>Nenhum conteúdo para visualizar</span>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Nenhuma nota selecionada. Clique em "+ Nova Nota" no painel esquerdo.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: TRELLO KANBAN BOARD */}
          {activeMode === 'kanban' && (
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="kanban-board-scroll">
                {columns.map((column) => {
                  const columnCards = cards.filter((c) => c.columnId === column.id);
                  return (
                    <NoteColumn
                      key={column.id}
                      column={column}
                      cards={columnCards}
                      categories={CATEGORIES}
                      onAddCard={handleAddCard}
                      onEditCard={(card) => setEditingCard(card)}
                      onDeleteCard={handleDeleteCard}
                      onUpdateColumnTitle={handleUpdateColumnTitle}
                      onDeleteColumn={handleDeleteColumn}
                    />
                  );
                })}

                <div className="add-column-card">
                  {isAddingColumn ? (
                    <div className="add-column-form">
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Nova Coluna</span>
                      <input
                        type="text"
                        className="kanban-input"
                        placeholder="Nome da coluna..."
                        value={newColumnTitle}
                        onChange={(e) => setNewColumnTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateColumn();
                          if (e.key === 'Escape') setIsAddingColumn(false);
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="kanban-icon-btn" onClick={() => setIsAddingColumn(false)}>
                          <X size={16} />
                        </button>
                        <button
                          className="primary-btn"
                          onClick={handleCreateColumn}
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          Criar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="add-column-btn-content" onClick={() => setIsAddingColumn(true)}>
                      <Plus size={18} />
                      <span>Nova Coluna</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Multi-Board Selector Bar no Rodapé do Modo Kanban */}
              <div className="bottom-boards-bar">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    className={`board-tab ${board.id === activeBoardId ? 'active' : ''}`}
                    onClick={() => handleSelectBoard(board.id)}
                    title={`Alternar para ${board.name}`}
                  >
                    <LayoutGrid size={13} />
                    <span>{board.name}</span>
                    {boards.length > 1 && board.id === activeBoardId && (
                      <X
                        size={12}
                        style={{ marginLeft: '4px', opacity: 0.7 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteBoardModal(board.id);
                        }}
                        title="Excluir este quadro"
                      />
                    )}
                  </button>
                ))}

                <button className="add-board-btn" onClick={handleOpenCreateBoardModal} title="Criar novo quadro">
                  <Plus size={13} />
                  <span>Novo Quadro</span>
                </button>
              </div>

              <DragOverlay modifiers={[snapCenterToCursor]}>
                {activeCardObj ? (
                  <div style={{ width: '300px' }}>
                    <NoteCard card={activeCardObj} category={activeCardCategory} onEditCard={() => {}} onDeleteCard={() => {}} />
                  </div>
                ) : activeColumnObj ? (
                  <div style={{ width: '320px', opacity: 0.85 }}>
                    <NoteColumn
                      column={activeColumnObj}
                      cards={cards.filter((c) => c.columnId === activeColumnObj.id)}
                      categories={CATEGORIES}
                      onAddCard={() => {}}
                      onEditCard={() => {}}
                      onDeleteCard={() => {}}
                      onUpdateColumnTitle={() => {}}
                      onDeleteColumn={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* MODE 3: CANVA INFINITE CANVAS */}
          {activeMode === 'canvas' && (
            <InfiniteCanvas
              canvasNotes={canvasNotes}
              onUpdateNotes={setCanvasNotes}
              boards={boards.map((b) => ({ id: b.id, name: b.name }))}
              activeBoardId={activeBoardId}
              onSelectBoard={handleSelectBoard}
              onCreateBoard={handleOpenCreateBoardModal}
              onDeleteBoard={handleOpenDeleteBoardModal}
            />
          )}
        </div>

        {/* Modal 1: Criar Novo Quadro (Design Customizado do CRM) */}
        {isBoardModalOpen && (
          <div className="kanban-modal-overlay" onClick={() => setIsBoardModalOpen(false)}>
            <div className="kanban-modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
              <div className="kanban-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LayoutGrid size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Criar Novo Quadro
                  </h3>
                </div>
                <button className="kanban-icon-btn" onClick={() => setIsBoardModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>

              <div className="kanban-modal-body" style={{ padding: '20px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Nome do Quadro
                </label>
                <input
                  type="text"
                  className="kanban-input"
                  value={boardNameInput}
                  onChange={(e) => setBoardNameInput(e.target.value)}
                  placeholder="Ex: Planejamento 2026, Projetos..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmCreateBoard();
                    if (e.key === 'Escape') setIsBoardModalOpen(false);
                  }}
                  autoFocus
                />
              </div>

              <div className="kanban-modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="notes-mode-btn"
                  onClick={() => setIsBoardModalOpen(false)}
                  style={{ padding: '8px 14px' }}
                >
                  Cancelar
                </button>
                <button
                  className="primary-btn"
                  onClick={handleConfirmCreateBoard}
                  style={{ padding: '8px 16px' }}
                >
                  Criar Quadro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal 2: Confirmar Exclusão de Quadro */}
        {boardToDeleteId && (
          <div className="kanban-modal-overlay" onClick={() => setBoardToDeleteId(null)}>
            <div className="kanban-modal" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
              <div className="kanban-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Trash2 size={18} style={{ color: 'var(--color-danger)' }} />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Excluir Quadro
                  </h3>
                </div>
                <button className="kanban-icon-btn" onClick={() => setBoardToDeleteId(null)}>
                  <X size={16} />
                </button>
              </div>

              <div className="kanban-modal-body" style={{ padding: '20px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Tem certeza de que deseja excluir o quadro{' '}
                  <strong style={{ color: '#fff' }}>
                    "{boards.find((b) => b.id === boardToDeleteId)?.name}"
                  </strong>
                  ? Todas as notas e colunas deste quadro serão removidas.
                </p>
              </div>

              <div className="kanban-modal-footer" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="notes-mode-btn"
                  onClick={() => setBoardToDeleteId(null)}
                  style={{ padding: '8px 14px' }}
                >
                  Cancelar
                </button>
                <button
                  className="primary-btn"
                  onClick={handleConfirmDeleteBoard}
                  style={{ padding: '8px 16px', backgroundColor: 'var(--color-danger)' }}
                >
                  Excluir Quadro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição para o Modo Kanban */}
        <NoteModal
          isOpen={!!editingCard}
          card={editingCard}
          columns={columns}
          categories={CATEGORIES}
          onClose={() => setEditingCard(null)}
          onSave={handleSaveCard}
        />
      </div>
    </PageContainer>
  );
}
