-- ==========================================
-- GoalStream Supabase Database Schema & Seeds
-- ==========================================

-- Enable PGCrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CLEANUP EXISTING TABLES (IF ANY)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.cycles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CREATE public.users TABLE
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Employee', 'Manager', 'Admin')),
  avatar TEXT,
  title TEXT,
  manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE public.cycles TABLE
CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE public.goals TABLE
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  cycle_id UUID REFERENCES public.cycles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  thrust_area TEXT NOT NULL,
  description TEXT NOT NULL,
  uom TEXT NOT NULL CHECK (uom IN ('numeric', 'percentage', 'timeline', 'binary')),
  target TEXT NOT NULL,
  weightage INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Pending Review', 'Returned', 'Submitted', 'Locked', 'On Track', 'Behind', 'Completed', 'Scheduled')),
  locked BOOLEAN NOT NULL DEFAULT false,
  last_updated TEXT NOT NULL DEFAULT 'Just now',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. CREATE public.achievements TABLE
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL UNIQUE,
  q1 INTEGER NOT NULL DEFAULT 0,
  q2 INTEGER NOT NULL DEFAULT 0,
  q3 INTEGER NOT NULL DEFAULT 0,
  q4 INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. CREATE public.comments TABLE
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CREATE public.audit_logs TABLE
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'warning')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. INDEX OPTIMIZATIONS FOR FREQUENTLY QUERIED COLUMNS
CREATE INDEX IF NOT EXISTS idx_users_manager ON public.users(manager_id);
CREATE INDEX IF NOT EXISTS idx_goals_employee ON public.goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_cycle ON public.goals(cycle_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
CREATE INDEX IF NOT EXISTS idx_comments_goal ON public.comments(goal_id);
CREATE INDEX IF NOT EXISTS idx_achievements_goal ON public.achievements(goal_id);

-- 9. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. HELPER FUNCTION TO RETRIEVE ACTIVE USER ROLE
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 11. RLS POLICIES FOR SECURE USER ROLES

-- Users Policies
CREATE POLICY "Allow read access to authenticated users" 
  ON public.users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write/update for Admins" 
  ON public.users FOR ALL TO authenticated USING (public.get_user_role() = 'Admin');

-- Cycles Policies
CREATE POLICY "Allow read access to cycles" 
  ON public.cycles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin to manage cycles" 
  ON public.cycles FOR ALL TO authenticated USING (public.get_user_role() = 'Admin');

-- Goals Policies
CREATE POLICY "Allow employees to see own goals, managers/admins to see team"
  ON public.goals FOR SELECT TO authenticated 
  USING (
    auth.uid() = employee_id OR 
    public.get_user_role() IN ('Manager', 'Admin')
  );

CREATE POLICY "Allow employee to create own goals, admin to deploy"
  ON public.goals FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = employee_id OR 
    public.get_user_role() = 'Admin'
  );

CREATE POLICY "Allow employee to edit own goals, manager/admin to update status"
  ON public.goals FOR UPDATE TO authenticated
  USING (
    auth.uid() = employee_id OR 
    public.get_user_role() IN ('Manager', 'Admin')
  );

CREATE POLICY "Allow employee to delete own unlocked goals, admin to purge"
  ON public.goals FOR DELETE TO authenticated
  USING (
    (auth.uid() = employee_id AND NOT locked) OR 
    public.get_user_role() = 'Admin'
  );

-- Achievements Policies
CREATE POLICY "Allow select on achievements connected to accessible goals"
  ON public.achievements FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.goals 
      WHERE goals.id = achievements.goal_id AND (
        goals.employee_id = auth.uid() OR 
        public.get_user_role() IN ('Manager', 'Admin')
      )
    )
  );

CREATE POLICY "Allow select, insert, update on achievements for goal owners, managers/admins"
  ON public.achievements FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.goals 
      WHERE goals.id = achievements.goal_id AND (
        goals.employee_id = auth.uid() OR 
        public.get_user_role() IN ('Manager', 'Admin')
      )
    )
  );

-- Comments Policies
CREATE POLICY "Allow read access to comments" 
  ON public.comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow write access to comment owners"
  ON public.comments FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Audit Logs Policies
CREATE POLICY "Allow Admin to read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.get_user_role() = 'Admin');

CREATE POLICY "Allow all authenticated users to write audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- 12. SEED WORKSPACE AUTHS AND CORRESPONDING PROFILES

