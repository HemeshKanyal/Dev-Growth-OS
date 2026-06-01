import React, { useRef, useEffect } from 'react';
import { X, Trophy, Clock, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

export interface WeeklySummary {
  completionRate: number;
  weekCompletedTasks: number;
  weekTotalTasks: number;
  weekStudyHours: number;
  weekTopicsCount: number;
  missedDays: number;
  isSuccessful: boolean;
  hasTasks: boolean;
}


interface WeekModalProps {
  weekNum: number;
  summary: WeeklySummary;
  onClose: () => void;
}

export const WeekModal: React.FC<WeekModalProps> = ({ weekNum, summary, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open native modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [weekNum]);

  // Click outside and Esc handling
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      dialog.close();
    };

    const handleClose = () => {
      onClose();
    };

    // Click outside backdrop triggers close
    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const isInside = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInside) {
          dialog.close();
        }
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  const handleCloseClick = () => {
    dialogRef.current?.close();
  };

  // SVG Ring calculation details (Radius = 35, Circumference = 2 * PI * 35 = 219.91)
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (summary.completionRate / 100) * circumference;

  const getProgressColor = (percent: number) => {
    if (percent <= 30) return 'var(--color-red)';
    if (percent <= 60) return 'var(--color-orange)';
    if (percent <= 85) return 'var(--accent-blue)';
    return 'var(--color-green)';
  };

  const strokeColor = getProgressColor(summary.completionRate);

  return (
    <dialog 
      ref={dialogRef} 
      className="glass-panel text-left p-0 border border-slate-800/80 overflow-hidden flex flex-col max-w-md w-full"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/60">
        <div>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-semibold">Weekly Sync Review</span>
          <h3 className="text-lg font-bold text-slate-100 font-sans mt-0.5">Week {weekNum} Summary</h3>
        </div>
        <button 
          onClick={handleCloseClick}
          className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex-center hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6 flex flex-col gap-6 items-center">
        
        {/* Large Progress Ring */}
        <div className="relative flex items-center justify-center h-24 w-24">
          <svg className="h-24 w-24">
            <circle
              className="progress-ring-circle"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="5"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
              transform="rotate(-90 48 48)"
            />
            <circle
              className="progress-ring-circle"
              stroke={strokeColor}
              strokeWidth="5"
              strokeDasharray={`${circumference} ${circumference}`}
              style={{ strokeDashoffset }}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx="48"
              cy="48"
              transform="rotate(-90 48 48)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold font-mono text-slate-100">{summary.completionRate}%</span>
            <span className="text-[8px] font-mono text-muted uppercase tracking-wider">Complete</span>
          </div>
        </div>

        {/* Verdict Badge */}
        {summary.isSuccessful ? (
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center gap-3 text-emerald-400">
            <CheckCircle className="h-5 w-5 flex-shrink-0 stroke-[2.5]" />
            <div className="text-xs">
              <h4 className="font-bold font-sans">Week completed successfully! ✅</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Outstanding! You maintained a consistent top-developer success rate.</p>
            </div>
          </div>
        ) : (
          <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center gap-3 text-amber-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 stroke-[2.5]" />
            <div className="text-xs">
              <h4 className="font-bold font-sans">Needs improvement ⚠️</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Every commit is a step. Let's aim to cross the 80% target next week!</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3.5">
          {/* Tasks Done */}
          <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-900 rounded-lg flex-center text-blue-400">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] text-muted font-bold font-mono uppercase tracking-wider block">Tasks Done</span>
              <span className="text-sm font-bold font-mono text-slate-200 mt-0.5">{summary.weekCompletedTasks} / {summary.weekTotalTasks}</span>
            </div>
          </div>

          {/* Study Hours */}
          <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-900 rounded-lg flex-center text-purple-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] text-muted font-bold font-mono uppercase tracking-wider block">Study Hours</span>
              <span className="text-sm font-bold font-mono text-slate-200 mt-0.5">{summary.weekStudyHours.toFixed(1)}h</span>
            </div>
          </div>

          {/* Topics Finished */}
          <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-900 rounded-lg flex-center text-teal-400">
              <BookOpen className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] text-muted font-bold font-mono uppercase tracking-wider block">Topics Covered</span>
              <span className="text-sm font-bold font-mono text-slate-200 mt-0.5">{summary.weekTopicsCount} Topics</span>
            </div>
          </div>

          {/* Missed Days */}
          <div className="bg-slate-950/40 border border-slate-900 p-3 rounded-xl flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-900 rounded-lg flex-center text-red-400">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] text-muted font-bold font-mono uppercase tracking-wider block">Missed Days</span>
              <span className="text-sm font-bold font-mono text-slate-200 mt-0.5">{summary.missedDays} Days</span>
            </div>
          </div>
        </div>

      </div>
    </dialog>
  );
};
