import React, { useRef, useEffect } from 'react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { formatDateString, getMockToday, getMonthName } from '../../utils/dateUtils';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip 
} from 'recharts';
import { Trophy, Clock, CheckSquare, Flame } from 'lucide-react';

export const StatsDashboard: React.FC = () => {
  const { daysData, currentStreak, longestStreak, badges } = useGrowthStore();
  const today = getMockToday();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  // Calculate Global Statistics
  let totalTasksScheduled = 0;
  let totalTasksCompleted = 0;
  let totalHoursScheduled = 0;
  let totalHoursCompleted = 0;

  const categoryMap: Record<string, { completed: number; total: number; hours: number }> = {};

  Object.values(daysData).forEach((day) => {
    
    day.tasks.forEach((task) => {
      totalTasksScheduled++;
      totalHoursScheduled += task.estimatedTime;
      
      // Initialize category mapping
      if (!categoryMap[task.category]) {
        categoryMap[task.category] = { completed: 0, total: 0, hours: 0 };
      }
      
      categoryMap[task.category].total++;
      
      if (task.completed) {
        totalTasksCompleted++;
        totalHoursCompleted += task.estimatedTime;
        categoryMap[task.category].completed++;
        categoryMap[task.category].hours += task.estimatedTime;
      }
    });
  });

  const avgCompletionRate = totalTasksScheduled > 0 
    ? Math.round((totalTasksCompleted / totalTasksScheduled) * 100) 
    : 0;

  // Generate Weekly Completion Chart Data (Past 7 Days from Mock Today)
  const getPast7DaysData = () => {
    const data = [];
    const today = getMockToday();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = formatDateString(d);
      const day = daysData[dateStr];
      
      const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      
      let rate = 0;
      if (day && day.tasks.length > 0) {
        const completed = day.tasks.filter((t) => t.completed).length;
        rate = Math.round((completed / day.tasks.length) * 100);
      }
      
      data.push({
        name: label,
        percentage: rate,
        tasks: day ? day.tasks.length : 0
      });
    }
    return data;
  };

  const weeklyChartData = getPast7DaysData();

  // Generate Category Distribution Data for Charting
  const categoryData = Object.entries(categoryMap).map(([name, stats]) => {
    const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    return {
      name,
      rate,
      hours: stats.hours,
      total: stats.total
    };
  }).sort((a, b) => b.rate - a.rate);

  // Generate GitHub-contribution Heatmap Grid for a rolling 52 weeks (364 days + padding to align to Sunday)
  const getYearlyHeatmap = () => {
    const cells = [];
    
    // We want to show exactly 53 weeks.
    // Let's find the starting date: 52 weeks ago.
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 52 weeks ago
    
    // Align to the nearest preceding Sunday
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    startDate.setDate(startDate.getDate() - startDayOfWeek);
    
    // Generate exactly 53 weeks * 7 days = 371 cells
    const totalCells = 53 * 7;
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < totalCells; i++) {
      const dateStr = formatDateString(currentDate);
      const day = daysData[dateStr];
      
      let rate = -1; // -1 means no tasks scheduled (quiet)
      let completedCount = 0;
      let totalCount = 0;
      if (day && day.tasks.length > 0) {
        completedCount = day.tasks.filter((t) => t.completed).length;
        totalCount = day.tasks.length;
        rate = Math.round((completedCount / totalCount) * 100);
      }
      
      cells.push({
        dateStr,
        dayNum: currentDate.getDate(),
        monthNum: currentDate.getMonth(),
        yearNum: currentDate.getFullYear(),
        rate,
        completedCount,
        totalCount
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return cells;
  };

  const heatmapCells = getYearlyHeatmap();

  // Get color for heatmap cell based on completion rate (GitHub emerald monochromatic style)
  const getHeatmapBg = (rate: number) => {
    if (rate === -1) return 'bg-github-0'; // idle (empty)
    if (rate === 0) return 'bg-github-scheduled'; // scheduled but 0%
    if (rate <= 30) return 'bg-github-1';
    if (rate <= 60) return 'bg-github-2';
    if (rate <= 85) return 'bg-github-3';
    return 'bg-github-4';
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 4 Core Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total completed */}
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex-center">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-semibold font-mono uppercase tracking-wider">Completed Tasks</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5">{totalTasksCompleted}</h3>
            <p className="text-[10px] text-muted font-sans mt-0.5">Average: {avgCompletionRate}% done</p>
          </div>
        </div>

        {/* Study hours */}
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-semibold font-mono uppercase tracking-wider">Focus Hours</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5">{totalHoursCompleted.toFixed(1)}h</h3>
            <p className="text-[10px] text-muted font-sans mt-0.5">Scheduled: {totalHoursScheduled.toFixed(1)}h</p>
          </div>
        </div>

        {/* Current streak */}
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 text-orange-400 flex-center">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-semibold font-mono uppercase tracking-wider">Current Streak</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5">{currentStreak} Days</h3>
            <p className="text-[10px] text-muted font-sans mt-0.5">Streak threshold: &ge;80% daily</p>
          </div>
        </div>

        {/* Longest streak */}
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-yellow-500/10 text-yellow-400 flex-center">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-semibold font-mono uppercase tracking-wider">Longest Streak</span>
            <h3 className="text-2xl font-bold font-mono mt-0.5">{longestStreak} Days</h3>
            <p className="text-[10px] text-muted font-sans mt-0.5">Personal record consistency</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Heatmap Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Weekly Curve (Span 2) */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold">Weekly Performance Curve</h3>
            <p className="text-xs text-muted font-sans mt-0.5">Detailed completion percentage of the past 7 days.</p>
          </div>
          
          <div className="h-[280px] w-full relative" style={{ height: '280px', position: 'relative' }}>
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono"
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono"
                  domain={[0, 100]}
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-app)', 
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    fontFamily: 'Inter',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  name="Completion"
                  stroke="#e3e3e3" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Category Split */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold">Focus Areas</h3>
            <p className="text-xs text-muted font-sans mt-0.5">Completed learning tasks categorized by topic.</p>
          </div>
          
          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center italic text-slate-650 text-sm">
              Schedule and complete tasks to generate topic profiles.
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[280px] pr-1">
              {categoryData.slice(0, 5).map((cat) => (
                <div key={cat.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 font-mono uppercase tracking-wide">{cat.name}</span>
                    <span className="font-mono text-muted">{cat.rate}% ({cat.hours.toFixed(1)}h)</span>
                  </div>
                  {/* Flat Solid Gray Meter Bar */}
                  <div className="h-2 w-full bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-200 rounded-full transition-all duration-500"
                      style={{ width: `${cat.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GitHub heatmaps grid & Badges row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GitHubHeatmap widget (Span 2) */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Consistency Grid</h3>
              <p className="text-xs text-muted font-sans mt-0.5">Your daily commits and target successes in the past year.</p>
            </div>
            
            {/* Heatmap Legend */}
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted select-none">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-sm bg-github-0" />
              <div className="h-2.5 w-2.5 rounded-sm bg-github-1" />
              <div className="h-2.5 w-2.5 rounded-sm bg-github-2" />
              <div className="h-2.5 w-2.5 rounded-sm bg-github-3" />
              <div className="h-2.5 w-2.5 rounded-sm bg-github-4" />
              <span>More</span>
            </div>
          </div>

          {/* Scrollable Grid Wrapper */}
          <div ref={scrollRef} className="overflow-x-auto pr-2 pb-2 custom-scrollbar select-none">
            <div className="flex items-start gap-2.5 min-w-[1220px]" style={{ paddingTop: '28px' }}>
              {/* Weekday labels */}
              <div className="grid grid-rows-7 gap-1 text-[9px] font-mono text-muted select-none">
                <span className="h-4.5 flex items-center justify-end pr-1 text-right">Sun</span>
                <span className="h-4.5 flex items-center"></span>
                <span className="h-4.5 flex items-center justify-end pr-1 text-right">Tue</span>
                <span className="h-4.5 flex items-center"></span>
                <span className="h-4.5 flex items-center justify-end pr-1 text-right">Thu</span>
                <span className="h-4.5 flex items-center"></span>
                <span className="h-4.5 flex items-center justify-end pr-1 text-right">Sat</span>
              </div>

              {/* Heatmap Grid (7 rows, flowing column-first horizontally) */}
              <div 
                className="grid gap-1 overflow-visible"
                style={{ 
                  gridTemplateRows: 'repeat(7, 18px)', 
                  gridAutoFlow: 'column',
                  gridAutoColumns: '18px'
                }}
              >
                {/* Actual Cells with GitHub Monochromatic Tooltips */}
                {heatmapCells.map((cell) => (
                  <div 
                    key={cell.dateStr} 
                    className="heatmap-cell-container"
                    style={{ height: '18px', width: '18px' }}
                  >
                    <div
                      className={`h-full w-full rounded-sm select-none transition-all hover:scale-110 cursor-pointer ${getHeatmapBg(cell.rate)}`}
                    />
                    {/* Instantly Visible Tooltip */}
                    <span className="heatmap-tooltip">
                      {cell.completedCount === 0 
                        ? `No contributions on ${getMonthName(cell.monthNum)} ${cell.dayNum}, ${cell.yearNum}`
                        : `${cell.completedCount} contribution${cell.completedCount === 1 ? '' : 's'} on ${getMonthName(cell.monthNum)} ${cell.dayNum}, ${cell.yearNum} (${cell.completedCount}/${cell.totalCount} tasks)`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Milestone trophies achievements list */}
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold">Achievement Milestones</h3>
            <p className="text-xs text-muted font-sans mt-0.5">Trophies unlocked through consistent development.</p>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto h-[260px] pr-1">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition ${
                  badge.unlocked 
                    ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-100' 
                    : 'border-slate-900 bg-slate-950/20 opacity-30 text-slate-500'
                }`}
              >
                <div className="text-xl h-9 w-9 bg-slate-950/50 rounded-lg flex-center border border-slate-900 shadow">
                  {badge.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold font-sans tracking-tight">{badge.name}</h4>
                  <p className="text-[9px] text-muted mt-0.5 truncate">{badge.description}</p>
                </div>
                {badge.unlocked && (
                  <span className="text-[8px] font-bold font-mono bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded px-1.5 py-0.5 ml-auto uppercase scale-90">
                    Unlocked
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
