import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Inbox, Plus, AlertCircle } from 'lucide-react'
import { formatDate, statusColour } from '@/lib/utils'

export default async function InboxPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('inbox_items')
    .select('id, subject, from_name, from_email, type, status, priority, received_at, owner_id, due_by')
    .order('received_at', { ascending: false })
    .limit(100)

  const priorityColour: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-xl">
            <Inbox className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Shared Inbox</h1>
            <p className="text-sm text-gray-500">{items?.filter(i => i.status === 'new').length || 0} unread</p>
          </div>
        </div>
        <Link
          href="/inbox/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log enquiry
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {!items || items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Inbox is clear</p>
            <p className="text-sm mt-1">No enquiries or items to action</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`px-5 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors ${item.status === 'new' ? 'bg-blue-50/30' : ''}`}>
              <div className="flex-shrink-0 mt-1">
                {item.priority === 'high'
                  ? <AlertCircle className="w-4 h-4 text-red-500" />
                  : <Inbox className="w-4 h-4 text-gray-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm ${item.status === 'new' ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {item.subject}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      From: {item.from_name || item.from_email || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColour(item.status)}`}>
                      {item.status}
                    </span>
                    {item.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColour[item.priority]}`}>
                        {item.priority}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">{formatDate(item.received_at)}</span>
                  {item.due_by && (
                    <span className="text-xs text-orange-500">Due: {formatDate(item.due_by)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
