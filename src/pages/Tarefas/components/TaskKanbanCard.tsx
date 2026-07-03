import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../../../entities/tarefa/model/types';
import { Calendar, CheckSquare, MessageSquare } from 'lucide-react';

interface TaskKanbanCardProps {
  task: Task;
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

export const TaskKanbanCard: React.FC<TaskKanbanCardProps> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: transform ? undefined : 'transform 0.2s ease, box-shadow 0.2s ease',
    userSelect: 'none',
    touchAction: 'none',
    zIndex: isDragging ? 1000 : undefined,
  };

  const checklistCount = task.checklist ? task.checklist.length : 0;
  const checklistDone = task.checklist ? task.checklist.filter((item) => item.done).length : 0;
  const commentsCount = task.comments ? task.comments.length : 0;

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
      {/* Top: Priority indicator and Delete Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: `1px solid ${getPriorityColor(task.priority)}`,
          color: getPriorityColor(task.priority),
          fontSize: '0.68rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '4px',
          textTransform: 'uppercase'
        }}>
          {task.priority}
        </span>
        
        {/* Project Name (if any) */}
        {task.projectName && (
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--color-primary, #60A5FA)',
            fontWeight: 600,
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {task.projectName}
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>
          {task.title}
        </h4>
        {task.description && (
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
            {task.description}
          </p>
        )}
      </div>

      {/* Bottom status stats (Checklist, comments, assignee, deadline) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '4px',
        paddingTop: '8px',
        borderTop: '1px solid rgba(51, 65, 85, 0.4)'
      }}>
        {/* Assignee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary, #3B82F6)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.65rem',
            fontWeight: 700
          }}>
            {task.assignee ? task.assignee.charAt(0).toUpperCase() : '?'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary, #94A3B8)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.assignee || 'Sem resp.'}
          </span>
        </div>

        {/* Stats and Deadline */}
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
          {task.deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)' }} title="Prazo de entrega">
              <Calendar size={11} />
              <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>
                {task.deadline.includes('-') ? task.deadline.split('-').reverse().slice(0, 2).join('/') : task.deadline.split('/').slice(0, 2).join('/')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
