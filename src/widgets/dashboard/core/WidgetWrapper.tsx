import React, { useState } from 'react';
import { 
  MoreVertical, Copy, EyeOff, Trash2, Maximize2, 
  Settings, RefreshCw, Download, Pin, Share2
} from 'lucide-react';
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

  const handleDuplicate = () => {
    addWidget(widgetId);
    setShowMenu(false);
  };

  const handleRemove = () => {
    removeWidget(instanceId);
    setShowMenu(false);
  };

  return (
    <div className={`widget-wrapper ${isEditMode ? 'edit-mode' : ''}`} style={{ height: '100%', position: 'relative' }}>
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
            onMouseLeave={() => setShowMenu(false)}
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
                <button className="widget-menu-item" onClick={() => alert('Configurações do widget em breve')}>
                  <Settings size={14} /> Configurar
                </button>
                <button className="widget-menu-item" onClick={() => alert('Recarregando dados...')}>
                  <RefreshCw size={14} /> Atualizar Dados
                </button>
                <button className="widget-menu-item" onClick={handleDuplicate}>
                  <Copy size={14} /> Duplicar Widget
                </button>
                <button className="widget-menu-item" onClick={() => alert('Em breve')}>
                  <Share2 size={14} /> Copiar para Dashboard...
                </button>
                <button className="widget-menu-item" onClick={() => alert('Em breve')}>
                  <Pin size={14} /> Fixar Posição
                </button>
                <div className="widget-menu-divider" />
                <button className="widget-menu-item" onClick={() => alert('Em breve')}>
                  <Maximize2 size={14} /> Tela Cheia
                </button>
                <button className="widget-menu-item" onClick={() => alert('Exportando PDF/CSV...')}>
                  <Download size={14} /> Exportar Dados
                </button>
                <div className="widget-menu-divider" />
                <button className="widget-menu-item" onClick={handleRemove}>
                  <EyeOff size={14} /> Ocultar
                </button>
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
