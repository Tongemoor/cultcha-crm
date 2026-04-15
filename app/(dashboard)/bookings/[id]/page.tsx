'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [booking, setBooking] = useState<Record<string, string> | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [role, setRole] = useState('')

  useEffect(() => { loadBooking(); loadRole() }, [id])

  async function loadRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single(); if (data) setRole(data.role) }
  }

  async function loadBooking() {
    const { data } = await supabase.from('bookings').select('*').eq('id', id).single()
    setBooking(data); setForm(data || {}); setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('bookings').update({ title: form.title, event_date: form.event_date || null, event_time: form.event_time || null, status: form.status, fee: form.fee || null, notes: form.notes }).eq('id', id)
    setBooking({ ...booking, ...form }); setEditing(false); setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this booking?')) return
    await supabase.from('bookings').delete().eq('id', id)
    router.push('/bookings')
  }

  const canEdit = ['super_admin', 'admin', 'manager'].includes(role)
  const canDelete = ['super_admin', 'admin'].includes(role)
  const statuses = ['enquiry','response_sent','follow_up','discussion','agreed','confirmed','completed','cancelled','lost']

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!booking) return <div className="p-8 text-center text-gray-400">Booking not found. <Link href="/bookings" className="text-indigo-600">Back to bookings</Link></div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/bookings" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <h1 className="text-2xl font-bold text-gray-900">{booking.title || 'Booking'}</h1>
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
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Title</label><input value={form.title || ''} onChange={e => setForm(p => ({...p,title:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label><input type="date" value={form.event_date?.substring(0,10) || ''} onChange={e => setForm(p => ({...p,event_date:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Event Time</label><input type="time" value={form.event_time || ''} onChange={e => setForm(p => ({...p,event_time:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status || 'enquiry'} onChange={e => setForm(p => ({...p,status:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{statuses.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Fee</label><input value={form.fee || ''} onChange={e => setForm(p => ({...p,fee:e.target.value}))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><textarea value={form.notes || ''} onChange={e => setForm(p => ({...p,notes:e.target.value}))} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" /></div>
            <div className="flex gap-3"><button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button><button onClick={() => { setEditing(false); setForm(booking) }} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Cancel</button></div>
          </>
        ) : (
          <dl className="grid grid-cols-2 gap-4">
            {[['Venue', booking.venue_name],['Artist', booking.artist_name],['Event Date', booking.event_date ? new Date(booking.event_date).toLocaleDateString('en-GB') : null],['Event Time', booking.event_time],['Status', booking.status?.replace(/_/g,' ')],['Fee', booking.fee]].map(([label, value]) => (
              <div key={String(label)}><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt><dd className="mt-1 text-sm text-gray-900 capitalize">{value || '—'}</dd></div>
            ))}
            {booking.notes && <div className="col-span-2"><dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</dt><dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{booking.notes}</dd></div>}
          </dl>
        )}
      </div>
    </div>
  )
}
