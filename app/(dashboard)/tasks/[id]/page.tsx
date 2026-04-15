'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [task, setTask] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [role, setRole] = useState('')
  const [team, setTeam] = useState<{id: string, full_name: string}[]>([])

  useEffect(() => { loadTask(); loadRole(); supabase.from('profiles').select('id, full_name').then(({ data }) => setTeam(data || [])) }, [id])

  async function loadRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single(); if (data) setRole(data.role) }
  }

  async function loadTask() {
    const { data } = await supabase.from('tasks').select('*').eq('id', id).single()
    setTask(data); setForm(data || {}); setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('tasks').update({ title: form.title, description: form.description, due_date: form.due_date || null, priority: form.priority, assigned_to: form.assigned_to || null, notes: form.notes, status: form.status }).eq('id', id)
    setTask({ ...task, ...form }); setEditing(false); setSaving(false)
  }

  async function markComplete() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString(), completed_by: user?.id }).eq('id', id)
    setTask(t => t ? { ...t, status: 'completed' } : t)
  }

  async function handleDelete() {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    router.push('/tasks')
  }

  const canEdit = ['super_admin', 'admin', 'manager'].includes(role)

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!task) return <div className="p-8 text-center text-gray-400">Task not found. <Link href="/tasks" className="text-indigo-600">Back to tasks</Link></div>

  const priorityColour: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/tasks" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
        </div>
        {canEdit && !editing && (
          <div className="flex gap-2">
            {task.status !== 'completed' && <button onClick={markComplete} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">Mark Complete</button>}
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Edit</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100">Delete</button>
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        {!editing && (
          <div className="flex gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColour[task.priority] || 'bg-gray-100 text-gray-600'}`}>{task.priority} priority</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'completed' ? 'bg-green-100 text-green-700' : task.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{task.status}</span>
          </div>
        )}
        {editing ? (
          <>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input value={form.title || ''} onChange={e => setForm(p => ({...p,title:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description || ''} onChange={e => setForm(p => ({...p,description:e.target.value}))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={form.due_date?.substring(0,10) || ''} onChange={e => setForm(p => ({...p,due_date:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={form.priority || 'medium'} onChange={e => setForm(p => ({...p,priority:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label><select value={form.assigned_to || ''} onChange={e => setForm(p => ({...p,assigned_to:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Unassigned</option>{team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status || 'open'} onChange={e => setForm(p => ({...p,status:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="open">Open</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div>
            <div className="flex gap-3"><button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button><button onClick={() => { setEditing(false); setForm(task) }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button></div>
          </>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            {[['Due Date', task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB') : null],['Priority', task.priority],['Status', task.status]].map(([label, value]) => (
              <div key={String(label)}><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt><dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd></div>
            ))}
            {task.description && <div className="col-span-2"><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{task.description}</dd></div>}
            {task.notes && <div className="col-span-2"><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{task.notes}</dd></div>}
          </dl>
        )}
      </div>
    </div>
  )
}
