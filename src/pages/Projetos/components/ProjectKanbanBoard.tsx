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
import type { Project, ProjectStage } from '../../../entities/projeto/model/types';
import { ProjectKanbanColumn } from './ProjectKanbanColumn';
import { ProjectKanbanCard } from './ProjectKanbanCard';

interface ProjectKanbanBoardProps {
  projects: Project[];
  onProjectMove: (projectId: string, targetStage: ProjectStage) => void;
  onProjectClick: (projectId: string) => void;
  stages: { id: ProjectStage; label: string; color: string }[];
}

export const ProjectKanbanBoard: React.FC<ProjectKanbanBoardProps> = ({
  projects,
  onProjectMove,
  onProjectClick,
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

  const activeProject = projects.find((p) => p.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const projectId = active.id as string;
      const targetStage = over.id as ProjectStage;
      onProjectMove(projectId, targetStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board-container" style={{
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        padding: '4px 4px 16px 4px',
        width: '100%',
        scrollbarWidth: 'thin',
      }}>
        {stages.map((stage) => {
          const stageProjects = projects.filter((p) => p.stage === stage.id);

          return (
            <ProjectKanbanColumn
              key={stage.id}
              id={stage.id}
              label={stage.label}
              color={stage.color}
              projectCount={stageProjects.length}
            >
              {stageProjects.map((project) => (
                <ProjectKanbanCard
                  key={project.id}
                  project={project}
                  onClick={() => onProjectClick(project.id)}
                />
              ))}
            </ProjectKanbanColumn>
          );
        })}
      </div>

      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeProject ? (
          <div style={{
            transform: 'rotate(2deg)',
            transformOrigin: '0 0',
            width: '260px',
            opacity: 0.9,
          }}>
            <ProjectKanbanCard
              project={activeProject}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
