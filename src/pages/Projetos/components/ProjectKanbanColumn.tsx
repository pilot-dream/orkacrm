import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { ProjectStage } from '../../../entities/projeto/model/types';

interface ProjectKanbanColumnProps {
  id: ProjectStage;
  label: string;
  color: string;
  projectCount: number;
  children?: React.ReactNode;
}

export const ProjectKanbanColumn: React.FC<ProjectKanbanColumnProps> = ({
  id,
  label,
  color,
  projectCount,
  children
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div
      ref={setNodeRef}
      className="kanban-column"
      style={{
        flex: '1 0 260px',
        minWidth: '260px',
        maxWidth: '300px',
        backgroundColor: 'var(--bg-panel, #0F172A)',
        borderRadius: '12px',
        border: isOver ? `2px dashed ${color}` : '1px solid var(--border-color, #1E293B)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 240px)',
        minHeight: '450px',
        padding: '12px',
        transition: 'all 0.2s ease',
        boxShadow: isOver ? `0 0 16px rgba(0,0,0,0.2), inset 0 0 10px rgba(255,255,255,0.02)` : 'none'
      }}
    >
      {/* Column Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(51, 65, 85, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block'
          }} />
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
            {label}
          </h3>
        </div>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 700,
          backgroundColor: 'rgba(255,255,255,0.08)',
          color: 'var(--text-secondary, #94A3B8)',
          padding: '2px 8px',
          borderRadius: '12px'
        }}>
          {projectCount}
        </span>
      </div>

      {/* Cards list container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        overflowY: 'auto',
        flex: 1,
        padding: '2px'
      }}>
        {children}
        
        {projectCount === 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            border: '2px dashed rgba(51, 65, 85, 0.2)',
            borderRadius: '8px',
            color: 'var(--text-muted, #475569)',
            fontSize: '0.75rem',
            padding: '24px',
            textAlign: 'center'
          }}>
            Arraste um projeto aqui
          </div>
        )}
      </div>
    </div>
  );
};
