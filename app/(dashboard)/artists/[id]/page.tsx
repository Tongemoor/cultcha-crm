'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ArtistDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [artist, setArtist] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [role, setRole] = useState('')

  useEffect(() => { loadArtist(); loadRole() }, [id])

  async function loadRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single(); if (data) setRole(data.role) }
  }

  async function loadArtist() {
    const { data } = await supabase.from('artists').select('*').eq('id', id).single()
    setArtist(data); setForm(data || {}); setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('artists').update({ name: form.name, contact_name: form.contact_name, email: form.email, phone: form.phone, genre: form.genre, location: form.location, fee_level: form.fee_level, availability: form.availability, technical_requirements: form.technical_requirements, notes: form.notes, status: form.status }).eq('id', id)
    setArtist({ ...artist, ...form }); setEditing(false); setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this artist? This cannot be undone.')) return
    await supabase.from('artists').delete().eq('id', id)
    router.push('/artists')
  }

  const canEdit = ['super_admin', 'admin', 'manager'].includes(role)
  const canDelete = ['super_admin', 'admin'].includes(role)

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!artist) return <div className="p-8 text-center text-gray-400">Artist not found. <Link href="/artists" className="text-indigo-600">Back to artists</Link></div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/artists" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <h1 className="text-2xl font-bold text-gray-900">{artist.name}</h1>
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
              {[['name','Artist Name'],['contact_name','Contact / Manager'],['email','Email'],['phone','Phone'],['genre','Genre / Style'],['location','Location'],['fee_level','Fee Level'],['availability','Availability']].map(([f,l]) => (
                <div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{l}</label><input value={form[f] || ''} onChange={e => setForm(p => ({...p,[f]:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              ))}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status || 'prospect'} onChange={e => setForm(p => ({...p,status:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="prospect">Prospect</option><option value="in_conversation">In Conversation</option><option value="confirmed">Confirmed</option><option value="inactive">Inactive</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Technical Requirements</label><textarea value={form.technical_requirements || ''} onChange={e => setForm(p => ({...p,technical_requirements:e.target.value}))} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes || ''} onChange={e => setForm(p => ({...p,notes:e.target.value}))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            <div className="flex gap-3"><button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button><button onClick={() => { setEditing(false); setForm(artist) }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button></div>
          </>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            {[['Contact / Manager', artist.contact_name],['Email', artist.email],['Phone', artist.phone],['Genre / Style', artist.genre],['Location', artist.location],['Fee Level', artist.fee_level],['Availability', artist.availability],['Status', artist.status]].map(([label, value]) => (
              <div key={String(label)}><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt><dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd></div>
            ))}
            {artist.technical_requirements && <div className="col-span-2"><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Technical Requirements</dt><dd className="mt-1 text-sm text-gray-900">{artist.technical_requirements}</dd></div>}
            {artist.notes && <div className="col-span-2"><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{artist.notes}</dd></div>}
          </dl>
        )}
      </div>
    </div>
  )
}
