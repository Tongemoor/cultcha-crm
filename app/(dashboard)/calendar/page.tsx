import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default async function CalendarPage() {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString()

  const { data: events } = await supabase
    .from('calendar_events')
    .select('id, title, start_datetime, end_datetime, event_type, linked_record_name, location, description')
    .gte('start_datetime', monthStart)
    .lte('start_datetime', monthEnd)
    .order('start_datetime', { ascending: true })

  const eventTypeColour: Record<string, string> = {
    meeting: 'bg-blue-100 text-blue-700',
    call: 'bg-green-100 text-green-700',
    booking: 'bg-purple-100 text-purple-700',
    task: 'bg-yellow-100 text-yellow-700',
    deadline: 'bg-red-100 text-red-700',
    reminder: 'bg-orange-100 text-orange-700',
    event: 'bg-indigo-100 text-indigo-700',
  }

  // Group by date
  const grouped: Record<string, typeof events> = {}
  if (events) {
    for (const event of events) {
      const dateKey = new Date(event.start_datetime).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long'
      })
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey]!.push(event)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500">
              {now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} and beyond
            </p>
          </div>
        </div>
        <Link
          href="/calendar/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add event
        </Link>
      </div>

      <div className="space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No events coming up</p>
            <p className="text-sm mt-1">Add your first event or meeting</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">{date}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {dayEvents?.map((event) => (
                  <div key={event.id} className="px-5 py-3.5 flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${eventTypeColour[event.event_type] || 'bg-gray-100 text-gray-600'}`}>
                        {event.event_type}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {new Date(event.start_datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {event.end_datetime && ` — ${new Date(event.end_datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                        {event.location && <span className="text-xs text-gray-400">· {event.location}</span>}
                        {event.linked_record_name && (
                          <span className="text-xs text-indigo-500">· {event.linked_record_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
