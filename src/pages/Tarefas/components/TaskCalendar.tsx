import React, { useState } from 'react';
import type { Task } from '../../../entities/tarefa/model/types';
import { TASK_TYPE_LABELS, TASK_REMINDER_LABELS } from '../../../entities/tarefa/model/types';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, MapPin, Bell, X, Users, Phone, RefreshCcw, Code, Rocket, Wrench, DollarSign, Briefcase, Pin } from 'lucide-react';
import type { Project } from '../../../entities/projeto/model/types';

interface TaskCalendarProps {
  tasks: Task[];
  projects: Project[];
  onTaskMove: (taskId: string, newDateStr: string) => void;
  onTaskClick: (taskId: string) => void;
  onDayClick: (dateStr: string) => void;
}

const renderTaskIcon = (type?: string, size = 14) => {
  switch (type) {
    case 'reuniao': return <Users size={size} />;
    case 'ligacao': return <Phone size={size} />;
    case 'followup': return <RefreshCcw size={size} />;
    case 'desenvolvimento': return <Code size={size} />;
    case 'implantacao': return <Rocket size={size} />;
    case 'suporte': return <Wrench size={size} />;
    case 'financeiro': return <DollarSign size={size} />;
    case 'comercial': return <Briefcase size={size} />;
    case 'outro':
    default: return <Pin size={size} />;
  }
};

const getPriorityColor = (priority: 'baixa' | 'media' | 'alta') => {
  switch (priority) {
    case 'alta': return '#EF4444';
    case 'media': return '#F59E0B';
    case 'baixa': return '#10B981';
    default: return '#9CA3AF';
  }
};

const getPriorityLabel = (priority: 'baixa' | 'media' | 'alta') => {
  switch (priority) {
    case 'alta': return 'Alta';
    case 'media': return 'Média';
    case 'baixa': return 'Baixa';
    default: return '';
  }
};

const formatShortDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseTaskDeadline = (deadlineStr?: string): Date | null => {
  if (!deadlineStr) return null;
  try {
    const parts = deadlineStr.includes('/') ? deadlineStr.split('/') : deadlineStr.split('-');
    if (deadlineStr.includes('/')) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  } catch {
    return null;
  }
};

