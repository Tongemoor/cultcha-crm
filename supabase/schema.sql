-- ============================================================
-- CULTCHA VULTCHA CRM - FULL DATABASE SCHEMA
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'viewer')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'staff');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ORGANISATIONS
-- ============================================================
CREATE TABLE organisations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  address TEXT,
  postcode TEXT,
  city TEXT,
  country TEXT DEFAULT 'UK',
  phone TEXT,
  email TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active',
  notes TEXT,
  source TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CONTACTS (all people)
-- ============================================================
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'contact' CHECK (type IN (
    'contact', 'venue', 'artist', 'tester', 'waiting_list',
    'investor', 'advisor', 'supplier', 'team_member',
    'press', 'partner', 'organisation'
  )),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  organisation_id UUID REFERENCES organisations(id),
  job_title TEXT,
  address TEXT,
  postcode TEXT,
  city TEXT,
  country TEXT DEFAULT 'UK',
  status TEXT DEFAULT 'active',
  source TEXT,
  campaign_id UUID,
  notes TEXT,
  preferred_contact TEXT DEFAULT 'email',
  last_contacted TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  is_sensitive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VENUES
-- ============================================================
CREATE TABLE venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  postcode TEXT,
  city TEXT,
  country TEXT DEFAULT 'UK',
  contact_name TEXT,
  contact_id UUID REFERENCES contacts(id),
  phone TEXT,
  email TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  capacity INTEGER,
  genre_relevance TEXT,
  preferred_contact TEXT DEFAULT 'email',
  status TEXT DEFAULT 'identified',
  source TEXT,
  campaign_id UUID,
  notes TEXT,
  last_contacted TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  is_sensitive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ARTISTS
-- ============================================================
CREATE TABLE artists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_id UUID REFERENCES contacts(id),
  email TEXT,
  phone TEXT,
  genre TEXT,
  location TEXT,
  availability TEXT,
  fee_level TEXT,
  preferred_venue_type TEXT,
  member_count INTEGER,
  technical_requirements TEXT,
  demo_links TEXT[],
  social_links JSONB DEFAULT '{}',
  status TEXT DEFAULT 'identified',
  source TEXT,
  campaign_id UUID,
  notes TEXT,
  last_contacted TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  is_sensitive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  linked_record_id UUID,
  linked_record_type TEXT,
  linked_record_name TEXT,
  assigned_to UUID REFERENCES profiles(id),
  due_date TIMESTAMPTZ,
  reminder_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'overdue')),
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COMMUNICATIONS
-- ============================================================
CREATE TABLE communications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'message', 'whatsapp')),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound', 'internal')),
  subject TEXT,
  body TEXT,
  linked_record_id UUID,
  linked_record_type TEXT,
  linked_record_name TEXT,
  logged_by UUID REFERENCES profiles(id),
  communication_date TIMESTAMPTZ DEFAULT now(),
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PIPELINES
-- ============================================================
CREATE TABLE pipelines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  colour TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pipeline_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES pipeline_stages(id),
  linked_record_id UUID NOT NULL,
  linked_record_type TEXT NOT NULL,
  linked_record_name TEXT,
  owner_id UUID REFERENCES profiles(id),
  value NUMERIC(10,2),
  notes TEXT,
  stage_entered_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT,
  venue_id UUID REFERENCES venues(id),
  venue_name TEXT,
  artist_id UUID REFERENCES artists(id),
  artist_name TEXT,
  event_date DATE,
  event_time TIME,
  status TEXT DEFAULT 'enquiry' CHECK (status IN (
    'enquiry', 'response_sent', 'follow_up', 'discussion',
    'agreed', 'confirmed', 'completed', 'cancelled', 'lost'
  )),
  agreed_fee NUMERIC(10,2),
  deposit NUMERIC(10,2),
  deposit_paid BOOLEAN DEFAULT false,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'paid', 'overdue')),
  invoice_status TEXT DEFAULT 'none' CHECK (invoice_status IN ('none', 'draft', 'sent', 'paid')),
  money_received NUMERIC(10,2) DEFAULT 0,
  money_outstanding NUMERIC(10,2) DEFAULT 0,
  source TEXT,
  campaign_id UUID,
  notes TEXT,
  responsible_user UUID REFERENCES profiles(id),
  is_sensitive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FILES / DOCUMENTS
-- ============================================================
CREATE TABLE files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'general',
  linked_record_id UUID,
  linked_record_type TEXT,
  linked_record_name TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CAMPAIGNS / MARKETING SOURCES
-- ============================================================
CREATE TABLE campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  source_channel TEXT,
  start_date DATE,
  end_date DATE,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
CREATE TABLE calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN (
    'meeting', 'call', 'booking', 'task', 'deadline', 'reminder', 'event'
  )),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  linked_record_id UUID,
  linked_record_type TEXT,
  linked_record_name TEXT,
  attendees JSONB DEFAULT '[]',
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  record_id UUID,
  record_type TEXT,
  record_name TEXT,
  changed_by UUID REFERENCES profiles(id),
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SHARED INBOX
-- ============================================================
CREATE TABLE inbox_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject TEXT NOT NULL,
  body TEXT,
  from_name TEXT,
  from_email TEXT,
  type TEXT DEFAULT 'enquiry',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'replied', 'resolved', 'overdue')),
  owner_id UUID REFERENCES profiles(id),
  linked_record_id UUID,
  linked_record_type TEXT,
  priority TEXT DEFAULT 'medium',
  received_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  due_by TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FINANCIAL ITEMS
