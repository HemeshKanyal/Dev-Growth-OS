import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MOCK_TODAY_STR } from '../utils/dateUtils';
import { supabase } from '../utils/supabaseClient';

export interface Task {
  id: string;
  title: string;
  category: string;
  estimatedTime: number; // hours
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  description?: string;
}

export interface Topic {
  id: string;
  category: string;
  name: string;
}

export interface DayData {
  tasks: Task[];
  topics: Topic[];
  notes: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  created_at: string;
  read: boolean;
}

export interface Reminder {
  id: string;
  time: string; // e.g., "07:00 AM"
  category: string;
  enabled: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  xp?: number;
  current_streak?: number;
  longest_streak?: number;
  avatar_url?: string;
  phone?: string;
  location?: string;
  onboarding_completed: boolean;
  role?: string;
  productivity_goal?: string;
  daily_target_hours?: number;
}

interface GrowthStore {
  daysData: Record<string, DayData>;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  reminders: Reminder[];
  notifications: Notification[];
  loading: boolean;
  profile: UserProfile | null;
  
  // Sync Actions
  syncFromSupabase: () => Promise<void>;
  clearStore: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Tasks Actions
  addTask: (dateStr: string, task: Omit<Task, 'id' | 'completed'>) => void;
  updateTask: (dateStr: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (dateStr: string, taskId: string) => void;
  toggleTask: (dateStr: string, taskId: string) => void;
  reorderTasks: (dateStr: string, tasks: Task[]) => void;
  
  // Topics Actions
  addTopic: (dateStr: string, topic: Omit<Topic, 'id'>) => void;
  deleteTopic: (dateStr: string, topicId: string) => void;
  
  // Notes Actions
  updateNotes: (dateStr: string, notes: string) => void;
  
  // Reminders Actions
  addReminder: (time: string, category: string) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  
  // Template Import
  importTemplate: (dateStr: string, templateType: 'top1' | 'csCore' | 'web3') => void;
  
  // Notifications
  addNotification: (title: string, message: string, type?: 'success' | 'info' | 'warning') => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Calculations
  recalculateStats: () => void;
}

// Initial default badges list
const DEFAULT_BADGES: Badge[] = [
  { id: 'first_task', name: 'Hello World', description: 'Complete your first task', unlocked: false, icon: '🚀' },
  { id: 'streak_3', name: 'Hot Start', description: 'Maintain a 3-day consistency streak', unlocked: false, icon: '🔥' },
  { id: 'streak_7', name: 'Consistency King', description: 'Maintain a 7-day consistency streak', unlocked: false, icon: '👑' },
  { id: 'level_5', name: 'Elite Hacker', description: 'Earn 300 XP Points', unlocked: false, icon: '💻' },
  { id: 'perfectionist', name: '100% Club', description: 'Complete 100% of tasks in a single day', unlocked: false, icon: '⚡' },
  { id: 'dsa_slayer', name: 'DSA Slayer', description: 'Complete 5 DSA/LeetCode tasks', unlocked: false, icon: '🧠' }
];

// Initial default reminders
const DEFAULT_REMINDERS: Reminder[] = [
  { id: 'r1', time: '07:00 AM', category: 'DSA', enabled: true },
  { id: 'r2', time: '02:00 PM', category: 'Web Development', enabled: true },
  { id: 'r3', time: '09:00 PM', category: 'Open Source', enabled: false }
];

// Helper to generate mock pre-populated data for demonstration (Offline fallback)
const generateMockData = (): Record<string, DayData> => {
  return {
    '2026-05-25': {
      tasks: [
        { id: 't1', title: 'Solve 3 LeetCode problems', category: 'DSA', estimatedTime: 2, priority: 'high', completed: true },
        { id: 't2', title: 'Code custom state manager', category: 'Web Development', estimatedTime: 3, priority: 'medium', completed: true },
        { id: 't3', title: 'Process scheduling questions', category: 'OS', estimatedTime: 1.5, priority: 'high', completed: true }
      ],
      topics: [
        { id: 'tp1', category: 'DSA', name: 'Sliding Window & Two Pointers' },
        { id: 'tp2', category: 'Web Development', name: 'React State Handlers' }
      ],
      notes: 'Had a highly productive day. Solved sliding window questions and read processes.'
    },
    '2026-05-26': {
      tasks: [
        { id: 't4', title: 'Implement custom transformers', category: 'AI', estimatedTime: 2.5, priority: 'high', completed: true },
        { id: 't5', title: 'Practice Codeforces Div 3', category: 'Codeforces', estimatedTime: 2, priority: 'medium', completed: true },
        { id: 't6', title: 'Gym leg day session', category: 'Gym/MMA', estimatedTime: 1.5, priority: 'medium', completed: true }
      ],
      topics: [
        { id: 'tp3', category: 'AI', name: 'Transformer Self Attention' }
      ],
      notes: 'Leg day was intense. Fine-tuned standard BERT architecture in notebook.'
    },
    '2026-05-27': {
      tasks: [
        { id: 't7', title: 'Understand Docker networks', category: 'DevOps', estimatedTime: 2, priority: 'high', completed: true },
        { id: 't8', title: 'Build blockchain smart contract', category: 'Blockchain/Web3', estimatedTime: 3, priority: 'high', completed: false },
        { id: 't9', title: 'Revise IP addressing schemes', category: 'Computer Networks', estimatedTime: 1.5, priority: 'medium', completed: false }
      ],
      topics: [
        { id: 'tp4', category: 'DevOps', name: 'Docker Bridge vs Overlay' }
      ],
      notes: 'Felt tired today. Got stuck on solidity contract compilation and skipped networks.'
    },
    '2026-05-28': {
      tasks: [
        { id: 't10', title: 'Solve 2 LeetCode Mediums', category: 'LeetCode', estimatedTime: 1.5, priority: 'high', completed: true },
        { id: 't11', title: 'Design database index strategies', category: 'Database Notes', estimatedTime: 1.5, priority: 'medium', completed: true },
        { id: 't12', title: 'Add dark mode settings in portfolio', category: 'Project Building', estimatedTime: 2, priority: 'medium', completed: true },
        { id: 't13', title: 'Revise HTML semantic rules', category: 'Revision', estimatedTime: 0.5, priority: 'low', completed: true },
        { id: 't14', title: 'Submit pull request to active repo', category: 'Open Source', estimatedTime: 1.5, priority: 'medium', completed: false }
      ],
      topics: [
        { id: 'tp5', category: 'LeetCode', name: 'Tree Traversal' },
        { id: 'tp6', category: 'Database Notes', name: 'B+ Trees Indexing' }
      ],
      notes: 'Solid progress. Missed open source contribution due to lint error in PR.'
    },
    '2026-05-29': {
      tasks: [
        { id: 't15', title: 'Write Solidity modifier tests', category: 'Blockchain/Web3', estimatedTime: 2.5, priority: 'high', completed: true },
        { id: 't16', title: 'Implement WebSockets chat UI', category: 'Web Development', estimatedTime: 3, priority: 'medium', completed: true },
        { id: 't17', title: 'Solve 3 tree problems', category: 'DSA', estimatedTime: 1.5, priority: 'medium', completed: true }
      ],
      topics: [
        { id: 'tp7', category: 'Blockchain/Web3', name: 'Solidity Reentrancy Guard' }
      ],
      notes: 'Completed all. The WebSocket chat functions cleanly.'
    },
    '2026-05-30': {
      tasks: [
        { id: 't18', title: 'Review TCP flow control sliding window', category: 'Computer Networks', estimatedTime: 1.5, priority: 'high', completed: true },
        { id: 't19', title: 'Review open source PR feedbacks', category: 'Open Source', estimatedTime: 1, priority: 'low', completed: true },
        { id: 't20', title: 'Gym MMA grappling session', category: 'Gym/MMA', estimatedTime: 1.5, priority: 'medium', completed: true }
      ],
      topics: [
        { id: 'tp8', category: 'Computer Networks', name: 'TCP Congestion Control' }
      ],
      notes: 'Great grappling session in the evening. Finished networking notes.'
    },
    '2026-05-31': {
      tasks: [
        { id: 't21', title: 'Read sliding window optimizations', category: 'DSA', estimatedTime: 2, priority: 'high', completed: false },
        { id: 't22', title: 'Build responsive growth dashboard', category: 'Web Development', estimatedTime: 3.5, priority: 'medium', completed: false },
        { id: 't23', title: 'Configure docker stack overlays', category: 'DevOps', estimatedTime: 1.5, priority: 'medium', completed: false },
        { id: 't24', title: 'Clean up git main merge conflicts', category: 'Open Source', estimatedTime: 1, priority: 'low', completed: false }
      ],
      topics: [
        { id: 'tp9', category: 'DSA', name: 'Sliding Window Max' },
        { id: 'tp10', category: 'Web Development', name: 'React top-layer overlays' }
      ],
      notes: 'Beginning of the Developer Growth tracking dashboard!'
    }
  };
};

export const useGrowthStore = create<GrowthStore>()(
  persist(
    (set, get) => ({
      daysData: generateMockData(),
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: DEFAULT_BADGES,
      reminders: DEFAULT_REMINDERS,
      loading: false,
      profile: null,
      notifications: [],

      syncFromSupabase: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        set({ loading: true });

        
        try {
          // 1. Fetch Profile from Supabase
          let profile = null;
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (!error && data) {
              profile = data;
            } else if (error && error.code === 'PGRST116') {
              // Not found, trigger auto-creation
              const { data: newProfile } = await supabase
                .from('profiles')
                .insert([{ id: session.user.id, email: session.user.email, name: 'Developer', xp: 0, current_streak: 0, longest_streak: 0 }])
                .select()
                .single();
              profile = newProfile;
            }
          } catch (err) {
            console.error('Error fetching profile from Supabase:', err);
          }

          let dbTasks: any[] = [];
          let dbTopics: any[] = [];
          let dbNotes: any[] = [];
          let dbReminders: any[] = [];

          try {
            // Fetch Tasks from Supabase
            const { data: tasksData, error: tasksError } = await supabase
              .from('tasks')
              .select('*')
              .eq('user_id', session.user.id);
            if (!tasksError && tasksData) dbTasks = tasksData;

            // Fetch Notes from Supabase
            const { data: notesData, error: notesError } = await supabase
              .from('days_notes')
              .select('*')
              .eq('user_id', session.user.id);
            if (!notesError && notesData) dbNotes = notesData;

          } catch (apiErr) {
            console.error('Error fetching data from Supabase API:', apiErr);
          }

          // Transform db data into store format
          const newDaysData: Record<string, DayData> = {};

          interface DbTask {
            id: string;
            date_str: string;
            title: string;
            category: string;
            estimated_time: string | number;
            priority: string;
            completed: boolean;
            description?: string;
          }

          dbTasks.forEach((task: DbTask) => {
            if (!newDaysData[task.date_str]) {
              newDaysData[task.date_str] = { tasks: [], topics: [], notes: '' };
            }
            newDaysData[task.date_str].tasks.push({
              id: task.id,
              title: task.title,
              category: task.category,
              estimatedTime: Number(task.estimated_time),
              priority: task.priority as 'low' | 'medium' | 'high',
              completed: task.completed,
              description: task.description || '',
            });
          });

          interface DbTopic {
            id: string;
            date_str: string;
            category: string;
            name: string;
          }

          dbTopics.forEach((topic: DbTopic) => {
            if (!newDaysData[topic.date_str]) {
              newDaysData[topic.date_str] = { tasks: [], topics: [], notes: '' };
            }
            newDaysData[topic.date_str].topics.push({
              id: topic.id,
              category: topic.category,
              name: topic.name,
            });
          });

          interface DbNote {
            date_str: string;
            notes: string;
          }

          dbNotes.forEach((note: DbNote) => {
            if (!newDaysData[note.date_str]) {
              newDaysData[note.date_str] = { tasks: [], topics: [], notes: '' };
            }
            newDaysData[note.date_str].notes = note.notes;
          });

          interface DbReminder {
            id: string;
            time: string;
            category: string;
            enabled: boolean;
          }

          // Reminders format
          const formattedReminders: Reminder[] = dbReminders.map((r: DbReminder) => ({
            id: r.id,
            time: r.time,
            category: r.category,
            enabled: r.enabled,
          }));

          set({
            daysData: newDaysData,
            xp: profile?.xp ?? 0,
            currentStreak: profile?.current_streak ?? 0,
            longestStreak: profile?.longest_streak ?? 0,
            reminders: formattedReminders.length > 0 ? formattedReminders : DEFAULT_REMINDERS,
            profile: profile ? {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              avatar_url: profile.avatar_url,
              phone: profile.phone,
              location: profile.location,
              onboarding_completed: profile.onboarding_completed,
              role: profile.role,
              productivity_goal: profile.productivity_goal,
              daily_target_hours: profile.daily_target_hours ? Number(profile.daily_target_hours) : 2
            } : null
          });

          get().recalculateStats();
        } catch (error) {
          console.error('Error syncing from Express backend:', error);
        } finally {
          set({ loading: false });
        }
      },

      clearStore: () => {
        set({
          daysData: {},
          xp: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: DEFAULT_BADGES,
          reminders: DEFAULT_REMINDERS,
          notifications: [],
        });
      },
      
      updateProfile: async (updates) => {
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
          ...(updates.xp !== undefined ? { xp: updates.xp } : {}),
          ...(updates.current_streak !== undefined ? { currentStreak: updates.current_streak } : {}),
          ...(updates.longest_streak !== undefined ? { longestStreak: updates.longest_streak } : {}),
        }));

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          try {
            const { error, data } = await supabase
              .from('profiles')
              .update(updates)
              .eq('id', session.user.id)
              .select()
              .single();
              
            if (error) {
              console.error('Error updating user profile in Supabase:', error);
            } else if (data) {
              set((state) => ({
                profile: state.profile ? {
                  ...state.profile,
                  name: data.name,
                  avatar_url: data.avatar_url,
                  phone: data.phone,
                  location: data.location,
                  onboarding_completed: data.onboarding_completed,
                  role: data.role,
                  productivity_goal: data.productivity_goal,
                  daily_target_hours: data.daily_target_hours ? Number(data.daily_target_hours) : 2
                } : null
              }));
            }
          } catch (err) {
            console.error('Error updating user profile:', err);
          }
        }
        
        get().addNotification('Profile Updated', 'Your profile details have been updated successfully.', 'success');
      },
      
      addTask: (dateStr, task) => {
        const id = 'task_' + Math.random().toString(36).substr(2, 9);
        set((state) => {
          const day = state.daysData[dateStr] || { tasks: [], topics: [], notes: '' };
          const newTasks = [...day.tasks, { ...task, id, completed: false, description: task.description || '' }];
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, tasks: newTasks }
            }
          };
        });

        // Async write to Supabase
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            try {
              const { error } = await supabase.from('tasks').insert({
                id,
                user_id: session.user.id,
                date_str: dateStr,
                title: task.title,
                estimated_time: task.estimatedTime,
                priority: task.priority,
                description: task.description || ''
              });
              if (error) console.error('Error saving task to Supabase:', error);
            } catch (err) {
              console.error('Error saving task:', err);
            }
          }
        });

        get().recalculateStats();
        get().addNotification('Task Scheduled', `Task has been added to ${dateStr}`, 'success');
      },
      
      updateTask: (dateStr, taskId, updates) => {
        set((state) => {
          const day = state.daysData[dateStr];
          if (!day) return {};
          const newTasks = day.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, tasks: newTasks }
            }
          };
        });

        // Async write to Supabase
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            const mappedUpdates: Record<string, unknown> = {};
            if (updates.title !== undefined) mappedUpdates.title = updates.title;
            if (updates.estimatedTime !== undefined) mappedUpdates.estimated_time = updates.estimatedTime;
            if (updates.priority !== undefined) mappedUpdates.priority = updates.priority;
            if (updates.completed !== undefined) mappedUpdates.completed = updates.completed;
            if (updates.description !== undefined) mappedUpdates.description = updates.description;

            try {
              const { error } = await supabase.from('tasks').update(mappedUpdates).eq('id', taskId).eq('user_id', session.user.id);
              if (error) console.error('Error updating task in Supabase:', error);
            } catch (err) {
              console.error('Error updating task:', err);
            }
          }
        });

        get().recalculateStats();
        get().addNotification('Task Updated', `Task modifications saved.`, 'info');
      },
      
      deleteTask: (dateStr, taskId) => {
        set((state) => {
          const day = state.daysData[dateStr];
          if (!day) return {};
          const newTasks = day.tasks.filter((t) => t.id !== taskId);
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, tasks: newTasks }
            }
          };
        });

        // Async write to Supabase
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            try {
              const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', session.user.id);
              if (error) console.error('Error deleting task in Supabase:', error);
            } catch (err) {
              console.error('Error deleting task:', err);
            }
          }
        });

        get().recalculateStats();
        get().addNotification('Task Deleted', `A task was removed.`, 'info');
      },
      
      toggleTask: (dateStr, taskId) => {
        let isCompleted = false;
        set((state) => {
          const day = state.daysData[dateStr];
          if (!day) return {};
          const newTasks = day.tasks.map((t) => {
            if (t.id === taskId) {
              isCompleted = !t.completed;
              return { ...t, completed: isCompleted };
            }
            return t;
          });
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, tasks: newTasks }
            }
          };
        });

        // Async write to Supabase
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            try {
              const { error } = await supabase.from('tasks').update({ completed: isCompleted }).eq('id', taskId).eq('user_id', session.user.id);
              if (error) console.error('Error toggling task in Supabase:', error);
            } catch (err) {
              console.error('Error toggling task:', err);
            }
          }
        });

        get().recalculateStats();
        if (isCompleted) {
          get().addNotification('Task Completed', `Great job knocking out a task!`, 'success');
        }
      },
      
      reorderTasks: (dateStr, tasks) => {
        set((state) => {
          const day = state.daysData[dateStr] || { tasks: [], topics: [], notes: '' };
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, tasks }
            }
          };
        });
      },
      
      addTopic: (dateStr, topic) => {
        const id = 'topic_' + Math.random().toString(36).substr(2, 9);
        set((state) => {
          const day = state.daysData[dateStr] || { tasks: [], topics: [], notes: '' };
          const newTopics = [...day.topics, { ...topic, id }];
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, topics: newTopics }
            }
          };
        });

        // Async write to Express backend
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.access_token) {
            try {
              await fetch('http://localhost:5001/api/topics', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  id,
                  date_str: dateStr,
                  category: topic.category,
                  name: topic.name
                })
              });
            } catch (err) {
              console.error('Error saving topic to Express API:', err);
            }
          }
        });
      },
      
      deleteTopic: (dateStr, topicId) => {
        set((state) => {
          const day = state.daysData[dateStr];
          if (!day) return {};
          const newTopics = day.topics.filter((tp) => tp.id !== topicId);
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, topics: newTopics }
            }
          };
        });

        // Async write to Express backend
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.access_token) {
            try {
              await fetch(`http://localhost:5001/api/topics/${topicId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                }
              });
            } catch (err) {
              console.error('Error deleting topic in Express API:', err);
            }
          }
        });
      },
      
      updateNotes: (dateStr, notes) => {
        set((state) => {
          const day = state.daysData[dateStr] || { tasks: [], topics: [], notes: '' };
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: { ...day, notes }
            }
          };
        });

        // Async write to Supabase
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.user) {
            try {
              // Upsert the daily note
              const { error } = await supabase.from('days_notes').upsert({
                user_id: session.user.id,
                date_str: dateStr,
                notes: notes,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id, date_str' });
              
              if (error) {
                console.error('Error saving notes to Supabase:', error);
              } else {
                get().addNotification('Daily Log Saved', `Your notes for ${dateStr} have been saved.`, 'success');
              }
            } catch (err) {
              console.error('Error saving notes:', err);
            }
          }
        });
      },
      
      addReminder: (time, category) => {
        const id = 'rem_' + Math.random().toString(36).substr(2, 9);
        set((state) => ({
          reminders: [...state.reminders, { id, time, category, enabled: true }]
        }));

        // Async write to Express backend
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.access_token) {
            try {
              await fetch('http://localhost:5001/api/reminders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  id,
                  time,
                  category
                })
              });
            } catch (err) {
              console.error('Error saving reminder to Express API:', err);
            }
          }
        });
      },
      
      toggleReminder: (id) => {
        let isEnabled = false;
        set((state) => ({
          reminders: state.reminders.map((r) => {
            if (r.id === id) {
              isEnabled = !r.enabled;
              return { ...r, enabled: isEnabled };
            }
            return r;
          })
        }));

        // Async write to Express backend
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.access_token) {
            try {
              await fetch(`http://localhost:5001/api/reminders/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ enabled: isEnabled })
              });
            } catch (err) {
              console.error('Error toggling reminder in Express API:', err);
            }
          }
        });
      },
      
      deleteReminder: (id) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id)
        }));
      },
      
      addNotification: (title, message, type = 'info') => {
        const id = 'notif_' + Math.random().toString(36).substr(2, 9);
        set((state) => ({
          notifications: [
            { id, title, message, type, created_at: new Date().toISOString(), read: false },
            ...state.notifications
          ].slice(0, 50) // Keep max 50 recent notifications
        }));
      },

      markNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      importTemplate: (dateStr, templateType) => {
        let tasks: Omit<Task, 'id' | 'completed'>[] = [];
        let topics: Omit<Topic, 'id'>[] = [];
        let notesText = '';
        
        if (templateType === 'top1') {
          tasks = [
            { title: 'Solve 3 LeetCode problems', category: 'DSA', estimatedTime: 2, priority: 'high' },
            { title: 'Code custom component structures', category: 'Web Development', estimatedTime: 3, priority: 'medium' },
            { title: 'Review docker volumes notes', category: 'DevOps', estimatedTime: 1.5, priority: 'medium' },
            { title: 'Answer github open issues', category: 'Open Source', estimatedTime: 1, priority: 'low' }
          ];
          topics = [
            { category: 'DSA', name: 'Sliding Window & Two Pointer problems' },
            { category: 'Web Development', name: 'React Hooks and Reducers' },
            { category: 'DevOps', name: 'Docker Volumes & Mounting' }
          ];
          notesText = 'Imported: Top 1% Developer Schedule Template.';
        } else if (templateType === 'csCore') {
          tasks = [
            { title: 'Read sliding window TCP congestion control', category: 'Computer Networks', estimatedTime: 2, priority: 'high' },
            { title: 'Implement mutex locks in threads', category: 'OS', estimatedTime: 2, priority: 'high' },
            { title: 'Solve database normalization queries', category: 'Database Notes', estimatedTime: 1.5, priority: 'medium' },
            { title: 'MMA training or cardio drill', category: 'Gym/MMA', estimatedTime: 1.5, priority: 'medium' }
          ];
          topics = [
            { category: 'Computer Networks', name: 'TCP Socket Controls' },
            { category: 'OS', name: 'Mutual Exclusion & Thread Locks' }
          ];
          notesText = 'Imported: Computer Science Core Special Template.';
        } else if (templateType === 'web3') {
          tasks = [
            { title: 'Model self-attention inside neural net', category: 'AI', estimatedTime: 2, priority: 'high' },
            { title: 'Implement Solidity modifier protections', category: 'Blockchain/Web3', estimatedTime: 2.5, priority: 'high' },
            { title: 'Revise DSA stack & queue structures', category: 'Revision', estimatedTime: 1, priority: 'low' },
            { title: 'Push build to landing page staging', category: 'Project Building', estimatedTime: 2, priority: 'medium' }
          ];
          topics = [
            { category: 'AI', name: 'Transformer models & Deep learning' },
            { category: 'Blockchain/Web3', name: 'Smart Contract security modifiers' }
          ];
          notesText = 'Imported: AI & Web3 Builder Template.';
        }
        
        const tasksWithIds: Task[] = tasks.map((t) => ({
          ...t,
          id: 'task_' + Math.random().toString(36).substr(2, 9),
          completed: false
        }));
        
        const topicsWithIds: Topic[] = topics.map((tp) => ({
          ...tp,
          id: 'topic_' + Math.random().toString(36).substr(2, 9)
        }));

        set((state) => {
          const day = state.daysData[dateStr] || { tasks: [], topics: [], notes: '' };
          
          return {
            daysData: {
              ...state.daysData,
              [dateStr]: {
                tasks: [...day.tasks, ...tasksWithIds],
                topics: [...day.topics, ...topicsWithIds],
                notes: day.notes ? day.notes + '\n' + notesText : notesText
              }
            }
          };
        });

        // Async bulk write to Express backend
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.access_token) {
            const token = session.access_token;

            
            // Insert tasks
            for (const t of tasksWithIds) {
              try {
                await fetch('http://localhost:5001/api/tasks', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    id: t.id,
                    date_str: dateStr,
                    title: t.title,
                    category: t.category,
                    estimated_time: t.estimatedTime,
                    priority: t.priority
                  })
                });
              } catch (err) {
                console.error('Error bulk importing tasks to Express API:', err);
              }
            }

            // Insert topics
            for (const tp of topicsWithIds) {
              try {
                await fetch('http://localhost:5001/api/topics', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    id: tp.id,
                    date_str: dateStr,
                    category: tp.category,
                    name: tp.name
                  })
                });
              } catch (err) {
                console.error('Error bulk importing topics to Express API:', err);
              }
            }

            // Update/upsert notes
            const currentDay = get().daysData[dateStr];
            try {
              await fetch('http://localhost:5001/api/notes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  date_str: dateStr,
                  notes: currentDay?.notes || ''
                })
              });
            } catch (err) {
              console.error('Error importing notes to Express API:', err);
            }
          }
        });
        
        get().recalculateStats();
      },
      
      recalculateStats: () => {
        const { daysData, badges } = get();
        
        let totalXp = 0;
        let totalCompletedTasks = 0;
        let dsaCompletedCount = 0;
        let has100PercentDay = false;
        
        Object.values(daysData).forEach((data) => {
          if (data.tasks.length === 0) return;
          
          const completedTasks = data.tasks.filter((t) => t.completed);
          totalCompletedTasks += completedTasks.length;
          totalXp += completedTasks.length * 10;
          
          completedTasks.forEach(t => {
            if (t.category === 'DSA' || t.category === 'LeetCode' || t.category === 'Codeforces') {
              dsaCompletedCount++;
            }
          });
          
          if (completedTasks.length === data.tasks.length && data.tasks.length > 0) {
            totalXp += 50;
            has100PercentDay = true;
          }
        });
        
        const datesSorted = Object.keys(daysData).sort();
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        const isDaySuccess = (dateKey: string): boolean => {
          const day = daysData[dateKey];
          if (!day || day.tasks.length === 0) return false;
          const completed = day.tasks.filter((t) => t.completed).length;
          return (completed / day.tasks.length) >= 0.8;
        };
        
        if (datesSorted.length > 0) {
          const firstDate = new Date(datesSorted[0]);
          const lastDate = new Date(datesSorted[datesSorted.length - 1]);
          const iterDate = new Date(firstDate);
          
          while (iterDate <= lastDate) {
            const dateStr = iterDate.toISOString().split('T')[0];
            if (isDaySuccess(dateStr)) {
              tempStreak++;
              if (tempStreak > longestStreak) {
                longestStreak = tempStreak;
              }
            } else {
              tempStreak = 0;
            }
            iterDate.setDate(iterDate.getDate() + 1);
          }
        }
        
        const streakCheckDate = new Date(MOCK_TODAY_STR);
        let checkStr = streakCheckDate.toISOString().split('T')[0];
        
        let isStreakActive = isDaySuccess(checkStr);
        
        if (!isStreakActive) {
          streakCheckDate.setDate(streakCheckDate.getDate() - 1);
          checkStr = streakCheckDate.toISOString().split('T')[0];
          isStreakActive = isDaySuccess(checkStr);
        }
        
        if (isStreakActive) {
          while (isDaySuccess(checkStr)) {
            currentStreak++;
            streakCheckDate.setDate(streakCheckDate.getDate() - 1);
            checkStr = streakCheckDate.toISOString().split('T')[0];
          }
        }
        
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
        
        const updatedBadges = badges.map((badge) => {
          let unlocked = badge.unlocked;
          if (!unlocked) {
            if (badge.id === 'first_task' && totalCompletedTasks >= 1) unlocked = true;
            if (badge.id === 'streak_3' && longestStreak >= 3) unlocked = true;
            if (badge.id === 'streak_7' && longestStreak >= 7) unlocked = true;
            if (badge.id === 'level_5' && totalXp >= 300) unlocked = true;
            if (badge.id === 'perfectionist' && has100PercentDay) unlocked = true;
            if (badge.id === 'dsa_slayer' && dsaCompletedCount >= 5) unlocked = true;
          }
          return { ...badge, unlocked };
        });
        
        set({
          xp: totalXp,
          currentStreak,
          longestStreak,
          badges: updatedBadges
        });

        // Async write profiles xp and streaks to Express backend
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session?.access_token) {
            try {
              await fetch('http://localhost:5001/api/profile', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  xp: totalXp,
                  current_streak: currentStreak,
                  longest_streak: longestStreak
                })
              });
            } catch (err) {
              console.error('Error syncing profile metrics to Express API:', err);
            }
          }
        });
      }
    }),
    {
      name: 'growth-calendar-storage',
      partialize: (state) => {
        const rest: Partial<GrowthStore> = { ...state };
        delete rest.loading;
        return rest;
      }
    }
  )
);
