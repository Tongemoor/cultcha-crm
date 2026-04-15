'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewVenuePage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', address: '', city: '', postcode: '', country: 'UK', contact_name: '', phone: '', email: '', website: '', capacity: '', genre_relevance: '', notes: '', status: 'prospect' })
  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Venue name is required.'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('venues').insert({
      name: form.name.trim(), address: form.address || null, city: form.city || null,
      postcode: form.postcode || null, country: form.country, contact_name: form.contact_name || null,
      phone: form.phone || null, email: form.email || null, website: form.website || null,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      genre_relevance: form.genre_relevance || null, notes: form.notes || null,
      status: form.status, created_by: user?.id,
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/venues')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/venues" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Venue</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. The Venue, Manchester" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input value={form.city} onChange={e => set('city', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Manchester" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label><input value={form.postcode} onChange={e => set('postcode', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. M1 1AA" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input value={form.address} onChange={e => set('address', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label><input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 300" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input value={form.website} onChange={e => set('website', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://…" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Genre / Style Notes</label><input value={form.genre_relevance} onChange={e => set('genre_relevance', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Urban, live music, 18–35 audience" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        {error && <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Venue'}</button>
          <Link href="/venues" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