-- Seed Auth Users
INSERT INTO auth.users (
  id, 
  instance_id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  invited_at, 
  confirmation_token, 
  confirmation_sent_at, 
  recovery_token, 
  recovery_sent_at, 
  email_change_token_new, 
  email_change, 
  email_change_sent_at, 
  last_sign_in_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  is_super_admin, 
  created_at, 
  updated_at, 
  phone, 
  phone_confirmed_at, 
  phone_change, 
  phone_change_sent_at, 
  banned_until, 
  reauthentication_token, 
  reauthentication_sent_at, 
  is_sso_user, 
  deleted_at, 
  role, 
  aud
) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'sarah@goalstream.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{"name":"Sarah Jenkins"}', false, now(), now(), NULL, NULL, '', NULL, NULL, '', NULL, false, NULL, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'michael@goalstream.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{"name":"Michael Chen"}', false, now(), now(), NULL, NULL, '', NULL, NULL, '', NULL, false, NULL, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'manager@goalstream.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{"name":"Manager View"}', false, now(), now(), NULL, NULL, '', NULL, NULL, '', NULL, false, NULL, 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'admin@goalstream.com', crypt('password123', gen_salt('bf')), now(), NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{"name":"Admin User"}', false, now(), now(), NULL, NULL, '', NULL, NULL, '', NULL, false, NULL, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Seed Public Users Profile data
INSERT INTO public.users (id, name, role, avatar, title, manager_id) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Manager View', 'Manager', '/images/manager_view.png', 'Director of Product & Engineering', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Sarah Jenkins', 'Employee', '/images/sarah_jenkins.png', 'Senior UX Designer', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000002', 'Michael Chen', 'Employee', '/images/michael_chen.png', 'Senior Frontend Engineer', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004', 'Admin User', 'Admin', '/images/admin_user.png', 'Principal Systems Administrator', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed Cycle
INSERT INTO public.cycles (id, name, is_open) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'FY24 Objectives', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Goals
INSERT INTO public.goals (id, employee_id, cycle_id, title, thrust_area, description, uom, target, weightage, status, locked, last_updated) VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Increase Cloud Infrastructure Uptime', 'stability', 'Target: Maintain 99.99% availability across all production regions and optimize load balancing clusters.', 'percentage', '99.99', 25, 'On Track', false, '2 hours ago'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Reduce Open Bug Backlog', 'stability', 'Resolve high-priority P1/P2 issues to keep total open bug count under target threshold.', 'numeric', '0', 15, 'Behind', false, 'Yesterday'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002', '550e8400-e29b-41d4-a716-446655440000', 'Complete Advanced Security Certification', 'culture', 'Complete mandatory ISO/IEC 27001 corporate compliance and technical security recertification.', 'binary', 'Yes', 20, 'Completed', false, 'Oct 10, 2023'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Increase Q4 Inbound Lead Generation by 25%', 'strategic', 'Execute multi-channel campaigns targeting mid-market SaaS accounts. Includes launching two technical webinars and a LinkedIn sprint.', 'numeric', '1,200 MQLs', 25, 'Pending Review', false, 'Oct 12, 2023'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'Complete Advanced SEO Certification', 'growth', 'Complete the comprehensive SEO optimization course to bring in-house technical auditing skills to standard.', 'binary', 'Certificate Uploaded', 15, 'Pending Review', false, 'Oct 12, 2023')
ON CONFLICT (id) DO NOTHING;

-- Seed Achievements
INSERT INTO public.achievements (goal_id, q1, q2, q3, q4) VALUES
  ('11111111-1111-1111-1111-111111111111', 40, 65, 85, 0),
  ('22222222-2222-2222-2222-222222222222', 40, 40, 40, 0),
  ('33333333-3333-3333-3333-333333333333', 0, 0, 100, 0)
ON CONFLICT (goal_id) DO NOTHING;

-- Seed Comments
INSERT INTO public.comments (id, goal_id, user_id, text, created_at) VALUES
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000003', 'Is 25% aggressive enough given the new budget? Let`s discuss.', now() - interval '2 days'),
  ('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2', '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'I factored in the holiday slump, but we can stretch to 30% if we push the webinar budget.', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- Seed Audit Logs
INSERT INTO public.audit_logs (actor, action, timestamp, type) VALUES
  ('Manager View', 'Approved FY24 goals for Sarah Jenkins.', 'Today, 09:41 AM', 'success'),
  ('Sarah Jenkins', 'Submitted Q1 achievements for Increase Cloud Infrastructure Uptime.', 'Yesterday, 14:22 PM', 'info'),
  ('System', 'Automatically locked employee draft submissions for FY24 cycle.', 'Oct 12, 12:00 AM', 'warning'),
  ('Admin User', 'Initiated FY24 Corporate Objective Cycle alignment.', 'Oct 01, 09:00 AM', 'info'),
  ('Michael Chen', 'Created 3 new objective drafts.', 'Sep 28, 11:15 AM', 'info')
ON CONFLICT (id) DO NOTHING;
