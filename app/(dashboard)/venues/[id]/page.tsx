'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [venue, setVenue] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [role, setRole] = useState('')

  useEffect(() => { loadVenue(); loadRole() }, [id])

  async function loadRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single(); if (data) setRole(data.role) }
  }

  async function loadVenue() {
    const { data } = await supabase.from('venues').select('*').eq('id', id).single()
    setVenue(data); setForm(data || {}); setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('venues').update({ name: form.name, address: form.address, city: form.city, postcode: form.postcode, contact_name: form.contact_name, phone: form.phone, email: form.email, website: form.website, capacity: form.capacity, genre_relevance: form.genre_relevance, notes: form.notes, status: form.status }).eq('id', id)
    setVenue({ ...venue, ...form }); setEditing(false); setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this venue? This cannot be undone.')) return
    await supabase.from('venues').delete().eq('id', id)
    router.push('/venues')
  }

  const canEdit = ['super_admin', 'admin', 'manager'].includes(role)
  const canDelete = ['super_admin', 'admin'].includes(role)

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!venue) return <div className="p-8 text-center text-gray-400">Venue not found. <Link href="/venues" className="text-indigo-600">Back to venues</Link></div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/venues" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
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
              {[['name','Venue Name'],['city','City'],['postcode','Postcode'],['address','Address'],['contact_name','Contact Name'],['phone','Phone'],['email','Email'],['website','Website'],['capacity','Capacity'],['genre_relevance','Genre / Style']].map(([f,l]) => (
                <div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label><input value={form[f] || ''} onChange={e => setForm(p => ({...p,[f]:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              ))}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status || 'prospect'} onChange={e => setForm(p => ({...p,status:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes || ''} onChange={e => setForm(p => ({...p,notes:e.target.value}))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            <div className="flex gap-3"><button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button><button onClick={() => { setEditing(false); setForm(venue) }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button></div>
          </>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            {[['City', venue.city],['Postcode', venue.postcode],['Address', venue.address],['Contact', venue.contact_name],['Phone', venue.phone],['Email', venue.email],['Website', venue.website],['Capacity', venue.capacity],['Genre / Style', venue.genre_relevance],['Status', venue.status]].map(([label, value]) => (
              <div key={String(label)}><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt><dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd></div>
            ))}
            {venue.notes && <div className="col-span-2"><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{venue.notes}</dd></div>}
          </dl>
        )}
      </div>
    </div>
  )
}
