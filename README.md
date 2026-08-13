# Minimal Calendar App

A clean, modern, clutter-free shared calendar web application designed for cohorts, study groups, and teams. Built with a default dark-mode aesthetic, it strips away traditional calendar bloat to focus purely on upcoming agendas, exams, and milestones.

## 🚀 Features (Currently Implemented)

- **Minimalist UI:** Default dark-mode interface with zero visual clutter.
- **Interactive Calendar Grid:** Headless calendar integration using `react-day-picker`.
- **Dynamic Agenda View:** Click any date to instantly filter and view events.
- **Real-time Database:** Fetches and inserts events instantly using Supabase.
- **Categorized Events:** Visual color-coded indicators for Exams (Red), Quizzes (Blue), and Study Sessions (Green).
- **Quick Add Modal:** Clean UI for inserting new events on the fly.

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, `next-themes` (Dark Mode)
- **Components:** `react-day-picker`, `lucide-react` (Icons), `date-fns` (Date formatting)
- **Backend & Database:** Supabase (PostgreSQL)

---

## 💻 Getting Started

### 1. Clone the repository

```bash
git clone [https://github.com/YOUR-USERNAME/minimal-calendar.git](https://github.com/YOUR-USERNAME/minimal-calendar.git)
cd minimal-calendar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory and add your Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

---

## 🗄️ Database Setup (Supabase)

To make this app work, you need to execute the following SQL in your Supabase SQL Editor to build the schema:

```sql
-- Create the Calendars table
CREATE TABLE calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create the Members table (Handles who can see/edit the shared calendar)
CREATE TABLE calendar_members (
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('admin', 'contributor', 'viewer')) DEFAULT 'viewer',
  PRIMARY KEY (calendar_id, user_id)
);

-- Create the Events table (Your agendas, exams, and quizzes)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TEMPORARY RULES FOR DEVELOPMENT TESTING:
CREATE POLICY "Allow public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON events FOR INSERT WITH CHECK (true);

-- Insert a test calendar
INSERT INTO calendars (id, name)
VALUES ('11111111-1111-1111-1111-111111111111', 'Testing Cohort');
```

---

## 🗺️ Roadmap (Next Steps)

- [ ] Implement Supabase User Authentication.
- [ ] Replace public database rules with strict Row Level Security (RLS).
- [ ] Allow users to create and join multiple distinct shared calendars.
- [ ] Set up automated email reminders via Cron Jobs and Resend API.
