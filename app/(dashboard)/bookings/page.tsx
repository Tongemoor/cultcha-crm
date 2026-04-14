import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'
import { formatDate, statusColour } from '@/lib/utils'

export default async function BookingsPage() {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, title, venue_name, artist_name, event_date, status, agreed_fee, payment_status, responsible_user, created_at')
    .order('event_date', { ascending: true, nullsFirst: false })
    .limit(100)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl">
            <BookOpen className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-500">{bookings?.length || 0} bookings</p>
          </div>
        </div>
        <Link
          href="/bookings/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add booking
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!bookings || bookings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No bookings yet</p>
            <p className="text-sm mt-1">Add your first booking enquiry</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Booking</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Venue</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Artist</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Date</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden lg:table-cell">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/bookings/${b.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                        {b.title || `${b.artist_name || 'Artist'} @ ${b.venue_name || 'Venue'}`}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-sm text-gray-500">{b.venue_name || '—'}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-500">{b.artist_name || '—'}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-500">{formatDate(b.event_date)}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColour(b.status)}`}>
                        {b.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-gray-500">
                      {b.agreed_fee ? `£${Number(b.agreed_fee).toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
