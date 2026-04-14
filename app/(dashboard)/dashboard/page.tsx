import { createClient } from '@/lib/supabase/server'
import {
  Users, MapPin, Music, CheckSquare, AlertCircle,
  TrendingUp, Inbox, BookOpen, Calendar, Clock
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date().toISOString()
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    { count: totalContacts },
    { count: totalVenues },
    { count: totalArtists },
    { count: openTasks },
    { count: overdueTasks },
    { count: tasksDueToday },
    { count: activeBookings },
    { count: newInbox },
    { data: recentTasks },
    { data: upcomingEvents },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('venues').select('*', { count: 'exact', head: true }),
    supabase.from('artists').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).lt('due_date', now).eq('status', 'open'),
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .gte('due_date', new Date().toISOString())
      .lte('due_date', todayEnd.toISOString()),
    supabase.from('bookings').select('*', { count: 'exact', head: true })
      .in('status', ['enquiry', 'response_sent', 'follow_up', 'discussion', 'agreed', 'confirmed']),
    supabase.from('inbox_items').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('tasks').select('id, title, due_date, priority, status, linked_record_name, assigned_to')
      .in('status', ['open', 'in_progress', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(5),
    supabase.from('calendar_events').select('id, title, start_datetime, event_type, linked_record_name')
      .gte('start_datetime', now)
      .order('start_datetime', { ascending: true })
      .limit(5),
    supabase.from('audit_logs').select('id, action, record_type, record_name, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return {
    stats: {
      totalContacts: totalContacts || 0,
      totalVenues: totalVenues || 0,
      totalArtists: totalArtists || 0,
      openTasks: openTasks || 0,
      overdueTasks: overdueTasks || 0,
      tasksDueToday: tasksDueToday || 0,
      activeBookings: activeBookings || 0,
      newInbox: newInbox || 0,
    },
    recentTasks: recentTasks || [],
    upcomingEvents: upcomingEvents || [],
    recentActivity: recentActivity || [],
  }
}

function StatCard({
  label, value, icon: Icon, colour, href, alert
}: {
  label: string
  value: number
  icon: React.ElementType
  colour: string
  href: string
  alert?: boolean
}) {
  return (
    <Link href={href}>
      <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer ${alert && value > 0 ? 'border-red-200' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${alert && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {value}
            </p>
          </div>
          <div className={`p-2.5 rounded-xl ${colour}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

function priorityBadge(priority: string) {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }
  return map[priority] || 'bg-gray-100 text-gray-600'
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    return <div className="text-gray-500">Loading...</div>
  }

  const { stats, recentTasks, upcomingEvents, recentActivity } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alert row */}
      {(stats.overdueTasks > 0 || stats.newInbox > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.overdueTasks > 0 && (
            <Link href="/tasks?filter=overdue">
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                <AlertCircle className="w-4 h-4" />
                {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''} — action needed
              </div>
            </Link>
          )}
          {stats.newInbox > 0 && (
            <Link href="/inbox">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
                <Inbox className="w-4 h-4" />
                {stats.newInbox} new inbox item{stats.newInbox > 1 ? 's' : ''} unread
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Contacts" value={stats.totalContacts} icon={Users} colour="bg-blue-100 text-blue-600" href="/contacts" />
        <StatCard label="Venues" value={stats.totalVenues} icon={MapPin} colour="bg-purple-100 text-purple-600" href="/venues" />
        <StatCard label="Artists" value={stats.totalArtists} icon={Music} colour="bg-pink-100 text-pink-600" href="/artists" />
        <StatCard label="Active Bookings" value={stats.activeBookings} icon={BookOpen} colour="bg-green-100 text-green-600" href="/bookings" />
        <StatCard label="Open Tasks" value={stats.openTasks} icon={CheckSquare} colour="bg-indigo-100 text-indigo-600" href="/tasks" />
        <StatCard label="Overdue Tasks" value={stats.overdueTasks} icon={AlertCircle} colour="bg-red-100 text-red-600" href="/tasks?filter=overdue" alert />
        <StatCard label="Due Today" value={stats.tasksDueToday} icon={Clock} colour="bg-orange-100 text-orange-600" href="/tasks?filter=today" />
        <StatCard label="New Inbox" value={stats.newInbox} icon={Inbox} colour="bg-yellow-100 text-yellow-600" href="/inbox" alert />
      </div>

      {/* Main content: tasks + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Priority tasks</h2>
            <Link href="/tasks" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No open tasks</div>
            ) : (
              recentTasks.map((task: { id: string; title: string; due_date: string; priority: string; linked_record_name: string }) => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                        {task.linked_record_name && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.linked_record_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-400">{formatDate(task.due_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming</h2>
            <Link href="/calendar" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Calendar
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingEvents.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Nothing upcoming</div>
            ) : (
              upcomingEvents.map((event: { id: string; title: string; start_datetime: string; event_type: string; linked_record_name: string }) => (
                <div key={event.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(event.start_datetime)}
                      {event.linked_record_name && ` · ${event.linked_record_name}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 capitalize flex-shrink-0">
                    {event.event_type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
          <TrendingUp className="w-4 h-4 text-gray-400" />
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No recent activity</div>
          ) : (
            recentActivity.map((log: { id: string; action: string; record_type: string; record_name: string; created_at: string }) => (
              <div key={log.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    <span className="capitalize">{log.action}</span>
                    {log.record_name && <span className="text-gray-400"> — {log.record_name}</span>}
                    {log.record_type && <span className="text-gray-400 text-xs ml-1">({log.record_type})</span>}
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
