import React, { useState } from 'react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { getCalendarWeeks, getMonthName, getMockToday, formatDateString } from '../../utils/dateUtils';
import { DayCell } from './DayCell';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react';
import type { WeeklySummary } from './WeekModal';

interface CalendarProps {
  onDaySelect: (dateStr: string) => void;
  onWeekSelect: (weekNum: number, summary: WeeklySummary) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onDaySelect, onWeekSelect }) => {
  const mockToday = getMockToday();
  const [currentYear, setCurrentYear] = useState<number>(mockToday.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(mockToday.getMonth());
  
  const daysData = useGrowthStore((state) => state.daysData);
  
  const weeks = getCalendarWeeks(currentYear, currentMonth);
  
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const handleGoToday = () => {
    const today = getMockToday();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Weekly calculations
  const calculateWeeklySummary = (week: Date[]) => {
    let weekTotalTasks = 0;
    let weekCompletedTasks = 0;
    let weekStudyHours = 0;
    let weekTopicsCount = 0;
    let missedDays = 0;

    week.forEach((date) => {
      const dateStr = formatDateString(date);
      const day = daysData[dateStr];
      if (day) {
        const completed = day.tasks.filter((t) => t.completed).length;
        const total = day.tasks.length;
        weekTotalTasks += total;
        weekCompletedTasks += completed;
        
        // Sum completed hours
        day.tasks.forEach((t) => {
          if (t.completed) weekStudyHours += t.estimatedTime;
        });

        // Missed day counts (past days, has tasks, completion rate < 70%)
        const todayStr = formatDateString(getMockToday());
        const dayStr = formatDateString(date);
        const isPast = dayStr < todayStr;
        if (isPast && total > 0 && (completed / total) < 0.7) {
          missedDays++;
        }

        weekTopicsCount += day.topics.length;
      }
    });

    const completionRate = weekTotalTasks > 0 ? Math.round((weekCompletedTasks / weekTotalTasks) * 100) : 0;
    const isSuccessful = weekTotalTasks > 0 ? completionRate >= 80 : false;
    const hasTasks = weekTotalTasks > 0;

    return {
      completionRate,
      weekCompletedTasks,
      weekTotalTasks,
      weekStudyHours,
      weekTopicsCount,
      missedDays,
      isSuccessful,
      hasTasks
    };
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-6 w-full">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>{getMonthName(currentMonth)}</span>
            <span className="text-slate-500 font-mono font-medium">{currentYear}</span>
          </h2>
          <p className="text-xs text-muted font-sans mt-0.5">Click any day to schedule, or click Week Stats for progress details.</p>
        </div>
        
        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="btn btn-secondary p-2.5 rounded-xl flex-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={handleGoToday}
            className="btn btn-secondary px-4 py-2 text-sm font-mono tracking-wide"
          >
            TODAY
          </button>
          <button 
            onClick={handleNextMonth}
            className="btn btn-secondary p-2.5 rounded-xl flex-center"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid of Days (8 Columns total: 7 days of week + 1 weekly sync stats column) */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px] grid grid-cols-8 gap-3 calendar-grid">
          {/* Weekday headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-bold text-muted font-mono uppercase tracking-wider py-1">
              {d}
            </div>
          ))}
          <div className="text-center text-xs font-bold text-blue-400 font-mono uppercase tracking-wider py-1 border-l border-slate-800 pl-2">
            Week Stats
          </div>

          {/* Render Month Weeks */}
          {weeks.map((week, wIdx) => {
            const summary = calculateWeeklySummary(week);
            
            return (
              <React.Fragment key={`week-${wIdx}`}>
                {/* 7 Days of the Week */}
                {week.map((date, dIdx) => (
                  <DayCell
                    key={`day-${wIdx}-${dIdx}`}
                    date={date}
                    currentMonth={currentMonth}
                    onClick={() => onDaySelect(formatDateString(date))}
                  />
                ))}

                {/* 8th Column - Clickable, Sleek Weekly Sync Card with zero text overlaps */}
                <div 
                  onClick={() => summary.hasTasks && onWeekSelect(wIdx + 1, summary)}
                  className={`glass-card p-2 flex flex-col justify-between border-l border-slate-800 pl-3 bg-slate-950/40 relative overflow-hidden select-none ${
                    summary.hasTasks 
                      ? 'cursor-pointer hover:scale-102 hover:bg-slate-900/40 active:scale-98 transition-all'
                      : 'opacity-20'
                  } ${
                    summary.hasTasks 
                      ? summary.isSuccessful 
                        ? 'border-emerald-500/20 shadow-[inset_0_0_10px_rgba(16,185,129,0.02)]' 
                        : 'border-amber-500/10'
                      : 'border-slate-800'
                  }`}
                  style={{ aspectRatio: '1 / 1' }}
                  title={summary.hasTasks ? "Click for detailed weekly sync stats" : ""}
                >
                  {summary.hasTasks ? (
                    <>
                      {/* Weekly Label */}
                      <span className="text-[9px] text-muted font-mono leading-none">Week {wIdx + 1}</span>

                      {/* Large Minimal Percentage centered */}
                      <div className="flex flex-col items-center justify-center my-0.5">
                        <span 
                          className={`text-lg font-extrabold font-mono tracking-tight ${
                            summary.isSuccessful 
                              ? 'text-emerald-400' 
                              : 'text-amber-400'
                          }`}
                        >
                          {summary.completionRate}%
                        </span>
                      </div>

                      {/* Status Stamp - Minimal Indicator Icon */}
                      <div className="flex-center mt-auto">
                        {summary.isSuccessful ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 stroke-[2.5]" />
                        )}
                      </div>
                    </>
                  ) : (
                    /* Idle Week */
                    <div className="flex-1 flex items-center justify-center text-center opacity-15">
                      <span className="text-[8px] font-mono uppercase text-slate-500">Idle</span>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
