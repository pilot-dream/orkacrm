import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import type { Task, TaskStatus } from '../../../entities/tarefa/model/types';
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskKanbanCard } from './TaskKanbanCard';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onTaskMove: (taskId: string, targetStatus: TaskStatus) => void;
  onTaskClick: (taskId: string) => void;
  stages: { id: TaskStatus; label: string; color: string }[];
}

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onTaskMove,
  onTaskClick,
  stages
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    })
  );

  const activeTask = tasks.find((t) => t.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const targetStatus = over.id as TaskStatus;
      onTaskMove(taskId, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        padding: '4px 4px 16px 4px',
        width: '100%',
        scrollbarWidth: 'thin',
      }}>
        {stages.map((stage) => {
          const stageTasks = tasks.filter((t) => t.status === stage.id);

          return (
            <TaskKanbanColumn
              key={stage.id}
              id={stage.id}
              label={stage.label}
              color={stage.color}
              taskCount={stageTasks.length}
            >
              {stageTasks.map((task) => (
                <TaskKanbanCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            </TaskKanbanColumn>
          );
        })}
      </div>

      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeTask ? (
          <div style={{
            transform: 'rotate(2deg)',
            transformOrigin: '0 0',
            width: '260px',
            opacity: 0.9,
          }}>
            <TaskKanbanCard
              task={activeTask}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
