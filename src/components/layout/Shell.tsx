import React, { useState, useRef, useEffect } from 'react';
import { useGrowthStore } from '../../store/useGrowthStore';
import { Calendar as CalendarIcon, BarChart2, Bell, LogOut, User, Trash2, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
  activeTab: 'calendar' | 'dashboard';
  setActiveTab: (tab: 'calendar' | 'dashboard') => void;
  onSignOut?: () => void;
  onProfileClick: () => void;
}

export const Shell: React.FC<ShellProps> = ({ children, activeTab, setActiveTab, onSignOut, onProfileClick }) => {
  const { currentStreak, daysData, profile, notifications, markNotificationsRead, clearNotifications } = useGrowthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      // mark as read when opened
      if (unreadCount > 0) {
        markNotificationsRead();
      }
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, markNotificationsRead, unreadCount]);
  
  // Generate a dynamic motivational message
  const getMotivationalMessage = (): { text: string; emoji: string } => {
    // If today is completed or yesterday is completed
    const datesSorted = Object.keys(daysData).sort().reverse();
    const lastCompletedRate = datesSorted.length > 1 ? (() => {
      const yesterdayData = daysData[datesSorted[1]];
      if (!yesterdayData || yesterdayData.tasks.length === 0) return 0;
      return yesterdayData.tasks.filter(t => t.completed).length / yesterdayData.tasks.length;
    })() : 0;
    
    if (currentStreak >= 5) {
      return { text: `Incredible! A ${currentStreak}-day streak. You are in the top 1% today!`, emoji: '⚡' };
    } else if (lastCompletedRate >= 0.8) {
      return { text: 'Outstanding work yesterday! Keep that momentum going today.', emoji: '🚀' };
    } else if (currentStreak > 0) {
      return { text: `${currentStreak} day streak active! Let's conquer today's schedule.`, emoji: '🔥' };
    } else {
      return { text: 'Every day is a fresh compile. Build your dream system one block at a time.', emoji: '💻' };
    }
  };

  const motivation = getMotivationalMessage();

  return (
    <div className="min-h-screen flex flex-col" style={{ paddingBottom: '40px' }}>
      {/* Top Navbar */}
      <header className="glass-panel sticky top-0 z-40 border-t-0 border-x-0 rounded-none px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex-center border border-slate-300">
            <CalendarIcon className="h-5 w-5 text-slate-800" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-none">
              DEV_GROWTH
            </h1>
            <p className="text-[10px] text-muted font-mono tracking-widest uppercase mt-1">productivity OS v1.0</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex bg-slate-950/40 p-1.5 rounded-xl border border-slate-800/60">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`btn flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
              activeTab === 'calendar'
                ? 'btn-primary'
                : 'text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Growth Calendar
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`btn flex items-center gap-2 px-4 py-2 text-sm rounded-lg ${
              activeTab === 'dashboard'
                ? 'btn-primary'
                : 'text-secondary hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Analytics Dashboard
          </button>
        </nav>

        {/* User Status (XP & Streaks) */}
        <div className="flex items-center gap-4">
          {/* Streak Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold font-mono shadow-[0_0_10px_rgba(249,115,22,0.1)]">
            <span>{currentStreak}</span>
            <span>🔥</span>
          </div>

          {/* Profile Trigger */}
          <button 
            onClick={onProfileClick}
            className="nav-profile-trigger"
            title="User Profile Settings"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="nav-profile-avatar" />
            ) : (
              <div className="nav-profile-fallback">
                <User className="h-3.5 w-3.5" style={{ display: 'block' }} />
              </div>
            )}
            <span className="hidden md:inline nav-profile-name">{profile?.name || 'Developer'}</span>
          </button>

          {/* Mini notifications anchor */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`h-10 w-10 rounded-xl bg-slate-900/60 border flex-center transition relative ${
                showNotifications ? 'border-blue-500/50 text-blue-400' : 'border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-400'
              }`} 
              title="View Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex-center border-2 border-[#0b0b0b]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute top-[calc(100%+0.75rem)] right-0 w-80 max-h-[400px] bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                  <h3 className="text-sm font-bold text-slate-200">Notifications</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={clearNotifications}
                      className="text-[10px] text-slate-500 hover:text-red-400 font-mono tracking-wider transition uppercase flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-slate-800/50 flex-center mb-2">
                        <Bell className="h-5 w-5 text-slate-500" />
                      </div>
                      <p className="text-sm text-slate-400 font-medium">All caught up!</p>
                      <p className="text-xs text-slate-500 mt-1">No new notifications</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition flex gap-3 last:border-0">
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : notif.type === 'warning' ? (
                              <AlertTriangle className="h-4 w-4 text-orange-400" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-400" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-sm font-semibold text-slate-200 truncate">{notif.title}</span>
                            <span className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{notif.message}</span>
                            <span className="text-[9px] text-slate-500 font-mono mt-1">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Trigger */}
          {onSignOut && (
            <button 
              onClick={onSignOut}
              className="h-10 px-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center gap-2 hover:bg-red-950/15 hover:border-red-900/30 text-slate-400 hover:text-red-400 transition text-[10px] font-bold font-mono tracking-wider cursor-pointer"
              title="Sign Out of Session"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          )}
        </div>
      </header>

      {/* Motivational Sub-Bar */}
      <section className="px-6 py-2.5 bg-slate-900/30 border-b border-slate-900/60 flex-center gap-2 text-center text-xs font-medium text-slate-400 font-mono">
        <span className="text-sm">{motivation.emoji}</span>
        <span className="font-sans">{motivation.text}</span>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        {children}
      </main>

      {/* Mobile Footer Sticky Nav */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 px-6 py-2.5 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition ${
            activeTab === 'calendar' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="h-5 w-5" />
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 text-[11px] font-medium transition ${
            activeTab === 'dashboard' ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="h-5 w-5" />
          Analytics
        </button>
      </footer>
    </div>
  );
};