interface EventPopupProps {
  task: Task;
  projectName?: string;
  anchorRect: DOMRect;
  onClose: () => void;
  onOpenDetail: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ task, projectName, anchorRect, onClose, onOpenDetail }) => {
  const priorityColor = getPriorityColor(task.priority);

  // Determine popup position (left of element if near right edge)
  const popupWidth = 300;
  const isNearRight = anchorRect.right + popupWidth + 16 > window.innerWidth;
  const left = isNearRight ? anchorRect.left - popupWidth - 8 : anchorRect.right + 8;
  const top = Math.min(anchorRect.top, window.innerHeight - 400);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top,
        left,
        width: `${popupWidth}px`,
        backgroundColor: '#1E293B',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      {/* Header strip with priority color */}
      <div style={{ height: '4px', backgroundColor: priorityColor }} />

      {/* Close button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 14px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>{renderTaskIcon(task.taskType, 16)}</span>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', lineHeight: 1.3 }}>{task.title}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', flexShrink: 0, marginLeft: '8px' }}>
          <X size={14} />
        </button>
      </div>

      {/* Details */}
      <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Type + Priority */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {task.taskType && (
            <span style={{ fontSize: '0.72rem', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-secondary)' }}>
              {TASK_TYPE_LABELS[task.taskType]}
            </span>
          )}
          <span style={{ fontSize: '0.72rem', backgroundColor: `${priorityColor}15`, color: priorityColor, padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
            Prioridade {getPriorityLabel(task.priority)}
          </span>
        </div>

        {/* Date + Time */}
        {(task.deadline || task.time) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {task.deadline && <span>📅 {task.deadline}</span>}
            {task.time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#A78BFA', fontWeight: 600 }}>
                <Clock size={12} /> {task.time}
              </span>
            )}
          </div>
        )}

        {/* Reminder */}
        {task.reminder && task.reminder !== 'sem_lembrete' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#F59E0B' }}>
            <Bell size={12} />
            <span>{TASK_REMINDER_LABELS[task.reminder]}</span>
          </div>
        )}

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div className="flex -space-x-2 overflow-hidden">
              {task.assignees.slice(0, 3).map((a, i) => (
                <div key={i} className="inline-flex items-center justify-center rounded-full bg-blue-500 text-white text-[8px] font-bold" style={{ width: '18px', height: '18px', zIndex: 3 - i, border: '2px solid var(--bg-card)' }} title={a}>
                  {a.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.assignees.length > 3 && (
                <div className="inline-flex items-center justify-center rounded-full bg-slate-700 text-white text-[8px] font-bold" style={{ width: '18px', height: '18px', zIndex: 0, border: '2px solid var(--bg-card)' }}>
                  +{task.assignees.length - 3}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project */}
        {projectName && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🗂️</span> <span>{projectName}</span>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            {task.description}
          </p>
        )}

        {/* Location / Link */}
        {task.locationLink && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
            <MapPin size={12} style={{ color: '#818CF8', flexShrink: 0 }} />
            {task.locationLink.startsWith('http') ? (
              <a href={task.locationLink} target="_blank" rel="noopener noreferrer" style={{ color: '#818CF8', textDecoration: 'none', wordBreak: 'break-all' }}>
                {task.locationLink}
              </a>
            ) : (
              <span style={{ color: '#818CF8' }}>{task.locationLink}</span>
            )}
          </div>
        )}

        {/* Open Detail button */}
        <button
          onClick={onOpenDetail}
          style={{ marginTop: '4px', width: '100%', padding: '7px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
        >
          Abrir Detalhes Completos
        </button>
      </div>
    </div>
  );
};

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  projects,
  onTaskMove,
  onTaskClick,
  onDayClick,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [popupTask, setPopupTask] = useState<{ task: Task; rect: DOMRect } | null>(null);

  const isOverdue = (task: Task) => {
    if (task.status === 'concluida') return false;
    const deadlineDate = parseTaskDeadline(task.deadline);
    if (!deadlineDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  const getProjectName = (task: Task) => {
    if (!task.projectId) return undefined;
    const proj = projects.find(p => p.id === task.projectId);
    return proj?.name;
  };

  const handleTaskChipClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupTask({ task, rect });
  };

  // Navigations
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') nextDate.setMonth(currentDate.getMonth() - 1);
    else if (viewMode === 'week') nextDate.setDate(currentDate.getDate() - 7);
    else nextDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') nextDate.setMonth(currentDate.getMonth() + 1);
    else if (viewMode === 'week') nextDate.setDate(currentDate.getDate() + 7);
    else nextDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const days: Date[] = [];
    for (let i = startOffset; i > 0; i--) days.push(new Date(year, month, 1 - i));
    for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));
    const endOffset = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= endOffset; i++) days.push(new Date(year, month + 1, i));
    while (days.length < 42) {
      const lastAdded = days[days.length - 1];
      days.push(new Date(lastAdded.getFullYear(), lastAdded.getMonth(), lastAdded.getDate() + 1));
    }
    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const currentDayOfWeek = (date.getDay() + 6) % 7;
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDayOfWeek);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    }
    return days;
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) onTaskMove(taskId, dateStr);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const getMonthName = (monthIdx: number) => ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][monthIdx];
  const getWeekdayShortName = (dayIdx: number) => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][dayIdx];

  const getTasksForDate = (date: Date) => {
    const dateStr = formatShortDate(date);
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const tDate = parseTaskDeadline(t.deadline);
      return tDate ? formatShortDate(tDate) === dateStr : false;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', minHeight: '550px', backgroundColor: 'var(--bg-card, #1E293B)', borderRadius: '12px', border: '1px solid var(--border-color, #334155)', overflow: 'hidden', color: '#fff' }}
      onClick={() => setPopupTask(null)}
    >
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color, #334155)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-panel, #0F172A)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button onClick={handlePrev} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronLeft size={16} /></button>
            <button onClick={handleToday} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>Hoje</button>
            <button onClick={handleNext} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><ChevronRight size={16} /></button>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, minWidth: '180px' }}>
            {viewMode === 'month' && `${getMonthName(currentDate.getMonth())} de ${currentDate.getFullYear()}`}
            {viewMode === 'week' && `Semana de ${currentDate.getDate()} ${getMonthName(currentDate.getMonth())}`}
            {viewMode === 'day' && `${currentDate.getDate()} de ${getMonthName(currentDate.getMonth())} de ${currentDate.getFullYear()}`}
          </h2>
        </div>
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-panel, #0F172A)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{ border: 'none', backgroundColor: viewMode === mode ? 'var(--color-primary, #3B82F6)' : 'transparent', color: '#fff', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s ease' }}>
              {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Month View */}
        {viewMode === 'month' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(15, 23, 42, 0.2)' }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ padding: '10px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {getWeekdayShortName(i)}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, overflowY: 'auto' }}>
              {getDaysInMonth(currentDate).map((day, idx) => {
                const dayTasks = getTasksForDate(day);
                const dayStr = formatShortDate(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                return (
                  <div key={idx} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, dayStr)}
                    onClick={(e) => { if (e.target === e.currentTarget) onDayClick(dayStr); }}
                    style={{ borderRight: '1px solid rgba(51, 65, 85, 0.4)', borderBottom: '1px solid rgba(51, 65, 85, 0.4)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '80px', backgroundColor: isCurrentMonth ? 'transparent' : 'rgba(15, 23, 42, 0.2)', opacity: isCurrentMonth ? 1 : 0.45, cursor: 'pointer', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isToday(day) ? 'var(--color-primary, #3B82F6)' : 'transparent', color: isToday(day) ? '#fff' : 'var(--text-secondary)' }}>
                        {day.getDate()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, pointerEvents: 'auto' }}>
                      {dayTasks.map((t) => {
                        const overdue = isOverdue(t);
                        return (
                          <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}
                            onClick={(e) => handleTaskChipClick(e, t)}
                            style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: overdue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(51, 65, 85, 0.3)', borderLeft: `3px solid ${getPriorityColor(t.priority)}`, border: overdue ? '1px dashed #EF4444' : undefined, borderLeftWidth: overdue ? '3px' : undefined, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', cursor: 'pointer' }}
                            title={`${t.title} (${t.assignees ? t.assignees.join(', ') : 'Sem resp.'})`}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {renderTaskIcon(t.taskType, 12)} {t.title}
                              </div>
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                              {t.time && <span style={{ fontSize: '0.65rem', color: '#A78BFA' }}>{t.time}</span>}
                              {overdue && <Clock size={10} style={{ color: '#EF4444' }} />}
                              {t.assignees && t.assignees.length > 0 && (
                                <div className="flex -space-x-1 overflow-hidden" style={{ flexShrink: 0 }}>
                                  {t.assignees.slice(0, 3).map((a, i) => (
                                    <div key={i} className="inline-flex items-center justify-center rounded-full bg-blue-500 text-white text-[7px] font-bold" style={{ width: '14px', height: '14px', zIndex: 3 - i, border: '1px solid var(--bg-card)' }} title={a}>
                                      {a.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {getDaysInWeek(currentDate).map((day, idx) => {
              const dayTasks = getTasksForDate(day);
              const dayStr = formatShortDate(day);
              return (
                <div key={idx} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, dayStr)}
                  onClick={(e) => { if (e.target === e.currentTarget) onDayClick(dayStr); }}
                  style={{ flex: 1, borderRight: '1px solid rgba(51, 65, 85, 0.4)', display: 'flex', flexDirection: 'column', minWidth: '120px', backgroundColor: isToday(day) ? 'rgba(59, 130, 246, 0.03)' : 'transparent', cursor: 'pointer' }}>
                  <div style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border-color)', backgroundColor: isToday(day) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', pointerEvents: 'none' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{getWeekdayShortName(idx)}</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isToday(day) ? 'var(--color-primary, #3B82F6)' : 'transparent', color: '#fff' }}>{day.getDate()}</span>
                  </div>
                  <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', pointerEvents: 'auto' }}>
                    {dayTasks.map((t) => {
                      const overdue = isOverdue(t);
                      return (
                        <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}
                          onClick={(e) => handleTaskChipClick(e, t)}
                          style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: overdue ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-panel, #0F172A)', borderLeft: `4px solid ${getPriorityColor(t.priority)}`, border: overdue ? '1px dashed #EF4444' : '1px solid var(--border-color)', borderLeftWidth: overdue ? '4px' : undefined, display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {renderTaskIcon(t.taskType, 12)} {t.title}
                            </div>
                          </span>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {t.time && <span style={{ fontSize: '0.68rem', color: '#A78BFA', fontWeight: 600 }}>⏰ {t.time}</span>}
                              <span style={{ fontSize: '0.7rem', color: overdue ? '#EF4444' : 'var(--text-muted)' }}>
                                {overdue ? 'Atrasado' : (t.assignees && t.assignees.length > 0 ? t.assignees.length === 1 ? t.assignees[0] : `${t.assignees.length} resp.` : 'Sem resp.')}
                              </span>
                            </div>
                            {t.assignees && t.assignees.length > 0 && (
                              <div className="flex -space-x-1 overflow-hidden">
                                {t.assignees.slice(0, 3).map((a, i) => (
                                  <div key={i} className="inline-flex items-center justify-center rounded-full bg-blue-500 text-white text-[8px] font-bold" style={{ width: '16px', height: '16px', zIndex: 3 - i, border: '1px solid var(--bg-card)' }} title={a}>
                                    {a.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, formatShortDate(currentDate))}
            onClick={(e) => { if (e.target === e.currentTarget) onDayClick(formatShortDate(currentDate)); }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto', backgroundColor: 'rgba(15, 23, 42, 0.1)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', pointerEvents: 'none' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tarefas do Dia</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px' }}>
                {getTasksForDate(currentDate).length} no total
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'auto' }}>
              {getTasksForDate(currentDate).map((t) => {
                const overdue = isOverdue(t);
                return (
                  <div key={t.id} draggable onDragStart={(e) => handleDragStart(e, t.id)}
                    onClick={(e) => handleTaskChipClick(e, t)}
                    style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: overdue ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-panel, #0F172A)', borderLeft: `4px solid ${getPriorityColor(t.priority)}`, border: overdue ? '1px dashed #EF4444' : '1px solid var(--border-color)', borderLeftWidth: overdue ? '4px' : undefined, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {renderTaskIcon(t.taskType, 12)} {t.title}
                        </div>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {t.time && <span style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600 }}>⏰ {t.time}</span>}
                        {t.taskType && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{TASK_TYPE_LABELS[t.taskType]}</span>}
                        {t.description && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t.description.substring(0, 60)}{t.description.length > 60 ? '...' : ''}</span>}
                      </div>
                      {t.locationLink && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#818CF8' }}>
                          <MapPin size={10} /> {t.locationLink.startsWith('http') ? 'Link de reunião' : t.locationLink}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {overdue && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.72rem', fontWeight: 700 }}>
                          <AlertTriangle size={12} /> Atrasado
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.assignees && t.assignees.length > 0 ? t.assignees.join(', ') : 'Sem responsável'}</span>
                        {t.assignees && t.assignees.length > 0 && (
                          <div className="flex -space-x-1 overflow-hidden">
                            {t.assignees.slice(0, 3).map((a, i) => (
                              <div key={i} className="inline-flex items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-bold" style={{ width: '20px', height: '20px', zIndex: 3 - i, border: '1px solid var(--bg-card)' }} title={a}>
                                {a.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {getTasksForDate(currentDate).length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #475569)', fontSize: '0.85rem', border: '2px dashed rgba(51, 65, 85, 0.2)', borderRadius: '10px', marginTop: '10px' }}>
                  Nenhuma tarefa programada para este dia. Clique para criar uma!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Popup */}
      {popupTask && (
        <EventPopup
          task={popupTask.task}
          projectName={getProjectName(popupTask.task)}
          anchorRect={popupTask.rect}
          onClose={() => setPopupTask(null)}
          onOpenDetail={() => {
            setPopupTask(null);
            onTaskClick(popupTask.task.id);
          }}
        />
      )}
    </div>
  );
};
