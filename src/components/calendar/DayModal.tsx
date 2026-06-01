import React, { useRef, useEffect, useState } from 'react';
import { useGrowthStore } from '../../store/useGrowthStore';
import type { Task } from '../../store/useGrowthStore';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Clock, FileText, CheckCircle2, Check, Flag, Signal, AlertTriangle, Sparkles, CalendarCheck2 } from 'lucide-react';

interface DayModalProps {
  dateStr: string;
  onClose: () => void;
}


const MAX_DESCRIPTION_LENGTH = 500;

const PRIORITY_CONFIG = {
  low: {
    icon: Flag,
    label: 'Low',
    activeClass: 'dm-priority-low-active',
  },
  medium: {
    icon: Signal,
    label: 'Medium',
    activeClass: 'dm-priority-medium-active',
  },
  high: {
    icon: AlertTriangle,
    label: 'High',
    activeClass: 'dm-priority-high-active',
  },
} as const;

export const DayModal: React.FC<DayModalProps> = ({ dateStr, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const { 
    daysData, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTask, 
    reorderTasks, 
    updateNotes
  } = useGrowthStore();

  const dayData = daysData[dateStr] || { tasks: [], notes: '' };
  const { tasks, notes } = dayData;
  // Local state for forms
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskHours, setTaskHours] = useState('1');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  

  
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 20);
  };
  
  // Format readable title
  const formatHeaderDate = (ds: string) => {
    const [y, m, d] = ds.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Open native modal on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [dateStr]);

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

  // Task Handlers
  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(dateStr, {
      title: taskTitle.trim(),
      category: 'General',
      estimatedTime: parseFloat(taskHours) || 1,
      priority: taskPriority,
      description: taskDescription.trim()
    });
    setTaskTitle('');
    setTaskDescription('');
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  const handleSaveEdit = (taskId: string) => {
    if (!editTitle.trim()) return;
    updateTask(dateStr, taskId, { title: editTitle.trim() });
    setEditingTaskId(null);
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...tasks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newTasks.length) return;
    
    // Swap elements
    const temp = newTasks[index];
    newTasks[index] = newTasks[targetIdx];
    newTasks[targetIdx] = temp;
    
    reorderTasks(dateStr, newTasks);
  };





  // Progress metrics for today
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const sidebarTabs = [
    { key: 'tasks' as const, icon: CheckCircle2, label: 'Tasks', count: tasks.length },
    { key: 'notes' as const, icon: FileText, label: 'Daily Log', count: null },
  ];

  const handleSaveNotes = () => {
    setIsSavingNotes(true);
    setTimeout(() => {
      setIsSavingNotes(false);
    }, 1500);
  };

  return (
    <dialog 
      ref={dialogRef} 
      className="glass-panel text-left p-0 border border-slate-800/80 overflow-hidden flex flex-col md:max-w-4xl max-h-[85vh] h-full"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/60 sticky top-0 z-10">
        <div>
          <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase font-semibold">Growth Scheduler</span>
          <h3 className="text-lg font-bold text-slate-100 font-sans mt-0.5">{formatHeaderDate(dateStr)}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-xl">
              <span className="text-xs font-mono font-bold text-slate-300">{percent}% Done</span>
              <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    percent === 100 
                      ? 'bg-emerald-500' 
                      : percent >= 70 
                        ? 'bg-blue-500' 
                        : percent > 30 
                          ? 'bg-orange-500' 
                          : 'bg-red-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}
          <button 
            onClick={handleCloseClick}
            className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex-center hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal Body with 2 Columns */}
      <div className="flex-1 overflow-y-auto flex flex-col md:flex-row h-full">
        {/* Navigation Sidebar (Premium Rail) */}
        <div 
          className={`md:w-52 bg-slate-950/40 border-b md:border-b-0 md:border-r border-slate-900 flex md:flex-col gap-1 p-2.5 sticky top-0 z-10 backdrop-blur-md transition-all duration-300 ${
            isScrolled ? 'opacity-0 pointer-events-none -translate-x-4' : 'opacity-100 translate-x-0'
          }`}
        >
          {sidebarTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`dm-nav-btn ${isActive ? 'dm-nav-btn-active' : ''}`}
              >
                {/* Active indicator bar */}
                {isActive && <span className="dm-nav-indicator" />}
                <Icon className="h-3.5 w-3.5" style={{ flexShrink: 0 }} />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.count !== null && (
                  <span className={`dm-nav-badge ${isActive ? 'dm-nav-badge-active' : ''}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div 
          onScroll={handleScroll}
          className="flex-1 p-6 overflow-y-auto min-h-0"
        >
          
          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-6 h-full dm-tab-enter">
              {/* Form to Add Task — Premium Card */}
              <form onSubmit={handleAddTaskSubmit} className="dm-form-card">
                {/* Top row: Title + Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                  <div className="sm:col-span-8 flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted font-bold font-mono uppercase tracking-wider">Task Title</label>
                    <input
                      type="text"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Solve 3 LeetCode problems..."
                      className="dm-input-title"
                    />
                  </div>

                  <div className="sm:col-span-4 flex flex-col gap-1.5">
                    <label className="text-[10px] text-muted font-bold font-mono uppercase tracking-wider">Est. Hours</label>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={taskHours}
                      onChange={(e) => setTaskHours(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500/60"
                    />
                  </div>
                </div>

                {/* Priority — directly below title for better flow */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-[10px] text-muted font-bold font-mono uppercase tracking-wider">Priority</span>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((p) => {
                      const config = PRIORITY_CONFIG[p];
                      const PIcon = config.icon;
                      const isSelected = taskPriority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTaskPriority(p)}
                          className={`dm-priority-pill ${isSelected ? config.activeClass : 'dm-priority-pill-inactive'}`}
                        >
                          <PIcon className="h-3 w-3" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description — enhanced textarea */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <label className="text-[10px] text-muted font-bold font-mono uppercase tracking-wider">
                    Description <span className="text-[8px] text-slate-550 font-normal italic">(Optional)</span>
                  </label>
                  <div className={`dm-desc-wrapper ${descFocused ? 'dm-desc-wrapper-focus' : ''}`}>
                    <textarea
                      value={taskDescription}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                          setTaskDescription(e.target.value);
                        }
                      }}
                      onFocus={() => setDescFocused(true)}
                      onBlur={() => setDescFocused(false)}
                      placeholder="Write details, bullet points, or sub-tasks here..."
                      rows={3}
                      className="dm-desc-textarea"
                    />
                    <div className="dm-desc-footer">
                      <span className="dm-desc-hint">
                        <Sparkles className="h-2.5 w-2.5" /> Markdown-style notes
                      </span>
                      <span className={`dm-desc-counter ${taskDescription.length > MAX_DESCRIPTION_LENGTH * 0.9 ? 'dm-desc-counter-warn' : ''}`}>
                        {taskDescription.length}/{MAX_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Add Task Button */}
                <div className="flex justify-end mt-1">
                  <button 
                    type="submit" 
                    className="btn btn-primary justify-center text-xs py-2.5 px-5"
                  >
                    <Plus className="h-4 w-4" /> Add Task
                  </button>
                </div>
              </form>

              {/* Tasks List */}
              <div className="flex-1 flex flex-col gap-2 min-h-0">
                <span className="text-xs font-bold text-muted font-mono uppercase tracking-wider">Scheduled Tasks ({tasks.length})</span>
                {tasks.length === 0 ? (
                  <div className="dm-empty-state">
                    <div className="dm-empty-icon-wrapper">
                      <CalendarCheck2 className="h-7 w-7 text-slate-600" />
                    </div>
                    <span className="text-sm text-slate-500 font-medium">No tasks scheduled yet</span>
                    <span className="text-[11px] text-slate-600">Add your first task above to get started!</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                    {tasks.map((task, index) => {
                      const isHigh = task.priority === 'high';
                      const isMed = task.priority === 'medium';
                      
                      return (
                        <div 
                          key={task.id}
                          className={`dm-task-item ${
                            task.completed 
                              ? 'dm-task-completed' 
                              : ''
                          }`}
                        >
                          {/* Complete Checkbox */}
                          <button
                            onClick={() => toggleTask(dateStr, task.id)}
                            className={`h-5 w-5 rounded-md border flex-center transition ${
                              task.completed 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold' 
                                : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                            }`}
                          >
                            {task.completed && <Check className="h-3.5 w-3.5 stroke-[3.5]" />}
                          </button>
                          
                          {/* Title / Inline Edit */}
                          <div className="flex-1 min-w-0">
                            {editingTaskId === task.id ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={() => handleSaveEdit(task.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(task.id)}
                                autoFocus
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm text-slate-200 w-full focus:outline-none focus:border-blue-500"
                              />
                            ) : (
                              <span 
                                onClick={() => handleStartEdit(task)}
                                className={`text-sm block truncate cursor-text hover:text-blue-400 transition font-medium ${
                                  task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                                }`}
                                title="Click to edit task title"
                              >
                                {task.title}
                              </span>
                            )}
                            {task.description && (
                              <p className={`text-[11px] mt-0.5 font-sans leading-relaxed text-slate-400 ${task.completed ? 'line-through text-slate-600' : ''}`}>
                                {task.description}
                              </p>
                            )}
                            
                            {/* Badges info */}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] text-slate-500 font-mono flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" /> {task.estimatedTime}h
                              </span>
                              <span className={`text-[8px] font-mono font-bold uppercase rounded px-1 ${
                                isHigh 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                  : isMed 
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                    : 'bg-slate-800 text-slate-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          {/* Reordering Controls */}
                          <div className="flex flex-col gap-0.5 opacity-40 hover:opacity-100 transition">
                            <button 
                              onClick={() => handleMoveTask(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:text-blue-400 disabled:opacity-20 transition"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => handleMoveTask(index, 'down')}
                              disabled={index === tasks.length - 1}
                              className="p-1 hover:text-blue-400 disabled:opacity-20 transition"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Delete Trigger */}
                          <button
                            onClick={() => deleteTask(dateStr, task.id)}
                            className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="flex flex-col gap-4 h-full dm-tab-enter">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted font-mono uppercase tracking-wider">Daily Log Notes/journal</label>
                <p className="text-[11px] text-muted">Jot down questions, code architectures, or milestones you hit today.</p>
              </div>
              <textarea
                value={notes}
                onChange={(e) => updateNotes(dateStr, e.target.value)}
                placeholder="Today was amazing. Fine-tuned standard transformers. Had a blocker on TCP sockets in Java, but solved it by reading sliding window flow rules..."
                className="w-full flex-1 min-h-[220px] bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-slate-200 text-sm leading-relaxed placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono resize-none"
              />
              <div className="flex justify-end mt-2">
                <button 
                  onClick={handleSaveNotes}
                  className={`btn flex items-center justify-center gap-2 text-xs py-2.5 px-6 transition-all duration-300 border-0 ${
                    isSavingNotes 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'btn-green font-bold'
                  }`}
                >
                  {isSavingNotes ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Log</span>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </dialog>
  );
};
