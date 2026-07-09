import { create } from 'zustand';

export type DateRangeLabel = 'Este Mês' | 'Mês Passado' | 'Últimos 30 Dias' | 'Este Ano' | 'Últimos 12 Meses' | 'Todo o Período';

interface FilterState {
  dateRangeLabel: DateRangeLabel;
  startDate: string | null;
  endDate: string | null;
  
  setDateRange: (label: DateRangeLabel) => void;
  // future global filters can be added here
}

const calculateDateRange = (label: DateRangeLabel) => {
  const today = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  switch (label) {
    case 'Este Mês':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'Mês Passado':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'Últimos 30 Dias':
      start = new Date(today);
      start.setDate(today.getDate() - 30);
      end = new Date(today);
      break;
    case 'Este Ano':
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
      break;
    case 'Últimos 12 Meses':
      start = new Date(today);
      start.setMonth(today.getMonth() - 12);
      end = new Date(today);
      break;
    case 'Todo o Período':
      start = null;
      end = null;
      break;
  }

  return {
    start: start ? start.toISOString().split('T')[0] : null,
    end: end ? end.toISOString().split('T')[0] : null,
  };
};

export const useFilterStore = create<FilterState>((set) => ({
  dateRangeLabel: 'Todo o Período', // Default para não ocultar dados retroativos na tela inicial
  startDate: null,
  endDate: null,

  setDateRange: (label: DateRangeLabel) => {
    const { start, end } = calculateDateRange(label);
    set({ dateRangeLabel: label, startDate: start, endDate: end });
  }
}));

export const isDateInRange = (dateStr: string, start: string | null, end: string | null) => {
  if (!start || !end) return true;
  
  // Try parsing dd/mm/yyyy first
  let dateObj: Date;
  if (dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/');
    dateObj = new Date(`${y}-${m}-${d}T00:00:00`);
  } else {
    dateObj = new Date(dateStr);
  }

  const dateIso = dateObj.toISOString().split('T')[0];
  return dateIso >= start && dateIso <= end;
};
