export type RecordType =
  | 'contact'
  | 'venue'
  | 'artist'
  | 'tester'
  | 'waiting_list'
  | 'investor'
  | 'advisor'
  | 'supplier'
  | 'team_member'
  | 'press'
  | 'partner'
  | 'organisation'

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'overdue'

export type PipelineType =
  | 'venue_partnership'
  | 'artist_booking'
  | 'tester_conversion'
  | 'investor'
  | 'press_media'
  | 'partner'
  | 'supplier'

export type BookingStatus =
  | 'enquiry'
  | 'response_sent'
  | 'follow_up'
  | 'discussion'
  | 'agreed'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'lost'

export type CommunicationType = 'email' | 'call' | 'meeting' | 'note' | 'message' | 'whatsapp'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url?: string
  created_at: string
}

export interface Contact {
  id: string
  type: RecordType
  first_name: string
  last_name: string
  email?: string
  phone?: string
  organisation_id?: string
  organisation_name?: string
  job_title?: string
  address?: string
  postcode?: string
  city?: string
  country?: string
  status: string
  source?: string
  campaign_id?: string
  notes?: string
  preferred_contact?: string
  last_contacted?: string
  next_followup?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Venue {
  id: string
  name: string
  address?: string
  postcode?: string
  city?: string
  contact_name?: string
  phone?: string
  email?: string
  website?: string
  social_links?: Record<string, string>
  capacity?: number
  genre_relevance?: string
  preferred_contact?: string
  status: string
  source?: string
  notes?: string
  last_contacted?: string
  next_followup?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Artist {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  genre?: string
  location?: string
  availability?: string
  fee_level?: string
  preferred_venue_type?: string
  member_count?: number
  technical_requirements?: string
  demo_links?: string[]
  social_links?: Record<string, string>
  status: string
  source?: string
  notes?: string
  last_contacted?: string
  next_followup?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  linked_record_id?: string
  linked_record_type?: RecordType
  linked_record_name?: string
  assigned_to?: string
  assigned_name?: string
  due_date?: string
  reminder_date?: string
  priority: TaskPriority
  status: TaskStatus
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Communication {
  id: string
  type: CommunicationType
  direction?: 'inbound' | 'outbound'
  subject?: string
  body?: string
  linked_record_id?: string
  linked_record_type?: RecordType
  linked_record_name?: string
  logged_by?: string
  logged_by_name?: string
  communication_date: string
  created_at: string
}

export interface Pipeline {
  id: string
  name: string
  type: PipelineType
  stages: PipelineStage[]
  created_at: string
}

export interface PipelineStage {
  id: string
  pipeline_id: string
  name: string
  order: number
  colour?: string
}

export interface PipelineItem {
  id: string
  pipeline_id: string
  stage_id: string
  stage_name?: string
  linked_record_id: string
  linked_record_type: RecordType
  linked_record_name: string
  owner_id?: string
  owner_name?: string
  value?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  venue_id?: string
  venue_name?: string
  artist_id?: string
  artist_name?: string
  event_date?: string
  event_time?: string
  status: BookingStatus
  agreed_fee?: number
  deposit?: number
  payment_status?: string
  source?: string
  campaign_id?: string
  notes?: string
  responsible_user?: string
  responsible_name?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  action: string
  record_id?: string
  record_type?: string
  changed_by?: string
  changed_by_name?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  new_enquiries: number
  overdue_tasks: number
  tasks_today: number
  bookings_in_progress: number
  confirmed_bookings: number
  active_venues: number
  active_artists: number
}
