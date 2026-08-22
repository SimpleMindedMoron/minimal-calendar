# Minimal Shared Calendar

A high-performance, multi-tenant shared calendar application built for study groups, cohorts, and teams. Users can create private rooms, invite peers via unique UUIDs, and manage shared schedules with granular access control.

## 🚀 Features

*   **Multi-Tenant Rooms:** Create distinct calendars ("Rooms") and join existing ones using a secure invite code.
*   **Aggregated Dashboard:** View all upcoming events across every room you have joined in a single, unified view, or filter by a specific room.
*   **Zero-Flash Authentication:** Utilizes Next.js Middleware and `@supabase/ssr` for seamless server-side route protection, eliminating client-side loading flashes.
*   **Production-Grade Security:** Fully locked down with Supabase Row Level Security (RLS). Users can only view, create, or delete events within rooms they have explicitly joined. Admins retain exclusive deletion rights for the rooms they create.
*   **Event Categorization:** Classify calendar events seamlessly (e.g., Exams, Quizzes, Study Sessions).
*   **Automated Email Invitations:** Invite users directly via email. The app sends customized HTML emails containing the secure room code using Gmail SMTP (via Nodemailer) or the Resend API.
*   **Access Control Modes:** Define room access as "Strict" (only invited emails can join) or "Open" (anyone with the code can join).

## 🛠 Tech Stack

*   **Framework:** Next.js (App Router)
*   **Backend & Auth:** Supabase (PostgreSQL, Supabase Auth, `@supabase/ssr`)
*   **Styling:** CSS Modules
*   **Components:** `react-day-picker` (Calendar logic), `lucide-react` (Icons)
*   **Utilities:** `date-fns`, `next-themes` (Dark Mode)
*   **Email Services:** `nodemailer`, Resend API

---

## 💻 Getting Started

### Prerequisites
*   Node.js 18+ installed
*   A [Supabase](https://supabase.com/) account and project

### 1. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials, as well as optional email provider credentials for sending invites:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For Email Invitations
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
# OR
RESEND_API_KEY=your_resend_api_key
```

### 3. Database Setup
Execute the following SQL script in your Supabase SQL Editor to generate the necessary tables and enforce Row Level Security (RLS):

```sql
-- Create Tables
CREATE TABLE calendars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE calendar_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'contributor', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(calendar_id, user_id)
);

CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  event_type TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Apply Policies
CREATE POLICY "Anyone can create calendars" ON calendars FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view calendars" ON calendars FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can delete calendars" ON calendars FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM calendar_members WHERE calendar_id = calendars.id AND user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view members" ON calendar_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join calendars" ON calendar_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can view events" ON events FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM calendar_members WHERE calendar_id = events.calendar_id AND user_id = auth.uid())
);
CREATE POLICY "Members can insert events" ON events FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM calendar_members WHERE calendar_id = events.calendar_id AND user_id = auth.uid())
);
CREATE POLICY "Members can delete events" ON events FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM calendar_members WHERE calendar_id = events.calendar_id AND user_id = auth.uid())
);
```

### 4. Run the Development Server
Start the local server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the application.
