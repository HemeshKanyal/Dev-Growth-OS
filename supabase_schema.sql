-- DATABASE SCHEMA FOR DEVELOPER GROWTH CALENDAR (DEV_GROWTH)
-- Execute this SQL inside your Supabase SQL Editor to set up all tables and security rules.

-- 1. Profiles Table (Stores user-specific stats and meta-data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  xp INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  location TEXT,
  onboarding_completed BOOLEAN DEFAULT false NOT NULL,
  role TEXT,
  productivity_goal TEXT,
  daily_target_hours NUMERIC DEFAULT 2 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Days Notes Table (Stores daily reflections and notes)
CREATE TABLE IF NOT EXISTS public.days_notes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_str TEXT NOT NULL,
  notes TEXT DEFAULT '' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, date_str)
);

-- 3. Tasks Table (Stores individual daily task/agenda items)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_str TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_time NUMERIC DEFAULT 0 NOT NULL,
  priority TEXT DEFAULT 'medium'::text NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, id)
);

-- 4. Indexes for optimized querying
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, date_str);
CREATE INDEX IF NOT EXISTS idx_notes_user_date ON public.days_notes(user_id, date_str);

-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.days_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 6. Create Security Policies (RLS) for isolated user data access
-- Profiles Policies
CREATE POLICY "Allow users to read their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Days Notes Policies
CREATE POLICY "Allow users to manage their own notes" 
  ON public.days_notes FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Allow users to manage their own tasks" 
  ON public.tasks FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. Trigger: Automatically create a new public profile when an auth.user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, xp, current_streak, longest_streak)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'Developer'),
    0,
    0,
    0
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
