import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, Copy, EyeOff, Trash2, Maximize2, 
  RefreshCw
} from 'lucide-react';
import { useLongPress } from '../../../hooks/useLongPress';
import { useDashboardStore } from '../../../entities/dashboard/model/store';
import type { WidgetConfig } from '../../../entities/dashboard/model/types';

interface WidgetWrapperProps {
  instanceId: string;
  widgetId: string;
  config?: WidgetConfig;
  isEditMode: boolean;
  children: React.ReactNode;
}

export const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ instanceId, widgetId, isEditMode, children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const removeWidget = useDashboardStore((state: any) => state.removeWidget);
  const addWidget = useDashboardStore((state: any) => state.addWidget);
  const setIsEditMode = useDashboardStore((state: any) => state.setIsEditMode);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  const longPressProps = useLongPress(() => {
    setIsEditMode(true);
    setIsLongPressing(true);
    setTimeout(() => setIsLongPressing(false), 2000); // Visual feedback removes after 2s or when drag stops
  }, () => {
    // Normal click handler if needed
  }, { delay: 600 });

  const handleDuplicate = () => {
    addWidget(widgetId);
    setShowMenu(false);
  };

  const handleRemove = () => {
    removeWidget(instanceId);
    setShowMenu(false);
  };

  return (
    <div 
      className={`widget-wrapper ${isEditMode ? 'edit-mode' : ''} ${isLongPressing ? 'widget-dragging-active' : ''}`} 
      style={{ height: '100%', position: 'relative' }}
      {...(!isEditMode ? longPressProps : {})}
    >
      {/* The component itself */}
      <div style={{ height: '100%', pointerEvents: isEditMode ? 'none' : 'auto' }}>
        {children}
      </div>

      {/* Overlay just for Edit Mode */}
      {isEditMode && (
        <div className="widget-overlay">
          <div className="widget-drag-handle" title="Arraste para mover">
            <Maximize2 size={14} />
          </div>
          
          <div 
            className="widget-menu-container" 
            ref={menuRef}
          >
            <button 
              className="widget-menu-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="widget-dropdown-menu">
                <button className="widget-menu-item" onClick={() => { alert('Recarregando dados...'); setShowMenu(false); }}>
                  <RefreshCw size={14} /> Atualizar Dados
                </button>
                <button className="widget-menu-item" onClick={handleDuplicate}>
                  <Copy size={14} /> Duplicar Widget
                </button>
                <button className="widget-menu-item" onClick={() => { alert('Em breve'); setShowMenu(false); }}>
                  <Maximize2 size={14} /> Tela Cheia
                </button>
                <button className="widget-menu-item" onClick={handleRemove}>
                  <EyeOff size={14} /> Ocultar
                </button>
                <div className="widget-menu-divider" />
                <button className="widget-menu-item danger" onClick={handleRemove}>
                  <Trash2 size={14} /> Remover da Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
