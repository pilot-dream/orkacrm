import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2, 
  Move, 
  ExternalLink,
  Type,
  Square,
  Maximize2,
  Layers,
  Plus,
  LayoutGrid,
  X
} from 'lucide-react';

export interface CanvasNoteItem {
  id: string;
  x: number;
  y: number;
  title: string;
  body: string;
  colorType: 'yellow' | 'blue' | 'purple' | 'emerald' | 'dark';
  styleMode?: 'solid' | 'semi' | 'outline';
  createdAt: string;
}

export interface BoardSummary {
  id: string;
  name: string;
}

interface InfiniteCanvasProps {
  canvasNotes: CanvasNoteItem[];
  onUpdateNotes: (notes: CanvasNoteItem[]) => void;
  boards: BoardSummary[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: () => void;
  onDeleteBoard: (boardId: string) => void;
}

export const renderCanvasLinks = (text: string) => {
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
          className="note-auto-link inline-flex items-center gap-1 font-semibold"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {part}
          <ExternalLink size={11} className="inline ml-0.5" />
        </a>
      );
    }
    return part;
  });
};

export const InfiniteCanvas: React.FC<InfiniteCanvasProps> = ({
  canvasNotes,
  onUpdateNotes,
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onDeleteBoard,
}) => {
  // Estado de zoom e pan do canvas
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Estilo padrão para novos post-its ('solid' | 'semi' | 'outline')
  const [defaultStyleMode, setDefaultStyleMode] = useState<'solid' | 'semi' | 'outline'>('solid');

  // Panning com o mouse ou toque
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging de um card individual
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const cardStartPosRef = useRef<{ cardX: number; cardY: number; mouseX: number; mouseY: number }>({
    cardX: 0,
    cardY: 0,
    mouseX: 0,
    mouseY: 0,
  });

  // Zoom handlers
  const handleZoomIn = () => setScale((prev) => Math.min(2, Math.round((prev + 0.1) * 10) / 10));
  const handleZoomOut = () => setScale((prev) => Math.max(0.4, Math.round((prev - 0.1) * 10) / 10));
  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-world')) {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
    } else if (draggingCardId) {
      const dx = (e.clientX - cardStartPosRef.current.mouseX) / scale;
      const dy = (e.clientY - cardStartPosRef.current.mouseY) / scale;

      onUpdateNotes(
        canvasNotes.map((note) => {
          if (note.id === draggingCardId) {
            return {
              ...note,
              x: Math.round(cardStartPosRef.current.cardX + dx),
              y: Math.round(cardStartPosRef.current.cardY + dy),
            };
          }
          return note;
        })
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingCardId(null);
  };

  // Touch handlers para mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-world'))) {
      setIsPanning(true);
      const touch = e.touches[0];
      startPanRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({
        x: touch.clientX - startPanRef.current.x,
        y: touch.clientY - startPanRef.current.y,
      });
    } else if (draggingCardId && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = (touch.clientX - cardStartPosRef.current.mouseX) / scale;
      const dy = (touch.clientY - cardStartPosRef.current.mouseY) / scale;

      onUpdateNotes(
        canvasNotes.map((note) => {
          if (note.id === draggingCardId) {
            return {
              ...note,
              x: Math.round(cardStartPosRef.current.cardX + dx),
              y: Math.round(cardStartPosRef.current.cardY + dy),
            };
          }
          return note;
        })
      );
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggingCardId(null);
  };

  const handleCardMouseDown = (e: React.MouseEvent, note: CanvasNoteItem) => {
    e.stopPropagation();
    setDraggingCardId(note.id);
    cardStartPosRef.current = {
      cardX: note.x,
      cardY: note.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  const handleCardTouchStart = (e: React.TouchEvent, note: CanvasNoteItem) => {
    e.stopPropagation();
    setDraggingCardId(note.id);
    const touch = e.touches[0];
    cardStartPosRef.current = {
      cardX: note.x,
      cardY: note.y,
      mouseX: touch.clientX,
      mouseY: touch.clientY,
    };
  };

  const handleAddNote = (colorType: CanvasNoteItem['colorType']) => {
    const newX = Math.round((-pan.x + 300) / scale + Math.random() * 40);
    const newY = Math.round((-pan.y + 150) / scale + Math.random() * 40);

    const newNote: CanvasNoteItem = {
      id: `canvas-${Date.now()}`,
      x: newX,
      y: newY,
      title: colorType === 'dark' ? 'Bloco de Texto' : 'Nova Nota',
      body: colorType === 'dark' ? 'Cole seu link aqui...' : 'Digite sua nota...',
      colorType,
      styleMode: defaultStyleMode,
      createdAt: new Date().toISOString(),
    };

    onUpdateNotes([...canvasNotes, newNote]);
  };

  const handleUpdateNoteField = (id: string, fields: Partial<CanvasNoteItem>) => {
    onUpdateNotes(
      canvasNotes.map((note) => (note.id === id ? { ...note, ...fields } : note))
    );
  };

  const cycleCardStyleMode = (note: CanvasNoteItem, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const currentMode = note.styleMode || 'solid';
    let nextMode: 'solid' | 'semi' | 'outline' = 'solid';

    if (currentMode === 'solid') nextMode = 'semi';
    else if (currentMode === 'semi') nextMode = 'outline';
    else nextMode = 'solid';

    handleUpdateNoteField(note.id, { styleMode: nextMode });
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onUpdateNotes(canvasNotes.filter((note) => note.id !== id));
  };

  const getPostItClass = (colorType: CanvasNoteItem['colorType'], styleMode: 'solid' | 'semi' | 'outline' = 'solid') => {
    if (styleMode === 'outline') {
      return `postit-outline-${colorType}`;
    }
    if (styleMode === 'semi') {
      return `postit-semi-${colorType}`;
    }
    switch (colorType) {
      case 'yellow': return 'postit-yellow';
      case 'blue': return 'postit-blue';
      case 'purple': return 'postit-purple';
      case 'emerald': return 'postit-emerald';
      case 'dark': return 'postit-dark';
      default: return 'postit-yellow';
    }
  };

  return (
    <div
      className={`canvas-viewport ${isPanning ? 'is-panning' : ''}`}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dock Flutuante Superior (Estilos & Cores) */}
      <div className="canvas-toolbar">
        <div className="canvas-style-toggle-group">
          <button
            className={`canvas-style-icon-btn ${defaultStyleMode === 'solid' ? 'active' : ''}`}
            onClick={() => setDefaultStyleMode('solid')}
            title="Preenchido 100%"
          >
            <Square size={14} className="fill-current" />
          </button>
          <button
            className={`canvas-style-icon-btn ${defaultStyleMode === 'semi' ? 'active' : ''}`}
            onClick={() => setDefaultStyleMode('semi')}
            title="Translúcido (Vidro)"
          >
            <Layers size={14} />
          </button>
          <button
            className={`canvas-style-icon-btn ${defaultStyleMode === 'outline' ? 'active' : ''}`}
            onClick={() => setDefaultStyleMode('outline')}
            title="Apenas Borda Colorida"
          >
            <Maximize2 size={14} />
          </button>
        </div>

        <div className="canvas-toolbar-divider" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className="canvas-color-dot yellow"
            onClick={() => handleAddNote('yellow')}
            title="+ Post-it Amarelo"
          >
            <Plus size={12} />
          </button>
          <button
            className="canvas-color-dot blue"
            onClick={() => handleAddNote('blue')}
            title="+ Post-it Azul"
          >
            <Plus size={12} />
          </button>
          <button
            className="canvas-color-dot purple"
            onClick={() => handleAddNote('purple')}
            title="+ Post-it Roxo"
          >
            <Plus size={12} />
          </button>
          <button
            className="canvas-color-dot dark"
            onClick={() => handleAddNote('dark')}
            title="+ Bloco de Texto / Link"
          >
            <Type size={12} />
          </button>
        </div>
      </div>

      {/* World Transform Layer */}
      <div
        className="canvas-world"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}
      >
        {canvasNotes.map((note) => {
          const currentMode = note.styleMode || 'solid';
          const colorClass = getPostItClass(note.colorType, currentMode);

          return (
            <div
              key={note.id}
              className={`canvas-card ${colorClass}`}
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
              }}
              onMouseDown={(e) => handleCardMouseDown(e, note)}
              onTouchStart={(e) => handleCardTouchStart(e, note)}
            >
              <div className="canvas-card-header">
                <input
                  type="text"
                  className="canvas-card-title-input"
                  value={note.title}
                  onChange={(e) => handleUpdateNoteField(note.id, { title: e.target.value })}
                  placeholder="Título..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={(e) => cycleCardStyleMode(note, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      opacity: 0.8,
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={`Estilo: ${currentMode.toUpperCase()}. Clique para alternar.`}
                  >
                    {currentMode === 'solid' && <Square size={13} className="fill-current" />}
                    {currentMode === 'semi' && <Layers size={13} />}
                    {currentMode === 'outline' && <Maximize2 size={13} />}
                  </button>

                  <Move size={12} style={{ opacity: 0.5, cursor: 'grab' }} />

                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      opacity: 0.8,
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                    title="Excluir nota"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <textarea
                className="canvas-card-body-input"
                value={note.body}
                onChange={(e) => handleUpdateNoteField(note.id, { body: e.target.value })}
                placeholder="Escreva aqui livremente..."
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />

              <div style={{ fontSize: '0.72rem', opacity: 0.8, paddingTop: '4px' }}>
                {renderCanvasLinks(note.body)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Seleção e Criação de Múltiplos Quadros no Canto Inferior Esquerdo */}
      <div className="bottom-boards-bar">
        {boards.map((board) => (
          <button
            key={board.id}
            className={`board-tab ${board.id === activeBoardId ? 'active' : ''}`}
            onClick={() => onSelectBoard(board.id)}
            title={`Alternar para ${board.name}`}
          >
            <LayoutGrid size={13} />
            <span>{board.name}</span>
            {boards.length > 1 && board.id === activeBoardId && (
              <span
                style={{ marginLeft: '4px', opacity: 0.7, display: 'inline-flex', alignItems: 'center' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBoard(board.id);
                }}
                title="Excluir este quadro"
              >
                <X size={12} />
              </span>
            )}
          </button>
        ))}

        <button className="add-board-btn" onClick={onCreateBoard} title="Criar novo quadro">
          <Plus size={13} />
          <span>Novo Quadro</span>
        </button>
      </div>

      {/* Controles de Zoom no Canto Inferior Direito */}
      <div className="canvas-zoom-controls">
        <button className="canvas-zoom-btn" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={15} />
        </button>
        <span className="canvas-zoom-level">{Math.round(scale * 100)}%</span>
        <button className="canvas-zoom-btn" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={15} />
        </button>
        <button className="canvas-zoom-btn" onClick={handleResetZoom} title="Resetar Câmera">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
