'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewArtistPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', contact_name: '', email: '', phone: '', genre: '', location: '', fee_level: '', availability: '', technical_requirements: '', notes: '', status: 'prospect' })
  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Artist name is required.'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('artists').insert({
      name: form.name.trim(), contact_name: form.contact_name || null, email: form.email || null,
      phone: form.phone || null, genre: form.genre || null, location: form.location || null,
      fee_level: form.fee_level || null, availability: form.availability || null,
      technical_requirements: form.technical_requirements || null, notes: form.notes || null,
      status: form.status, created_by: user?.id,
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/artists')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/artists" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Artist</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Artist / Act Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. The Jazz Collective" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact / Manager Name</label><input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Genre / Style</label><input value={form.genre} onChange={e => set('genre', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Jazz, Soul, Urban" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Location</label><input value={form.location} onChange={e => set('location', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. London" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee Level</label><input value={form.fee_level} onChange={e => set('fee_level', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. £500–£1,000" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Availability</label><input value={form.availability} onChange={e => set('availability', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Weekends only" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="prospect">Prospect</option><option value="in_conversation">In Conversation</option><option value="confirmed">Confirmed</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Technical Requirements</label><textarea value={form.technical_requirements} onChange={e => set('technical_requirements', e.target.value)} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        {error && <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Artist'}</button>
          <Link href="/artists" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
