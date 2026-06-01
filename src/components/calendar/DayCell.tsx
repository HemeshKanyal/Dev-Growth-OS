import React from 'react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { formatDateString, isToday, isPastDay } from '../../utils/dateUtils';
import { Check } from 'lucide-react';

interface DayCellProps {
  date: Date;
  currentMonth: number;
  onClick: () => void;
}

export const DayCell: React.FC<DayCellProps> = ({ date, currentMonth, onClick }) => {
  const dateStr = formatDateString(date);
  const dayData = useGrowthStore((state) => state.daysData[dateStr]);
  
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isTodayDay = isToday(dateStr);
  const isPast = isPastDay(dateStr);
  
  // Calculate completion percentage
  const tasks = dayData?.tasks || [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Status evaluations
  const isPerfect = totalTasks > 0 && completionPercentage === 100;
  const isPartialSuccess = totalTasks > 0 && completionPercentage >= 70 && completionPercentage < 100;
  const isMissed = isPast && totalTasks > 0 && completionPercentage < 70;
  
  // Determine color matching for progress ring
  const getProgressColor = (percent: number) => {
    if (percent <= 30) return 'var(--color-red)';
    if (percent <= 60) return 'var(--color-orange)';
    if (percent <= 85) return 'var(--accent-blue)';
    return 'var(--color-green)';
  };
  
  const strokeColor = getProgressColor(completionPercentage);
  
  // Compact SVG Ring calculation details (Radius = 10, Circumference = 2 * PI * 10 = 62.83)
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className={`calendar-day-card relative flex flex-col p-2 select-none cursor-pointer transition-all duration-300 ${
        !isCurrentMonth ? 'opacity-20' : ''
      } ${
        isTodayDay 
          ? 'border-blue-500 bg-slate-900/60 no-hover' 
          : 'border-slate-800/80 bg-slate-950/20 hover:border-slate-700/80'
      } ${
        isPerfect ? 'shadow-[0_0_12px_rgba(16,185,129,0.06)] border-emerald-500/20' : ''
      } ${
        isPartialSuccess ? 'shadow-[0_0_12px_rgba(59,130,246,0.04)] border-blue-500/15' : ''
      } ${
        isMissed ? 'border-red-950/20 bg-red-950/5' : ''
      }`}
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* Date & Progress Header (Extremely compact side-by-side) */}
      <div className="flex items-center justify-between mb-1">
        <span 
          className={`text-xs font-semibold font-mono leading-none ${
            isTodayDay 
              ? 'text-blue-400 font-bold bg-blue-500/10 px-1 py-0.5 rounded' 
              : 'text-slate-400'
          }`}
        >
          {date.getDate()}
        </span>
        
        {/* Compact Progress Indicator */}
        {totalTasks > 0 && (
          <div className="relative flex items-center justify-center h-6 w-6">
            {isPerfect ? (
              <div className="h-5.5 w-5.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex-center text-emerald-400">
                <Check className="h-3 w-3 stroke-[3.5]" />
              </div>
            ) : (
              <>
                <svg className="h-6 w-6">
                  <circle
                    className="progress-ring-circle"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="2"
                    fill="transparent"
                    r={radius}
                    cx="12"
                    cy="12"
                    transform="rotate(-90 12 12)"
                  />
                  <circle
                    className="progress-ring-circle"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="12"
                    cy="12"
                    transform="rotate(-90 12 12)"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold font-mono text-slate-300">
                  {completionPercentage}%
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Task Count at the bottom */}
      <div className="mt-auto flex items-center">
        {totalTasks > 0 ? (
          <div className="text-[9px] text-muted font-mono leading-none">
            {completedTasks}/{totalTasks} done
          </div>
        ) : (
          <div className="text-[8px] text-slate-700 italic font-sans leading-none flex-1">
            {isTodayDay ? 'Rest' : ''}
          </div>
        )}
      </div>

      {/* Missed Day Translucent Red X overlay without text boxes */}
      {isMissed && (
        <div className="absolute inset-0 rounded-[inherit] bg-red-950/10 flex-center pointer-events-none">
          <div className="relative w-full h-full opacity-[0.16] flex-center">
            <div className="absolute w-[80%] h-[1.5px] bg-red-500 rotate-45 rounded-full" />
            <div className="absolute w-[80%] h-[1.5px] bg-red-500 -rotate-45 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
};
