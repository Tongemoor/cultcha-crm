'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewBookingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [venues, setVenues] = useState<{id: string, name: string}[]>([])
  const [artists, setArtists] = useState<{id: string, name: string}[]>([])
  const [form, setForm] = useState({ title: '', venue_id: '', artist_id: '', event_date: '', event_time: '', status: 'enquiry', fee: '', notes: '' })
  function set(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  useEffect(() => {
    supabase.from('venues').select('id, name').order('name').then(({ data }) => setVenues(data || []))
    supabase.from('artists').select('id, name').order('name').then(({ data }) => setArtists(data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() && !form.venue_id && !form.artist_id) { setError('Please add a title or select a venue / artist.'); return }
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const selectedVenue = venues.find(v => v.id === form.venue_id)
    const selectedArtist = artists.find(a => a.id === form.artist_id)
    const { error: err } = await supabase.from('bookings').insert({
      title: form.title || `${selectedArtist?.name || 'Booking'} @ ${selectedVenue?.name || 'TBC'}`,
      venue_id: form.venue_id || null, venue_name: selectedVenue?.name || null,
      artist_id: form.artist_id || null, artist_name: selectedArtist?.name || null,
      event_date: form.event_date || null, event_time: form.event_time || null,
      status: form.status, fee: form.fee || null, notes: form.notes || null,
      created_by: user?.id,
    })
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/bookings')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/bookings" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Booking</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Booking Title</label><input value={form.title} onChange={e => set('title', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Leave blank to auto-generate from artist + venue" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
            <select value={form.venue_id} onChange={e => set('venue_id', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select venue…</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
            <select value={form.artist_id} onChange={e => set('artist_id', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select artist…</option>{artists.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label><input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label><input type="time" value={form.event_time} onChange={e => set('event_time', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['enquiry','response_sent','follow_up','discussion','agreed','confirmed','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee</label><input value={form.fee} onChange={e => set('fee', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. £500" /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
        {error && <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Booking'}</button>
          <Link href="/bookings" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