-- ============================================================
CREATE TABLE financial_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT DEFAULT 'fee' CHECK (type IN ('fee', 'deposit', 'expense', 'invoice', 'refund')),
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  linked_record_id UUID,
  linked_record_type TEXT,
  linked_record_name TEXT,
  booking_id UUID REFERENCES bookings(id),
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SEED DATA: DEFAULT PIPELINES
-- ============================================================
INSERT INTO pipelines (name, type, description) VALUES
  ('Venue Partnerships', 'venue_partnership', 'Track venue outreach and partnership progression'),
  ('Artist Bookings', 'artist_booking', 'Track artist identification through to booking'),
  ('Tester / Waiting List', 'tester_conversion', 'Convert testers and waiting list to active users'),
  ('Investor Relations', 'investor', 'Track investor outreach and discussions'),
  ('Press & Media', 'press_media', 'Track press pitches and coverage'),
  ('Partner Pipeline', 'partner', 'Track partner relationships and deals');

-- Add stages for Venue Partnerships
INSERT INTO pipeline_stages (pipeline_id, name, stage_order, colour)
SELECT id, stage_name, stage_order, colour FROM pipelines,
(VALUES
  ('Identified', 1, '#94a3b8'),
  ('Contacted', 2, '#60a5fa'),
  ('Interested', 3, '#34d399'),
  ('Meeting Booked', 4, '#a78bfa'),
  ('Testing', 5, '#fbbf24'),
  ('Active', 6, '#10b981'),
  ('Inactive', 7, '#9ca3af'),
  ('Lost', 8, '#f87171')
) AS s(stage_name, stage_order, colour)
WHERE pipelines.type = 'venue_partnership';

-- Add stages for Artist Bookings
INSERT INTO pipeline_stages (pipeline_id, name, stage_order, colour)
SELECT id, stage_name, stage_order, colour FROM pipelines,
(VALUES
  ('Identified', 1, '#94a3b8'),
  ('Contacted', 2, '#60a5fa'),
  ('Reviewed', 3, '#34d399'),
  ('Discussion', 4, '#a78bfa'),
  ('Booking Pending', 5, '#fbbf24'),
  ('Booked', 6, '#10b981'),
  ('Active', 7, '#10b981'),
  ('Inactive', 8, '#9ca3af'),
  ('Lost', 9, '#f87171')
) AS s(stage_name, stage_order, colour)
WHERE pipelines.type = 'artist_booking';

-- Add stages for Investor pipeline
INSERT INTO pipeline_stages (pipeline_id, name, stage_order, colour)
SELECT id, stage_name, stage_order, colour FROM pipelines,
(VALUES
  ('Identified', 1, '#94a3b8'),
  ('Approached', 2, '#60a5fa'),
  ('Deck Sent', 3, '#34d399'),
  ('Meeting Booked', 4, '#a78bfa'),
  ('Follow-up', 5, '#fbbf24'),
  ('Active Discussion', 6, '#f97316'),
  ('Closed', 7, '#10b981'),
  ('Inactive', 8, '#9ca3af')
) AS s(stage_name, stage_order, colour)
WHERE pipelines.type = 'investor';

-- Add stages for Press/Media
INSERT INTO pipeline_stages (pipeline_id, name, stage_order, colour)
SELECT id, stage_name, stage_order, colour FROM pipelines,
(VALUES
  ('Identified', 1, '#94a3b8'),
  ('Pitched', 2, '#60a5fa'),
  ('Responded', 3, '#34d399'),
  ('Follow-up', 4, '#fbbf24'),
  ('Coverage Secured', 5, '#10b981'),
  ('Inactive', 6, '#9ca3af')
) AS s(stage_name, stage_order, colour)
WHERE pipelines.type = 'press_media';

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- Basic RLS: authenticated users can read/write (we handle app-level permissions in code)
CREATE POLICY "Authenticated users can read profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Contacts
CREATE POLICY "Authenticated users full access to contacts" ON contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Venues
CREATE POLICY "Authenticated users full access to venues" ON venues FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Artists
CREATE POLICY "Authenticated users full access to artists" ON artists FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks
CREATE POLICY "Authenticated users full access to tasks" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Communications
CREATE POLICY "Authenticated users full access to communications" ON communications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pipelines
CREATE POLICY "Authenticated users full access to pipelines" ON pipelines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to pipeline_stages" ON pipeline_stages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users full access to pipeline_items" ON pipeline_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Bookings
CREATE POLICY "Authenticated users full access to bookings" ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Files
CREATE POLICY "Authenticated users full access to files" ON files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Campaigns
CREATE POLICY "Authenticated users full access to campaigns" ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Calendar
CREATE POLICY "Authenticated users full access to calendar_events" ON calendar_events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Audit logs (read only for all authenticated)
CREATE POLICY "Authenticated users can view audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Inbox
CREATE POLICY "Authenticated users full access to inbox_items" ON inbox_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Financial
CREATE POLICY "Authenticated users full access to financial_items" ON financial_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Organisations
CREATE POLICY "Authenticated users full access to organisations" ON organisations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- HELPER FUNCTION: Updated At Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pipeline_items_updated_at BEFORE UPDATE ON pipeline_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_organisations_updated_at BEFORE UPDATE ON organisations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inbox_updated_at BEFORE UPDATE ON inbox_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_financial_updated_at BEFORE UPDATE ON financial_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
