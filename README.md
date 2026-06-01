# 🚀 Dev Growth OS

**The minimalist, local-first sandboxed productivity OS designed exclusively for high-performing developers to sustain absolute consistency.**

Dev Growth OS is a highly focused productivity environment tailored for developers. Align your calendar grids, checklist scopes, weekly metrics, and streak dopamine systems into one unified, minimalist sandbox designed to build absolute coding consistency.

## ✨ Features

- 📅 **Developer Calendar**: A heat-map inspired contribution grid to visualize your consistency and track daily focus metrics.
- ✅ **Task Management**: Low-friction task scheduling and scoping, tailored for software engineering workflows (e.g., DSA, LeetCode, System Design, DevOps).
- 📝 **Daily Developer Log**: A sandboxed journal for dumping notes, debugging thoughts, and daily learnings.
- 🏆 **Gamified Progress**: Earn XP, unlock dynamic badges, and track your coding streaks to maintain momentum.
- ⚡ **Serverless Architecture**: Fully powered by a React (Vite) frontend with direct, secure integration into Supabase for zero-latency data persistence.
- 🔐 **Magic Link Authentication**: Seamless and secure passwordless login for developers.
- 🎨 **Minimalist UI**: Deep dark mode, zero-distraction interface, built for deep work.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (Minimalist, custom design tokens)
- **State Management**: Zustand (with selective persistence)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security)
- **Icons**: Lucide React

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/HemeshKanyal/Dev-Growth-OS.git
cd Dev-Growth-OS
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup
You will need to create the following tables in your Supabase SQL Editor:
- `profiles` (id, email, name, xp, current_streak, longest_streak)
- `tasks` (id, user_id, date_str, title, category, priority, completed, estimated_time)
- `days_notes` (user_id, date_str, notes)
- `waitlist` (id, email, created_at)

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🌐 Deployment
This project is completely serverless. You can deploy the frontend directly to Vercel with zero configuration required beyond adding your `VITE_SUPABASE` environment variables.

---
*Built with focus • Built for developers*
