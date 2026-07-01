import React, { useState } from 'react';
import type { Task } from '../../../entities/tarefa/model/types';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock } from 'lucide-react';

interface TaskCalendarProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newDateStr: string) => void;
  onTaskClick: (taskId: string) => void;
  onDayClick: (dateStr: string) => void;
}

const getPriorityColor = (priority: 'baixa' | 'media' | 'alta') => {
  switch (priority) {
    case 'alta': return '#EF4444';
    case 'media': return '#F59E0B';
    case 'baixa': return '#10B981';
    default: return '#9CA3AF';
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
      // DD/MM/YYYY
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      // YYYY-MM-DD
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
  } catch {
    return null;
  }
};

export const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  onTaskMove,
  onTaskClick,
  onDayClick,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Overdue check
  const isOverdue = (task: Task) => {
    if (task.status === 'concluida') return false;
    const deadlineDate = parseTaskDeadline(task.deadline);
    if (!deadlineDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    return deadlineDate < today;
  };

  // Navigations
  const handlePrev = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') {
      nextDate.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(currentDate.getDate() - 7);
    } else {
      nextDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = new Date(currentDate);
    if (viewMode === 'month') {
      nextDate.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      nextDate.setDate(currentDate.getDate() + 7);
    } else {
      nextDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(nextDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Date generators
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Align to Monday
    
    // Total days in month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    const days: Date[] = [];
    
    // Previous month padding
    for (let i = startOffset; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Next month padding (make grid multiple of 7)
    const endOffset = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= endOffset; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    // Fill up to 6 rows if needed for visual consistency
    while (days.length < 42) {
      const lastAdded = days[days.length - 1];
      days.push(new Date(lastAdded.getFullYear(), lastAdded.getMonth(), lastAdded.getDate() + 1));
    }

    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const currentDayOfWeek = (date.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - currentDayOfWeek);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    }
    return days;
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onTaskMove(taskId, dateStr);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Month label mapper
  const getMonthName = (monthIdx: number) => {
    const names = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return names[monthIdx];
  };

  const getWeekdayShortName = (dayIdx: number) => {
    const names = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return names[dayIdx];
  };

  // Match tasks for a specific date
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
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 240px)',
      minHeight: '550px',
      backgroundColor: 'var(--bg-card, #1E293B)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #334155)',
      overflow: 'hidden',
      color: '#fff'
    }}>
      {/* Calendar Header Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color, #334155)',
        backgroundColor: 'rgba(15, 23, 42, 0.4)'
      }}>
        {/* Left: Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-panel, #0F172A)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <button onClick={handlePrev} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={handleToday} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
              Hoje
            </button>
            <button onClick={handleNext} style={{ background: 'none', border: 'none', color: '#fff', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={16} />
            </button>
          </div>
          
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, minWidth: '180px' }}>
            {viewMode === 'month' && `${getMonthName(currentDate.getMonth())} de ${currentDate.getFullYear()}`}
            {viewMode === 'week' && `Semana de ${currentDate.getDate()} ${getMonthName(currentDate.getMonth())}`}
            {viewMode === 'day' && `${currentDate.getDate()} de ${getMonthName(currentDate.getMonth())} de ${currentDate.getFullYear()}`}
          </h2>
        </div>

        {/* Right: View Mode switcher */}
        <div style={{ display: 'flex', backgroundColor: 'var(--bg-panel, #0F172A)', padding: '4px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          {([
            { id: 'month', label: 'Mês' },
            { id: 'week', label: 'Semana' },
            { id: 'day', label: 'Dia' }
          ] as const).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              style={{
                border: 'none',
                backgroundColor: viewMode === mode.id ? 'var(--color-primary, #3B82F6)' : 'transparent',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                transition: 'all 0.15s ease'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Month View */}
        {viewMode === 'month' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Weekdays Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(15, 23, 42, 0.2)' }}>
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} style={{ padding: '10px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {getWeekdayShortName(i)}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', flex: 1, overflowY: 'auto' }}>
              {getDaysInMonth(currentDate).map((day, idx) => {
                const dayTasks = getTasksForDate(day);
                const dayStr = formatShortDate(day);
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={idx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dayStr)}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        onDayClick(dayStr);
                      }
                    }}
                    style={{
                      borderRight: '1px solid rgba(51, 65, 85, 0.4)',
                      borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      minHeight: '80px',
                      backgroundColor: isCurrentMonth ? 'transparent' : 'rgba(15, 23, 42, 0.2)',
                      opacity: isCurrentMonth ? 1 : 0.45,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {/* Day Number */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isToday(day) ? 'var(--color-primary, #3B82F6)' : 'transparent',
                        color: isToday(day) ? '#fff' : 'var(--text-secondary)'
                      }}>
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Day Tasks List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, pointerEvents: 'auto' }}>
                      {dayTasks.map((t) => {
                        const overdue = isOverdue(t);
                        return (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, t.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick(t.id);
                            }}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              backgroundColor: overdue ? 'rgba(239, 68, 68, 0.08)' : 'rgba(51, 65, 85, 0.3)',
                              borderLeft: `3px solid ${getPriorityColor(t.priority)}`,
                              border: overdue ? '1px dashed #EF4444' : undefined,
                              borderLeftWidth: overdue ? '3px' : undefined,
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '4px',
                              cursor: 'grab'
                            }}
                            title={`${t.title} (Resp: ${t.assignee || 'Sem'})`}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {t.title}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                              {overdue && <Clock size={10} style={{ color: '#EF4444' }} />}
                              {t.assignee && (
                                <div style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--color-primary)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.55rem',
                                  fontWeight: 700
                                }}>
                                  {t.assignee.charAt(0).toUpperCase()}
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
                <div
                  key={idx}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dayStr)}
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      onDayClick(dayStr);
                    }
                  }}
                  style={{
                    flex: 1,
                    borderRight: '1px solid rgba(51, 65, 85, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '120px',
                    backgroundColor: isToday(day) ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  {/* Column Header */}
                  <div style={{
                    padding: '12px',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: isToday(day) ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: 'none'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {getWeekdayShortName(idx)}
                    </span>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday(day) ? 'var(--color-primary, #3B82F6)' : 'transparent',
                      color: '#fff'
                    }}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Tasks Container */}
                  <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', pointerEvents: 'auto' }}>
                    {dayTasks.map((t) => {
                      const overdue = isOverdue(t);
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(t.id);
                          }}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: overdue ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-panel, #0F172A)',
                            borderLeft: `4px solid ${getPriorityColor(t.priority)}`,
                            border: overdue ? '1px dashed #EF4444' : '1px solid var(--border-color)',
                            borderLeftWidth: overdue ? '4px' : undefined,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            cursor: 'grab'
                          }}
                        >
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', lineHeight: '1.3' }}>
                            {t.title}
                          </span>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: overdue ? '#EF4444' : 'var(--text-muted)' }}>
                              {overdue ? 'Atrasado' : t.assignee || 'Sem resp.'}
                            </span>
                            
                            {t.assignee && (
                              <div style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-primary)',
                                color: '#fff',
                                display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.6rem',
                                  fontWeight: 700
                              }}>
                                {t.assignee.charAt(0).toUpperCase()}
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
          <div
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, formatShortDate(currentDate))}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onDayClick(formatShortDate(currentDate));
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: 'rgba(15, 23, 42, 0.1)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', pointerEvents: 'none' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Tarefas do Dia
              </h3>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255,255,255,0.06)',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                {getTasksForDate(currentDate).length} no total
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'auto' }}>
              {getTasksForDate(currentDate).map((t) => {
                const overdue = isOverdue(t);
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    onClick={() => onTaskClick(t.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: overdue ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-panel, #0F172A)',
                      borderLeft: `4px solid ${getPriorityColor(t.priority)}`,
                      border: overdue ? '1px dashed #EF4444' : '1px solid var(--border-color)',
                      borderLeftWidth: overdue ? '4px' : undefined,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'grab'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        {t.title}
                      </span>
                      {t.description && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {t.description}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {overdue && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#EF4444',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          <AlertTriangle size={12} /> Atrasado
                        </span>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {t.assignee || 'Sem responsável'}
                        </span>
                        
                        {t.assignee && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700
                          }}>
                            {t.assignee.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {getTasksForDate(currentDate).length === 0 && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-muted, #475569)',
                  fontSize: '0.85rem',
                  border: '2px dashed rgba(51, 65, 85, 0.2)',
                  borderRadius: '10px',
                  marginTop: '10px'
                }}>
                  Nenhuma tarefa programada para este dia. Clique para criar uma!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
