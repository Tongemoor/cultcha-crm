'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [contact, setContact] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [role, setRole] = useState('')

  useEffect(() => {
    loadContact()
    loadRole()
  }, [id])

  async function loadRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (data) setRole(data.role)
    }
  }

  async function loadContact() {
    const { data } = await supabase.from('contacts').select('*').eq('id', id).single()
    setContact(data)
    setForm(data || {})
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('contacts').update({
      first_name: form.first_name, last_name: form.last_name,
      email: form.email, phone: form.phone, job_title: form.job_title,
      city: form.city, notes: form.notes, type: form.type, status: form.status,
    }).eq('id', id)
    setContact({ ...contact, ...form })
    setEditing(false)
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this contact? This cannot be undone.')) return
    await supabase.from('contacts').delete().eq('id', id)
    router.push('/contacts')
  }

  const canEdit = ['super_admin', 'admin', 'manager'].includes(role)
  const canDelete = ['super_admin', 'admin'].includes(role)

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!contact) return <div className="p-8 text-center text-gray-400">Contact not found. <Link href="/contacts" className="text-indigo-600">Back to contacts</Link></div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/contacts" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{contact.first_name} {contact.last_name}</h1>
        </div>
        {canEdit && !editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">Edit</button>
            {canDelete && <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100">Delete</button>}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        {editing ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              {[['first_name','First Name'],['last_name','Last Name'],['email','Email'],['phone','Phone'],['job_title','Job Title'],['city','City']].map(([field, label]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input value={form[field] || ''} onChange={e => setForm(f => ({...f, [field]: e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type || 'contact'} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {['contact','partner','press','investor','advisor','supplier','tester','waiting_list','organisation'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status || 'active'} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="active">Active</option><option value="lead">Lead</option><option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
              <button onClick={() => { setEditing(false); setForm(contact) }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button>
            </div>
          </>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            {[['Email', contact.email],['Phone', contact.phone],['Job Title', contact.job_title],['City', contact.city],['Type', contact.type],['Status', contact.status]].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
                <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
              </div>
            ))}
            {contact.notes && (
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{contact.notes}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  )
}
