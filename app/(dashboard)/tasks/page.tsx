import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CheckSquare, Plus, AlertCircle, Clock } from 'lucide-react'
import { formatDate, statusColour } from '@/lib/utils'

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; priority?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('tasks')
    .select('id, title, description, priority, status, due_date, linked_record_name, linked_record_type, assigned_to, created_at')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (params.filter === 'overdue') {
    query = query.lt('due_date', now).neq('status', 'completed')
  } else if (params.filter === 'today') {
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    query = query.gte('due_date', now).lte('due_date', todayEnd.toISOString())
  } else {
    query = query.neq('status', 'completed')
  }

  if (params.priority) {
    query = query.eq('priority', params.priority)
  }

  const { data: tasks } = await query.limit(100)

  function priorityIcon(priority: string) {
    if (priority === 'high') return <AlertCircle className="w-3.5 h-3.5 text-red-500" />
    if (priority === 'medium') return <Clock className="w-3.5 h-3.5 text-yellow-500" />
    return <Clock className="w-3.5 h-3.5 text-green-500" />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
            <p className="text-sm text-gray-500">{tasks?.length || 0} tasks</p>
          </div>
        </div>
        <Link
          href="/tasks/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add task
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { label: 'All open', filter: '' },
          { label: 'Overdue', filter: 'overdue' },
          { label: 'Due today', filter: 'today' },
        ].map(({ label, filter }) => (
          <Link
            key={filter}
            href={filter ? `/tasks?filter=${filter}` : '/tasks'}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              params.filter === filter || (!params.filter && !filter)
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!tasks || tasks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tasks here</p>
            <p className="text-sm mt-1">Create a task to stay on top of follow-ups</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tasks.map((task) => {
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
              return (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5">{priorityIcon(task.priority)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
                          )}
                          {task.linked_record_name && (
                            <p className="text-xs text-indigo-500 mt-0.5 truncate">
                              Linked: {task.linked_record_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColour(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-400'}`}>
                            {isOverdue ? '⚠ ' : ''}{formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
