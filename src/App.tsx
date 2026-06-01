import { useState, useEffect } from 'react';
import { useGrowthStore } from './store/useGrowthStore';
import { Shell } from './components/layout/Shell';
import { Calendar } from './components/calendar/Calendar';
import { DayModal } from './components/calendar/DayModal';
import { WeekModal } from './components/calendar/WeekModal';
import type { WeeklySummary } from './components/calendar/WeekModal';
import { StatsDashboard } from './components/dashboard/StatsDashboard';
import { MOCK_TODAY_STR } from './utils/dateUtils';
import { Flame, Award, Check } from 'lucide-react';
import { supabase } from './utils/supabaseClient';

import { LandingPage } from './components/layout/LandingPage';
import { ProfileModal } from './components/profile/ProfileModal';
import { OnboardingWizard } from './components/layout/OnboardingWizard';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { AuthErrorPage } from './components/auth/AuthErrorPage';

export default function App() {
  const { 
    currentStreak, 
    longestStreak, 
    daysData,
    toggleTask,
    syncFromSupabase,
    clearStore,
    loading,
    profile
  } = useGrowthStore();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'dashboard'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<{ num: number; summary: WeeklySummary } | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<{ title: string; description: string } | null>(null);

  // Setup Supabase Auth Session listener
  useEffect(() => {
    let isMounted = true;
    let authListener: { unsubscribe: () => void } | null = null;
    let hasSynced = false;

    // Reset loading state on initial mount to prevent being stuck if previously persisted as true in localStorage
    useGrowthStore.setState({ loading: false });

    const initAuth = async () => {
      // 1. Register auth state changes first so we don't miss any events from manual setSession
      if (isMounted) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!isMounted) return;
            console.log("Auth state changed event:", event, "User:", session?.user?.email);
            
            if (event === 'PASSWORD_RECOVERY') {
              setIsRecoveryMode(true);
            }
            
            if (session?.user) {
              setIsAuthenticated(true);
              if (!hasSynced) {
                hasSynced = true;
                await syncFromSupabase();
              }
              // Clear hash if it was parsed
              const currentHash = window.location.hash;
              if (currentHash && (currentHash.includes('access_token=') || currentHash.includes('id_token='))) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
            } else {
              setIsAuthenticated(false);
              clearStore();
              hasSynced = false;
            }
          }
        );
        authListener = subscription;
      }

      // 2. Manually parse hash if present (e.g. Google OAuth redirect params)
      const hash = window.location.hash;
      
      if (hash && hash.includes('error=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const error = params.get('error');
        const errorDescription = params.get('error_description');
        if (error) {
          setAuthError({
            title: error === 'access_denied' ? 'Access Denied' : 'Authentication Error',
            description: errorDescription || 'An error occurred during authentication.'
          });
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      if (hash && hash.includes('type=recovery')) {
        setIsRecoveryMode(true);
      }

    };

    initAuth();

    return () => {
      isMounted = false;
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [syncFromSupabase, clearStore]);

  const handleLoginSuccess = (email: string) => {
    console.log("Logged in successfully:", email);
    setIsAuthenticated(true);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("SignOut error:", err);
    } finally {
      setIsAuthenticated(false);
      clearStore();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#191919] flex-center flex-col gap-4 text-slate-400 font-mono text-sm selection:bg-white/10 selection:text-white">
        <div className="h-10 w-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <div className="animate-pulse">SYNCHRONIZING SECURE SANDBOX CALENDAR...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <AuthErrorPage 
        errorTitle={authError.title}
        errorDescription={authError.description}
        onReturn={() => setAuthError(null)}
      />
    );
  }

  if (isRecoveryMode) {
    return <ResetPasswordPage onPasswordReset={() => setIsRecoveryMode(false)} />;
  }

  if (!isAuthenticated) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (profile && profile.onboarding_completed === false) {
    return <OnboardingWizard />;
  }

  return (
    <Shell 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onSignOut={handleSignOut}
      onProfileClick={() => setShowProfileModal(true)}
    >
      
      {/* CALENDAR VIEW GRID WITH COMPACT SIDEBAR */}
      {activeTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Calendar Plate (Span 3 on Desktop) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <Calendar 
              onDaySelect={setSelectedDate} 
              onWeekSelect={(num, summary) => setSelectedWeek({ num, summary })}
            />
          </div>

          {/* Sidebar (Span 1 on Desktop) - Keep ONLY Today's Agenda and Streak Records */}
          <div className="flex flex-col gap-6">
            
            {/* Today's Agenda Sidebar Checklist Card */}
            <div className="glass-panel p-5 flex flex-col gap-4 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-300">Today's Agenda</h4>
                  <p className="text-[10px] text-muted font-mono">{MOCK_TODAY_STR}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(MOCK_TODAY_STR)}
                  className="manage-day-btn"
                >
                  Manage Day
                </button>
              </div>

              {/* Quick Checklist */}
              {(() => {
                const todayData = daysData[MOCK_TODAY_STR];
                const todayTasks = todayData?.tasks || [];
                
                if (todayTasks.length === 0) {
                  return (
                    <div className="text-center p-4 border border-dashed border-slate-800 text-xs italic text-slate-500 rounded-xl">
                      No tasks scheduled for today. Click today on the grid to plan!
                    </div>
                  );
                }

                const todayCompleted = todayTasks.filter(t => t.completed).length;
                const todayPercentage = Math.round((todayCompleted / todayTasks.length) * 100);

                return (
                  <div className="flex flex-col gap-3">
                    {/* Compact progress bar */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Progress ({todayPercentage}%)</span>
                      <span>
                        {todayCompleted}/{todayTasks.length} Done
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          todayPercentage === 100 
                            ? 'bg-emerald-500' 
                            : todayPercentage >= 70 
                              ? 'bg-blue-500' 
                              : todayPercentage > 30 
                                ? 'bg-orange-500' 
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${todayPercentage}%` }}
                      />
                    </div>
                    
                    {/* Task checklist */}
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {todayTasks.map((t) => (
                        <div 
                          key={t.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg border transition text-xs ${
                            t.completed 
                              ? 'border-emerald-500/10 bg-slate-950/20 opacity-50' 
                              : 'border-slate-800 bg-slate-900/10'
                          }`}
                        >
                          <button
                            onClick={() => toggleTask(MOCK_TODAY_STR, t.id)}
                            className={`h-4.5 w-4.5 rounded border flex-center transition flex-shrink-0 cursor-pointer ${
                              t.completed 
                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold' 
                                : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                            }`}
                          >
                            {t.completed && <Check className="h-3 w-3 stroke-[3.5]" />}
                          </button>
                          <span className={`truncate flex-1 font-medium ${t.completed ? 'line-through text-slate-500 font-normal' : 'text-slate-200'}`}>
                            {t.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Quick Streaks Records Card */}
            <div className="glass-panel p-5 flex flex-col gap-3 border border-slate-800/80">
              <h4 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-300">Streak Records</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-950/30 border border-slate-900 p-2.5 rounded-xl flex flex-col items-center">
                  <Flame className="h-5 w-5 text-orange-400 fill-orange-400/10 mb-1" />
                  <span className="text-[10px] text-muted font-sans font-semibold">Active Streak</span>
                  <span className="text-sm font-bold font-mono text-slate-200 mt-0.5">{currentStreak} days</span>
                </div>
                <div className="bg-slate-950/30 border border-slate-900 p-2.5 rounded-xl flex flex-col items-center">
                  <Award className="h-5 w-5 text-yellow-400 fill-yellow-400/10 mb-1" />
                  <span className="text-[10px] text-muted font-sans font-semibold">Longest Streak</span>
                  <span className="text-sm font-bold font-mono text-slate-250 mt-0.5">{longestStreak} days</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* DETAILED STATISTICS ANALYTICS VIEW */}
      {activeTab === 'dashboard' && <StatsDashboard />}

      {/* DYNAMIC PLANNER OVERLAY DIALOG (Opens if a Date cell is active) */}
      {selectedDate && (
        <DayModal
          dateStr={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* DYNAMIC WEEKLY REVIEW OVERLAY DIALOG (Opens if a Week Stats cell is active) */}
      {selectedWeek && (
        <WeekModal
          weekNum={selectedWeek.num}
          summary={selectedWeek.summary}
          onClose={() => setSelectedWeek(null)}
        />
      )}

      {/* USER PROFILE MODAL SETTINGS OVERLAY */}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
        />
      )}

    </Shell>
  );
}
