const getRealTodayStr = (): string => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const MOCK_TODAY_STR = getRealTodayStr();

export const getMockToday = (): Date => {
  const [year, month, day] = MOCK_TODAY_STR.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 */
export const formatDateString = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Check if a date string is "Today" (2026-05-31)
 */
export const isToday = (dateStr: string): boolean => {
  return dateStr === MOCK_TODAY_STR;
};

/**
 * Check if a date string is in the past relative to Today
 */
export const isPastDay = (dateStr: string): boolean => {
  return dateStr < MOCK_TODAY_STR;
};

/**
 * Check if a date string is in the future relative to Today
 */
export const isFutureDay = (dateStr: string): boolean => {
  return dateStr > MOCK_TODAY_STR;
};

/**
 * Get name of month
 */
export const getMonthName = (monthIndex: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

/**
 * Generates weeks for a given year and month (0-indexed).
 * Each week is an array of 7 Date objects.
 * It includes padded days from previous/next months to fill the calendar grid.
 */
export const getCalendarWeeks = (year: number, month: number): Date[][] => {
  const weeks: Date[][] = [];
  
  // First day of the month
  const firstDayOfMonth = new Date(year, month, 1);
  // Last day of the month
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Day of the week for the first day (0 = Sunday, 6 = Saturday)
  const startDayOfWeek = firstDayOfMonth.getDay();
  
  // We start filling the grid from the previous month if necessary
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDayOfWeek);
  
  const currentDate = new Date(startDate);
  
  // Generates 6 weeks (42 days) to cover all calendar possibilities consistently
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Stop generating if we've completed the month and filled the current week
    // But generate at least 5 weeks or 6 weeks to keep layout jump-free.
    weeks.push(week);
    
    // If the next week starts in the next month, and we've already rendered the last day of this month
    if (currentDate.getMonth() !== month && currentDate > lastDayOfMonth && weeks.length >= 5) {
      break;
    }
  }
  
  return weeks;
};
