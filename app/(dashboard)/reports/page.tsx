import { createClient } from '@/lib/supabase/server'
import { BarChart2, TrendingUp, Users, MapPin, Music, BookOpen, PoundSterling } from 'lucide-react'

export default async function ReportsPage() {
  const supabase = await createClient()

  const [
    { count: totalContacts },
    { count: totalVenues },
    { count: totalArtists },
    { count: confirmedBookings },
    { count: activeBookings },
    { count: lostBookings },
    { data: financials },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('venues').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('artists').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['enquiry', 'response_sent', 'follow_up', 'discussion', 'agreed']),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'lost'),
    supabase.from('bookings').select('agreed_fee, money_received, money_outstanding, status'),
  ])

  const totalFees = financials?.reduce((sum, b) => sum + (Number(b.agreed_fee) || 0), 0) || 0
  const totalReceived = financials?.reduce((sum, b) => sum + (Number(b.money_received) || 0), 0) || 0
  const totalOutstanding = financials?.reduce((sum, b) => sum + (Number(b.money_outstanding) || 0), 0) || 0

  const stats = [
    { label: 'Total contacts', value: totalContacts || 0, icon: Users, colour: 'bg-blue-100 text-blue-600' },
    { label: 'Active venues', value: totalVenues || 0, icon: MapPin, colour: 'bg-purple-100 text-purple-600' },
    { label: 'Active artists', value: totalArtists || 0, icon: Music, colour: 'bg-pink-100 text-pink-600' },
    { label: 'Confirmed bookings', value: confirmedBookings || 0, icon: BookOpen, colour: 'bg-green-100 text-green-600' },
    { label: 'In-progress bookings', value: activeBookings || 0, icon: TrendingUp, colour: 'bg-indigo-100 text-indigo-600' },
    { label: 'Lost/cancelled', value: lostBookings || 0, icon: BarChart2, colour: 'bg-red-100 text-red-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-xl">
          <BarChart2 className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Business performance overview</p>
        </div>
      </div>

      {/* Operational stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Operational summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, colour }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`p-2 rounded-xl ${colour}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial summary */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Financial summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total agreed fees', value: totalFees, colour: 'text-gray-900' },
            { label: 'Total received', value: totalReceived, colour: 'text-green-600' },
            { label: 'Outstanding', value: totalOutstanding, colour: 'text-orange-600' },
          ].map(({ label, value, colour }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <PoundSterling className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
              <p className={`text-2xl font-bold ${colour}`}>
                £{value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
        <p className="text-sm text-indigo-700 font-medium">Phase 2 reporting coming soon</p>
        <p className="text-xs text-indigo-500 mt-1">
          Full ROI dashboards, campaign performance, like-for-like comparisons, and source-to-sale tracking will be available in Phase 2.
        </p>
      </div>
    </div>
  )
}
