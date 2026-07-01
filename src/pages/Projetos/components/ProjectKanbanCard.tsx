import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Project } from '../../../entities/projeto/model/types';
import { Calendar, CheckSquare, MessageSquare, Users } from 'lucide-react';

interface ProjectKanbanCardProps {
  project: Project;
  onClick: () => void;
}

const getPriorityColor = (priority: 'baixa' | 'media' | 'alta') => {
  switch (priority) {
    case 'alta': return '#EF4444';
    case 'media': return '#F59E0B';
    case 'baixa': return '#10B981';
    default: return '#9CA3AF';
  }
};

export const ProjectKanbanCard: React.FC<ProjectKanbanCardProps> = ({ project, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: transform ? undefined : 'transform 0.2s ease, box-shadow 0.2s ease',
    userSelect: 'none',
    zIndex: isDragging ? 1000 : undefined,
  };

  const checklistCount = project.checklist ? project.checklist.length : 0;
  const checklistDone = project.checklist ? project.checklist.filter((item) => item.done).length : 0;
  const commentsCount = project.comments ? project.comments.length : 0;
  const teamCount = project.team ? project.team.length : 0;
  const progressPercent = project.progress || 0;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (transform) {
          e.preventDefault();
          return;
        }
        onClick();
      }}
      style={{
        ...style,
        backgroundColor: 'var(--bg-card, #1E293B)',
        border: '1px solid var(--border-color, #334155)',
        borderRadius: '10px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
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
        }
      }}
    >
      {/* Top Priority Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: `1px solid ${getPriorityColor(project.priority)}`,
          color: getPriorityColor(project.priority),
          fontSize: '0.68rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '4px',
          textTransform: 'uppercase'
        }}>
          {project.priority}
        </span>

        {/* Progress Value */}
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: progressPercent === 100 ? 'var(--color-success, #10B981)' : '#fff' }}>
          {progressPercent}%
        </span>
      </div>

      {/* Title & Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>
          {project.name}
        </h4>
        {project.description && (
          <p style={{
            margin: 0,
            fontSize: '0.78rem',
            color: 'var(--text-secondary, #94A3B8)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: '1.4'
          }}>
            {project.description}
          </p>
        )}
      </div>

      {/* Progress Bar Graphic */}
      <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          backgroundColor: progressPercent === 100 ? 'var(--color-success, #10B981)' : 'var(--color-primary, #3B82F6)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Bottom stats details */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '4px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(51, 65, 85, 0.4)'
      }}>
        {/* Team list count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
          <Users size={12} />
          <span style={{ fontSize: '0.72rem' }}>{teamCount} {teamCount === 1 ? 'membro' : 'membros'}</span>
        </div>

        {/* Stats (Checklist, comments, deadline) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {checklistCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: checklistDone === checklistCount ? 'var(--color-success, #10B981)' : 'var(--text-muted)' }} title="Checklist concluído">
              <CheckSquare size={11} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{checklistDone}/{checklistCount}</span>
            </div>
          )}
          {commentsCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }} title="Comentários">
              <MessageSquare size={11} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{commentsCount}</span>
            </div>
          )}
          {project.deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)' }} title="Prazo do projeto">
              <Calendar size={11} />
              <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                {project.deadline.includes('-') ? project.deadline.split('-').reverse().slice(0, 2).join('/') : project.deadline.split('/').slice(0, 2).join('/')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
