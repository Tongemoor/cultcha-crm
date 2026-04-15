'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewTaskPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [team, setTeam] = useState<{id: string, full_name: string}[]>([])
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'medium', assigned_to: '', notes: '' })
  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  useEffect(() => {
    supabase.from('profiles').select('id, full_name').then(({ data }) => setTeam(data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Task title is required.'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('tasks').insert({
      title: form.title.trim(), description: form.description || null,
      due_date: form.due_date || null, priority: form.priority,
      assigned_to: form.assigned_to || user?.id, notes: form.notes || null,
      status: 'open', created_by: user?.id,
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/tasks')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tasks" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Task</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Follow up with The Venue" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="What needs to be done?" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
          <select value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Assign to myself</option>
            {team.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        {error && <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Task'}</button>
          <Link href="/tasks" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
