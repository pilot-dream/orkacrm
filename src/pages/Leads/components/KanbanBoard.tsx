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
import type { Lead, LeadStage } from '../../../entities/lead/model/types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadMove: (leadId: string, targetStage: LeadStage) => void;
  onLeadClick: (leadId: string) => void;
  onLeadDelete?: (leadId: string, e: React.MouseEvent) => void;
  stages: { id: LeadStage; label: string; color: string }[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onLeadMove,
  onLeadClick,
  onLeadDelete,
  stages
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Set up sensors with constraints so click works properly
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

  const activeLead = leads.find((l) => l.id === activeId);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const leadId = active.id as string;
      const targetStage = over.id as LeadStage;
      onLeadMove(leadId, targetStage);
    }
  };

  // Helper function to calculate sum values in each stage column
  const getStageStats = (stageId: LeadStage) => {
    const stageLeads = leads.filter((l) => l.stage === stageId);
    const leadCount = stageLeads.length;
    const totalValue = stageLeads.reduce((acc, l) => acc + (l.value || 0) + (l.mrrValue || 0), 0);
    return { leadCount, totalValue };
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
          const { leadCount, totalValue } = getStageStats(stage.id);
          const stageLeads = leads.filter((l) => l.stage === stage.id);

          return (
            <KanbanColumn
              key={stage.id}
              id={stage.id}
              label={stage.label}
              color={stage.color}
              leadCount={leadCount}
              totalValue={totalValue}
            >
              {stageLeads.map((lead) => (
                <KanbanCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead.id)}
                  onDelete={onLeadDelete}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      {/* Drag Overlay for smooth clone preview */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeLead ? (
          <div style={{
            transform: 'rotate(2deg)',
            transformOrigin: '0 0',
            width: '280px',
            opacity: 0.9,
          }}>
            <KanbanCard
              lead={activeLead}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
